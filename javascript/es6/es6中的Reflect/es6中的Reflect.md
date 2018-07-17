# Reflect

**Reflect** 是一个内置的对象，没有构造函数，因此不能和 new 操作符一起使用，也不能将Reflect 作为一个函数来使用。

要使用的话，只能使用 Reflect 对象身上的静态属性和方法。

Reflect的方法基本上都可以从Object上面找到，找不到的那些，也是可以通过对对象命令式的操作去实现的；

Reflect 的作用是什么呢？ 为什么需要再加一个全局对象？

1. Reflect上面的一些方法并不是专门为对象设计的，比如Reflect.apply方法，它的参数是一个函数，如果使用Object.apply(func)会让人感觉很奇怪。
2. 用一个单一的全局对象去存储这些方法，能够保持其它的JavaScript代码的整洁、干净。不然的话，这些方法可能是全局的，或者要通过原型来调用。
3. 将一些命令式的操作如delete，in等使用函数来替代，这样做的目的是为了让代码更加好维护，更容易向下兼容；也避免出现更多的保留字。

 

## 方法

####  [`Reflect.apply()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/apply)

```js
Reflect.apply(target, this, arumentList);
```

**target就是我们的目标函数，thisArgument就是target函数调用的时候绑定的this对象，argumentsList就是函数的参数列表。**

这个方法与原来ES5的**Function.prototype.apply**类似，我们来看一下示例：

```js
 Math.max(1,2,3)  //  3
 

 // apply第一个参数是 this, 第二个参数是数组，表示传入的参数
 Math.max.apply(undefined, [1,2,3]) // 3


 Function.proptotype.apply.call(Math.max, undefined, [1,2,3])

 // 第一个参数是目标函数，第二个是 this, 第三个是参数列表
 Reflect.apply(Math.max, undefined, arr);
```



#### [`Reflect.construct()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/construct)

```js
Reflect.construct(Fun1, argsArr, [Fun2])
```

使用这个方法，与使用**new target(...args)**方法类似，相当于提供了一种新的不使用new来调用构造函数的方法；

其中，**Fun1表示被实例化的构造函数，argsArr调用构造函数传递的参数数组或者伪数组，Fun2 参数为另外一个构造函数**

如果没有传递第三个参数，那么**Fun1**就是唯一的构造函数；但是如果传递了第三个参数，那就表示：**生成的实例由两部分组成，实例的属性部分由第一个参数Fun1生成，实例的方法部分由第三个参数Fun2生成。**

下面我们来实践一下这个方法：

```js
// es5 构造函数
function A (name) {
  this.name = name
}
A.prototype.getName = function () {
  return this.name
}

function B (age) {
  this.age = age
}
B.prototype.getAge = function () {
  return this.age;
}

let person = Reflect.construct(A, ['dudu'], B)

console.log(person.name)  // dudu
console.log(person.age)   // undefined
console.log(person.getName())  // 报错，因为该实例的方法由第三个构造函数决定，故getName()方法不存在
console.log(person.getAge())  // undefined 因为该实例的属性由第一个参数决定，所以该值不存在
```

上面是传统的es5的构造函数方式，下面是es6 的class

```
class A1 {
  constructor (name) {
    this.name = name
  }
  getName() {
    return this.name
  }
}

class B1 {
  constructor (age) {
    this.age = age
  }
  getAge() {
    return this.age
  }
}

var p = Reflect.construct(A1, ['dudu'], B1)

console.log(p.name)  // dudu
console.log(p.age)   // undefined
console.log(p.getName())  // 报错，因为该实例的方法由第三个构造函数决定，故getName()方法不存在
console.log(p.getAge())  // undefined 因为该实例的属性由第一个参数决定，所以该值不存在
```



#### [`Reflect.defineProperty()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/defineProperty)

用来替代 [`Object.defineProperty()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)。

`obeject.defineProperty()`  的方法在赋值成功时返回修改后的对象，失败时会报错中断执行。

而 `Reflect.defineProperty（）`在赋值成功时返回true, 在赋值失败时返回 false

之前使用 object.defineProperty（）的方法需要如下：

```js
let obj = {};
// 对象的属性定义失败
try {
    Object.defineProperty(null, 'a', {
        value: 22
    })
}catch (e) {
    console.log('define property failed!');
}  // define property failed!
```

现在使用 Reflect.defineProperty 不用担心赋值会报错：

```js
let result = Reflect.defineProperty(obj, 'name', {
  configuable: false,
  value: 'dudu',
  enumerable: true
})

let result2 = Reflect.defineProperty(obj, 'name', {
  value: 'dudu'
})
```

#### [`Reflect.getOwnPropertyDescriptor()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/getOwnPropertyDescriptor)

```js
Reflect.getOwnPropertyDescriptor(obj,key)
```

类似于 [`Object.getOwnPropertyDescriptor()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor)

唯一的不同是， 当第一个参数不是对象时 `Object.getOwnPropertyDescriptor()` 是会把第一个参数强制转成对象，而 `Reflect.getOwnPropertyDescriptor` 则是报错。

#### [`Reflect.deleteProperty()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/deleteProperty)

```js
Reflect.deleteProperty(target, key)
```

这个方法用于删除一个对象上的属性，与delete操作符相似；其中target表示要操作的对象，表示要删除的属性。这个函数的返回值是一个Boolean值，如果成功的话，返回true；失败的话返回false。下面我们来实践这个方法：

```js
let obj = {
    name: 'dreamapple',
    age: 22
};

let r1 = Reflect.deleteProperty(obj, 'name');
console.log(r1); // true
let r2 = Reflect.deleteProperty(obj, 'name');
console.log(r2); // true
let r3 = Reflect.deleteProperty(Object.freeze(obj), 'age');
console.log(r3); // false
```

