
## class和普通构造函数有什么区别

### js构造函数
```js
function mathHandle (x,y) {
	this.x = x
	this.y = y
}

mathHandle.prototype.add = function() {
  return this.x + this.y
}

var m = new mathHandle(1,2)
console.log(m.add())
```
### class基础语法
```js
class mathHandle {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
	
	add() {
		return this.x + this.y
	}
}

var m = new mathHandle(1,2)
console.log(m.add())
```


### 语法糖
```js
class mathHanle {
	
}

typeof mathHanle // 'function'
mathHanle === mathHanle.prototype.constructor
```
class 本身还是函数
这种语法糖的形式，看起来和原理不太一样，强行模仿c# 和java

```js
var m = new mathHanle(1,2)
// 实例的隐式原型等于构造函数的原型 
m.__proto__ === mathHanle.prototype //true
mathHanle.prototype.constructor === mathHanle // true

```

继承（构造函数如何继承，class如何继承）