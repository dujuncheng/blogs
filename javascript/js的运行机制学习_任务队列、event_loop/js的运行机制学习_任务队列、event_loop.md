# 前言
让`javascript`区别于其他编程语言的是js处理`IO`的方式。
我们经常听`NodeJS`是一个基于`v8`引擎`非阻塞（non-bloking）`, `事件驱动(event-driven)`的平台。
这些答案就在js的核心——event-loop

# 同步、异步、阻塞、非阻塞的关系

- 同步、异步关注的是**指令执行顺序**
  
  `同步`是**必须**等待`IO操作`完成才返回的调用方式;
  `异步`**不必**等待`IO操作`完成就返回的调用方式
   
- 阻塞、非阻塞关注的是**线程与进程**
   
  阻塞是指调用线程被操作系统挂起; 非阻塞是指调用线程或者进程不会被操作系统挂起。

- 异步的原因是**IO**, 异步的前提是**多线程**

  没有IO操作，所有的代码基本都是同步的
  有了IO操作后，如果没有多进程多线程，所有代码还是同步的
  有了IO操作，有了多进程多线程，代码才有了异步的可能性，同时也产生了阻塞与非阻塞
   

> javascript是单线程，为什么仍然可以异步？

> js是单线程，但浏览器是多线程的。js引擎在执行代码的时候，遇到异步任务，浏览器工作线程（http请求线程，定时器线程）来执行。
  之后，js在主栈继续执行下一帧，浏览器工作线程来执行异步的任务，任务完成之后，将完成事件和回调函数推入到任务队列。

#  js是单线程的
## 单线程含义
同一个时间只能做一件事

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
     

## 单线程原因
- 浏览器需要渲染dom
- js可以操作dom
- js执行的时候，浏览器dom渲染会暂停（js引擎的执行和浏览器渲染dom的是在同一个线程里面的，是互斥的）
- 两段js也不能同时执行 (js本身是单线程的)
- webworker支持多线程，不能访问dom






# 浏览器是多线程的
浏览器的内核是多线程的：

1. `JavaScript引擎线程`： 

    JavaScript引擎是基于事件驱动单线程执行的，JavaScript 引擎一直等待着任务队列中任务的到来，然后加以处理。
2. `GUI渲染线程` 

    GUI渲染线程负责渲染浏览器界面，当界面需要重绘（Repaint）或由于某种操作引发回流(reflow)时,该线程就会执行。但需要注意GUI渲染线程与JavaScript引擎是互斥的，当JavaScript引擎执行时GUI线程会被挂起，GUI更新会被保存在一个队列中等到JavaScript引擎空闲时立即被执行。
    
    下面的代码演示了，js线程和浏览器的渲染线程是互斥的
    ```js
       <button id='do'> Do long calc!</button>
       <div id='status'></div>
       <div id='result'></div>
        
        
       $('#do').on('click', function(){
         // 此处会触发redraw事件，但会放到队列里执行，直到long()执行完。
         $('#status').text('calculating....');
       
         
         // 执行长时间任务，造成阻塞
         long();
  
        });
         
       function long(){
         var result = 0
         for (var i = 0; i<1000; i++){
           for (var j = 0; j<1000; j++){
             for (var k = 0; k<1000; k++){
               result = result + i+j+k
             }
           } 
         }
       }
    ```
    
3. `事件触发线程`
 
    事件触发线程，当一个事件被触发时该线程会把事件添加到“任务队列”的队尾，等待JavaScript引擎的处理。这些事件可来自JavaScript引擎当前执行的代码块如setTimeOut、也可来自浏览器内核的其他线程如鼠标点击、AJAX异步请求等，但由于JavaScript是单线程执行的，所有这些事件都得排队等待JavaScript引擎处理。
4. `定时器线程`： 
   
   setTimeout() 等待的过程是浏览器的定时器线程在做
   浏览器定时计数器并不是由JavaScript引擎计数的, 因为JavaScript引擎是单线程的, 如果处于阻塞线程状态就会影响记计时的准确, 因此通过单独线程来计时并触发定时是更为合理的方案。
   
5. `异步http请求线程`： 

    ajax 发起请求也是浏览器的异步http线程在做
    在XMLHttpRequest在连接后是通过浏览器新开一个线程请求， 将检测到状态变更时，如果设置有回调函数，异步线程就产生状态变更事件放到 JavaScript引擎的处理队列中等待处理。


# 同步任务，异步任务
主线程在面对任务时，把任务分成两种，一种是同步任务（synchronous），另一种是异步任务（asynchronous）。
## 同步任务

能马上拿到预期的返回值或者看到了预期的效果
## 异步任务

Javascript中异步任务有两个，
其一是基于浏览器的各种异步IO和事件监听，
其二是Javascript代码中的关于定时器；

