HMR 全称是 Hot Module Replacement，即模块热替换。

# HMR配置
需要提前安装`webpack-dev-server`, 需要两个插件：NamedModulesPlugin 、HotModuleReplacementPlugin

webpack的热更新竟然不能开箱即用，差评！





# HMR的原理
webpack 内部运行时，会维护一份用于管理构建代码时各个模块之间交互的表数据，webpack 官方称之为 Manifest，其中包括入口代码文件和构建出来的 bundle 文件的对应关系。可以使用 WebpackManifestPlugin 插件来输出这样的一份数据。



## hmr 并不是live reload

在 webpack HMR 功能之前，已经有很多 live reload 的工具或库。

live reload存在缺点:

1. live reload 工具并不能够保存应用的状态（states）
2. 打包的话还是需要打手动命令



![](http://p8cyzbt5x.bkt.clouddn.com/UC20180702_123254.png)

- 上图底部红色框内是服务端，而上面的橙色框是浏览器端。
- 绿色的方框是 webpack 代码控制的区域。蓝色方框是 webpack-dev-server 代码控制的区域，洋红色的方框是文件系统，文件修改后的变化就发生在这，而青色的方框是应用本身。

上图显示了我们修改代码到模块热更新完成的一个周期，通过深绿色的阿拉伯数字符号已经将 HMR 的整个过程标识了出来。

1. 文件发生修改，webpack 监听到变化，重新编译打包，并将打包后的代码通过简单的 JavaScript 对象保存在内存中。
2.  webpack-dev-server 和 webpack 之间的接口交互，而在这一步，主要是中间件 webpack-dev-middleware 和 webpack 之间的交互，webpack-dev-middleware 调用 webpack 暴露的 API对代码变化进行监控，并且告诉 webpack，将代码打包到内存中。
3.  webpack-dev-server 对文件变化的一个监控，这一步不同于第一步，并不是监控代码变化重新打包。当我们在配置文件中配置了[devServer.watchContentBase](https://link.juejin.im/?target=http%3A%2F%2Flink.zhihu.com%2F%3Ftarget%3Dhttps%253A%2F%2Fwebpack.js.org%2Fconfiguration%2Fdev-server%2F%2523devserver-watchcontentbase) 为 true 的时候，Server 会监听这些配置文件夹中静态文件的变化，变化后会通知浏览器端对应用进行 live reload。注意，这儿是浏览器刷新，和 HMR 是两个概念。
4. 通过 [sockjs](https://link.juejin.im/?target=http%3A%2F%2Flink.zhihu.com%2F%3Ftarget%3Dhttps%253A%2F%2Fgithub.com%2Fsockjs%2Fsockjs-client)（webpack-dev-server 的依赖）在浏览器端和服务端之间建立一个 websocket 长连接，将 webpack 编译打包的各个阶段的状态信息告知浏览器端，同时也包括第三步中 Server 监听静态文件变化的信息。浏览器端根据这些 socket 消息进行不同的操作。当然服务端传递的最主要信息还是新模块的 hash 值，后面的步骤根据这一 hash 值来进行模块热替换。
5. webpack-dev-server/client 端并不能够请求更新的代码，也不会执行热更模块操作，而把这些工作又交回给了 webpack，webpack/hot/dev-server 的工作就是根据 webpack-dev-server/client 传给它的信息以及 dev-server 的配置决定是刷新浏览器呢还是进行模块热更新。当然如果仅仅是刷新浏览器，也就没有后面那些步骤了。
6. HotModuleReplacement.runtime 是客户端 HMR 的中枢，它接收到上一步传递给他的新模块的 hash 值，它通过 JsonpMainTemplate.runtime 向 server 端发送 Ajax 请求，服务端返回一个 json，该 json 包含了所有要更新的模块的 hash 值，获取到更新列表后，该模块再次通过 jsonp 请求，获取到最新的模块代码。这就是上图中 7、8、9 步骤。
7. 而第 10 步是决定 HMR 成功与否的关键步骤，在该步骤中，HotModulePlugin 将会对新旧模块进行对比，决定是否更新模块，在决定更新模块后，检查模块之间的依赖关系，更新模块的同时更新模块间的依赖引用。
8. 最后一步，当 HMR 失败后，回退到 live reload 操作，也就是进行浏览器刷新来获取最新打包代码。

## 运用 HMR 的简单例子

```
--hello.js
--index.js
--index.html
--package.json
--webpack.config.js
```

webpack.config.js的配置如下：

```
const path = require('path')
const webpack = require('webpack')
module.exports = {
    entry: './index.js',
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, '/')
    },
    devServer: {
        hot: true
    }
}

```

值得一提的是，在上面的配置中并没有配置 HotModuleReplacementPlugin，原因在于当我们设置 devServer.hot 为 true 后，并且在package.json 文件中添加如下的 script 脚本：

```
"start": "webpack-dev-server --hot --open"
```

添加 —hot 配置项后，devServer 会告诉 webpack 自动引入 HotModuleReplacementPlugin 插件，而不用我们再手动引入了。



接下来修改代码

```
// hello.js
- const hello = () => 'hello world' // 将 hello world 字符串修改为 hello eleme
+ const hello = () => 'hello eleme'
```

**第一步：webpack 对文件系统进行 watch 打包到内存中**

webpack-dev-middleware 调用 webpack 的 api 对文件系统 watch，当 hello.js 文件发生改变后，webpack 重新对文件进行编译打包，然后保存到内存中。

```
// webpack-dev-middleware/lib/Shared.js
if(!options.lazy) {
    var watching = compiler.watch(options.watchOptions, share.handleCompilerCallback);
    context.watching = watching;
}
```

 webpack 将 bundle.js 文件打包到了内存中，访问内存中的代码比访问文件系统中的文件更快，而且也减少了代码写入文件的开销，这一切都归功于[memory-fs](https://link.juejin.im/?target=http%3A%2F%2Flink.zhihu.com%2F%3Ftarget%3Dhttps%253A%2F%2Fgithub.com%2Fwebpack%2Fmemory-fs)，

webpack-dev-middleware 将 webpack 原本的 outputFileSystem 替换成了MemoryFileSystem 实例，这样代码就将输出到内存中。webpack-dev-middleware 中该部分源码如下：

```
// webpack-dev-middleware/lib/Shared.js
var isMemoryFs = !compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem;
if(isMemoryFs) {
    fs = compiler.outputFileSystem;
} else {
    fs = compiler.outputFileSystem = new MemoryFileSystem();
}
```

这样 bundle.js 文件代码就作为一个简单 javascript 对象保存在了内存中，当浏览器请求 bundle.js 文件时，devServer就直接去内存中找到上面保存的 javascript 对象返回给浏览器端。

**第二步：devServer 通知浏览器端文件发生改变**

启动 devServer 的时候，sockjs 在服务端和浏览器端建立了一个 webSocket 长连接，

最关键的步骤还是 webpack-dev-server 调用 webpack api 监听 compile的 `done` 事件，当compile 完成后，webpack-dev-server通过 `_sendStatus` 方法将编译打包后的新模块 hash 值发送到浏览器端。

```javascript
// webpack-dev-server/lib/Server.js
compiler.plugin('done', (stats) => {
  // stats.hash 是最新打包文件的 hash 值
  this._sendStats(this.sockets, stats.toJson(clientStats));
  this._stats = stats;
});
...
Server.prototype._sendStats = function (sockets, stats, force) {
  if (!force && stats &&
  (!stats.errors || stats.errors.length === 0) && stats.assets &&
  stats.assets.every(asset => !asset.emitted)
  ) { return this.sockWrite(sockets, 'still-ok'); }
  // 调用 sockWrite 方法将 hash 值通过 websocket 发送到浏览器端
  this.sockWrite(sockets, 'hash', stats.hash);
  if (stats.errors.length > 0) { this.sockWrite(sockets, 'errors', stats.errors); } 
  else if (stats.warnings.length > 0) { this.sockWrite(sockets, 'warnings', stats.warnings); }      else { this.sockWrite(sockets, 'ok'); }
};
```

**第三步：webpack-dev-server/client 接收到服务端消息做出响应**

 webpack-dev-server 修改了webpack 配置中的 entry 属性，在里面添加了 webpack-dev-client 的代码，这样在最后的 bundle.js 文件中就会有接收 websocket 消息的代码了。

webpack-dev-server/client 当接收到 type 为 hash 消息后会将 hash 值暂存起来，当接收到 type 为 ok 的消息后对应用执行 reload 操作，如下图所示，hash 消息是在 ok 消息之前。

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180702_141107.png)



在 reload 操作中，webpack-dev-server/client 会根据 hot 配置决定是刷新浏览器还是对代码进行热更新（HMR）。

```
// webpack-dev-server/client/index.js
hash: function msgHash(hash) {
    currentHash = hash;
},
ok: function msgOk() {
    // ...
    reloadApp();
},
// ...
function reloadApp() {
  // ...
  if (hot) {
    log.info('[WDS] App hot update...');
    const hotEmitter = require('webpack/hot/emitter');
    hotEmitter.emit('webpackHotUpdate', currentHash);
    // ...
  } else {
    log.info('[WDS] App updated. Reloading...');
    self.location.reload();
  }
}
```





hmr的一些源码解读的文章

https://github.com/liangklfangl/webpack-dev-server



https://github.com/liangklfangl/webpack-hmr



https://juejin.im/entry/5a0278fe6fb9a045076f15b9






