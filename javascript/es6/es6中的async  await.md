# 兼容性

所有浏览器已经支持



# 使用async声明函数

使用async声明的函数，和普通函数唯一的区别在于，返回值的不同。

## 返回值是promise

这是使用async声明的函数，最常规的用法

```js
const request = require('request');


async function f1() {
     return new Promise(function(resolve, reject) {
        request('http://www.baidu.com',function(err, res, body) {
            resolve(body)
        })
     })
}

(async function() {
    console.log(f1());
})()
```



## 返回值是普通值

如果return 出来一个普通值，会被包装成一个promise对象。该promise状态为fullfilled, 该promise的值为该简单值。可以使用.then() 方法取到该promise对象的值（该值就是async声明的函数返回来的简单值）

```js
async function f1 () {
    return 10;
}


console.log(f1());     // Promise {<resolved>: 10}

fn1().then(function (x) {
  console.log(x);      // 10
})
```

## 返回值为Error类型

如果return出来是一个Error类型，则同样会被包装成一个promise对象，该promise对象的状态是reject, 值是Error的信息

```js
async function f1 () {
    return new Error('报错了');
}

console.log(f1())     // Promise {<rejected>: Error: 报错了
```

如何想取出来该promise的报错信息，可以通过.then的第二个参数，或者通过.catch 方法

```js
async function f1() {
	throw new Error('ssss');
}

// 方法1
f1().then(function(x){
    console.log(x)
}, function(e) {
	console.log(e)
})

// 方法2
f1().catch(function(e){
	console.log(e)
})
```

## 没有返回值

如果没有return任何东西，则同样会返回一个promise对象。该promise对象的状态为fullfilled，该promsie的值为undefined.

```js
async function f1 () {
    //do nothing     
}


console.log(f1());                   // Promise {<resolved>: undefined}
```

```js
const rp = require('request-promise');


async function f1() {
     await rp('http://www.beibei.com');
}

(async () => {
    console.log(await f1());          // undefined
})()

```





# 使用await 取到 promise 对象中的值

await 关键字可以取到 promise 对象中的值，所以，目前取出promise对象中的值的方法有两种：

1. .then() 方法

   ```js
   let p = Promise.resolve()
   p.then(function(x) {
   	console.log(x)
   })
   ```

2. await 关键字

   ```js
   var p1 = Promise.resolve(1);
   
   (async function() {
       console.log(await p1);
   })()
   ```

需要注意的是，await 关键字只能在 async 声明的函数中使用。（这也是为什么上面的代码要放在 async 匿名的自执行函数里面）



await 最主要的作用是代替 .then 方法：

```js
// 使用 .then 方法
asycn function asyncFunc() {
	otherAsyncFunc().then(function(result) {
		console.log(result)
	})
}

// 使用 await 关键字
async function asyncFunc() {
    const result = await otherAsyncFunc();
    console.log(result);
}
```

当串联异步的操作时，await 要比.then方法更加简洁

```js
// 使用 .then 进行串联操作
function asyncFunc() {
	otherAsyncFunc1().then(function(x){
    	console.log(x)
        return otherAsyncFunc2();
    }).then(function(x) {
        console.log(x)
    })
}

// 使用await关键字
async function asyncFunc() {
    const result1 = await otherAsyncFunc1();
    console.log(result1);
    const result2 = await otherAsyncFunc2();
    console.log(result2);
}
```

当进行并发异步操作的时候，

```js
const request           = require('request');
const rp                = require('request-promise');

// 使用 .then 方法
function fn1() {
    let p1 = rp('http://www.baidu.com');
    let p2 = rp('http://www.baidu.com');
    Promise.all([p1, p2]).then(function([res1, res2]) {
        console.log(res1)
        console.log(res2)
    })
}


// 使用await 关键字
async function fn1() {
    let p1 = rp('http://www.baidu.com');
    let p2 = rp('http://www.baidu.com');
    let [res1, res2] = await Promise.all([p1, p2]);
    console.log(res1)
    console.log(res2)
}
```

当处理 异常时,  采用 await 关键字是使用try……catch， 而另一种则是使用 .catch() 

```js

async function asyncFunc() {
    try {
        await otherAsyncFunc();
    } catch (err) {
        console.error(err);
    }
}

// Equivalent to:
function asyncFunc() {
    return otherAsyncFunc()
    .catch(err => {
        console.error(err);
    });
}
```



await 关键字会让代码执行到 await 这一行的时候，“暂停执行”，等到异步的操作有了结果，再继续往下执行。



# async 与 await 的声明与调用