### 处理异步任务的两种
1. 回调函数式的传统异步函数
```js
A(args..., callbackFn)﻿​
```
它可以叫做异步过程的发起函数，或异步任务注册函数。

有两个关键的点：
 - 发起函数(或叫注册函数)A
 - 回调函数callbackFn
注册函数和回调函数都是在主线程上调用的，
其中注册函数用来发起异步过程，
向浏览器的工作线程发起请求, 
之后浏览器的工作线程会来执行异步任务(数定时器，发起异步请求),
回调函数用来处理结果。

2. es6的promise
关于『es6中的promise』的具体执行过程，将在本文下面进行介绍

# 执行过程
对于**同步任务**，`js主进程`将其推入`执行栈（stack）`；对于**异步任务**，`js主线程`发起一个异步请求，浏览器工作线程接收请求，主线程继续执行后面的同步任务，同时浏览器的工作线程执行异步任务。

工作线程中有`定时器线程`、`http异步请求线程`，比如说js中`ajax()`只是向浏览器工作线程发起“我这里有个异步任务”，具体的工作（发起和接收请求）是浏览器的`http`异步请求线程在做。

浏览器的工作线程完成工作后，将事件和回调函数推入任务队列，js主线程在执行完所有同步任务后，通过`event-loop`去拉取消息，推入执行栈，执行回调函数或执行`promise.then()`方法。
可以配合下面的图进行理解：

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180509_120653.png)

## Stack（栈）
这里放着`JavaScript`正在执行的任务。每个任务被称为`帧（stack of frames）`。

```js
function f(b){
  var a = 12;
  return a+b+35;
}

function g(x){
  var m = 4;
  return f(m*x);
}

g(21);
```
调用`g`时，创建栈的第一帧，该帧包含了`g`的参数和局部变量。当`g`调用`f`时，第二帧就会被创建，并且置于第一帧之上，
当然，该帧也包含了`f`的参数和局部变量。当`f`返回时，其对应的帧就会出栈。同理，当`g`返回时，栈就为空了。 


## heap(堆)
一个用来表示内存中一大片非结构化区域的名字，对象都被分配在这。

## Queue（任务队列）
该队列是由一系列待处理的任务组成。而每个任务都有相对应的函数。
当栈为空时，就会从任务队列中取出一个任务，并处理之。

## event-loop(事件轮询)
EventLoop也是一个程序，它会不停的轮询任务队列中的事件。如果Javascript线程空了，则取出任务队列的第一个事件，然后找到此事件的处理函数并执行处理函数。主线程从"任务队列"中读取事件，这个过程是循环不断的，所以整个的这种运行机制又称为Event Loop（事件循环）。

正如上述所说，“任务队列”是一个事件的队列，如果I/O设备完成任务或用户触发事件（该事件指定了回调函数），那么相关事件处理函数就会进入“任务队列”，当主线程空闲时，就会调度“任务队列”里第一个待处理任务，（FIFO）。当然，对于定时器，当到达其指定时间时，才会把相应任务插到“任务队列”尾部。

## 回调函数的具体执行过程
传统的 js 是通过普及回调函数来构建异步编程模型的，而回调函数通常以参数的形式被传入。
```js
readFile('example.txt', function(err, contents){
    if(err){
        throw err
    }
    console.log(contents)
})
console.log('hi~')
```
`readFile`函数有两个参数，第一个参数是要被读取的文件，第二个参数就是回调函数。
`readFile()`被立刻调用，从磁盘中读取相应的文件，这是一个异步操作，js 主进程把它交给了浏览器的工作进程，js 主进程继续执行, 输出 "hi~"。交给浏览器工作进程的异步任务被执行完后，浏览器工作进程会把『消息』（消息中有回调函数）塞到js 的异步队列中。 当js 主进程的执行栈为空时，将会通过event loop 取出『消息』，然后 js 主进程执行回调函数。

## promise 的具体执行过程
关于promise的介绍，可以看我写的《学习js中的promise》﻿



## 定时器
在到达指定时间时，定时器就会将相应回调函数插入“任务队列”尾部。这就是“定时器(timer)”功能。
定时器 包括setTimeout与setInterval两个方法。它们的第二个参数是指定其回调函数推迟\每隔多少毫秒数后执行。 
零延迟`setTimeout(func, 0)`并不是意味着回调函数立刻执行:
1. 当指定的值小于4毫秒，则增加到4ms（4ms是HTML5标准指定的，对于2010年及之前的浏览器则是10ms
2. 添加到任务队列后，什么时候执行，取决于主线程当前是否空闲和任务队列之前排队的人数
如果你理解上述知识，那么以下代码就应该对你没什么问题了：
```js
console.log(1);
setTimeout(function(){
    console.log(2);
},10);
console.log(3);
// 输出：1 3 2
```

