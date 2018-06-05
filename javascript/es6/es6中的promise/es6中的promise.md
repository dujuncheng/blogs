
promise是`异步`编程的一种解决方案。
## 什么是异步
有两个函数，分别是函数A和函数B，如何在程序中保证，先执行函数A再执行函数B, 有两种方案：
1. 事件触发
2. 回调

promise区别上面两种方案

## promise 的语法


异常捕获

catch可以捕获语法的错误和异常的情况
```js
result.then(function() {
  console.log('xx')
}).then(function() {
  console.log('xx')
}).catch(function(err) {
  console.log(err)
})
```

多个串联

promise.all 和 promise.race

promise 标准

  



