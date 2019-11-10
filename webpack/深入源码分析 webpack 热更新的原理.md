> 本文首发于 本人掘金专栏 https://juejin.im/user/5a676894f265da3e2b16921c/posts，

现在，已经有很多人分析过 `webpack` 热更新的文章了。

那么，为什么还要写本篇文章呢？

主要是，我想从源码分析的角度去梳理一下。

`webpack` 热更新的整体流程比较复杂，第一次接触的同学很容易陷入到`webpack-dev-server`/ `webpack-client` 这些名字的深渊中，希望这篇文章会对你有帮助。

## 从入口开始

一般来说，我们跑起来一个前端项目的命令是：

```javascript
npm run start
```

那么，我们找到这个项目的`package.json` 文件，可以找到下面这段代码：

```javascript
"scripts": {
 "start": "webpack-dev-server --hot --open"
},
```

上面的代码意思是，使用 `webpack-dev-server` 这个命令，传入`hot`、`open` 两个参数。

### `webpack-dev-server` 命令是从哪里来的呢？

我们在 `./node_module` 目录下面，找到 `webpack-dev-server` 包，找到这个包的 `package.json` 文件，这个文件描述了 这个 `npm` 包的行为，有一个字段是 `bin`，如下面：

```javascript
"bin": "bin/webpack-dev-server.js",
```

上面代码的意思是，当我们执行 `webpack-dev-server` 命令时，本质是执行了`node_module/webpack-dev-server/bin/webpack-dev-server.js` 这个文件。

### `webpack-dev-server.js`

`webpack-dev-server.js` 做了什么呢？

主要是做了两件事情：

2.  引用 `webpack`，然后开始编译，实例化出一个 `compiler` ，比如说`var compiler = webpack(options)`
    
3.  启动服务，并且刚才实例化出来的 `compiler` ，传入到服务中。比如说`new Server(compiler)` 。
    

下面的代码，就是简化版的 `webpack-dev-server.js` 的内容

```javascript
// bin/webpack-dev-server.js 的内容

// 1. 调用 webpack 开始编译
let compiler;
try {
    compiler = webpack(webpackOptions);
} catch (e) {
    throw e;
}

// 2. 启动服务
const Server = require('../lib/Server');
try {
    server = new Server(compiler, options);
} catch (e) {
    process.exit(1);
}
```

细心的同学会发现，`new Server()` 里面其实传入了 `compiler` 对象。`compiler` 对象代表着 `webpack`编译过程， 我们就可以在服务端的拿到编译各个过程的钩子。

调用 `webpack()` 方法，我们亲爱的`webpack` 会编译打包我们的代码到内存中。具体 `webpack` 的编译打包过程，这里就不讲解了，内容有点多，以后有机会再说。

接下来，我们把注意力转移到本文的重点，代码热更新上。也就是， `new Server()` 背后做了什么。

### `new Server()` 做了什么事情呢？

其实就是三件事情： 建立了`http`的静态资源服务 、建立了 `websocket` 服务、监听了 webpack 重新编译的 `done` 的生命周期。

`http`的静态资源服务的作用是什么呢？

作用是：提供打包后的 `js` 资源。当开发时候，在浏览器里面请求 `http://localhost:8081/bundle.js` 的静态资源，就可以拿到对应的js文件。这是因为中间件 `webpack-dev-middleware` 使用了 `express` 框架搭建了一个静态资源的服务。我们后面会讲解到。

`websocket` 服务的作用是什么呢？

作用是：用于通知浏览器。这里的服务端，并不是远程的服务端，而是跑在我们本机上的服务。服务端没有办法通过`http` 协议去通知浏览器，『嘿，你需要更新了』，只能通过 `websocket` 协议去通知浏览器。

接下来，我们就来看一下，是如何建立`http`的静态资源服务的？

### 建立 http 静态资源服务

首先是，引用了 `express` 框架，起了一个后端服务；

```javascript
const express = require('express');
const app = this.app = new express();
```

但是，光跑起来服务还不行，我们还要匹配对应的路径，返回不同的静态资源；

