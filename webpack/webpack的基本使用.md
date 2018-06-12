# 背景
近年来，前端技术蓬勃发展，我们想在js更方便的实现html,
社区就出现了jsx，
我们觉得原生的css不够好用，
社区就提出了`scss`, `less`，
针对前端项目越来越强的模块化开发需求，社区出现了`AMD`, `CommonJS`, `ES2015 import`等等方案。
遗憾的是，这些方案大多并不直接被浏览器支持，往往伴随这些方案而生的还有另外一些，让这些新技术应用于浏览器的方案，我们用`babel`来转换下一代的js，转换jsx；
我们用各种工具转换`scss`, `less`为`css`；
我们发现项目越来越复杂，代码体积越来越大，又要开始寻找各种优化，压缩，分割方案。
前端工程化这个过程，真是让我们大费精力。我们也大多是在寻找前端模块化解决方案的过程中知晓了`webpack`。

# 前端为什么需要建构
## 前后端分离
之前前后端耦合，前端仅仅输出静态页面给后端，后端的同学通过模板引擎来渲染数据。
现在前后端分离，前端的逻辑复杂度增加，有自己的view层，model层。在管理的时候，需要打包。
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180612_233416.png)

## 框架的变化
之前的jQuery只能是库，提供一些静态的js方法，后来到了mvc的时代，backbone.js, underscore.js, require.js
再到现在的mvvm时代，三大代表性的框架, 一方面模块化开发要求打包，另一方面，es6的语法，typescript语法都要求编译一步。`Angular`,`react`,`vue`

