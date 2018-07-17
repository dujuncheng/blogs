# 基本数据类型

在es6之前有5种基本数据类型，其中有4个是原始数据类型，分别是：Number, String , Boolen, Undefined, None， 还有1个是Object类型的数据。在es6 中新增了一个原始数据类型：Symbol

Symbol表示独一无二的值



# 生成 Symbol

```
let s = Symbol();
console.log(s) // 报错了，connot convert a Symbol value to a string
typeof s // 'symbol'
```

在函数前使用 new 操作符会生成对象，`new Symbol`会报错。

直接调用 Symbol() 方法生成的是一个基本数据类型



我们还可以给Symbol函数传递一个参数，用于对这个Symbol值进行描述，方便我们区分不同的Symbol值，以及调试。

```
// 方法二
let s1 = Symbol('s1');
let s2 = Symbol('s2');

typeof s1; // "symbol"
typeof s2; // "symbol"

s1 === s2; // false
```

# 共享环境

**使用Symbol.for(describe)方法会先在全局环境中查找有没有使用describe注册的Symbol值，如果有的话就会返回找到的那个值，如果没有的话就会重新创建一个。**这样做的目的使我们可以重复使用之前定义过的Symbol值，或者修改与之相关的一些东西。

```
let s4 = Symbol.for('s4');
s4.toString(); // "Symbol(s4)"

let s5 = Symbol.for('s4');
s5 === s4; // true

Symbol.keyFor(s3); // undefined
Symbol.keyFor(s4); // "s4"
```

共享环境中仍然会有命名冲突的风险，因此仍需要命名空间



# 隐式转换

Symbol可以显示转换，不能隐式转换

```
let dudu = Symbol('dudu');
console.log(dudu)   // 报错了，因为发生了隐式转换
console.log(String(dudu))  // Symbol(dudu)
```

隐式转换成字符串 和 数字都会报错：

```js
let uid = Symbol('uid')

s = uid + ''    // 报错了
s = 0 + uid     // 报错了
```



# 枚举

object.keys(), obejct.getOwnPropertyNames() 都没有办法枚举到 对象中的  Symbol ( 主要是保持es5的代码统一 )

es6 新增 obj.getOwnPropertySymbols() 和 obj.ownKeys() 可以枚举到





# 使用场景

防止对象内 属性名的冲突

```js
let s = Symbol.for('s4')
let a = {}
let b = {}
let c = {}

a[s] = 'dudu'
b[s] = function () {}
Object.defineProperty(c, s, {
  value: 'hello'
})

console.log(a[s]);
console.log(b[s]);
console.log(c[s]);
```

使用Symbol值作为对象的属性名称可以有效地避免属性名的覆盖或者改写，当然你也要付出一点小代价；**那就是使用对象的Symbol值作为属性名字的时候，获取相应的属性值需要使用obj[symbol]的方式来获取相应的属性值。不可以使用.运算符来获取相应的属性值。**  

