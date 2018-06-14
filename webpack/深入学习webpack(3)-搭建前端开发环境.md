# 使用webpack搭建前端开发环境

前端开发环境有什么：
1. 构建我们发布需要的 HTML、CSS、JS 文件
2. 使用 CSS 预处理器来编写样式
3. 处理和压缩图片
4. 使用 Babel 来支持 ES 新特性
5. 本地提供静态服务以方便开发调试


## 关联HTML
`webpack`默认从作为入口的`.js`文件进行构建（更多是基于 SPA 去考虑），
但通常一个前端项目都是从一个页面（即 HTML）出发的，
最简单的方法是，创建一个 `HTML` 文件，使用 script 标签直接引用构建好的 JS 文件，如：
```HTML
<script src="./dist/bundle.js"></script>
```
但是，我们如果用hash来命名呢，那么最好是将 HTML 引用路径和我们的构建结果关联起来，这个时候我们可以使用 html-webpack-plugin。

`html-webpack-plugin` 是一个独立的 `node package`，所以在使用之前我们需要先安装它，把它安装到项目的开发依赖中：

```
npm install html-webpack-plugin -D 
```

然后在 webpack 配置中，将 `html-webpack-plugin` 添加到 plugins 列表中：

```js
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  // ...
  plugins: [
    new HtmlWebpackPlugin(
    	filename: 'index.html', // 配置输出到哪里和叫什么
    	template: 'assets/index.html',  // 配置模板来自哪里
    )
  ]
}
```
之前打包webpack是不管html怎么样的，如果我们要在html中引入js,需要写这样写死：
```html
<script src="bundle.js"></script>
```
现在通过`htmlWebpackPlugin`插件，可以把`template`指定的html处理一下，强行插入下面这样：
```
这里src的地址，是output的地址
<script type="text/javascript" src="main.bundle.b24c51ee800d365fcc78.js"></script></body>
```
输出到`filename`指定的目录和名称。

如果是多output话，`htmlWebpackPlugin` 会插入多条sript

如果需要添加多个页面关联，那么实例化多个 html-webpack-plugin， 并将它们都放到 plugins 字段数组中就可以了。

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_151031.png)
参考文档：https://github.com/jantimon/html-webpack-plugin


## 编译css
webpack只能处理js文件，为此，需要在配置中引入 loader 来解析和处理 CSS 文件：

```js
module.exports = {
  module: {
    rules: [
      // ...
      {
        test: /\.css/,
        include: [
          path.resolve(__dirname, 'src'),
        ],
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  }
}
```
> style-loader 和 css-loader 都是单独的 node package，需要安装。

- `css-loader` 负责 CSS 中的依赖， @import 和 url() 引入外部文件
- `style-loader` 会将 css-loader 解析的结果转变成 JS 代码，插入 style 标签

css经过上面两个loader,可以和index.js打包在一起。如果不想打包在一起，使用`extract-text-webpack-plugin`
```
npm install extract-text-webpack-plugin@next -D
```

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

## 启动静态服务
我们可以使用 webpack-dev-server 在本地开启一个简单的静态服务来进行开发。

推荐在项目中安装`webpack-dev-server`, 然后写入`package.json`

```js
"scripts": {
	'build': 'webpack --mode production',
	'start': 'webapck-dev-server --mode development'
}
```

