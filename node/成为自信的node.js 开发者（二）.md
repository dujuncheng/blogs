这一章，我们来学习一下event_loop, 本文内容旨在厘清浏览器（browsing context）和Node环境中不同的 Event Loop。

首先清楚一点：浏览器环境和 node环境的`event-loop` 完全不一样。

# 浏览器环境

为了协调事件、用户交互、脚本、UI渲染、网络请求等行为，用户引擎必须使用`Event Loop`。`event loop`包含两类：基于browsing contexts，基于worker。

本文讨论的浏览器中的EL基于browsing contexts

![](https://user-gold-cdn.xitu.io/2019/2/18/168ffe62f5da6d9d?w=1494&h=1080&f=jpeg&s=70941)

上面图中，关键性的两点：

   同步任务直接进入主执行栈（call stack）中执行
    
   等待主执行栈中任务执行完毕，由EL将异步任务推入主执行栈中执行
    

### task——宏任务

task在网上也被成为`macrotask` （宏任务）

#### 宏任务分类：

   script代码
    
   setTimeout/setInterval
    
   setImmediate （未实现）
    
   I/O
    
   UI交互
    

#### 宏任务特征

   一个`event loop` 中，有一个或多个 task队列。
    
   不同的task会放入不同的task队列中：比如，浏览器会为鼠标键盘事件分配一个task队列，为其他的事件分配另外的队列。
    
   先进队列的先被执行
    

### microtask——微任务

微任务

#### 微任务的分类

通常下面几种任务被认为是microtask

   promise（`promise`的`then`和`catch`才是microtask，本身其内部的代码并不是）
    
   MutationObserver
    
   process.nextTick(nodejs环境中)
    

#### 微任务特性

一个EL中只有一个microtask队列。

### event-loop的循环过程

一个EL只要存在，就会不断执行下边的步骤：

> 先执行同步代码，所有微任务，一个宏任务，所有微任务（，更新渲染），一个宏任务，所有微任务（，更新渲染）......
> 执行完microtask队列里的任务，有可能会渲染更新。在一帧以内的多次dom变动浏览器不会立即响应，而是会积攒变动以最高60HZ的频率更新视图

### 例子

```javascript
setTimeout(() => console.log('setTimeout1'), 0);
setTimeout(() => {
    console.log('setTimeout2');
    Promise.resolve().then(() => {
        console.log('promise3');
        Promise.resolve().then(() => {
            console.log('promise4');
        })
        console.log(5)
    })
    setTimeout(() => console.log('setTimeout4'), 0);
}, 0);
setTimeout(() => console.log('setTimeout3'), 0);
Promise.resolve().then(() => {
    console.log('promise1');
})
```

打印出来的结果是 ：

```
promise1
setTimeout1
setTimeout2
'promise3'
5
promise4
setTimeout3
setTimeout4
```

另外一个例子：

```javascript
console.log('script start')

async function async1() {
    await async2()
    console.log('async1 end')
}
async function async2() {
    console.log('async2 end')
}
async1()

setTimeout(function () {
    console.log('setTimeout')
}, 0)

new Promise(resolve => {
    console.log('Promise')
    resolve()
})
    .then(function () {
        console.log('promise1')
        setTimeout(() => {
            console.log('sssss')
        }, 0)
    })
    .then(function () {
        console.log('promise2')
    })

console.log('script end')
```

在浏览器内输出结果如下, node内输出结果不同

```
'script start'
'async2 end'
'Promise'
'script end'
'async1 end'
'promise1'
'promise2'
'setTimeout'
'sssss'
```

1.  await 只是 `fn().then()` 这些写法的语法糖，相当于 `await` 那一行代码下面的代码都被当成一个微任务，推入到了`microtask queue` 中
    
2.  ![](https://user-gold-cdn.xitu.io/2019/2/18/168ffe62f5e9c0fa?w=548&h=266&f=jpeg&s=9205)
    
    顺序：执行完同步任务，执行微任务队列中的全部的微任务，执行一个宏任务，执行全部的微任务
    

# node 环境中

Node中的`event-loop`由 **libuv库** 实现，js是单线程的，会把回调和任务交给libuv

`event loop` 首先会在内部维持多个事件队列，比如 时间队列、网络队列等等，而libuv会执行一个相当于 while true的无限循环，不断的检查各个事件队列上面是否有需要处理的pending状态事件，如果有则按顺序去触发队列里面保存的事件，同时由于libuv的事件循环每次只会执行一个回调，从而避免了 竞争的发生

个人理解，它与浏览器中的轮询机制（一个task，所有microtasks；一个task，所有microtasks…）最大的不同是，node轮询有phase（阶段）的概念，不同的任务在不同阶段执行，进入下一阶段之前执行所有的process.nextTick() 和 所有的microtasks。

## 阶段

![](https://user-gold-cdn.xitu.io/2019/2/18/168ffe62f5fbc7bd?w=990&h=640&f=jpeg&s=40565)

   timers阶段
    
    在这个阶段检查是否有超时的timer(setTimeout/setInterval)，有的话就执行他们的回调
    
    但timer设定的阈值不是执行回调的确切时间（只是最短的间隔时间），node内核调度机制和其他的回调函数会推迟它的执行
    
    由poll阶段来控制什么时候执行timers callbacks
    
   I/O callback 阶段
    
    处理异步事件的回调，比如网络I/O，比如文件读取I/O，当这些事件报错的时候，会在 `I/O` callback阶段执行
    
   poll 阶段
    
    这里是最重要的阶段，poll阶段主要的两个功能：
    
       处理poll queue的callbacks
        
       回到timers phase执行timers callbacks（当到达timers指定的时间时）
        
    
    进入poll阶段，timer的设定有下面两种情况：
    
    1.  event loop进入了poll阶段， **未设定timer**
        
           poll queue不为空：event loop将同步的执行queue里的callback，直到清空或执行的callback到达系统上限
            
           poll queue为空
            
               如果有设定` callback`, event loop将结束poll阶段进入check阶段，并执行check queue (check queue是 setImmediate设定的)
                
               如果代码没有设定setImmediate() callback，event loop将阻塞在该阶段等待callbacks加入poll queue
                
    2.  event loop进入了 poll阶段， **设定了timer**
        
           如果poll进入空闲状态，event loop将检查timers，如果有1个或多个timers时间时间已经到达，event loop将回到 timers 阶段执行timers queue
            
    
    这里的逻辑比较复杂，流程可以借助下面的图进行理解：
    
    ![](https://ws1.sinaimg.cn/large/006tKfTcgy1g0anodoa11j311i0h0t8w.jpg)
    
   check 阶段
    
    一旦poll队列闲置下来或者是代码被`setImmediate`调度，EL会马上进入check phase
    
   close callbacks
    
    关闭I/O的动作，比如文件描述符的关闭，连接断开等
    
    如果socket突然中断，close事件会在这个阶段被触发
    

![](https://user-gold-cdn.xitu.io/2019/2/18/168ffe62f67d9f2e?w=532&h=572&f=jpeg&s=17709)

同步的任务执行完，先执行完全部的`process.nextTick()` 和 全部的微任务队列，然后执行每一个阶段，每个阶段执行完毕后，

## 注意点

#### setTimeout 和 setImmediate

1.  调用阶段不一样
    
2.  不同的io中，执行顺序不保证
    

二者非常相似，区别主要在于调用时机不同。

   `setImmediate` 设计在poll阶段完成时执行，即check段；
    
   `setTimeout` 设计在poll阶段为空闲时，且设定时间到达后执行，但它在timer阶段执行
    

```javascript
setTimeout(function timeout () {
  console.log('timeout');
},0);
setImmediate(function immediate () {
  console.log('immediate');
});
```

对于以上代码来说，setTimeout 可能执行在前，也可能执行在后。
首先 `setTimeout(fn, 0) === setTimeout(fn, 1)`，这是由源码决定的。

如果在准备时候花费了大于 1ms 的时间，那么在 timer 阶段就会直接执行 setTimeout 回调。
 如果准备时间花费小于 1ms，那么就是 setImmediate 回调先执行了。

也就是说，进入事件循环也是需要成本的。有可能进入event loop 时，`setTimeout(fn, 1)` 还在等待timer中，并没有被推入到 `time 事件队列`，而`setImmediate` 方法已经被推入到了 `check事件队列` 中了。那么event_loop 按照`time`、`i/o`、`poll`、`check`、`close` 顺序执行，先执行`immediate` 任务。

![](https://user-gold-cdn.xitu.io/2019/2/18/168ffe62f69bd5bf?w=520&h=618&f=jpeg&s=36192)

也有可能，进入event loop 时，`setTimeout(fn, 1)` 已经结束了等待，被推到了`time` 阶段的队列中，如下图所示，则先执行了`timeout` 方法。

![](https://user-gold-cdn.xitu.io/2019/2/18/168ffe62f6846897?w=604&h=716&f=jpeg&s=59260)

所以，`setTimeout` `setImmediate` 哪个先执行，这主要取决于，进入event loop 花了多长时间。

但当二者在异步i/o callback内部调用时，总是先执行setImmediate，再执行setTimeout

```javascript
const fs = require('fs')
fs.readFile(__filename, () => {
    setTimeout(() => {
        console.log('timeout');
    }, 0)
    setImmediate(() => {
        console.log('immediate')
    })
})
```

在上述代码中，setImmediate 永远先执行。因为两个代码写在 IO 回调中，IO 回调是在 poll 阶段执行，当回调执行完毕后队列为空，发现存在 setImmediate 回调，所以就直接跳转到 check 阶段去执行回调了。

### process.nextTick() 和 setImmediate()

> 官方推荐使用 `setImmediate()`，因为更容易推理，也兼容更多的环境，例如浏览器环境

   `process.nextTick()` 在当前循环阶段结束之前触发
    
   `setImmediate()` 在下一个事件循环中的check阶段触发
    

通过`process.nextTick()`触发的回调也会在进入下一阶段前被执行结束，这会允许用户递归调用 `process.nextTick()` 造成I/O被榨干，使EL不能进入poll阶段

因此node作者推荐我们尽量使用setImmediate，因为它只在check阶段执行，不至于导致其他异步回调无法被执行到

### 例子

```javascript
console.log('start')
setTimeout(() => {
  console.log('timer1')
  Promise.resolve().then(function() {
    console.log('promise1')
  })
}, 0)
setTimeout(() => {
  console.log('timer2')
  Promise.resolve().then(function() {
    console.log('promise2')
  })
}, 0)
Promise.resolve().then(function() {
  console.log('promise3')
})
console.log('end')
```

注意：主栈执行完了之后，会先清空 process.nextick() 队列和microtask队列中的任务，然后按照每一个阶段来执行先处理异步事件的回调，比如网络I/O，比如文件读取I/O。当这些I/O动作都结束的时候，在这个阶段会触发它们的

另外一个例子

```javascript
const {readFile} = require('fs')

setTimeout(() => {
    console.log('1')
}, 0)

setTimeout(() => {
    console.log('2')
}, 100)

setTimeout(() => {
    console.log('3')
}, 200)

readFile('./test.js', () => {
    console.log('4')
})

readFile(__filename, () => {
    console.log('5')
})

setImmediate(() => {
    console.log('立即回调')
})

process.nextTick(() => {
    console.log('process.nexttick的回调')
})

Promise.resolve().then(() => {

    process.nextTick(() => {
        console.log('nexttick 第二次回调')
    })
    console.log('6')
}).then(() => {
    console.log('7')
})
```

上面代码的结果是：

```
process.nexttick的回调
6
7
nexttick 第二次回调
1
立即回调
4
5
2
3
```

上面代码需要注意点:

1.  下面两个回调任务，要等`100ms` 和 `200ms` 才能被推入到`timers` 阶段的任务队列
    
    ![](https://user-gold-cdn.xitu.io/2019/2/20/16906ce18b463c2f?w=640&h=776&f=jpeg&s=59125)
    
2.  两个读取文件的回调，需要等待读取完成后，才能被推入到 `poll` 阶段的任务队列。（不是被推入到 `io` 阶段的任务队列，只有读取失败等异常的回调，才会被推入到 `io` 阶段的任务队列）
    
3.  在微任务里面，新添加的`process.nextTick()` 也会在新阶段的开始之前被执行。简单理解为，在每一个阶段的任务队列开始之前，都需要全部清空`process.nextTick` 和 `microtask` 任务队列
    

## 一个误区

自己在验证上面的想法的时候，实验过很多代码，从未失手过，但是当实验到下面的代码时：

```javascript
Promise.resolve().then(() => {
    console.log(1)
    Promise.resolve().then(() => {
        console.log(2)
    })
}).then(() => {
    console.log(3)
})
```

按照上面我们讲的，这里应该是输出`132`, 但是反复验证，在 `node` 实际输出的是 `123`，连续好几天都不得其解，后来看到一个问答，才恍然大悟： https://stackoverflow.com/questions/36870467/what-is-the-order-of-execution-in-javascript-promises

首先，上面的代码，在`.then()` 的回调函数中去执行`promise.resolve()`, 实际上是， 在目前的`promise 链`中新建了一个独立的 `promise链` 。 你没有任何办法保证这两个哪个先执行完，这实际上是node引擎 的一个bug，就像一口气发出两个请求，并不知道哪个请求先返回。

每次我们都能得到相同的结果是因为，我们`Promise.resolve()`里面恰好没有异步的操作，这并不是`event-loop` 专门设计成这样的。

所以，不必花太多的时间，在上面的代码中，实际写代码中，也不会出现这种情况。
