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

如果需要添加多个页面关联，那么实例化多个 html-webpack-plugin， 并将它们都放到 plugins 字段数组中就可以了。

参考文档：https://github.com/jantimon/html-webpack-plugin