#### [`Reflect.get()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/get)

```js
Reflect.get(obj, key[, this])
```

用来读取一个对象的属性，obj是目标对象，key是我们要读取的属性，this是可选的，如果key的getter函数里面有this值，那么this就是这个this所代表的上下文。下面我们来实践这个方法:

```js
let obj = {
    name: 'dreamapple',
    age: 22,
    get money() {
        console.log(`I can tell you my name ${this.name}, but not my money`);
        return 0
    }
};
console.log(Reflect.get(obj, 'name')); // dreamapple
console.log(Reflect.get(obj, 'myName')); // undefined
// I can tell you my name dreamapple, but not my money
// 0
console.log(Reflect.get(obj, 'money'));
// I can tell you my name happy, but not my money
// 0
console.log(Reflect.get(obj, 'money', {name: 'happy'}));
```



#### [`Reflect.getPrototypeOf()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/getPrototypeOf)

```js
Reflect.getPrototypeOf(target)
```

这个方法与**Object.getPrototypeOf**方法是一样的，都是返回一个对象的原型，也就是内部的**[[Prototype]]**属性的值。下面我们来实践一下这个方法：

```js
// ES5
function A() {}
A.prototype.sayHello = function(){};

var a = new A();
var aPrototype = Object.getPrototypeOf(a);
console.log(aPrototype);
// Object
//  constructor: A()
//  sayHello: ()
//  __proto__: Object

// ES6
let ap = Reflect.getPrototypeOf(a);
console.log(ap);
// Object
//  constructor: A()
//  sayHello: ()
//  __proto__: Object

console.log(ap === aPrototype); // true
```



#### [`Reflect.has()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/has)

```js
Reflect.has(target, propertyKey)
```

这个方法相当于ES5的**in操作符**，**就是检查一个对象上是否含有特定的属性**；in 操作符的判断范围是 自身的，继承的，可枚举的，不可枚举的。

```js
function A(name) {
    this.name = name || 'dreamapple';
}
A.prototype.getName = function() {
    return this.name;
};

var a = new A();

console.log('name' in a); // true
console.log('getName' in a); // true

let r1 = Reflect.has(a, 'name');
let r2 = Reflect.has(a, 'getName');
console.log(r1, r2); // true true
```

如果第一个参数不是对象，则报错



#### [`Reflect.isExtensible()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/isExtensible)

```js
Reflect.isExtensible(obj)	
```

检查一个对象是否是可以扩展的，也就是是否可以添加新的属性；和方法Object.isExtensible方法相似。**其中，obj表示目标对象，如果这个目标对象不是一个对象，则报错；函数的返回值表示这个对象是否可以扩展；如果是true，表示这个对象可以扩展，如果是false，表示这个对象不可以扩展。**下面我们来实践这个方法：

```js
let obj = {};
let r1 = Reflect.isExtensible(obj);
console.log(r1); // true

// 密封这个对象
Object.seal(obj);
let r2 = Reflect.isExtensible(obj);
console.log(r2); // false

// 冻结一个对象
let obj1 = Object.freeze({});
let r3 = Reflect.isExtensible(obj1);
console.log(r3); // false

// 阻止一个对象添加新的属性
let obj2 = {};
Object.preventExtensions(obj2);
let r4 = Reflect.isExtensible(obj2);
console.log(r4); // false
```



#### [`Reflect.ownKeys()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/ownKeys)

```js
Reflect.ownKeys(target)
```

这个函数的作用是，返回由目标对象自身的属性键组成的数组。**这个数组的值等于Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target)),**下面我们来实践这个方法： 

#### [`Reflect.preventExtensions()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/preventExtensions)

```
Reflect.preventExtensions(target)
```

这个函数的作用是，阻止新的属性添加到对象中去。

```js
let obj = {};
let r1 = Reflect.isExtensible(obj);
console.log(r1); // true
Reflect.preventExtensions(obj);
let r2 = Reflect.isExtensible(obj);
console.log(r2); // false
```

####  [`Reflect.set()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/set)

```js
Reflect.set(target, propertyKey, value[, receiver])
```

这个函数的作用是在一个对象身上设置一个属性，其中target表示我们要操作的对象；propertyKey表示我们要设置的属性名，value表示我们要设置的属性值，receiver表示的是一个this值，如果我们在设置值的时候遇到setter函数，那么这个receiver值表示的就是setter函数中的this值。这个函数会返回一个Boolean值，表示在目标对象上设置属性是否成功。

```js
let obj = {
    set name(name) {
        console.log('this: --> ', this);
    },
    age: 22
};

let r1 = Reflect.set(obj, 'age', 24);
console.log(r1); // true
console.log(obj); // { name: [Setter], age: 24 }

console.log('\n');
let r2 = Reflect.set(obj, 'name', 'dreamapple', {test: 'test'}); // this: -->  { test: 'test' }
console.log(r2); // true
console.log(obj); // { name: [Setter], age: 24 }
```

将值分配给属性的函数。返回一个[`Boolean`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Boolean)，如果更新成功，则返回`true`。

#### [`Reflect.setPrototypeOf()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect/setPrototypeOf)

```js
Reflect.setPrototypeOf(target, prototype)
```

Reflect.setPrototypeOf与Object.setPrototypeOf方法的作用是相似的，设置一个对象的原型，如果设置成功的话，这个对象会返回一个true；如果设置失败，这个对象会返回一个false。下面我们来实践一下这个方法：

```
let obj = {};
let r1 = Reflect.setPrototypeOf(obj, Object.prototype);
console.log(r1); // true
let r2 = Reflect.setPrototypeOf(Object.freeze({}), null);
console.log(r2); // false
```