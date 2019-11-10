> 本文首发于 本人掘金专栏https://juejin.im/user/5a676894f265da3e2b16921c/posts， 欢迎关注交流

## 引子
最近在忙着阅读 `megalo` 的代码 (未来会出一个系列专门讲 `megalo` 的源码，还是挺有意思的，大家可以期待一下)。感觉 `megalo` 、 `mpvue` 等小程序的跨端框架也好， `weex` 跨平台框架也好，本质都差不多，都是 `fork` 了一份 `vue` 过来改了改，借助了 `vue` 的能力，在平台具体的`api`上换成了自己的。

其中，有一段代码觉得挺有意思：
```javascript
Vue.prototype._l = aop(Vue.prototype._l, {
    after: afterRenderList
  });
```
上面代码，通过 `aop` 拓展了 Vue 原型上的 `_l` 方法，当 `_l` 方法执行完后，再执行 `afterRenderList`。

那么，什么是 `AOP` ?

## 什么是AOP

`AOP`(Aspect-Oriented Programming)：面向切面的编程，是对面向对象编程（OOP）的补充。面向对象是纵向编程，继承、封装和多态，而面向切面编程补充面向对象的不足。

在`OOP`中，我们关注的是**类**（class），而在AOP中，我们关注的是**切面**。

比如说，一次表单提交，有正常的业务提交过程，但我们想在这个提交过程的横向加一个表单验证。或者一个正常的业务中，我们希望横向添加一些埋点功能，同时再横向添加运行时错误信息收集的功能，同时还能够验证一下是否有操作权限等，这些都是面向切面编程。

一般来说，如果你遇到了需要从外部增加一些行为，进而合并或修改既有行为，或者把业务逻辑代码和处理琐碎事务的代码分离开，以便能够分离复杂度等的业务场景，请一定要用好这种编程设计思想。

AOP比较典型的应用有：**日志记录、性能监控、埋点上报、异常处理**等等。

那么， javascript 中的 AOP 怎么实现呢？

## ES3 下通过高阶函数实现

什么是**高阶函数**？

高阶函数接受一个或多个函数，并返回一个函数。

我们经常用到的高阶函数有：`once`, `debounce`, `memoize`, `fluent`等

```javascript
// 原函数
var takePhoto =function(){
 console.log('拍照片');
}
// 定义 aop 函数
var after=function( fn, afterfn ){
 return function(){
 let res = fn.apply( this, arguments );
 afterfn.apply( this, arguments );
 return res;
 }
}
// 装饰函数
var addFilter=function(){
 console.log('加滤镜');
}
// 用装饰函数装饰原函数
takePhoto=after(takePhoto,addFilter);
takePhoto();

```

再来一个 `fluent` 的例子：

```javascript
function fluent(fn) {
 return function(...args) {
 fn.apply(this, args)
 return this
 }
}
function Person() {}
Person.prototype.setName = fluent(function(first, last) {
 this.first = first
 this.last = last
})
Person.prototype.sayName = fluent(function() {
 console.log(this.first, this.last)
})
var person = new Person()
person
 .setName('Jone', 'Doe')
 .sayName()
 .setName('John', 'Doe')
 .sayName()
```

这就是我们标准非侵入地动态扩展属性的方法：在执行原有代码的基础上再扩展所需要的功能。
事实上，`megalo` 的 aop 也是通过`高阶函数` 自己实现的。

```javascript
          function aop(fn, options) {
            if (options === void 0) options = {};
            
            var before = options.before;
            var after = options.after;
            return function () {
              var args = [],
                  len = arguments.length;
              while (len--) {
                args[len] = arguments[len];
              }var self = this;
              
              if (before) {
                before.call.apply(before, [self, args].concat(args));
              }
              
              var ret = fn.call.apply(fn, [self].concat(args));
              
              if (after) {
                after.call.apply(after, [self, ret].concat(args, [ret]));
              }
              
              return ret;
            };
          }
```

上面的 `aop` 函数，会给源函数 `fn` 拓展 `before` 和 `after` 方法。

## ES5 下装饰者的实现

在 ES5 中引入了`Object.defineProperty`，我们可以更方便的给对象添加属性：

```javascript
let takePhoto = function () {
 console.log('拍照片');
}
// 给 takePhoto 添加属性 after
Object.defineProperty(takePhoto, 'after', {
 writable: true,
 value: function () {
 console.log('加滤镜');
 },
});
// 给 takePhoto 添加属性 before
Object.defineProperty(takePhoto, 'before', {
 writable: true,
 value: function () {
 console.log('打开相机');
 },
});
// 包装方法
let aop = function (fn) {
 return function () {
 fn.before()
 fn()
 fn.after()
 }
}
takePhoto = aop(takePhoto)
takePhoto()
```

## 基于原型链和类的装饰者实现

```javascript

class Test {
 takePhoto() {
 console.log('拍照');
 }
}
// after AOP
function after(target, action, fn) {
 let old = target.prototype[action];
 if (old) {
 target.prototype[action] = function () {
 let self = this;
 fn.bind(self);
 fn(handle);
 }
 }
}
// 用 AOP 函数修饰原函数
after(Test, 'takePhoto', () => {
 console.log('添加滤镜');
});
let t = new Test();
t.takePhoto();

```

## 使用 ES7 修饰器实现装饰者

Decorator 提案经过了大幅修改，目前还没有定案，不知道语法会不会再变。

## 场景：性能上报

典型的场景是记录某异步请求请求耗时的性能数据并上报：

## 场景：异常处理

我们可以对原有代码进行简单的异常处理，而无需侵入式的修改

比如说，window.onerror 不可以捕获 异步的错误，比如说setTimeout, 所以会有人这样操作:

```javascript
var _setTimeout = window.setTimeout
window.setTimeout = function(cb, timeout) {
 var args = Array.prototype.slice.call(arguments, 2)
 return _setTimeout(function() {
 try {
 cb(...args)
 } catch (error) {
 // 对 error 进行加工后上报给服务器
 reportError(e)
 throw error
 }
 }, timeout)
}
```
