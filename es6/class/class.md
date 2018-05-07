
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

class的基本语法
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

###类的静态方法
类的静态方法就是通过类来调用，而不是通过实例来调用

```js
class parent {
	constructor(){
		
	}
	static tell() {
		console.log('tell')
	}
}

parent.tell()
```

###类的静态s属性
类的静态方法就是通过类来调用，而不是通过实例来调用

```js
class parent {
	constructor(){
		
	}
	static tell() {
		console.log('tell')
	}
}

parent.tell()
```


###getter 和 setter
```js
class parent {
	constructor (name) {
		this.name = name
	}
	//形式上是方法，但其实是属性
	get longName () {
		return 'mk' + this.name
	}
	set longName (name) {
		 this.name = name
	}
}
let v = new parent('test')
v.longName        //'mktest'
v.longName = 'hello'
v.longName        // 'mkhello'
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

### 继承
构造函数如何继承


class如何继承
基本语法
```js
class animal {
	constructor (name) {
		this.name = name
	}
	eat () {
		console.log('eat')
	}
}

class dog extends animal {
	constructor (name) {
		super(name)
		this.name = name
	}
	say () {
	  console.log('say')
	}
}

const hashiqi = new dog('哈士奇')
dog.say()
dog.eat()
```




### class和构造函数的区别
1. class在语法上更加贴合面向对象的写法
2. class实现继承容易理解
3. java转比较容易
4. 本质还是语法糖，使用的还是prototype
5.  
