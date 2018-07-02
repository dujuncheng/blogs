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

首先，执行了bin / webpack-dev-server.js，

```js
let server;

// 实例化Server构造函数，Server的构造函数放在 /lib/Server.js
// compiler 是外部webpack传入的方法
server = new Server(compiler, options);
 
```

new Server传入两个参数，compiler和options。compiler是在webpack-dev-server.js中声明的的，是webpack的一个实例：

```js
 let compiler;
  try {
    compiler = webpack(webpackOptions);
  } catch (e) {
    if (e instanceof webpack.WebpackOptionsValidationError) {
      console.error(colorError(options.stats.colors, e.message));
      process.exit(1); // eslint-disable-line
    }
    throw e;
  }
```

options是形如下面的一个对象：

```
{
    hot: true,
    host: 'localhost',
    publicPath: '/',
    filename: 'bundle.js',
    watchOptions: undefined,
    hotOnly: false,
    clientLogLevel: 'info',
    stats: {
        cached: false,
        cachedAssets: false,
        colors: {
            supportsColor: [Function: getSupportLevel],
            stdout: [Object],
            stderr: [Object]
        }
    },
    open: true,
    openPage: '',
    port: 8080
}
```

我们来看/lib/Server.js文件里面的Server构造函数：

```js
function Server() {}

Server.prototype.use = function (){}

Server.prototype.setContentHeader = function(){}

Server.prototype.checkHost= function(){}

Server.prototype.listen = function(){}

Server.prototype.close = function(){}

Server.prototype.sockWrite = function(){}

Server.prototype.serveMagicHtml = function (){}

// send stats to a socket or multiple sockets

Server.prototype._sendStats = function (sockets, stats, force){}

Server.prototype._watch = function(){}

Server.prototype.invalidate = function(){}

Server.addDevServerEntrypoint = require


module.exports = Server;
```

emmm, 非常经典的构造函数。

在 function Server 函数里面，有这样一行代码：

```js
// Init express server
const app = this.app = new express();
  
  app.get('/__webpack_dev_server__/live.bundle.js', () => {})
  
app.get('__webpack_dev_server__/sockjs.bundle.js',()=>{})

app.get('/webpack-dev-server.js', () => {})

app.get('/webpack-dev-server/*', () => {})

app.get('/webpack-dev-server', () => {})
```

Webpack-dev-serve 是基于express来启动服务的。

同时，我们还看到了这一行代码, 调用webpackDevMiddleware方法，并且传入了compiler(webpack 实例) 和 一些配置项：

```js
// middleware for serving webpack bundle
this.middleware = webpackDevMiddleware(compiler, Object.assign({}, options, wdmOptions));
```

webpackDevMiddleware 是 Share.js 在顶部引入的：

```js
const webpackDevMiddleware = require('webpack-dev-middleware');
```

我们找到webpackDevMiddleware方法，它藏在webpack-dev-middleware / middleware.js 中

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180702_152949.png)

这个文件的结构如上图所示。这个方法一进来就调用了一个Share的方法，传入了 context对象。

```js
	var context = {
		state: false,
		webpackStats: undefined,
		callbacks: [],
		options: options,
	    // 注意这里的 context.compiler，就是实例化的那个webpack
		compiler: compiler,
		watching: undefined,
		forceRebuild: false
	};
	var shared = Shared(context);
```

Share 方法是在 webpack-dev-middleware / lib / shared.js 中的。 share.js的结构如下图所示：

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180702_154016.png)

其中执行了 share.startWatch() 方法，这个方法在上面红框部分被定义的。

#### share.startWatch 

这个方法本质是调用 webpack 的 api 对文件系统 watch。当 hello.js 文件发生改变后，webpack 重新对文件进行编译打包，然后保存到内存中。

```javascript
// webpack-dev-middleware/lib/Shared.js
startWatch: function() {
			var options = context.options;
			var compiler = context.compiler;
			// start watching
			if(!options.lazy) {
				var watching = compiler.watch(options.watchOptions, share.handleCompilerCallback);
				context.watching = watching;
				//context.watching得到原样返回的Watching对象
			} else {
			 //如果是lazy，表示我们不是watching监听，而是请求的时候才编译
				context.state = true;
			}
		}
```

 

#### share.handleRangeHeaders

share对象身上有一个 handleRangeHeaders 方法，代码如下：

```js
handleRangeHeaders: function handleRangeHeaders(content, req, res) {
  // 下面的api是使用了express的api, 如果不是使用了express, 那可能需要自己写逻辑来增加这个字段头了。
  res.setHeader("Accept-Ranges", "bytes");
  if (req.headers.range) {
    var ranges = parseRange(content.length, req.headers.range);
    // 不满足 ranges
    if (-1 == ranges) {
      res.setHeader("Content-Range", "bytes */" + content.length);
      res.statusCode = 416;
    }
    
    // range 有效
    if (-2 != ranges && ranges.length === 1) {
      res.statusCode = 206;
      var length = content.length;
      res.setHeader(
        "Content-Range",
        "bytes " + ranges[0].start + "-" + ranges[0].end + "/" + length
      );
      content = content.slice(ranges[0].start, ranges[0].end + 1);
    }
  }
  return content;
},
```

