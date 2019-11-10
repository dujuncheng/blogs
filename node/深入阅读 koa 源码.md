> 本文首发于 本人掘金专栏https://juejin.im/user/5a676894f265da3e2b16921c/posts， 欢迎关注交流

# koa是什么

koa 2做了的事情：

1.  基于node原生req和res为request和response对象赋能，并基于它们封装成一个context对象。
    
2.  基于async/await 中间件洋葱模型机制。
    

**koa1和koa2**在源码上的**区别**主要是于对异步中间件的支持方式的不同。

**koa1**是使用**generator、yield**)的模式。

**koa2**使用的是**async/await**+Promise的模式。下文主要是针对koa2版本源码上的讲解。

# 初读koa源码

koa源码其实很简单，共4个文件。

```javascript

── lib
 ├── application.js
 ├── context.js
 ├── request.js
 └── response.js
 
 ```
 
 这4个文件其实也对应了koa的4个对象：
 
 ```javascript
 
 ── lib
 ├── new Koa() || ctx.app
 ├── ctx
 ├── ctx.req || ctx.request
 └── ctx.res || ctx.response
 
 ```
 
 `request.js` 和 `response.js` 在实现逻辑上完全一致，都是暴露出一个对象，对象属性都通过`getter` 和 `setter` 来实现读写和控制。

下面，我们先初步了解koa的源码内容，读懂它们，可以对koa有一个初步的了解。

### application.js

application.js是koa的入口（从koa文件夹下的package.json的main字段（lib/application.js）中可以得知此文件是入口文件），也是核心部分。

```javascript
/**
 * 依赖模块，包括但不止于下面的，只列出核心需要关注的内容
 */
const response = require('./response');
const compose = require('koa-compose');
const context = require('./context');
const request = require('./request');
const Emitter = require('events');
const convert = require('koa-convert');
/**
 * 继承Emitter，很重要，说明Application有异步事件的处理能力
 */
module.exports = class Application extends Emitter {
 constructor() {
 super();
 this.middleware = []; // 该数组存放所有通过use函数的引入的中间件函数
 this.subdomainOffset = 2; // 需要忽略的域名个数
 this.env = process.env.NODE_ENV || 'development';
 // 通过context.js、request.js、response.js创建对应的context、request、response。为什么用Object.create下面会讲解
 this.context = Object.create(context);
 this.request = Object.create(request);
 this.response = Object.create(response);
 }
 // 创建服务器
 listen(...args) {
 debug('listen');
 const server = http.createServer(this.callback()); //this.callback()是需要重点关注的部分，其实对应了http.createServer的参数(req, res)=> {}
 return server.listen(...args);
 }
 /*
 通过调用koa应用实例的use函数，形如：
 app.use(async (ctx, next) => {
 await next();
 });
 来加入中间件
 */
 use(fn) {
 if (isGeneratorFunction(fn)) {
 fn = convert(fn); // 兼容koa1的generator写法，下文会讲解转换原理
 }
 this.middleware.push(fn); // 将传入的函数存放到middleware数组中
 return this;
 }
 // 返回一个类似(req, res) => {}的函数，该函数会作为参数传递给上文的listen函数中的http.createServer函数，作为请求处理的函数
 callback() {
 // 将所有传入use的函数通过koa-compose组合一下
 const fn = compose(this.middleware);
 const handleRequest = (req, res) => {
 // 基于req、res封装出更强大的ctx，下文会详细讲解
 const ctx = this.createContext(req, res);
 // 调用app实例上的handleRequest，注意区分本函数handleRequest
 return this.handleRequest(ctx, fn);
 };
 return handleRequest;
 }
 // 处理请求
 handleRequest(ctx, fnMiddleware) {
 // 省略，见下文
 }
 // 基于req、res封装出更强大的ctx
 createContext(req, res) {
 // 省略，见下文
 }
};
```

从上面代码中，我们可以总结出**application.js**核心其实处理了这**4个事情**：

**1. 启动框架**

**2. 实现洋葱模型中间件机制**

**3. 封装高内聚的context**

**4. 实现异步函数的统一错误处理机制**