## 语言的变化
### CSS的发展
一方面，我们希望写一套css多个浏览器运行，另一方面，我们希望更高效的编写css,比如说less，sass，这都要求需要对前端工程进行构建。
### 前端脚本语言的发展
!()[http://p8cyzbt5x.bkt.clouddn.com/UC20180612_233551.png]

## 包管理的发展
npm社区的完善，前端项目中也会引入越来越多的库和依赖，这就要求前端在上线的时候，需要使用工具对项目打包上线。

---------------------------

# 模块化开发
## js 模块化
### 命名空间
最开始，前端使用命名空间来解决模块化的问题。一个团队里面约定好，个人使用个人的命名空间，从而避免冲突的问题。
```
var nameSpace = {}
nameSpace.type = nameSpace.type || {}
nameSpace.type.method = function (){
  
}
```
但是有一个问题是，想访问一个命名空间一个具体的方法，路径会非常长，为了解决这个问题，YUI提供了解决方法：
```
// 方式一
YUI.add('davglass', function(Y){
  Y.davglass = function() {
    Y.log('hello')
  }
}, '3.4.0', { requires: ['test1','test2'] })

YUI().use('davglass',function(Y){
  Y.davglass()
})

// 方式二
YUI.applyConfig({
  modules:{
    'davglass': {
      fullpath: './davglass.js'
    }
  }
})
YUI().use('davglass',function(Y){
  Y.davglass()
})
```

### commonjs
在node端，发展出来了commonjs
在`modules/1.1.1`版本里，commonjs规定了
1. 一个文件为一个模块
2. 通过`module.export`暴露了接口
3. 通过`requir`e引入
4. 服务端，同步执行

### AMD / CMD / UMD
随后，在浏览器端，社区分别发展出了AMD / CMD / UMD 规范
#### AMD
1. 异步
2. 通过define来定义模块
3. 通过require来加载模块
4. 代表是 Requirejs
5. 依赖前置，提前执行
 依赖前置，不管是在代码哪里引入的

#### CMD
1. 通过define来定义模块
2. 通过require来加载模块
3. 代表是 Seajs
4. 尽可能的懒执行

#### UMD
1. Universal Module Definition
2. 首先会判断是否支持AMD, 判断是否支持CommonJS, 如果都没有，则定义为全局变量


### ES6 mudule
随着es6的发展，es6 module逐渐普及
1. 一个文件一个模块
2. export / import

### webpack支持程度
1. 支持AMD(requirejs)d
2. es module（推荐的）
3. Commonjs （服务端）


## CSS模块化
### OOCSS
面向对象的css, 结构和样式分理，内容和容器分理
### SMACSS
主要目的是减少代码量
base + layout + module + state + theme
### atomic css
原子的css,一个css类只负责一件事情
```
<div class = 'mt-10 w-5 h-10'>
```
### BEM
#### BLOCK
区域的划分，比如说header，menu
#### ELEMENT
一些小部分，比如说 checkbox
#### MODIFIDER
一些变化啊，比如说 hovered, actived


# webpack版本的演进
## webpack v1
1. 编译打包
2. 热更新
3. 代码分割
4. 对文件的处理，loader，plugin等等
## webpack v2
1. tree shaking, 体积更小，引入但是没有使用的，会被删掉
2. 支持原生es module
3. 动态Import, 不是es6的， import()
## webpack v3
1. scope hoisting 作用域提升，打包之后的代码性能提升
2. magic comments , 配合动态 import() 使用，指定打包以后的文件名

-------------------------------

# webpack核心概念
## entry
一段代码的入口，我所需要的模块和依赖，都可以通过这个入口来找到，也是打包的入口，我从这个文件中查找依赖，接着从依赖文件里面去查找依赖。
entry可以有一个，也可以有多个，多个entry主要是用在多页应用程序，或者说在单页项目中，我想把业务代码放一个entry, 把框架的代码放在另一个entry里面
```
// 方式一
module.export = {
  entry: './index.js'
}
// 方式二
module.export = {
  entry = ['./index.js','./test.js']
}

// 方式三
module.export = {
  entry: {
    index:'./index.js'
  }
}
```
## output 
打包输出的地方, 因为entry可以是一个或者多个，output 也可以是一个或者多个，可以通过自定义规则，把指定的entry放到指定的output里面，还可以配合cdn
```
// 方式一 单entry单output
modules.exports = {
  entry:'index.js',
  output: {
    filename:'index.min.js'
  }
}
// 方式二 多entry多output
module.exports = {
  entry: {
    index: './index.js',
    vendor: './vendor.js'
  },
  output: {
    // [name]就是entryname,[hash:5]是md5码
    filename: '[name].min.[hash:5].js'
  }
}

```
## loader
用来处理文件，把文件转化为webpack可以处理的模块
```
module.exports = {
  module: {
    rules: [
      {
        test:/\.css$/,
        use: 'css-loader'   // 对.css结尾的文件，用css-loader处理
      }
    ]
  }
}
```
常用的loader
1. bable-loader / ts-loader
2. style-loader / css-loader / less-loader / postcss-loader 
3. file-loader

## plugin
可以参与打包的过程，打包优化和压缩，配置编译时的变量，及其灵活
```
const webpack = require('webpack')
module.exports = {
  plugins = [
    new webpack.optimize.UglifyJsPlugin()
   ]
} 
```
常用的plugin
1. 优化相关的plugin
`CommonChunkPlugin` 用来提取公共相同的代码的插件
`UglifyjsWebpackPlugin` 用来混淆代码的插件
2. 功能相关的plugin
`ExtractTextWebpackPlugin` 把css提取出来打包成单独的文件
`HotModuleReplacePlugin` 热更新的插件
`CopyWebpackPlugin` 帮助打包的


## chunk
其实就是代码块，一堆代码可以被称为 chunk

## Bundle
一般指打包后的“一束一捆”的代码

## Module
模块，通过plugin处理完的css文件，html文件，都可以被称为Module



# 使用webpack

## 使用webpack命令

`webpack -h`   help
`webpack  -v`  版本

`webpack <entry> [<entry>] <output>`

webpack-cli
```
npm install webpack-cli
```
1. 初始化
2. 迁移v1 -> v2


## 配置文件

```
webpack --config webpack.conf.dev.js
```

### 脚手架
vue-cli
angular-cli



## 使用命令行打包js

下面过程可以用流程图来演示：
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180612_232742.png)

```js
// app.js

// 使用es6 module 规范
import { sum } from './sum'

// 使用commonjs规范
var minus = require('./minus')

console.log(sum(1,2))
console.log(minus(1,3))
```

```js
// sum.js
function sum (a, b) {
    return a + b
}

export {sum}
```

```js
// minus.js
module.exports = function(a,b) {
  return a - b 
}
```

