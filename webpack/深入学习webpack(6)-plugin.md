社区中有很多 webpack 插件可供使用，而优秀的插件基本上都提供了详细的使用说明文档。更多的插件可以在这里查找：plugins in awesome-webpack。

常用的插件如下：

# DefinePlugin
内置的插件，通过 `webpack.DefinePlugin` 直接获取。
用来配置一些全局的常量，我们可以在代码中使用：
```js
console.log("Running App version " + VERSION);

if(!BROWSER_SUPPORTS_HTML5) require("html5shiv");c
```
配置如下：
```js
module.exports = {
	plugins: [
		new webpack.DefinePlugin({
		    PRODUCTION: JSON.stringify(true), // const PRODUCTION = TRUE
		    VERSION: JSON.stringify('234fds'),  // const VERSION = '234fds'
		    BROSER_SUPPORTS_H5: true,
		    TWO: '1+1',
		    CONSTANTS: {
		    	APP_VERSION: JSON.stringify('1.1.2') // const CONSTANTS = { APP_VERSION: '1.1.2' }
             }
		})
	]
}
```
DefinePlugin 使用得最多是定义环境变量，例如 `PRODUCTION` = `true `或者 `__DEV__` = `true` 等。

# copy-webpack-plugin
有些文件webpack帮我们处理，会复制到dist目录下，有些文件不经webpack处理，我们也希望出现在dist下面。
这就需要复制的插件。
```js
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new CopyWebpackPlugin([
      { from: 'src/file.txt', to: 'build/file.txt', }, // 顾名思义，from 配置来源，to 配置目标路径
      { from: 'src/*.ico', to: 'build/*.ico' }, // 配置项可以使用 glob
      // 可以配置很多项复制规则
    ]),
  ],
}
```

# extract-text-webpack-plugin
把依赖的 CSS 分离出来成为单独的文件。
```js
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = {
  // ...
  module: {
    rules: [
      {
        test: /\.css$/,
        // 因为这个插件需要干涉模块转换的内容，所以需要使用它对应的 loader
        use: ExtractTextPlugin.extract({ 
          fallback: 'style-loader',
          use: 'css-loader',
        }), 
      },
    ],
  },
  plugins: [
    // 引入插件，配置文件名，这里同样可以使用 [hash]
    new ExtractTextPlugin('index.css'),
  ],
}
```
`extract-text-webpack-plugin`比较特殊，一方面用的比较多，另一方面需要修改loader对应的配置

# ProvidePlugin
这个很有意思，可以帮你引用一些变量，少些几次 `import` 或者 `require`。
也是一个 webpack 内置的插件，我们可以直接使用 webpack.ProvidePlugin 来获取。

```js
new webpack.ProvidePlugin({
  identifier: 'module',
  // ...
})

// 或者
new webpack.ProvidePlugin({
  identifier: ['module', 'property'], // 即引用 module 下的 property，类似 import { property } from 'module'
  
})

```

在你的代码中，当 identifier 被当作未赋值的变量时，module 就会被自动加载了，而 identifier 这个变量即 module 对外暴露的内容。

注意，如果是 ES 的 default export，那么你需要指定模块的 default 属性：identifier: ['module', 'default'],。...


# IgnorePlugin
IgnorePlugin 和 ProvidePlugin 一样，也是一个 webpack 内置的插件，可以直接使用 webpack.IgnorePlugin 来获取。

这个插件用于忽略某些特定的模块，让 webpack 不把这些指定的模块打包进去。例如我们使用 moment.js，直接引用后，里边有大量的 i18n 的代码，导致最后打包出来的文件比较大，而实际场景并不需要这些 i18n 的代码，这时我们可以使用 IgnorePlugin 来忽略掉这些代码文件，配置如下：

```js
module.exports = {
  // ...
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
  ]
}
```

IgnorePlugin 配置的参数有两个，第一个是匹配引入模块路径的正则表达式，第二个是匹配模块的对应上下文，即所在目录名。...
