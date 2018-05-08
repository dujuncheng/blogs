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
    
同步代码，直接执行，一行一行执行
异步函数放在异步队列
等待同步函数执行完毕之后轮询执行异步队列  

```js
setTimeout(function() {
  console.log(100)
},100)

setTimeout(function() {
  console.log(300)
})
console.log(200)

// 上面的代码会依次输出
200 
300
100
```  
上面的代码中，执行到第一个setTimeout时候，是一个异步任务, 100毫秒后放入任务队列
然后代码执行到第二个setTimeout, 会马上添加到任务队列
然后执行到200时，输出200

也就是说，`console.log(100)`和`console.log(300)`都会被添加到异步队列，`console.log(100)`会在100毫秒后被添加到异步队列


```js
$.ajax({
  url:' ',
  success: function() {
    console.log('a')
  }
})

setTimeout(function() {
  console.log('b')
}, 100)

setTimeout(function() {
  console.log('c')
})

console.log('d')

// 输出的顺序有可能是 d c b a 或者是 d c a b 
```

何时被放入异步队列
1. 直接放入
2. 定时器到时候了
3. 拿到了请求




## jquery的deferred
jquery1.5的版本变化，前后的对比
1.5之后，增加了jquery deferred
deferred是promise的初步概念

jquery 1.5之前的写法
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
类似于promise面这种写法, 从Jquery时代就已经提出来了。

1. 无法改变js异步和单线程的本质
2. 只能从写法上杜绝callback
3. 只是一种语法糖，但是解耦了代码
4. 很好的体现了开放封闭原则（对拓展开放，对修改封闭）
    
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
    
### 应用jQuery deferred

deferred有两类api
1. reject resolve
2. then done fail

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
上面的代码就可以高拓展了，但是有个问题，如果有个致命的问题

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

所以我们对上面的代码进行完善
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