```js
(function () {

  console.log('this is the start');

  setTimeout(function cb() {
    console.log('this is a msg from call back');
  });

  console.log('this is just a message');

  setTimeout(function cb1() {
    console.log('this is a msg from call back1');
  }, 0);

  console.log('this is the  end');

})();

// 输出如下：
this is the start
this is just a message
this is the end
undefined // 立即调用函数的返回值
this is a msg from callback
this is a msg from a callback1
```




##  异步存在的问题
1. 没有按照书写的方式执行，可读差
2. 回调函数不容易模块化，回调函数不宜写的太复杂，要不然耦合度太高



# jQuery的deferred

## jQuery deferred的写法
jquery1.5的版本发生了变化，子啊1.5之后，增加了`jQuery deferred`。
deferred是promise的初步概念

jQuery 1.5之前关于异步请求的写法
```js
var ajax = $.ajax({
  url: 'xx',
  success: function() {
    
  },
  error: function() {
    
  }
})
console.log(ajax)  // 返回一个xhr对象
```
jquery 1.5之后的写法
```js
var ajax = $.ajax('data.json')
ajax.done(function() {
    console.log('success1')	
}).fail(function() {
    console.log('erro')
}).done(function() {
    console.log('success2')
})

console.log(ajax) // 返回一个deffered对象
```
上面的写法也可以改成下面的写法：
```js
var ajax = $.ajax('data.json')

ajax.then(function() {
	console.log('success')
}, function() {
  console.log('error')
}).then(function() {
  console.log('success')
},function() {
  console.log('error')
})
```
可以看出，这种写法很类似于`promise`的写法。`promise`最早的思想从`Jquery`时代就已经提出来了。

但是也存在一些问题：

1. 无法改变js异步和单线程的本质
2. 只能从写法上杜绝callback
3. 只是一种语法糖，但是解耦了代码
4. 很好的体现了*开放封闭原则*（对拓展开放，对修改封闭）
    
    ```js
       // 1.5之前的写法
       var ajax = $.ajax({
         url: 'xx',
         success: function() {
            // 对修改开放，对拓展封闭
            console.log('1')
            console.log('2')
            console.log('3')
         },
         error: function() {
           
         }
       })
       // 1.5之后的写法
       // 对修改封闭，对拓展封闭
       ajax.then(function() {
       	console.log('success')
       }, function() {
         console.log('error')
       }).then(function() {
         console.log('success')
       },function() {
         console.log('error')
       })
    ```
    
## 应用jQuery deferred


现在有下面这段代码，我们使用使用jQuery deferred进行改造
```js
var wait = function() {
  var task = function() {
    console.log('执行完成')
    // 执行很多代码
    
  }
  setTimeout(task, 2000)
}

wait()
```    
下面是改造后的代码
```js
function waitHandle() {
  var dtd = $.Deferred()
  
  var wait = function (dtd) {
  	var task = function () { 
        console.log('执行完成')
        // 执行很多代码
        
        dtd.resolve()
      }
      
  	setTimeout(task, 2000)
  	return dtd
  }
    
    
    return wait(dtd)
}

var w = waitHandle()
w.then(function() {
  console.log('ok1')
},function() {
  console.log('error1')
})
w.then(function() {
  console.log('ok2')
},function() {
  console.log('error2')
})
```
上面的代码就可以高拓展了，但是有个问题，如果有个调皮的同事，给你改成下面这样：

```js
var w = waitHandle()

// 在这里其他同事新增了代码
w.reject()
// 下面的结果会输出 error1, error2

w.then(function() {
  console.log('ok1')
},function() {
  console.log('error1')
})
w.then(function() {
  console.log('ok2')
},function() {
  console.log('error2')
})
```
上面的代码就会gg了，
所以我们对上面的代码进行完善，如下：
```js

function waitHandle() {
  let dtd = $.deferred()
  function wait (dtd) {
    function ajax () {
      console.log('ajax success')
      dtd.resolve()
    }
    
    setTimeout(ajax, 1000)
    // 这里是返回promise对象，而不是deferred对象
    return dtd.promise()
  }
  return wait(dtd)
}

function waitHandle() {
  var dtd = $.Deferred()
  
  var wait = function (dtd) {
  	var task = function () { 
        console.log('执行完成')
        // 执行很多代码
        
        dtd.resolve()
      }
      
  	setTimeout(task, 2000)
  	return dtd
  }
    
    
    return wait(dtd)
}

var w = waitHandle()
$.when(w).then(function() {
  console.log('ok1')
},function() {
  console.log('error1')
})
$.when(w).then(function() {
  console.log('ok2')
},function() {
  console.log('error2')
})
```

## promise 的基本使用和原理


## 介绍一下async/await的区别和联系

## 总结一下当前js解决异步的方案(发展过程、好处坏处)