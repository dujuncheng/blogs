
promise是`异步`编程的一种解决方案。
## 什么是异步
有两个函数，分别是函数A和函数B，如何在程序中保证，先执行函数A再执行函数B, 有两种方案：
1. 事件触发
2. 回调

promise区别上面两种方案

# promise

1. `producing code` 是做一些异步事情的代码，比如说异步请求，请求数据库
2. `consuming code` 是想要拿到 `producing code` 结果的代码。
3.  promise 是一个javascript对象，连接 `producing code ` 和 `consuming code`

```js
let promise = new Promise(function(resolve, reject) {
  // executor 
});
```

被传入 new Promise () 方法被称为 `executor`,  当 new Promise () ，`executor `  方法会被自动调用。

一个promise对象有两个属性：

1. **state**

   最初是`pending`, 然后要么是`fulfilled`, 要么是`rejected`

2. **result**

   最后是`undefined`

当`executor` 干完活了，要么调用 `resolve()`, 要么调用`reject()`

1. **resolve()**
   - 把`state`修改为`fullfilled`
   - 把`result` 设置为传入的参数
2. **reject()**
   - 把 `state` 修改为`rejected`
   - 把`result` 设置为传入的参数

![image-20180816091706909](http://p8cyzbt5x.bkt.clouddn.com/2018-08-16-011707.png)

下面就是例子：

```js
let promise = new Promise(function(resolve, reject) {
  // 这个方法，在new Promise 的时候就会被自动执行
  // 在1秒之后，state变为‘fullfilled’, value 变为‘done’
  setTimeout(() => resolve("done!"), 1000);
});
```

上面的代码，我们声明的promise 会在一秒钟后，其属性 `state` 变为 `fullfilled`, 其属性 `value` 变为 `done`



### 注意点：

1. 只能执行一次resolve 或者 reject, 也就是 promise 实例的 `state` 只能被改变一次。其余的 resolve 或者 reject 会被忽略

   ```js
   var p1 = new Promise ((resolve, reject) => {
   	resolve('done1');    // only this one will make different
      
     reject('err');       // will be ignored
     setTimeout(() => {
       resolve('done2')   // will be ignored
     }, 1000)
   })
   ```

   

2. `reject()` 可以传入任意参数，但是最好是`err`

3. `executor` 干的活，可以是同步的，也可以是异步的，也就是，`resolve` 被立即执行也是可以的。

4. promise 实例的 `state` 属性和`value`属性，都是内部的外部不可见，那么我们怎么样才能在 `comsumer code`拿到 value 呢？ 通过 then 。

   

# then

上面说过了， promise 是链接`producing code` 和 `comsuming code` 的桥梁。 `comsuming code` 可以拿到`producing code`的结果。`comsuming code ` 是通过`.then`或者 `.catch` 方法注册的。

```js
promise.then(
  function(result) { /* handle a successful result */ },
  function(error) { /* handle an error */ }
);
```

`.then` 方法的第一个函数：

1. 当 promise 的状态变为 `fullfilled`时被立即执行
2. 参数为 promise 实例的 value

`.then` 方法的第二个函数：

1. 当 promise 的状态变为 `rejected`时被立即执行
2. 接收error



注意点：

1. 如果promise 实例状态仍然是 `pending` ，则 then / catch 方法都会继续等着，如果promise 实例的状态一旦发生改变，则 then / catch 方法会被立即执行。

2. 即使 promise executor 不是异步的，是立即执行的，还是then 下面的方法先执行：

   ```js
   const executor = resolve => resolve("done!");
   const promise = new Promise(executor);
   
   promise.then(alert); // this alert shows last (*)
   
   alert("code finished"); // this alert shows first 
   ```

   ```js
   var p1  = new Promise((resolve,rejec) => {
       // 会先执行这句，因为promise里面的executor会被立即执行
       console.log('11111111')
       // 遇到了异步任务，会将任务推到任务队列
       setTimeout(() => {
           // 第三步执行
         	console.log('333333333')
           resolve('done')
       },100)
   })
   
   // then 方法也会被推到任务队列
   p1.then((result) => {
       // 第四步执行
       console.log('4444444')
       console.log(result);
   })
   
   // 这一行第二步执行
   console.log('2222222222')
   ```

3. 

  



