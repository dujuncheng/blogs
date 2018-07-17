# Proxy

注意，target( 被我们代理的源对象 )  不会受到影响，只有我们的（proxy）代理对象会根据我们自定义的结果。

比如下面的代码:

```js
let obj = {
  a:1,
  b:2,
}

let objProxy = new Proxy(obj, {
  get(target, key) {
    if (key === 'c') {
      return '这是一个自定义的结果'
    } else {
      return target[key]
    }
  },
  set (target, key, value) {
    if (value === 4) {
      target[key] = '我是一个自定义的结果'
    } else {
      target[key] = property
    }
  }
})

console.log(obj.c)   // undefined
console.log(objProxy.c)  // 这是一个自定义的结果

obj.d = 4
console.log(obj.d)  // 4

objProxy.d = 4  
console.log(objProxy.d) // 我是一个自定义的结果
```

代理就像 **源对象**外面薄薄的一层壳子，会先代替了外面的访问和写入，但是如果是对源对象直接的操作，则不会受到代理的影响。



## Proxy的作用

对于代理模式`Proxy`的作用主要体现在三个方面:

1、 拦截和监视外部对对象的访问

2、 降低函数或类的复杂度

2、 在复杂操作前对操作进行校验或对所需资源进行管理

而对于这三个使用方面的具体表现大家可以参考这篇文章--[实例解析ES6 Proxy使用场景](https://link.juejin.im?target=https%3A%2F%2Fwww.w3cplus.com%2Fjavascript%2Fuse-cases-for-es6-proxies.html)



## Proxy的兼容性

 大部分浏览器已经兼容，仍然不兼容的有 IE, Opera Mini, 和 UC 安卓版。

## Proxy 的实例方法

1. get()

`get`方法用于拦截某个属性的读取操作，可以接受三个参数，依次为target、property和 proxy 实例本身（严格地说，是操作行为所针对的对象），其中最后一个参数可选。

```js
let person = {
  name: 'zhangsan'
}

let proxy = new Proxy(person, {
  get (target, property) {
    if (property in target) {
      return target[property];
    } else {
      throw new Error('none')
    }
  }
})
```