app.js依赖了sum.js和 minus.js文件，分别是es6 Module 和 commonJS 规范。
然后执行命令：
```
webpack app.js bundle.js
```
bundle.js是打包之后的文件。`html` 文件就可以引入`bundle.js`文件来使用。


## 使用配置文件来打包js
创建 `webpack.config.js`, 如果filename不为`webpack.config.js`，则需要在命令中通过 `-- config`来指定
需要遵循common.js规范
```js
module.exports = {
    entry: {
        app: './app.js'
    },
    output: {
        filename: '[name].[hash:5].js'
    }
}
```
直接运行`webpack`命令可以直接打包，打包出来的文件是`app.d2a2f.js`

--------------------------
# 在webpack中编译es6/7
## babel
babel是非常常见的编译工具，想要在webpack中使用需要`babel-loader`

### 安装
因此需要安装 `babel-loader` 和 `babel-core`
```
npm install babel-loader babel-core --save-dev --registry=https://registry.npm.taobao.org
```
### 配置`babel-loader`
然后配置`webpack.config.js` 文件：
```js

module.exports = {
    entry: {
        app: './app.js'
    },
    output: {
        filename: '[name].[hash:8].js'
    },
    module: {
        rules: [
            {   
                // test是一个匹配的正则
                test: /\.js$/,
                // use 指定一个loader
                use: 'babel-loader',
                // exclude排除不被loader处理的目录
                exclude: '/node_modules/'         
            }
        ]
    }
}
```

### 配置`babel-preset`
配置好loader之后，并不知道是根据怎么样的配置规范来打包的

这个时候需要`Babel presets`. `Babel presets`其实就是规范的总结，

比如说`es2015`是2015年的汇总，`es2016`是2016年的汇总.
我们最常使用的是`env`, `env`包括了从`2015`到最近的规范

除此之外，还有一些自定义的，比如说`babel-preset-react`

1. 安装`babel-preset-env`
```
npm install babel-preset-env --save-dev
```
2. 在`webpack.config.js`里面指定`preset-env`
`webpack.config.js`里面的内容修改为下面：
```js
module.exports = {
    entry: {
        app: './app.js'
    },
    output: {
        filename: '[name].[hash:8].js'
    },
    module: {
        rules: [
            {   
                // test是一个匹配的正则
                test: /\.js$/,
                // use 指定一个loader
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                },
                // exclude排除不被loader处理的目录
                exclude: '/node_modules/'         
            }
        ]
    }
}
```

### 配置`babel-preset`的`target`
`Babel presets`可以指定`target`参数，这个参数告诉`Babel`, 当你要编译的时候，会根据指定的targets来选择那些语法会进行编译，哪些语法不会进行编译。

`targets.browsers` 指定浏览器
`targets.browsers: 'last 2 version'` 最新的两个版本

`webpack.config.js`里面的配置如下；
```js
module.exports = {
    entry: {
        app: './app.js'
    },
    output: {
        filename: '[name].[hash:8].js'
    },
    module: {
        rules: [
            {   
                // test是一个匹配的正则
                test: /\.js$/,
                // use 指定一个loader
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', {
                            targets: {
                                browsers: [' > 1%', 'last 2 versions']
                            }
                        }]
                    }
                },
                // exclude排除不被loader处理的目录
                exclude: '/node_modules/'         
            }
        ]
    }
}
```

## `babel-polyfill`
`babel polyfill` 和 `babel runtime transform`是两个插件
`babel-preset` 仅仅是在语法上进行了规范，比如说把`let` 转变成`var`, 而在函数和方法上则需要插件`babel-polyfill`

有哪些函数和方法需要polyfill呢？
- generator
- set
- map
- Array.from
- Array.prototype.includes

`babel polyfill`是一个全局的垫片，是为开发应用而准备的，比如说开发一个网页，而开发一个框架的时候不建议使用
1. 安装
```
npm install babel-polyfill --save-dev
```
2. 使用
```
import 'babel-polyfill'
```

## `babel-runtime-transform`

`babel-runtime-transform`是一个局部的垫片，是为开发框架而准备的, 不会污染全局变量

1. 安装
```
npm install babel-plugin-transform-runtime --save-dev
npm install babel-runtime --save
```
2. 配置
在根目录下新建`.babelrc`配置文件,target/plugin都可以在这里配置




















