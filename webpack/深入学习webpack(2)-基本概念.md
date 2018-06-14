# webpack核心概念
## entry
一段代码的入口，我所需要的模块和依赖，都可以通过这个入口来找到，也是打包的入口，我从这个文件中查找依赖，接着从依赖文件里面去查找依赖。
entry可以有一个，也可以有多个，多个entry主要是用在多页应用程序，或者说在单页项目中，我想把业务代码放一个entry, 把框架的代码放在另一个entry里面
```
// 单入口：最简单的就是直接后面跟路径
module.export = {
  entry: './index.js'
}

// 上面的写法等同于下面
module.export = {
    entry: {
        main: './index.js'
    }
}

// 多入口：配置多个入口
module.export = {
  entry = {
    foo: './src/foo.js'，
    bar: './src/bar.js'
  }
}

// 多个文件作为单一入口
module.export = {
  entry: {
    main: [
        '.src/foo.js',
        '.src/bar.js'
    ]
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
    filename:'bundle.js',
    // 这里的path是指将打包好的bundle放到哪个文件夹下面
    // 如果没有创建的话，会自动帮我们创建
    path: path.resolve(__dirname, 'dist')
  }
}

// 方式二 多entry多output
module.exports = {
  entry: {
    foo: './src/foo.js',
    bar: './src/bar.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: __dirname + '/dist'
  }
}
// 多entry 不必写多个output，因为都是放到dist目录下面的，同时名字可以通过[name].js来指定,比如说'foo.js'会被打包成'foo.bundle.js'输出


// 方式三： 路径中使用 hash，每次构建时会有一个不同 hash 值，避免发布新版本时线上使用浏览器缓存
module.exports = {
  entry: {
    main: [
        './src/foo.js',
        '/src/bar.js'
    ]
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist/[name].bundle[hash].js',
  },
}
```
## loader
用来处理文件，把文件转化为webpack可以处理的模块。
举个例子，在没有添加额外插件的情况下，webpack 会默认把所有依赖打包成 js 文件，如果入口文件依赖一个 `.hbs`的模板文件以及一个 `.css` 的样式文件，那么我们需要 `handlebars-loader` 来处理 `.hbs `文件，需要 `css-loader` 来处理 `.css` 文件（这里其实还需要 style-loader，后续详解），
最终把不同格式的文件都解析成 js 代码，以便打包后在浏览器中运行。

loader的配置规则写在 module.rules下面：
```
module.exports = {
  module: {
    rules: [
      {
        test:/\.css$/,
        use: 'css-loader'   // 对.css结尾的文件，用css-loader处理
      }，
      {
        test: /\.js$/,
        include: [
            path.resolve(__dirname, 'src')
        ],
        use: 'babel-loader'
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
在module.plugin字段进行定义：
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

plugin 理论上可以干涉 webpack 整个构建流程，可以在流程的每一个步骤中定制自己的构建需求。


## chunk
其实就是代码块，一堆代码可以被称为 chunk

## Bundle
一般指打包后的“一束一捆”的代码

## Module
模块，通过plugin处理完的css文件，html文件，都可以被称为Module

## module, chunk, bundle 之间有什么区别
1. `bundle`是相关的代码被打到了一个单个的文件里面。
2. 如果你不想你的所有代码都打到一个单个的文件里面，你要把他们分开打进不同的文件，被称为`chunk`，在这种情况下，你要自己决定代码如何分割，
在webpack4.0之前，可以使用CommonsChunkPlugin插件。
3. `module` 是js语言中的一个概念，比如说es6中的module



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
只需要在入口文件的最开始引入`babel-polyfill`,就可以在接下来的代码中使用新的语法了

## `babel-runtime-transform`

`babel-runtime-transform`是一个局部的垫片，是为开发框架而准备的, 不会污染全局变量

1. 安装
```
npm install babel-plugin-transform-runtime --save-dev
npm install babel-runtime --save
```
2. 配置
在根目录下新建`.babelrc`配置文件,target/plugin都可以在这里配置




----------------------------------
# code splitting
对一个网页来说，把所有的代码都打进一个文件里面是不切实际的，尤其是某些代码只需要在需要的时候被加载。webpack可以把你的代码分割成为`chunk`,并且按需加载。

一个常见的误区是，有人会以为`code splitting`仅仅是把公共代码抽出来，但其最主要的目的是为了按需加载。

下面的表单，只有用户在点击了之后才会加载，所以，如果form的代码页被打包了。即使用户不点击，这些代码仍然会被加载。
![](https://i.imgur.com/eXVVswt.gif)


我们需要一个文件夹来放我们的demo, 暂且命名为`code-splitting`吧。
```
$ mkdir codepslit
$ cd codesplit
$ npm init 
$ npm install lodash
$ npm install webpack webpack-dev-server -D
```
创建`src`目录和`dist`目录，分别作为我们的源码和打包路径；创建`webpack.config.js`作为配置文件：
```js
const path = require('path')

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist/'),
		filename: 'bundle.js'
	},
	devServer: {
		contentBase: 'dist'
	}
}
```
上面的配置让`webpack`会把`./src/index.js`打包到`dist`路径下。

到目前为止，我们的项目结构是：
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180613_212500.png)

在src下新建`index.js`、`form.js`和`index.html`。

在`index.js`里面，我们代码如下：
```js
// statically import form module.
import form from "./form";