###  2.2 context.js

```javascript

const util = require('util');
const createError = require('http-errors');
const httpAssert = require('http-assert');
const delegate = require('delegates');
const proto = module.exports = {
 // 省略了一些不甚重要的函数
 onerror(err) {
 // 触发application实例的error事件
 this.app.emit('error', err, this);
 },
};
/*
 在application.createContext函数中，
 被创建的context对象会挂载基于request.js实现的request对象和基于response.js实现的response对象。
 下面2个delegate的作用是让context对象代理request和response的部分属性和方法
*/
delegate(proto, 'response')
 .method('attachment')
 ...
 .access('status')
 ...
 .getter('writable')
 ...;
delegate(proto, 'request')
 .method('acceptsLanguages')
 ...
 .access('querystring')
 ...
 .getter('origin')
 ...;
 
 ```
 
 
 从上面代码中，我们可以总结出context.js核心其实处理了这**2个事情**

**1. 错误事件处理**

**2. 代理response对象和request对象的部分属性和方法**

### request.js

```
module.exports = {
 // 在application.js的createContext函数中，会把node原生的req作为request对象(即request.js封装的对象)的属性
 // request对象会基于req封装很多便利的属性和方法
 get header() {
 return this.req.headers;
 },
 set header(val) {
 this.req.headers = val;
 },
 // 省略了大量类似的工具属性和方法
};

```

request对象基于node原生req封装了一系列便利属性和方法，供处理请求时调用。

所以当你访问ctx.request.xxx的时候，实际上是在访问request对象上的赋值器（setter）和取值器（getter）。

### response.js

```javascript

module.exports = {
 // 在application.js的createContext函数中，会把node原生的res作为response对象（即response.js封装的对象）的属性
 // response对象与request对象类似，基于res封装了一系列便利的属性和方法
 get body() {
 return this._body;
 },
 set body(val) {
 // 支持string
 if ('string' == typeof val) {
 }
 // 支持buffer
 if (Buffer.isBuffer(val)) {
 }
 // 支持stream
 if ('function' == typeof val.pipe) {
 }
 // 支持json
 this.remove('Content-Length');
 this.type = 'json';
 },
 }
 
```

值得注意的是，返回的**body支持Buffer、Stream、String以及最常见的json**，如上示例所示。

## 深入理解Koa 源码

下文会从**初始化、启动应用、处理请求**等的角度，来**对这过程中比较重要**的细节进行讲解及延伸，如果彻底弄懂，会对koa以及ES6、generator、async/await、co、异步中间件等有更深一步的了解

### 初始化

koa实例化：

```javascript

const Koa = require('koa');
const app = new Koa();

```

koa执行源码：

```javascript

module.exports = class Application extends Emitter {
 constructor() {
 super();
 this.proxy = false;
 this.middleware = [];
 this.subdomainOffset = 2;
 this.env = process.env.NODE_ENV || 'development';
 this.context = Object.create(context); //为什么要使用Object.create？ 见下面原因
 this.request = Object.create(request);
 this.response = Object.create(response);
 if (util.inspect.custom) {
 this[util.inspect.custom] = this.inspect;
 }
 }
}

```

当实例化koa的时候，koa做了以下**2件事**：

1.  **继承Emitter**，具备处理异步事件的能力。然而koa是如何处理，现在还不得而知，这里打个问号。
    
2.  在创建实例过程中，有三个对象作为实例的属性被**初始化**，分别是**context、request、response**。还有我们熟悉的存放中间件的数组**mddleware**。这里需要注意，是使用Object.create(xxx)对this.xxx进行赋值。
    

### 启动应用及处理请求

在实例化koa之后，接下来，使用app.use传入中间件函数:

```javascript

app.use(async (ctx,next) => {
 await next();
});

```

koa对应执行源码：

```javascript

use(fn) {
 if (isGeneratorFunction(fn)) {
 fn = convert(fn);
 }
 this.middleware.push(fn);
 return this;
 }
 
```

当我们执行app.use的时候，koa做了这**2件事情**：

