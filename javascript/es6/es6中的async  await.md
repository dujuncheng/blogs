```js
async function f() {
  return 1;
}

console.log(f())   // 返回 Promise {<resolved>: 1}

// 如果我想拿到内部的value，则需要 .then()
let p = f();
p.then()
```

`async`  放在方法名的前面，只意味一件事情：这个方法会返回一个promise.

如果返回的不是一个promise, JavaScript 引擎将会将其包裹成一个已经 resolved promise.