window.onload = function () {
    let btn = document.getElementById('load');
    btn.addEventListener('click', function () {
        document.getElementById('form').appendChild(form.render());
    });
};
```

在`form.js`里面，我们的代码如下：
```js
import _ from "lodash";

export default {
    render: function () {
        let form = document.createElement('form');
        _.map(['Name', 'Email', 'Contact'], function (field) {
            let lbl = document.createElement('label');
            lbl.innerHTML = field;
            let txt = document.createElement('input');
            txt.type = 'text';
            let container = document.createElement('div');
            container.className = 'field';
            container.appendChild(lbl);
            container.appendChild(txt);
            form.appendChild(container);
        });
        return form;
    }
};
```

在`index.html`里面，我们的代码如下：
```html
<body>
    <div class="app-loader">
        <h1>User Registration Form</h1>
        <button id="load">Load Form</button>
    </div>
    <div id="form"></div>
    <script src="/bundle.js"></script>
</body>
```

然后在项目的根目录下，运行`webpack`命令。
结果打出来了71kb的bundle。
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180613_213112.png)


webpack支持动态的导入一个模块，本质意义上是把之前打出的一个bundle, 现在打出多个bundle

我们首先需要安装babel, 因为是es6的语法嘛。同时我们还需要`abel-plugin-syntax-dynamic-import`这个插件
```
npm install --save-dev babel-loader babel-core babel-plugin-syntax-dynamic-import
```

接着，我们需要配置`webpack.config.js`，让js文件通过`babel`来进行编译：
```js
module: {
	rules: [
		{
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_module/
		}
	]
}
```
这样仅仅是告诉webpack我们需要使用babel来编译，我们还需要告诉babel, 我们要使用动态导入的语法。
创建`.babelrc`
```js
{
	"plugins": ["syntax-dynamic-import"]
}
```
这样，babel就可以把我们的动态import语法翻译给webpack能听懂了，接下来，我们要告诉`webpack`如何处理动态导入
修改`webpack.config.js`
```js
entry: {
    index: "./src/index.js"
},
output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
}
```
`chunkFilename` 注意`name`是不大写的


接下里修改index.js

```js
window.onload = function () {
    let btn = document.getElementById('load');
    btn.addEventListener('click', function () {
        // dynamically import form module at run time.
        import(/* webpackChunkName: "form" */ './form').then(function (form) {
            document.getElementById('form').appendChild(form.default.render());
        });
    });
};
```
运行`webpack`打包结果如下：
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180613_215531.png)

奥秘在这里：
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180613_215416.png)














## 确定分割点
AMD和CommonJS有不同的方法去按需加载。

### CommonJs: `require.ensure`
```js
require.ensure(dependencies, callback)
```
`require.ensure` 方法的`callback`被触发的时候，`dependencies`中的每一个依赖会被同步的加载。






webpack4.0 在`chunk graph`上有了大的提升，对`chunk splitting` 增加了新的`optimiztion`的字段

老的`chunk graph`的缺点：
1. 之前的chunk是通过`父子`关系连接，











需要使用到`commonsChunkPlugin`这个插件,这个插件是内置的，
`webpack.optimize.CommonsChunkPlugin`

1. 配置

```
{
   plugins: [
    new webpack.optimize.CommonChunkPlugin(option)
   ]
}
```
options的配置是什么样的

- options.name / options.names:  chunk的名称，把name指定为已知chunk的名称， 表示提取公用代码选用这个chunK; 如果给出一个数组，则说明新建这个实例多少次
- options.filename：公用代码打包之后的文件名
- options.minChunks： 被判断为公用代码的阈值, 可以为数字，比如说2，代码重复出现2次被判定为chunk; 可以是函数，可以自定义提取代码的逻辑
- options.chunks: 提取代码的范围，需要在哪几个代码块中提取我的公用代码
- options.children
- options.deepChildren
- options.async: 创建异步的公共代码流






# 提取公用代码
需要多个entry, 单页面的打包还是会打到一起






# tree shaking 

## js tree shaking 
只需要加一行命令

lodash比较特殊
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_011133.png)


## css tree shaking 

install purifycss-webpack
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_011400.png)

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_011719.png)

动态添加的class也可以被打包进去



# 本地开发环境的搭建
## webpack -watch



# proxy
代理远程接口请求




## 引入css

1. style loader: 创建标签
2. css loader： 可以import css进入js

```
npm install style-loader css-loader
```