1.  判断**是否是generator函数**，如果是，使**用koa-convert做转换**（koa3将不再支持generator）。
2.  **所有传入use**的**方法**，**会被push到middleware**中。


### 如何将generator函数转为类async函数

koa2处于对koa1版本的兼容，中间件函数如果是generator函数的话，会使用koa-convert进行转换为“类async函数”。（不过到第三个版本，该兼容会取消）。

那么究竟是怎么转换的呢？

我们先来想想**generator和async有什么区别**？

唯一的**区别就是async会自动执行，而generator每次都要调用next函数**。

所以问题变为，如何让generator自动执行next函数？

回忆一下generator的知识：每次执行generator的next函数时，它会返回一个对象：

```javascript
{ value: xxx, done: false }
```

返回这个对象后，如果能再次执行next，就可以达到自动执行的目的了。

看下面的例子：

```javascript

function * gen(){
 yield new Promise((resolve,reject){
 //异步函数1
 if（成功）{
 resolve（）
 }else{
 reject();
 }
 });
 yield new Promise((resolve,reject){
 //异步函数2
 if（成功）{
 resolve（）
 }else{
 reject();
 }
 })
}
let g = gen();
let ret = g.next();

```

此时ret = { value: Promise实例; done: false}；value已经拿到了Promise对象，那就可以自己定义成功/失败的回调函数了。如：

```javascript

ret.value.then(()=>{
 g.next();
 })

```

现在就大功告成啦。我们只要**找到一个合适的方法让g.next()一直持续下去**就可以自动执行了。

所以问题的关键在于yield的value必须是一个Promise。那么我们来看看co是如何把这些都东西都转化为Promise的：

```javascript

function co(gen) {
 var ctx = this; // 把上下文转换为当前调用co的对象
 var args = slice.call(arguments, 1) // 获取参数
 // we wrap everything in a promise to avoid promise chaining,
 // 不管你的gen是什么，都先用Promise包裹起来
 return new Promise(function(resolve, reject) {
 // 如果gen是函数，则修改gen的this为co中的this对象并执行gen
 if (typeof gen === 'function') gen = gen.apply(ctx, args);
 // 因为执行了gen，所以gen现在是一个有next和value的对象，如果gen不存在、或者不是函数则直接返回gen
 if (!gen || typeof gen.next !== 'function') return resolve(gen);
 // 执行类似上面示例g.next()的代码
 onFulfilled();
 function onFulfilled(res) {
 var ret;
 try {
 ret = gen.next(res); // 执行每一个gen.next()
 } catch (e) {
 return reject(e);
 }
 next(ret); //把执行得到的返回值传入到next函数中，next函数是自动执行的关键
 }
 function onRejected(err) {
 var ret;
 try {
 ret = gen.throw(err);
 } catch (e) {
 return reject(e);
 }
 next(ret);
 }
 /**
 * Get the next value in the generator,
 * return a promise.
 */
 function next(ret) {
 // 如果ret.done=true说明迭代已经完毕，返回最后一次迭代的value
 if (ret.done) return resolve(ret.value);
 // 无论ret.value是什么，都转换为Promise，并且把上下文指向ctx
 var value = toPromise.call(ctx, ret.value);
 // 如果value是一个Promise，则继续在then中调用onFulfilled。相当于从头开始！！
 if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
 return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
 + 'but the following object was passed: "' + String(ret.value) + '"'));
 }
 });
}

```

请留意上面代码的注释。

从上面代码可以得到这样的结论，**co的思想**其实就是：

**把一个generator封装在一个Promise对象中，然后再这个Promise对象中再次把它的gen.next()也封装出Promise对象，相当于这个子Promise对象完成的时候也重复调用gen.next()。当所有迭代完成时，把父Promise对象resolve掉。这就成了一个类async函数了。**

以上就是如何把generator函数转为类async的内容。

好啦，我们继续回来看koa的源码。

当执行完app.use时，服务还没启动，只有当执行到app.listen(3000)时，程序才真正启动。

koa源码：

```javascript

listen(...args) {
 const server = http.createServer(this.callback());
 return server.listen(...args);
 }

```

这里使用了node原生http.createServer创建服务器，并把this.callback()作为参数传递进去。

