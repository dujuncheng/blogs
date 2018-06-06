
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
类有2种表现形式：声明式和表达式。
```js
// 声明式
class B {
	
}

//表达式
var B = class {
	
}

// 命名表达式 B可以在外部使用，而B1只能在内部使用
let B = class B1 {

}

```

class是函数，是一等公民
1. class可以作为参数传入
```js
let A = class {
	constructor () {
		
	}
}

function test(class) {
	return new class()
}

let a = test(A)
```
2. 通过立即调用类构造函数可以创建单例
```js

let a = new class {
	constructor(name) {
		this.name = name
	}
	sayname () {
		return this.name
	}
}('dudu')

console.log(a.sayname())
```


### 类的静态方法
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

### 类的静态属性
类的静态属性目前没有关键词，如果想实现，如下面

```js
class parent {
	constructor(){
		
	}
	static tell() {
		console.log('tell')
	}
}

parent.type = '这个是静态的属性'
```

### 类的成员不可遍历

```js
class Person {
    constructor (name, age) {
       this.name = name
       this.age = age    
    }
    say () {
        console.log(this.name)
    }
    get age () {
        return this.age
    }
    set age (newage) {
        this.age = age
    }
    static hi () {
        console.log('hi~')
    }
}

console.log(Object.keys(Person))
// 定义的property都是不可遍历的
```
上面的class 定义的property都是不可遍历的, 因此在使用es5的语法进行改写时候，需要使用`Object.defineProperty`方法来设置 `enumerable` 为`false`
其他的`value`, `writable`, `configuable`都为true

```js
function Person () {}
// Object.defineProperty(obj, key, {})
Object.defineProperty(Person, 'say', {
    value: function() {},
    enumerable: false,
    writable: true,
    configurable: true
})

Object.defineProperties(obj, {
    "say": {
        value:"",
        enumerable: false,
        writable: true,
        configurable: true
    },
    "hello": {
            value:"",
            enumerable: false,
            writable: true,
            configurable: true
        }
})
```




### getter 和 setter
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

下面是一个普通的类
```js
class Person {
	constructor (name) {
		this.name = name
	}
	say () {
		console.log(this.name)
	}
}

let person1 = new Person('person1')
```
下面使用es5的语法来改写
```js
  const Person = function(name) {
  	
  	// 确保必须用new关键字来调用
  	if (typeof new.target == 'undifined') {
  		throw  new Error('必须使用new关键字来调用')
  	}
    this.name = name
  }
  
  Object.defineProperty(Person.prototype, 'say', {
  	value: function() {
      // 确保不会用new关键字来调用
  	  if (typeof new.target !== undefined) {
  	  	throw new Error('不要用new关键字来调用')
  	  }
  	  
  	  console.log(this.name)
  	},
  	enumerable: false,
  	writable: true,
  	configurable: true
  })
```

> new.target属性允许你检测函数或构造方法是否是通过new运算符被调用的。在通过new运算符被初始化的函数或构造方法中，new.target返回一个指向构造方法或函数的引用。在普通的函数调用中，new.target 的值是undefined。





### 继承
构造函数如何继承的问题可以参考我之前的博客

class如何继承
 - 基本语法
```js
class animal {
	constructor (name) {
		this.name = name
	}
	eat () {
		console.log('eat')
	}
}
// extends关键字
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

> 只能在派生类中使用super
> 访问this前一定要调用 super

#### 继承中的类方法遮蔽
如果派生类中的方法和父类中的方法重名，派生类的实例调用该方法时为子类的方法。
比如下面的例子，Son继承了Parent, Son类中有和父类重名的方法，Son的实例调用的是Son的方法
```js
class Parent{
	constructor(w,h){
		this.w = w
		this.h = h
	}
	getArea() {
		return this.w * this.h
	} 
}

class Son extends Parent{
	constructor(w,h){
		super(w, h)
	}
	getArea() {
		return this.w + this.h
	} 
}

let a = new Son(2,3)
a.getArea()        // 5
```
如果在派生类中想使用父类的重名方法，可以调动super.getArea()，如下面的例子
```js
class Parent{
	constructor(w,h){
		this.w = w
		this.h = h
	}
	getArea() {
		return this.w * this.h
	} 
}

class Son extends Parent{
	constructor(w,h){
		super(w, h)
	}
	getArea() {
		return super.getArea()
	} 
}

let a = new Son(2,3)
a.getArea()        // 6
```
#### 继承中的静态成员
父类中的静态成员，也可以继承到派生类中。
同样的，类的静态成员均不能通过实例来访问。静态成员继承只能通过派生类访问，不能通过派生类的实例访问

如下例子，
```js
class Rectangle {
	constructor (w,h) {
		this.w = w;
		this.h = h;
	}
	getArea () {
		return this.w * this.h
	}
	
	static create(w,h) {
		return new Rectangle(w, h)
	}
}

class Square extends Rectangle{
	constructor(x,y) {
		super(x,y)
	}
}

let a = Square.create(2,3)

a instanceof Rectangle // true
a instanceof Square    // false
a.getArea()            // 6
```

#### 继承中的表达式
extends很强大，只要有一个表达式可以解析为函数，并且具有[[constructor]]属性和原型，那么就可以用extends来继承（或称为派生）
下面这个例子：
```js
// rectangle是一个有prototype的构造函数
function Rectangle (w, h) {
	this.w = w;
	this.h = h;
}

Rectangle.prototype.getArea = function() {
	return this.w * this.h
}

// 可以通过 extends 来继承
class Square extends Rectangle {
	constructor (w, h) {
		super(w, h)
	}
}

let a = new Square(2,3)
a.getArea() // 6
a instanceof Rectangle //TRUE
```
extends可以继承表达式这一特性，可以动态的确定类的继承目标，比如说对上面的例子稍微改造一下
```js
function Rectangle (w, h) {
	this.w = w;
	this.h = h;
}

Rectangle.prototype.getArea = function() {
	return this.w * this.h
}

function getBase () {
	return Rectangle
}

// getBase最终返回的还是一个类
class Square extends getBase() {
	constructor (w, h) {
		super(w, h)
	}
}

let a = new Square(2,3)
a.getArea() // 6
a instanceof Rectangle //TRUE
```
也可以像下面这个例子创建这样的mixin
```js
let mixin1 = {
	serialize () {
		return JSON.stringify(this)
	}
}

let mixin2 = {
	getArea () {
		return this.x * this.y
	}
}

// 下面是高能预警
function getBase (...mixins) {
  var base = function() {}
  Object.assign(base.prototype, ...mixins)
  return  base
}

// getBase最终返回的还是一个类
class Square extends getBase(mixin1, mixin2) {
	constructor (w, h) {
		super()
		this.w = w
		this.y = y
	}
}

let a = new Square(2,3)
a.getArea() // 6
a.serialize()  // "{"w": 2, "h" : 3}"
```
注：如果多个mixin对象有同样的属性，那么只有最后一个添加的属性被保留


### class和构造函数的区别
1. class在语法上更加贴合面向对象的写法
2. class实现继承容易理解
3. java转比较容易
4. 本质还是语法糖，使用的还是prototype

