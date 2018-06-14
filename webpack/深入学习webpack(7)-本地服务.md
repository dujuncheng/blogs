webpack-dev-server 是 webpack 官方提供的一个工具，可以基于当前的 webpack 构建配置快速启动一个静态服务。当 mode 为 development 时，会具备 hot reload 的功能，即当源码文件变化时，会即时更新当前页面，以便你看到最新的效果。...

# 基础使用
`webpack-dev-sever`不是自带的，需要npm安装，安装好启动即可：

```
npm install webpack-dev-server

webpack-dev-server --mode development
```
本质上也是调用 webpack


不想写那么长的名字，一般都作为开发依赖，写入package.json
```
{
  // ...
  "scripts": {
    "start": "webpack-dev-server --mode development"
  }
}
```

```
npm run start
```

# webpack-dev-server的配置

webpack.config.js中通过 `devServer` 字段配置、

常用配置如下：
- public 字段用于指定静态服务的域名，默认是 http://localhost:8080/ ，当你使用 `Nginx` 来做反向代理时，应该就需要使用该配置来指定 `Nginx` 配置使用的服务域名。
- port 端口
- publicPath 构建好的静态文件在浏览器中用什么路径去访问，默认是 / . 例如，对于一个构建好的文件 bundle.js，完整的访问路径是 http://localhost:8080/bundle.js，如果你配置了 publicPath: 'assets/'，那么上述 bundle.js 的完整访问路径就是 http://localhost:8080/assets/bundle.js。可以使用整个 `URL` 来作为 `publicPath` 的值，如 publicPath: 'http://localhost:8080/assets/'。如果你使用了 HMR，那么要设置 publicPath 就必须使用完整的 URL。
- proxy  `webpack-dev-server` 将特定 `URL `的请求代理到另外一台服务器上 
    ```js
        proxy: {
          '/api': {
            target: "http://localhost:3000", // 将 URL 中带有 /api 的请求代理到本地的 3000 端口的服务上
            pathRewrite: { '^/api': '' }, // 把 URL 中 path 部分的 `api` 移除掉
          },
        }
    ```
- contentBase 不经过 webpack 构建，但是需要在 webpack-dev-server 中提供访问的静态资源
- before 拦截部分请求返回特定内容，实现简单的数据 mock。
```js
    before(app){
      app.get('/some/path', function(req, res) { // 当访问 /some/path 路径时，返回自定义的 json 数据
        res.json({ custom: 'response' })
      })
    }
```

更多的参考官方文档
https://webpack.docschina.org/configuration/dev-server/

# webpack-dev-middleware
`webpack-dev-middleware`是在express中用的中间件
中间件就是在 Express 之类的框架中实现具体功能（如静态文件访问）的函数。多个中间件可以一起协同构建起一个完整的 Web 服务器。
`webpack-dev-middleware` 就是在 `Express` 中提供 `webpack-dev-server` 静态服务能力的一个中间件，我们可以很轻松地将其集成到现有的 Express 代码中去，就像添加一个 Express 中间件那么简单。

接着创建一个 Node.js 服务的脚本文件，如 app.js：

```js
const webpack = require('webpack')
const middleware = require('webpack-dev-middleware')
const webpackOptions = require('./webpack.config.js') // webpack 配置文件的路径

// 本地的开发环境默认就是使用 development mode
webpackOptions.mode = 'development'

const compiler = webpack(webpackOptions)
const express = require('express')
const app = express()

app.use(middleware(compiler, {
  // webpack-dev-middleware 的配置选项
}))

// 其他 Web 服务中间件
// app.use(...)

app.listen(3000, () => console.log('Example app listening on port 3000!'))
```
然后用 Node.js 运行该文件即可.

使用 webpack-dev-server 的好处是相对简单，直接安装依赖后执行命令即可，而使用 webpack-dev-middleware 的好处是可以在既有的 Express 代码基础上快速添加 webpack-dev-server 的功能，同时利用 Express 来根据需要添加更多的功能，如 mock 服务、代理 API 请求等。...

# 实现一个简单的mock功能

我们最主要的需求是当浏览器请求某一个特定的路径时（如 /some/path ），可以访问我们想要的数据内容。
我们先基于 Express app 实现一个简单 mock 功能的方法：
```js
module.export = function mock(app) {
  app.get('/some/path', (req, res) => {
    res.json({ data: '' })
  })

  // ... 其他的请求 mock
  // 如果 mock 代码过多，可以将其拆分成多个代码文件，然后 require 进来
}...
```
然后应用到配置中的 before 字段：
```
const mock = require('./mock')

// ...
before(app) {
  mock(app) // 调用 mock 函数
}
```
这样的 mock 函数照样可以应用到 Express 中去，提供与 webpack-dev-middleware 同样的功能。

由于 app.get('', (req, res) => { ... }) 的 callback 可以拿到 req 请求对象，其实可以根据请求参数来改变返回的结果，即通过参数来模拟多种场景的返回数据来协助测试多种场景下的代码应用。

当你单独实现或者使用一个 mock 服务时，你可以通过 proxy 来配置部分路径代理到对应的 mock 服务上去，从而把 mock 服务集成到当前的开发服务中去，相对来说也很简单。

当你和后端开发进行联调时，亦可使用 proxy 代理到对应联调使用的机器上，从而可以使用本地前端代码的开发环境来进行联调。当然了，连线上环境的异常都可以这样来尝试定位问题。...