其次，使用中间件 `webpack-dev-middleware`，匹配对应的路径。

下面这一段代码，本质就是提供了普通的静态资源服务器的基本功能。作用是，根据客户端请求的路径，返回不同的文件内容。

唯一不同的地方是，文件内容是从内存中读出的，因为访问内存中的代码比访问文件系统中的文件更快，而且也减少了代码写入文件的开销，这一切都归功于[memory-fs](https://link.zhihu.com/?target=https%3A//github.com/webpack/memory-fs)。

```javascript
function processRequest() {
	try {
		var stat = context.fs.statSync(filename);
		if(!stat.isFile()) {
			// 是目录
			if(stat.isDirectory()) {
				// 如果是访问 localhost:8080, index 就是 undefined
				var index = context.options.index;
				if(index === undefined || index === true) {
					// 默认是 index.html
					index = "index.html";
				} else if(!index) {
					throw "next";
				}
				// 找到了
				filename = pathJoin(filename, index);
				stat = context.fs.statSync(filename);
				// 如果不是文件，则报错退出
				if(!stat.isFile()) throw "next";
			} else {
				throw "next";
			}
		}
	} catch(e) {
		return resolve(goNext());
	}
	// 从内存中找到 "/Users/dudu/webstorm/beibei/webpack-HMR-demo//bundle.js"
	// 从内存中，读出 /bundle.js 的二进制数据
	var content = context.fs.readFileSync(filename);
	content = shared.handleRangeHeaders(content, req, res);
	// 确定响应的contentType
	var contentType = mime.lookup(filename);
	if(!/\.wasm$/.test(filename)) {
		contentType += "; charset=UTF-8";
	}
	// 设置 Content-Type Content-Length
	res.setHeader("Content-Type", contentType);
	res.setHeader("Content-Length", content.length);
	if(context.options.headers) {
		for(var name in context.options.headers) {
			res.setHeader(name, context.options.headers[name]);
		}
	}
	// Express automatically sets the statusCode to 200, but not all servers do (Koa).
	// 作者似乎黑了一把 Koa
	res.statusCode = res.statusCode || 200;
	if(res.send) res.send(content);
	else res.end(content);
	resolve();
}
```

我们用 webpack-dev-server 相对简单，直接安装依赖后执行命令即可，用 `webpack-dev-middleware` 可以在既有的 Express 代码基础上快速添加 `webpack-dev-server` 的功能，同时利用 Express 来根据需要添加更多的功能，如 mock 服务、代理 API 请求等。

### 建立 websocket 服务

使用 `sockjs` 库，建立一个 `websocket ` 的服务。

```javascript
// 建立一个 `websocket ` 的服务
const sockjs = require('sockjs');
const sockServer = sockjs.createServer();
```

但是，光有 `websocket` 的服务还不行啊，还得有客户端的请求啊，我们并没有写接收 `websocket `消息的代码。

当我们使用了 `webpackd-dev-server`, 就会修改了webpack 配置中的 entry 属性，在里面添加了建立 `websocket` 连接的代码，这样在最后的 `bundle.js` 文件中就会有接收 `websocket` 消息的代码了。

### 监听了编译过程的`done` 钩子

其实，本质就是监听 `compiler.done` 的生命周期

上文中说过，`new Server(compiler)` 传入了 `compiler` 对象，`compiler` 对象代表着webpack编译过程， 就可以拿到编译各个过程的钩子。

下面的代码，是监听了 `done` 的生命周期函数，如果文件发生了变化，webpack 发生了重新编译，在`done` 的钩子中， 调用 `_sendStats` 方法，使用 `websocket` 协议去通知浏览器。

```javascript
// webpack-dev-server/lib/Server.js
compiler.plugin('done', (stats) => {
  // stats.hash 是最新打包文件的 hash 值
  this._sendStats(this.sockets, stats.toJson(clientStats));
  this._stats = stats;
});

Server.prototype._sendStats = function (sockets, stats, force) {
  // 调用 sockWrite 方法将 hash 值通过 websocket 发送到浏览器端
  this.sockWrite(sockets, 'hash', stats.hash);
};
```

接下来，我们把视角转到浏览器中。

浏览器会接收 `websocket` 消息， 这部分的代码，是被打到 `bundle.js` 里面的。

源码是 `node_modules/_webpack-dev-server@2.11.5@webpack-dev-server/client/index.js`

我们来看一下：

```javascript
var socket = function initSocket(url, handlers) {
  sock = new SockJS(url);

  sock.onopen = function onopen() {
    retries = 0;
  };

  sock.onclose = function onclose() {

  };
  // 在这里，接收 来自 webpack-dev-server 的各种消息
  sock.onmessage = function onmessage(e) {
    var msg = JSON.parse(e.data);
    // 根据 服务端传过来的 type, 调用不同的处理函数
    if (handlers[msg.type]) {
      handlers[msg.type](msg.data);
    }
  };
};
```

上面处理函数的集合 ` handlers ` 长什么样子呢？

```javascript
var onSocketMsg = {
  hot: function hot() {},
  invalid: function invalid() {},
  hash: function hash(_hash) {
    currentHash = _hash;
  },
  'still-ok': function stillOk() {},
  'log-level': function logLevel(level) {},
  overlay: function overlay(value) {},
  progress: function progress(_progress) {},
  'progress-update': function progressUpdate(data) {},
  ok: function ok() {
    sendMsg('Ok');
    reloadApp();
  },
  'content-changed': function contentChanged() {
    self.location.reload();
  },
  warnings: function warnings(_warnings) {},
  errors: function errors(_errors) {},
  error: function error(_error) {},
  close: function close() {}
};
```

我们可以发现，服务器传给浏览器的 websocket 消息有好多类型哦，

但是我们只需要关注 `hash` 类型 和 `ok` 类型：

```javascript
// webpack-dev-server/client/index.js
hash: function msgHash(hash) {
    currentHash = hash;
},
ok: function msgOk() {
    reloadApp();
},
function reloadApp() {
  if (hot) {
    log.info('[WDS] App hot update...');
    const hotEmitter = require('webpack/hot/emitter');
    hotEmitter.emit('webpackHotUpdate', currentHash);
  } else {
    log.info('[WDS] App updated. Reloading...');
    self.location.reload();
  }
}
```

如上面代码所示，首先将 hash 值暂存到 `currentHash` 变量，当接收到 `ok` 类型消息后，对 App 进行 `reload`。

判断是否配置了模块热更新`hot`，如果没有配置模块热更新，就直接调用 location.reload 方法刷新页面。如果配置了，就调用`hotEmitter.emit('webpackHotUpdate', currentHash)`

接下来发生了什么呢？

```javascript
// 监听第三步 webpack-dev-server/client 发送的 webpackHotUpdate 消息
// 调用了 check() 方法
hotEmitter.on("webpackHotUpdate", function(currentHash) {
  lastHash = currentHash;
  // 竟然去执行了检查，真是严谨的小 webpack 啊
  check();
});
```

执行了 `check()` 过程，那么究竟是怎么检查是否需要更新的呢？

在 `check` 过程中会利用两个方法: `hotDownloadManifest` 和 `hotDownloadUpdateChunk`

```javascript
// 调用 AJAX 向服务端请求是否有更新的文件，如果有将发更新的文件列表返回浏览器端
hotDownloadManifest(hotRequestTimeout).then(function(update) {
	if(!update) {
		hotSetStatus("idle");
		return null;
	}
	hotRequestedFilesMap = {};
	hotWaitingFilesMap = {};
	hotAvailableFilesMap = update.c;
	hotUpdateNewHash = update.h;
	hotSetStatus("prepare");
	var promise = new Promise(function(resolve, reject) {
		hotDeferred = {
			resolve: resolve,
			reject: reject
		};
	});
	hotUpdate = {};
	var chunkId = 0;
	hotEnsureUpdateChunk()
	if(hotStatus === "prepare" && hotChunksLoading === 0 && hotWaitingFiles === 0) {
		// 真正开始下载了
		hotUpdateDownloaded();
	}
	return promise;
});
```

上面代码的核心就是：

先检查是否需要更新，再下载更新的文件

```javascript
return hotDownloadManifest().then(function() {
  hotEnsureUpdateChunk()
  hotUpdateDownloaded();
});
```

我们先来看一下 `hotDownloadManifest` 方法做了什么：

```javascript
// webpack自己写了一个原生ajax
function hotDownloadManifest(requestTimeout) {
	requestTimeout = requestTimeout || 10000;
	return new Promise(function(resolve, reject) {
		if(typeof XMLHttpRequest === "undefined")
			return reject(new Error("No browser support"));
		try {
			// 构建了一个原生的 XHR 对象
			var request = new XMLHttpRequest();
			// 拼接请求的路径
			// hotCurrentHash 是 89e94c7776606408e5a3
			// requestPath 是 "89e94c7776606408e5a3.hot-update.json"
			var requestPath = __webpack_require__.p + "" + hotCurrentHash + ".hot-update.json";
			//
			request.open("GET", requestPath, true);
			request.timeout = requestTimeout;
			request.send(null);
		} catch(err) {
			return reject(err);
		}
		request.onreadystatechange = function() {
			// success
			try {
				// update 是 "{"h":"3f8a14b8d23b5bad41cc","c":{"0":true}}"
				var update = JSON.parse(request.responseText);
			} catch(e) {
				reject(e);
				return;
			}
		};
	});
}
```

上面的代码，核心流程是，构造一个原生的 XHR 对象， 向服务端请求是否有更新的文件，发送的`GET` 请求的路径是类似于 "89e94c7776606408e5a3.hot-update.json" 这样的。中间一串数字是 hash 值。

服务端如果有将发更新的文件列表返回浏览器端，拿到的文件列表大概是这样的

```javascript
"{"h":"3f8a14b8d23b5bad41cc","c":{"0":true}}"
```

接下来，执行 `hotEnsureUpdateChunk` 方法，如下面代码所示。最终其实是执行了 `hotDownloadUpdateChunk` 方法。

```javascript
function hotEnsureUpdateChunk(chunkId) {
	if(!hotAvailableFilesMap[chunkId]) {
		hotWaitingFilesMap[chunkId] = true;
	} else {
		hotRequestedFilesMap[chunkId] = true;
		hotWaitingFiles++;
		hotDownloadUpdateChunk(chunkId);
	}
}
```

`hotDownloadUpdateChunk` 方法的核心就是使用 `jsonp` 去下载更新后的代码：

```javascript
function hotDownloadUpdateChunk(chunkId) {
	var head = document.getElementsByTagName("head")[0];
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.charset = "utf-8";
	script.src = __webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js";
	;
	head.appendChild(script);
}

```

上面的代码中，所谓的`jsonp` 技术，其实没什么难度。

核心就是创建一个 `<script>` 标签，设置好`type`、`src` 属性，浏览器就去下载 js 脚本。因为浏览器在下载脚本的时候，不会进行跨域处理，所以 `jsonp` 也常常用于处理跨域。

`<script>` 标签的 `src` 属性指定了 js 脚本文件的路径，是由 `chunkId` 和 `hotCurrentHash` 拼接起来的：

```javascript
// 大概长这个样子
"http://localhost:8080/0.4d6b38763300df57f063.hot-update.js"
```

然后，浏览器就回去下载这个文件：

![image-20191025215807578](https://user-gold-cdn.xitu.io/2019/10/26/16e05c5b8570b725?w=1396&h=182&f=png&s=32944)

下载回来的文件大概是长这个样子的：

```javascript
webpackHotUpdate(0,{

/***/ 28:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
const hello = () => 'hell12o world nice12333'
/* harmony default export */ __webpack_exports__["a"] = (hello);


/***/ })

})
```

到目前为止，我们经历了的流程是：

`文件更新` -> `webpack 重新编译打包` -> `监听到 编译打包的 done 阶段` -> `发送socket 通知浏览器` -> `浏览器收到通知` -> `发送 ajax 请求检查` -> `如果确实需要更新，发送 jsonp 请求拉取新代码` -> `jsonp 请求回来的代码可以直接执行`

我们接着来看，接下来发生了什么？

接下来，我们要更新的代码已经下载下来了。我们应该怎么样，在保持页面状态的情况下，把新的代码插进去。

我们注意到，下载的文件中，调用了 `webpackHotUpdate` 方法。这个方法的定义如下：

```javascript
//  `webpackHotUpdate` 方法 的定义
var parentHotUpdateCallback = window["webpackHotUpdate"];
window["webpackHotUpdate"] =
  function webpackHotUpdateCallback(chunkId, moreModules) { // eslint-disable-line no-unused-vars
  hotAddUpdateChunk(chunkId, moreModules);
  if(parentHotUpdateCallback) parentHotUpdateCallback(chunkId, moreModules);
} ;
```

上面代码的核心，是调用了 `hotAddUpdateChunk` 方法， `hotAddUpdateChunk` 方法又调用了 `hotUpdateDownloaded` 方法，又调用了 `hotApply` 方法。

这一步是整个模块热更新（HMR）的关键步骤，这儿我不打算把 hotApply 方法整个源码贴出来了，因为这个方法包含 300 多行代码，我将只摘取关键代码片段：

```javascript
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

从上面 `hotApply` 方法可以看出，模块热替换主要分三个阶段

-   第一个阶段是找出 `outdatedModules` 和 `outdatedDependencie`
    
-   第二个阶段从缓存中删除过期的模块和依赖，如下：
    

```javascript
delete installedModules[moduleId];
delete outdatedDependencies[moduleId];
```

-   第三个阶段是将新的模块添加到 modules 中，当下次调用 __webpack_require__ (webpack 重写的 require 方法)方法的时候，就是获取到了新的模块代码了
    

但是，我们还剩最后一件事情，当用新的模块代码替换老的模块后，但是业务代码并不能知道代码已经发生变化，虽然新代码已经被替换上去了，但是并没有被真正执行一遍。

接下来，就是热更新的阶段。

不知道你有没有听过或看过这样一段话：“在高速公路上将汽车引擎换成波音747飞机引擎”。

微信小程序的开发工具，没有提供类似 Webpack 热更新的机制，所以在本地开发时，每次修改了代码，预览页面都会刷新，于是之前的路由跳转状态、表单中填入的数据，都没了。

如果有类似 Webpack 热更新的机制存在，则是修改了代码，不会导致刷新，而是保留现有的数据状态，只将模块进行更新替换。也就是说，既保留了现有的数据状态，又能看到代码修改后的变化。

webpack 具体是如何实现呢？

需要 我们开发者，自己去写一些额外的代码。

这些额外的代码，告诉 `webpack` 要么是接受变更（页面不用刷新，模块替换下就好），要么不接受（必须得刷新）。我们需要手动在业务代码里面这样写类似于下面

```javascript
if (module.hot) {
  // 选择接受并处理 timer 的更新, 如果 timer.js 更新了，不刷新浏览器更新
  module.hot.accept('timer', () => {
    // ...
  })
  // 如果 foo.js 更新了，需要刷新浏览器
  module.hot.decline('./foo')
}
```

这些额外的代码放在哪里呢？

假设 `index.js` 引用了 `a.js`。那么，这些额外的代码要么放在 `index.js`，要么放在 `a.js` 中。

Webpack 的实现机制有点类似 DOM 事件的冒泡机制，更新事件先由模块自身处理，如果模块自身没有任何声明，才会向上冒泡，检查使用方是否有对该模块更新的声明，以此类推。如果最终入口模块也没有任何声明，那么就刷新页面了。

关于这块内容，可以看 这一篇文章的讲解 [https://juejin.im/post/5c14beee51882531b81b3818](https://juejin.im/post/5c14beee51882531b81b3818)

这样就是整个 HMR 的工作流程了。


![](https://user-gold-cdn.xitu.io/2019/10/26/16e0854a5f76fa54?w=914&h=1052&f=png&s=436779)
