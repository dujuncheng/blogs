> 本文首发于 本人掘金专栏https://juejin.im/user/5a676894f265da3e2b16921c/posts， 欢迎关注交流

如何解决 npm 包需要强制安装其依赖包的最低版本？

## 问题简述

最近公司在自研一套小程序跨端的框架，遇到一个小问题 —— npm 包需要强制安装其依赖包的最低版本。简单来说，是这样的：

- 工程的 `node_module` 装了一个包，专门负责编译过程，名为 `compile` 
- 工程的 `node_module` 还装了一个包，是放组件库的，名为 `components`

现在 `compile` npm 的包版本升级到 `0.2.0`, 需要 `components` 的npm 包版本配合升级到 `1.3.0`。 原因可能是`compile` npm 的包修改了某个编译规则，组件库里的某种写法需要改变，否则会报错。

问题是，公司有多条业务线，存在多个工程，不可能每次  `compile`  包升级后，我都人肉去升级每个工程的  `components` 包，否则要被业务同学怼死。

## 其实这个问题挺常见……

这个问题，`vue` 也遇到过。在 vue 官网有那么这句话，如下：

> 每个 `vue` 包的新版本发布时，一个相应版本的 `vue-template-compiler` 也会随之发布。编译器的版本必须和基本的 `vue` 包保持同步，这样 `vue-loader` 就会生成兼容运行时的代码。这意味着**你每次升级项目中的 `vue` 包时，也应该匹配升级 `vue-template-compiler`。**

![](https://user-gold-cdn.xitu.io/2019/10/21/16decb7b2e6ae9d0?w=1354&h=368&f=png&s=97426)

所以，问题的本质是，如何保证 依赖包之间的强制最低版本要求

## 解决方案

### 方案1： 远程分发config 配置

在我们工程中，每次开发者启动项目，会有一个小彩蛋，我们会友好热情的温馨提示开发者，今天的天气如何如何。其实本质上，就是启动的时候，去服务端拉取一个动态脚本去执行。

我们想到了，可以在这个环节，做一点事情。比如说，检查一下用户安装的版本是否ok。



![](https://user-gold-cdn.xitu.io/2019/10/21/16decbc7ac61efcf?w=1108&h=708&f=png&s=134876)

在服务端，我们维护一份配置文件，这份配置文件描述了依赖包之间的强制最低版本要求。

服务端可以自己搭建的一个node服务，甚至，最简单的做法，也可以放在一个git仓库里面。

每次开发者执行 `npm run dev` 的时候，也就是在 `pre` 这个钩子时候，就去服务端拉取这份配置文件，然后，检查一下用户本地安装的版本是否满足配置文件中的描述。

但是，这种方案存在一个问题，就是不太好维护。

首先，每次我发布一个新的 `compile` 包，版本都更新一次，那么这份配置文件也需要更新一次。

其次，配置文件长这个样子：

```json
{
  "compile编译包": {
    "0.0.1版本": {
      "A依赖包": "0.1.2",
      "B依赖包": "0.1.3",
      "c依赖包": "0.1.3",  
    },
    "0.0.2版本": {
      "A依赖包": "0.1.2",
      "B依赖包": "0.1.4",
      "c依赖包": "0.1.5",  
    }
  }
}
```

因为这份配置文件是公用的。每次 `compile编译包` 升级，都要 新加上一段代码，日积月累，这个配置就会变得很大很大。

所以，最终我们选择了第二种方案。

### 方案2： 硬编码

![](https://user-gold-cdn.xitu.io/2019/10/21/16decc35e58d2592?w=940&h=646&f=png&s=127012)

事实上，vue 等框架也是这样做的。

直接把强制依赖的版本校验的逻辑，写死在代码里面。

在初始化之前，就去校验**自身版本**，和**依赖版本**，是否符合配置文件的描述。配置文件是放在包内，随版本走的。

### 具体实现

下面是代码的具体实现：

下面定义了 `compare` 方法，用于比较 `"0.2.3"`,  和 `"0.3.4"` 两个字符串，表示的版本号大小

```javascript
let _isVersion = (v) => {
    let result = /^\d+(\.\d+)*$/.test(v);
    return result;
};

let compare = (v1, v2) => {
    if (_isVersion(v1) && _isVersion(v2)) {
        v1 = v1.toString().split('.');
        v2 = v2.toString().split('.');
        for (let i = 0, l1 = v1.length, l2 = v2.length; i < l1 || i < l2; i++) {
            let n1 = parseInt(v1[i], 10);
            let n2 = parseInt(v2[i], 10);
            if (n1 < n2) {
                return -1;
            } else if (n1 > n2) {
                return 1;
            }
        }
        return 0;
    }
    return console.error('version value is invalid');
};
```

下面定义了 配置文件config.js

```javascript
// compiler 依赖包最低版本的配置
module.exports = {
    'A依赖包': {
        'max': '',
        'min': '0.1.2',
        'require': true
    }
}

```

下面定义了 `_checkDependencyVersion` 方法:

```javascript
// 检查依赖包的版本
const _checkDependencyVersion = () => {
    return new Promise((resolve, reject) => {
        let depMinOption = require('./config.js');
        for (let key in depMinOption) {
            let dep = depMinOption[key];
            try {
                let depSource = require(`${key}/package.json`);
                let sourceVersion = depSource.version;
                if (dep.min && compare(sourceVersion, dep.min) === -1) {
                    console.log(`
                    |*****************************************************
                    |
                    |    ${chalk.red('ERROR!')}
                    |    ${chalk.red(`toolkit 依赖 ${key} 的最低版本是 ${dep.min}, 请升级 ${key} 到 ${dep.min} 及以上`)}
                    |
                    |*****************************************************
                    `);
                    resolve(false);
                }
                if (dep.max && compare(sourceVersion, dep.max) === 1) {
                    console.log(`
                    |*****************************************************
                    |
                    |    ${chalk.red('ERROR!')}
                    |    ${chalk.red(`toolkit 依赖 ${key} 的最高版本是 ${dep.max}, 请调整 ${key} 版本`)}
                    |
                    |*****************************************************
                    `);
                    resolve(false);
                }
        
                resolve(true)
            } catch (e) {
                console.log(e)
                if (dep.require) {
                    console.log(`
                    |*****************************************************
                    |
                    |    ${chalk.red('ERROR!')}
                    |    ${chalk.red(`toolkit 依赖 ${key} ${dep.min ? '最低版本：' + dep.min: ''} ${dep.max ? '最高版本：' + dep.max: ''}`)}
                    |
                    |*****************************************************
                    `);
                }
            }
        }
    })
}
```

上面的 `_checkDependencyVersion` 方法会在 `npm run dev` 之后马上执行，如果发现，开发者本地装的版本不ok， 则会提醒开发者升级对应包的版本。



如果有更好的解决方案，欢迎在下方评论区留言。
