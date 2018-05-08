##  什么是单线程
1. 单线程的含义
同一个时间只能做一件事,
    ```js
    // 循环期间，js执行和dom渲染卡顿
    var i, sum = 0
    for (i = 0; i < 1000000000; i++) {
        sum += i;
    }
    console.log(sum)
    
    // alert不处理，js执行和dom渲染暂时卡顿
    console.log(1)
    alert('hello')
    console.log(2)
    ```

2. 单线程的原因
    - 浏览器需要渲染dom
    - js可以操作dom
    - js执行的时候，浏览器dom渲染会暂停（js引擎的执行和浏览器渲染dom的是在同一个线程里面的，是互斥的）
    - 两段js也不能同时执行 (js本身是单线程的)
    - webworker支持多线程，不能访问dom


3. 单线程解决方案是异步

    异步本身又会有很多问题，所以我们需要异步的解决方案
    ```js
    console.log(100)
    setTimeout(function() {
      console.log(200)     // 针对异步的操作，先让其他js代码执行
    }, 100)
    console.log(300)
    console.log(400)
    ```

4.  异步存在的问题
    1. 没有按照书写的方式执行，可读差
    2. 回调函数不容易模块化，回调函数不宜写的太复杂，要不然耦合度太高

5. 异步是通过event-loop来实现的

## 什么是event-loop
1. event-loop的含义
    event-loop就是事件轮询。
    
    




## 是否用过jquery的deferred


## promise 的基本使用和原理


## 介绍一下async/await的区别和联系

## 总结一下当前js解决异步的方案(发展过程、好处坏处)