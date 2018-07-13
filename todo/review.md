####   Object.hasOwnProperty

1. 非继承属性
2. 恐怕被重写，需要 Object.prototype.hasOwnProperty.call()
3. 不能用于检测数组是否存在某一元素，但 index 可以
4. null / undefied 返回 true



#### key in obj

1. 会查找继承属性
2. 右侧必须是对象
3. delete 返回false, null / undefied 返回 true



#### defineProperty()

```js
Object.prototype.defineProperty(obj, key, {
    enumerable: true,
    comfigurable: true,
    writable: true,
    value: 12,
    get: function(){},
    set: function(){}
})
```



#### DOM节点可以全等比较

```
el === document.body || el === document.documentElement
```