1. 如果一个函数通过async来声明，则一定可以通过await 关键字来取到该函数的返回值。
2. 如果一个函数通过async来声明，则一定也可以通过.then() 方法来取到该函数返回的 promise中的值(因为return出来的结果一定是promise对象)
3. 如果一个函数没有通过async 来声明，但只要return 出现的是promise对象 ，则也可以通过await来拿到promise里面的取值。
4. 如果一个函数没有通过async 来声明，但只要return 出来一个promise ，也可以通过.then()拿到promise里面值（在没有async/await 的年代就是这样做的）
5. 如果一个函数通过async声明，则在该函数内部可以使用await ，也可以使用.then()
6. 如何一个函数没有通过async 声明，则在该函数内部不可以使用await，但是可以使用 .then()



# await 会阻塞线程吗？

await 关键字只能用在 async 方法里面，当执行到 await 关键字时，代码会“暂停”执行，等到异步的方法返回了结果后，才会继续执行。那么，问题来了，await关键字会阻塞线程吗？

### 不会，本质是. then()的语法糖

await 并没有改变node的单线程的本质，没有改变event_loop的模型，只是方便我们写代码，更快捷，更清晰。

```
await foo();            // foo is an async function that returns a promise
console.log("hello");
```

上面的代码，执行到foo时会”暂停“，等待结果，然后才执行console.log，本质上是下面代码的语法糖：

```
foo().then(() => {
    console.log("hello");
});
```

await 关键字是把调用函数下面的逻辑，放入到一个隐形的，看不见的.then()中，让我们的代码看起来是同步执行的。



node的单线程在遇到await关键字后，流程如下图所:

![](https://ws4.sinaimg.cn/large/006tNbRwgy1fv7pbh633aj30w40fe0z6.jpg)



遇到函数内的await时，会发起异步调用，推入异步任务队列，然后node会接着执行**该函数被调用的那一行的下面的代码**。

所以，`await`关键字不会阻塞node的event_loop的线程。当代码执行到 async 函数遇到await 关键词时，不会继续往下执行，而是等待异步的结果，但是此时node线程并不会闲到无所事事，而是继续执行async 函数被调用的那一行下面的代码。等到异步操作的结果发生了变化时，将异步结果推入任务队列，event_loop从队列中取出事件，推入到执行栈中。



# await 真的会让代码变慢！

在上文中，await关键字不会阻塞node的event_loop的线程，那么，await 是不是可以放心大胆的时候了呢？

并不是！

### 我等得花儿都谢了



![](https://ws4.sinaimg.cn/large/0069RVTdgy1fv6skife8nj30mq0kiwjs.jpg)

在上面的代码中，requestsAsync 这个方法依次调用了多个await 方法。



![](https://ws1.sinaimg.cn/large/0069RVTdgy1fv6sndp7u3j308q0383yi.jpg)

虽然并不会阻塞event_loop线程：requestAsync 方法被调用的那一行下面的代码会被执行。

但是在requestAsync 方法内部其实造成了阻塞：在调用第一行异步请求时，会把这个推入到异步队列，然后暂停执行。等第一行异步请求有了结果之后，调用第二行异步请求时，接着会把这个推入到异步队列，然后再暂停执行的……

所以在 requestAsync 方法内部，每一行异步请求，都需要苦苦等待它上面的await请求结束后，才可以去发起请求，最终执行的时间消耗了1443ms



### 串行变并行

如果上面这种串行异步请求之间，没有依赖关系，建议修改成并行的结构。

也就是如下所示：

![image-20180912154519600](https://ws4.sinaimg.cn/large/0069RVTdgy1fv6sxkn3hjj31020ms79p.jpg)

上文中提到，**async 异步方法**也可以不加 await 关键词调用，返回的结果会是一个处于pendding 状态的promise对象。于是，上面代码中 **rp异步方法**不加 await 关键词调用，会返回一个个处于pendding 状态的promise对象。

因为没有await关键字，代码不会被暂停执行，所有的异步请求会被依次触发。

等待 **Promise.all()** 捕捉到所有的pendding 状态的promise对象的改变，可以拿到各个异步请求的结果。

采用这种请求的总耗时是：

![image-20180912155253460](https://ws2.sinaimg.cn/large/0069RVTdgy1fv6t5eza0yj308u038mx5.jpg)







# async的作用范围还是比较小的

也就是说，只有直接最外层的函数，是通过 async 声明的，才会生效，如果函数里面还有 .map() , .each 等方法，则无效。






参考资料：

http://exploringjs.com/es2016-es2017/ch_async-functions.html

http://2ality.com/2016/10/async-function-tips.html