如果是用原生的node来写，是下面这种语法：

```javascript

var http = require('http');
http.createServer(function (req, res) {
 res.writeHead(200, {'Content-Type': 'text/plain'});
 res.write('Hello World!');
 res.end();
}).listen(8080);

```

上面的代码中，`http.createServer` 方法传入了一个回调函数。

每一次接收到一个新的请求的时候会调用这个回调函数，参数req和res分别是请求的实体和返回的实体，操作req可以获取收到的请求，操作res对应的是将要返回的packet。

弊端：`callback`函数非常容易随着业务逻辑的复杂也变得臃肿，即使把`callback`函数拆分成各个小函数，也会在繁杂的异步回调中渐渐失去对整个流程的把控。

解决： koa 把这些业务逻辑，拆分到不同的中间件中去处理

常用的中间件： 

   koa router
    
   koa logger 日志打印
    
   koa cors 跨域
    

可以知道，**this.callback()返回的**一定**是**这种形式：**(req, res) => {}**。继续看下this.callback代码。

```javascript

callback() {
 // compose处理所有中间件函数。洋葱模型实现核心
 const fn = compose(this.middleware);
 // 每次请求执行函数(req, res) => {}
 const handleRequest = (req, res) => {
 // 基于req和res封装ctx
 const ctx = this.createContext(req, res);
 // 调用handleRequest处理请求
 return this.handleRequest(ctx, fn);
 };
 return handleRequest;
 }
 handleRequest(ctx, fnMiddleware) {
 const res = ctx.res;
 res.statusCode = 404;
 // 调用context.js的onerror函数
 const onerror = err => ctx.onerror(err);
 // 处理响应内容
 const handleResponse = () => respond(ctx);
 // 确保一个流在关闭、完成和报错时都会执行响应的回调函数
 onFinished(res, onerror);
 // 中间件执行、统一错误处理机制的关键
 return fnMiddleware(ctx).then(handleResponse).catch(onerror);
 }

```

从上面源码可以看到，有这几个细节很关键：

1.  compose(this.middleware)做了什么事情（使用了koa-compose包）。
    
2.  如何实现洋葱式调用的？
    
3.  context是如何处理的？createContext的作用是什么？
    
4.  koa的统一错误处理机制是如何实现的？
    

下面，来进行一一讲解。

### koa-compose和洋葱式调用

这里可以结合之前的文章一起看

### 单一context原则

**context是如何处理的？createContext的作用是什么**？

context使用node原生的http监听回调函数中的req、res来进一步封装，意味着对于**每一个http请求**，koa**都会创建一个context**并**共享给所有的全局中间件使用**，当所有的中间件执行完后，会将所有的数据**统一交给res**进行**返回**。所以，在每个中间件中我们才能取得req的数据进行处理，最后ctx再把要返回的body给res进行返回。

**记住句话：每一个请求都有唯一一个context对象，所有的关于请求和响应的东西都放在其里面。**

下面来看context（即ctx）是怎么封装的：

```javascript

// 单一context原则
 createContext(req, res) {
 const context = Object.create(this.context); // 创建一个对象，使之拥有context的原型方法，后面以此类推
 const request = context.request = Object.create(this.request);
 const response = context.response = Object.create(this.response);
 context.app = request.app = response.app = this;
 context.req = request.req = response.req = req;
 context.res = request.res = response.res = res;
 request.ctx = response.ctx = context;
 request.response = response;
 response.request = request;
 context.originalUrl = request.originalUrl = req.url;
 context.state = {};
 return context;
 }

```

本着**一个请求一个context**的原则，context必须作为一个临时对象存在，所有的东西都必须放进一个对象，因此，从上面源码可以看到，app、req、res属性就此诞生。

请留意以上代码，**为什么app、req、res、ctx也存放在了request、和response对象中呢**？

使它们同时共享一个app、req、res、ctx，是为了将处理职责进行转移，当用户访问时，只需要ctx就可以获取koa提供的所有数据和方法，而koa会继续将这些职责进行划分，比如request是进一步封装req的，response是进一步封装res的，这样职责得到了分散，降**低**了**耦合**度，同时共享所有资源使context具有**高内聚**的性质，内部元素互相能访问到。

