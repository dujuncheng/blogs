一般我们有两个环境，一个是dev环境，一个是production环境。

# 不同环境，配置的要求不同

## 生产环境
1. 分离代码
2. 压缩html,css,js
3. 压缩图片

## 开发环境
1. 生成sourcemap
2. 打印debug信息
3. 需要热更新功能
>
# mode

webpack4 提出了mode概念，运行 webpack 时需要指定使用 production 或 development 两个 mode 其中一个.

使用 production mode 时，默认优化,而如果是 development mode 的话，则会开启 debug 工具，运行时打印详细的错误信息，以及更加快速的增量编译构建。

虽然 webpack 的 mode 参数很方便，但是针对一些项目情况，例如使用 css-loader 或者 url-loader 等，不同环境传入 loader 的配置也不一样，有一些还是需要我们自己配的。

## 配置mode
1. 通过配置文件来配置mode
    ```
    module.exports = {
        mode: 'production'
    }
    ```

2. 通过命令行
    ```
    webpack --mode=production
    ```
配置文件和命令行冲突，配置文件的优先级更高



# 在webpack配置文件中区分mode

## webpack4: argv.mode
配置文件不仅可以暴露一个对象，还可以暴露一个方法, 方法里面可以通过argv参数来获取mode

```js
module.exports = (env, argv) => {
    return {
     optimiztion: {
            minimize：false,
            // 使用 argv 来获取 mode 参数的值
            minimizer: argv.mode === 'production' ? [
                new UglifyJsPlugin({})
                // mode 为 production 时 webpack 会默认使用压缩 JS 的 plugin
            ]:[]
        }
    }
}
```
注意，这种方法只能拿到通过命令行的方式传入的mode
## webpack3:
在package.json 里面通过`script`字段来添加命令：
```js
{
    "scripts": {
        "build": "NODE_ENV=production webpack",
        "develop": "NODE_ENV=development webpack-dev-server"
    }
}
```
然后在 webpack.config.js 文件中可以通过 process.env.NODE_ENV 来获取命令传入的环境变量：

```js
const config = {
  // ... webpack 配置
}
if (process.env.NODE_ENV === 'production') {
  // 生产环境需要做的事情，如使用代码压缩插件等
  config.plugins.push(new UglifyJsPlugin())
}

module.exports = config
```


# js中区分mode

## webpack4: process.env.NODE_ENV
```
export default function log(...args) {
  if (process.env.NODE_ENV === 'development' && console && console.log) {
    console.log.apply(console, args)
  }
}
```

## webpack3: DefinePlugin定义全局变量

```
module.exports = {
  // ...
  // webpack 的配置

  plugins: [
    new webpack.DefinePlugin({
      // webpack 3.x 的 process.env.NODE_ENV 是通过手动在命令行中指定 NODE_ENV=... 的方式来传递的
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
  ],
}
```


# 拆分配置
不同文件负责不同环境下的配置
- webpack.base.js：基础部分，即多个文件中共享的配置
- webpack.development.js：开发环境使用的配置
- webpack.production.js：生产环境使用的配置
- webpack.test.js：测试环境使用的配置

不同配置之间的组合通过`webpack-merge`工具, merge 是通过一定的规则来合并的。

```
// 规则1：数组和字符串合并 = 字符串
[a,b,c] + 'd' = 'd'

// 规则2：数组和数组合并 = 合并后的数组
[a,b,c] + [d] = [a, b, c, d]
```

通常webpack.base.js是长这个样子：
```js
module.exports = {
    entry: {}，
    output: {},
    resolve: {},
    modules: {
        rules: [
            {
                test:/\.js$/,
                use:['babel']
            }
        ]
    },
    plugins: [
        new htmlWebpackPlugin({
            template: '',
            filename: ''
        })
    ]
}
```
然后我们的webpack.development.js添加loader或者plugin，使用webpack-merge的api:
```
// 注意这里要使用commonJS的导入规范
const { smart } = require('webpack-merge')
const webpack = require('webpack')
cont base = require('./webpack.base.js')

module.exports = smart(base, {
    module: {
        // 这里的rules会和base的rules合并
        rules: [
            {
                test: /\.js$/,
                use: ['coffee']
            }
        ]
    },
    plugins: [
        // 这里的plugins会和base的plugins合并
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ]
})
```
原来的`webpack.config.js`并不能删除，因为webpack需要找到它，但是需要修改成：
```
var dev-config = require('./config/webpack.development.js')
module.export = config
```