该方法传入三个参数： content（请求文件的内容），req, res

range字段是在 HTTP/1.1里新增的一个 header field，也是现在众多号称多线程下载工具（如 FlashGet、迅雷等）实现多线程下载的核心所在。

#### share.setFs

`setFs` 方法是改写node的fs。我们打包出来的东西不写入硬盘， 而是将 bundle.js 文件打包到了内存中，访问内存中的代码比访问文件系统中的文件更快，而且也减少了代码写入文件的开销。这个借助了[memory-fs](https://link.juejin.im/?target=http%3A%2F%2Flink.zhihu.com%2F%3Ftarget%3Dhttps%253A%2F%2Fgithub.com%2Fwebpack%2Fmemory-fs)的库

```js
setFs: function(compiler) {
    // compiler.outputPath 必须是绝对路径，否则就报错
  if(typeof compiler.outputPath === "string" && !pathIsAbsolute.posix(compiler.outputPath) && !pathIsAbsolute.win32(compiler.outputPath)) {
    throw new Error("`output.path` needs to be an absolute path or `/`.");
  }
  
  var fs;
  var isMemoryFs = !compiler.compilers && compiler.outputFileSystem instanceof MemoryFileSystem;
  if(isMemoryFs) {
    fs = compiler.outputFileSystem;
  } else {
    fs = compiler.outputFileSystem = new MemoryFileSystem();
  }
  context.fs = fs;
},
```

webpack-dev-middleware 将 webpack 原本的 outputFileSystem 替换成了MemoryFileSystem 实例。

这样 bundle.js 文件代码就作为一个简单 javascript 对象保存在了内存中.

####  share.handleRequest

上文说了， bundle.js被存在了内存中，当浏览器请求 bundle.js 文件时，devServer就直接去内存中找到上面保存的 javascript 对象返回给浏览器端。handleRequst 这个方法就是做这件事情的。

```js
handleRequest: function (filename, processRequest, req) {
    // 如果是lazy-mode, 那就请求来了再 rebuild
    if (context.options.lazy && (!context.options.filename || context.options.filename.test(filename)))
        share.rebuild();
    // 如果filename里面有hash，那么我们通过fs从内存中读取文件名，同时回调就是直接发送消息到客户端
    if (HASH_REGEXP.test(filename)) {
        try {
            if (context.fs.statSync(filename).isFile()) {
                processRequest();
                return;
            }
        } catch (e) {}
    }
    share.ready(processRequest, req);
}, 
```

#### processRequest

上面的代码中，如过可以通过fs从内存中读取文件名，那么直接调用processRequest方法，processRequest就是直接把资源发送到客户端:

```js
function processRequest() {
    try {
        var stat = context.fs.statSync(filename);
        // 处理不是文件的情况
        if (!stat.isFile()) {
            if (stat.isDirectory()) {
                var index = context.options.index;

                if (index === undefined || index === true) {
                    index = "index.html";
                } else if (!index) {
                    throw "next";
                }

                filename = pathJoin(filename, index);
                stat = context.fs.statSync(filename);
                if (!stat.isFile()) throw "next";
            } else {
                throw "next";
            }
        }
    } catch (e) {
        return resolve(goNext());
    }

    // server content
    var content = context.fs.readFileSync(filename);
    content = shared.handleRangeHeaders(content, req, res);
    var contentType = mime.lookup(filename);
    // do not add charset to WebAssembly files, otherwise compileStreaming will fail in the client
    if (!/\.wasm$/.test(filename)) {
        contentType += "; charset=UTF-8";
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", content.length);
    // 自定义的头部，遍历加上
    if (context.options.headers) {
        for (var name in context.options.headers) {
            res.setHeader(name, context.options.headers[name]);
        }
    }
    // Express automatically sets the statusCode to 200, but not all servers do (Koa).
    res.statusCode = res.statusCode || 200;
    if (res.send) res.send(content);
    else res.end(content);
    resolve();
}
```

所以，在lazy模式下如果我们没有指定文件名filename，那么我们每次都是会重新rebuild的！但是如果指定了文件名，那么只有访问该文件名的时候才会rebuild

#### share.rebuild

```js
 rebuild: function rebuild() {
			//如果没有通过compiler.done产生过State对象，那么我们设置forceRebuild为true
			//如果已经有State表明以前build过，那么我们调用run方法
			if(context.state) {
				context.state = false;
				context.compiler.run(share.handleCompilerCallback);
			} else {
				context.forceRebuild = true;
			}
		},
```





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

```javascript
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

首先将 hash 值暂存到 currentHash 变量，当接收到 ok 消息后，对 App 进行 reload。如果配置了模块热更新，就调用 webpack/hot/emitter 将最新 hash 值发送给 webpack，然后将控制权交给 webpack 客户端代码。如果没有配置模块热更新，就直接调用 location.reload 方法刷新页面。

 **第四步：webpack 接收到最新 hash 值验证并请求模块代码**

在这一步，其实是 webpack 中三个模块（三个文件，后面英文名对应文件路径）之间配合的结果，首先是 webpack/hot/dev-server（以下简称 dev-server） 监听第三步 webpack-dev-server/client 发送的 `webpackHotUpdate` 消息，调用 webpack/lib/HotModuleReplacement.runtime（简称 HMR runtime）中的 check 方法，检测是否有新的更新，在 check 过程中会利用 webpack/lib/JsonpMainTemplate.runtime（简称 jsonp runtime）中的两个方法 `hotDownloadUpdateChunk` 和 `hotDownloadManifest` ， 第二个方法是调用 AJAX 向服务端请求是否有更新的文件，如果有将发更新的文件列表返回浏览器端，而第一个方法是通过 jsonp 请求最新的模块代码，然后将代码返回给 HMR runtime，HMR runtime 会根据返回的新模块代码做进一步处理，可能是刷新页面，也可能是对模块进行热更新。

两次请求的都是使用上一次的 hash 值拼接的请求文件名，hotDownloadManifest 方法返回的是最新的 hash 值，hotDownloadUpdateChunk 方法返回的就是最新 hash 值对应的代码块。然后将新的代码块返回给 HMR runtime，进行模块热更新。



**第五步：HotModuleReplacement.runtime 对模块进行热更新**

这一步是整个模块热更新（HMR）的关键步骤，而且模块热更新都是发生在HMR runtime 中的 hotApply 方法中，这儿我不打算把 hotApply 方法整个源码贴出来了，因为这个方法包含 300 多行代码，我将只摘取关键代码片段。

```js
// webpack/lib/HotModuleReplacement.runtime
function hotApply() {
    // ...
    var idx;
    var queue = outdatedModules.slice();
    while(queue.length > 0) {
        moduleId = queue.pop();
        module = installedModules[moduleId];
        // ...
        // remove module from cache
        delete installedModules[moduleId];
        // when disposing there is no need to call dispose handler
        delete outdatedDependencies[moduleId];
        // remove "parents" references from all children
        for(j = 0; j < module.children.length; j++) {
            var child = installedModules[module.children[j]];
            if(!child) continue;
            idx = child.parents.indexOf(moduleId);
            if(idx >= 0) {
                child.parents.splice(idx, 1);
            }
        }
    }
    // ...
    // insert new code
    for(moduleId in appliedUpdate) {
        if(Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
            modules[moduleId] = appliedUpdate[moduleId];
        }
    }
    // ...
}
```



从上面 hotApply 方法可以看出，模块热替换主要分三个阶段，第一个阶段是找出 outdatedModules 和 outdatedDependencies，这儿我没有贴这部分代码，有兴趣可以自己阅读源码。第二个阶段从缓存中删除过期的模块和依赖，如下：

```
delete installedModules[moduleId];
delete outdatedDependencies[moduleId];
```



第三个阶段是将新的模块添加到 modules 中，当下次调用 __webpack_require__ (webpack 重写的 require 方法)方法的时候，就是获取到了新的模块代码了。

模块热更新的错误处理，如果在热更新过程中出现错误，热更新将回退到刷新浏览器，这部分代码在 dev-server 代码中，简要代码如下：

```
module.hot.check(true).then(function(updatedModules) {
    if(!updatedModules) {
        return window.location.reload();
    }
    // ...
}).catch(function(err) {
    var status = module.hot.status();
    if(["abort", "fail"].indexOf(status) >= 0) {
        window.location.reload();
    }
});
```

dev-server 先验证是否有更新，没有代码更新的话，重载浏览器。如果在 hotApply 的过程中出现 abort 或者 fail 错误，也进行重载浏览器。

 **第六步：业务代码需要做些什么？**

当 hello.js 文件修改后， index.js 文件中调用 HMR 的 accept 方法，添加模块更新后的处理函数，及时将 hello 方法的返回值插入到页面中。代码如下：

```js
// index.js
if(module.hot) {
    module.hot.accept('./hello.js', function() {
        div.innerHTML = hello()
    })
}
```









hmr的一些源码解读的文章

https://github.com/liangklfangl/webpack-dev-server



https://github.com/liangklfangl/webpack-hmr



https://juejin.im/entry/5a0278fe6fb9a045076f15b9