在createContext中，还有这样一行代码：

```javascript

context.state = {};

```

这里的state是专门负责保存单个请求状态的空对象，可以根据需要来管理内部内容。

### 异步函数的统一错误处理机制

接下来，我们再来看第四个问题：**koa的统一错误处理机制是如何实现的**？

回忆一下我们如何在koa中统一处理错误，只需要让koa实例监听onerror事件就可以了。则所有的中间件逻辑错误都会在这里被捕获并处理。如下所示：

```javascript
app.on('error', err => {  log.error('server error', err)});
```

这是怎么做到的呢？核心代码如下（在上面提到的application.js的handleRequest函数中）：

```javascript

handleRequest(ctx, fnMiddleware) {
 const res = ctx.res;
 res.statusCode = 404;
 // application.js也有onerror函数，但这里使用了context的onerror，
 const onerror = err => ctx.onerror(err);
 const handleResponse = () => respond(ctx);
 onFinished(res, onerror);
 // 这里是中间件如果执行出错的话，都能执行到onerror的关键！！！
 return fnMiddleware(ctx).then(handleResponse).catch(onerror);
 }

```

这里其实会有2个疑问：

1.  **出错执行的回调函数是context.js的onerror函数，为什么在app上监听onerror事件，就能处理所有中间件的错误呢？***

请看下context.js的onerror：

```javascript
onerror(err) {    this.app.emit('error', err, this);}
```

这里的this.app是对application的引用，当**context.js调用onerror**时，其实**是触发application实例的error事件**。该事件是基于“**Application类继承自EventEmitter**”这一事实。

2.  **如何做到集中处理所有中间件的错误？**

```javascript

function compose (middleware) {
 return function (context, next) {
 let index = -1
 return dispatch(0)
 function dispatch (i) {
 if (i <= index) return Promise.reject(new Error('next() called multiple times'))
 index = i
 let fn = middleware[i]
 if (i === middleware.length) fn = next
 if (!fn) return Promise.resolve()
 try {
 return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
 } catch (err) {
 return Promise.reject(err)
 }
 }
 }
}

```

还有外部处理：

```javascript
// 这里是中间件如果执行出错的话，都能执行到onerror的关键！！！
return fnMiddleware(ctx).then(handleResponse).catch(onerror);
```

主要涉及这几个知识点：

1.  **async**函数**返回**一个**Promise**对象
    
2.  **async**函数内部**抛出错误**，会**导致Promise**对象**变为reject**状态。抛出的错误**会被catch**的回调函数(上面为onerror)捕获到。
    
3.  **await**命令**后面的Promise**对象如果**变为reject状态**，reject的参数**也可以被catch**的回调函数(上面为onerror)捕获到。
    

这样就可以理解为什么koa能实现异步函数的统一错误处理了。

### 委托模式

最后讲一下koa中使用的设计模式——委托模式。

当我们在使用context对象时，往往会这样使用：

   ctx.header 获取请求头
    
   ctx.method 获取请求方法
    
   ctx.url 获取请求url
    

这些对请求参数的获取都得益于context.request的许多属性都被委托在context上了

```javascript

delegate(proto, 'request')
 .method('acceptsLanguages')
 ...
 .access('method')
 ...
 .getter('URL')
 .getter('header')
 ...;

```

又比如，

ctx.body 设置响应体

ctx.status 设置响应状态码

ctx.redirect() 请求重定向

这些对响应参数的设置都得益于koa中的context.response的许多方法都被委托在context对象上了：

```javascript

delegate(proto, 'response')
 .method('redirect')
 ...
 .access('status')
 .access('body')
 ...;

```

至于delegate的使用和源码就不展开了

为什么 ctx 这里代理用 delegate，而 response 和 request 代理原生的`res` 和 `req` 对象通过 `getter ` 和 `setter` ？
因为 `getter` 和 `setter` 中可以写逻辑，做一些处理，delegate 只是单纯的代理，本质还是基于`getter` 和 `setter` 实现的。
