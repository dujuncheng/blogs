> 本文首发于本人掘金专栏 https://juejin.im/user/5a676894f265da3e2b16921c/posts 欢迎关注交流

## 引子

如果你了解过 `webpack`，他们会告诉你，`webpack` 底层是基于 `tapable`。

如果你好奇 `tapable` 是什么，你可能会看到其他地方的博客：『`Tapble`是webpack在打包过程中，控制打包在什么阶段调用Plugin的库，是一个典型的观察者模式的实现』。

可能，他们还会告诉你，**Tapable的核心功能就是控制一系列注册事件之间的执行流控制**，对吧？

如果你了解的继续深一些，可能还会看到下面的表格，见到如此多的钩子：

| 名称 | 钩入的方式 | 作用 |
| --- | --- | --- |
| Hook | `tap`， `tapAsync`，`tapPromise` | 钩子基类 |
| SyncHook | `tap` | 同步钩子 |
| SyncBailHook | `tap` | 同步钩子，只要执行的 handler 有返回值，剩余 handler 不执行 |
| SyncLoopHook | `tap` | 同步钩子，只要执行的 handler 有返回值，一直循环执行此 handler |
| SyncWaterfallHook | `tap` | 同步钩子，上一个 handler 的返回值作为下一个 handler 的输入值 |
| AsyncParallelBailHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 并行触发，但是跟 handler 内部调用回调函数的逻辑有关 |
| AsyncParallelHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 并行触发 |
| AsyncSeriesBailHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 串行触发，但是跟 handler 内部调用回调函数的逻辑有关 |
| AsyncSeriesHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，handler 串行触发 |
| AsyncSeriesLoopHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，可以触发 handler 循环调用 |
| AsyncSeriesWaterfallHook | `tap`， `tapAsync`，`tapPromise` | 异步钩子，上一个 handler 可以根据内部的回调函数传值给下一个 handler |

##### Hook Helper 与 Tapable 类

| 名称 | 作用 |
| --- | --- |
| HookCodeFactory | 编译生成可执行 fn 的工厂类 |
| HookMap | Map 结构，存储多个 Hook 实例 |
| MultiHook | 组合多个 Hook 实例 |
| Tapable | 向前兼容老版本，实例必须拥有 hooks 属性 |

那么，问题来了，这些钩子的内部是如何实现的？它们之间有什么样的继承关系？ 源码设计上有什么优化地方？

本文接下来，将从 tapable 源码出发，解开 tapable 神秘的面纱。

## Tapable 源码核心

先上一张大图，涵盖了 80% 的 tapable 核心流程

![](https://user-gold-cdn.xitu.io/2019/11/5/16e3b72e36660a05?w=884&h=414&f=png&s=247895)

上图中，我们看到， `tapable` 这个框架，最底层的有两个类： 基础类 `Hook`, 工厂类 `HookCodeFactory`。

上面列表中 `tapable` 提供的钩子，比如说 `SyncHook`、 `SyncWaterHooks`等，都是继承自基础类 `Hook`。

图中可见，这些钩子，有两个最关键的方法： `tap`方法、 `call` 方法。

这两个方法是`tapable` 暴露给用户的`api`, 简单且好用。 `webpack` 是基于这两个api 建构出来的一套复杂的工作流。

我们再来看工厂类 `HookCodeFactory`，它也衍生出`SyncHookCodeFactory`、 `SyncWaterCodeFactory` 等不同的工厂构造函数，实例化出来不同工厂实例`factory`。

工厂实例`factory`的作用是，拼接生产出不同的 `compile` 函数，生产 `compile` 函数的过程，本质上就是拼接字符串，没有什么魔法，下文中会介绍到。

这些不同的 `compile` 函数，最终会在 `call()` 方法被调用。

> 呼，刚才介绍了一大堆概念，希望没有把读者弄晕

我们首先看一下，`call` 方法和 `tap` 方法是如何使用的。

## 基本用法

下面是简单的一个例子：

```javascript
let hook = new SyncHook(['foo']);

hook.tap({
    name: 'dudu',
    before: '',
}, (params) => {
    console.log('11')
})

hook.tap({
    name: 'lala',
    before: 'dudu',
}, (params) => {
    console.log('22')
})

hook.tap({
 name: 'xixi',
 stage: -1
}, (params) => {
 console.log('22')
})

hook.call('tapable', 'learn')
```

上面代码的输出结果：

```javascript
// 22
// 11
```

我们使用 `tap()`方法用于注册事件，使用 `call()` 来触发所有回调函数执行。

注意点：

-   在实例化 `SyncHook` 时，我们传入字符串数组。数组的长度很重要，会影响你通过 `call` 方法调用 `handler` 时入参个数。就像例子所示，调用 call 方法传入的是两个参数，实际上 `handler` 只能接收到一个参数，因为你在`new SyncHook` 的时候传入的字符串数组长度是1。
    
-   通过 `tap` 方法去注册 `handler` 时，第一个参数必须有，格式如下：
    
    ```javascript
    interface Tap {
            name: string,  // 标记每个 handler，必须有,
            before: string | array, // 插入到指定的 handler 之前
            type: string,   // 类型：'sync', 'async', 'promise'
            fn: Function,   // handler
            stage: number,  // handler 顺序的优先级，默认为 0，越小的排在越前面执行
            context: boolean // 内部是否维护 context 对象，这样在不同的 handler 就能共享这个对象
    }
    ```
    
    上面参数，我们重点关注 `before` 和 `stage`，这两个参数影响了回调函数的执行顺序 。上文例子中， `name` 为 `'lala'` 的 `handler` 注册的时候，是传了一个对象，它的 `before` 属性为 `dudu`，说明这个 `handler` 要插到 `name` 为 `dudu` 的 `handler` 之前执行。但是又因为 `name` 为 `xixi` 的 `handler` 注册的时候，`stage` 属性为 `-1`，比其他的 `handler` 的 `stage` 要小，所以它会被移到最前面执行。
    

那么，`tap` 和 `call`是如何实现的呢？ 被调用的时候，背后发生了什么？

我们接下来，深入到源码分析 `tapable` 机制。

> 下文中分析的源码是 tapable v1.1.3 版本

## tap 方法的实现

上文中，我们在注册事件时候，用了 `hook.tap()` 方法。

`tap` 方法核心是，把注册的回调函数，维护在这个钩子的一个数组中。

`tap` 方法实现在哪里呢？

代码里面，`hook` 是 `SyncHook` 的实例，`SyncHook`又继承了 `Hook` 基类，在 `Hook` 基类中，具体代码如下：

```javascript
class Hook {
    tap(options, fn) {
        options = this._runRegisterInterceptors(options);
        this._insert(options);
    }
}
```

我们发现，`tap` 方法最终调用了` _insert`方法，

```javascript
_insert(item) {
        this._resetCompilation();

        let before;
        if (typeof item.before === "string") before = new Set([item.before]);
        else if (Array.isArray(item.before)) {
            before = new Set(item.before);
        }
        // 默认 stage是0
        // stage 值越大，
        let stage = 0;
        if (typeof item.stage === "number") stage = item.stage;
        let i = this.taps.length;
        while (i > 0) {
            i--;
            const x = this.taps[i];
            this.taps[i + 1] = x;
            const xStage = x.stage || 0;
            if (before) {
                if (before.has(x.name)) {
                    before.delete(x.name);
                    continue;
                }
                if (before.size > 0) {
                    continue;
                }
            }
            if (xStage > stage) {
                continue;
            }
            i++;
            break;
        }
        this.taps[i] = item;
    }
```

把注册的方法，都 `push` 到一个 `taps` 数组上面。这里对 `before` 和 `stage` 做了处理，使得 `push` 到 taps 数组的顺序不同，从而决定了 回调函数的执行顺序不同。

## call 方法的实现

在 `SyncHook.js` 中，我们没有找到 `call` 方法的定义。再去 `Hook` 基类上找，发现有这样一句, `call` 方法 是 `_call` 方法

```javascript
this.call = this._call;
```

```javascript
class Hook {
    construcotr {
        // 这里发现，call 方法就是 this._call 方法
        this.call = this._call;
    }
    compile(options) {
        throw new Error("Abstract: should be overriden");
    }

    _createCall(type) {
        return this.compile({
            taps: this.taps,
            interceptors: this.interceptors,
            args: this._args,
            type: type
        });
    }
}
```

那么， `_call` 方法是在哪里定义的呢？看下面, `this._call `是 `createCompileDelegate("call", "sync") `的返回值。

```javascript
Object.defineProperties(Hook.prototype, {
    // this._call 是 createCompileDelegate("call", "sync") 的值, 为函数 lazyCompileHook
    _call: {
        value: createCompileDelegate("call", "sync"),
        configurable: true,
        writable: true
    },
    _promise: {
        value: createCompileDelegate("promise", "promise"),
        configurable: true,
        writable: true
    },
    _callAsync: {
        value: createCompileDelegate("callAsync", "async"),
        configurable: true,
        writable: true
    }
});
```

接着往下看 `createCompileDelegate` 方法里面做了什么？

```javascript
// 下面的createCompileDelegate 方法 返回了一个新的方法，
// 参数 name 是闭包保存的字符串 'call'
function createCompileDelegate(name, type) {
    return function lazyCompileHook(...args) {
        // 实际上
        // this.call = this._creteCall(type)
        // return this.call()
        this[name] = this._createCall(type);
        return this[name](...args);
    };
}
```

上面的代码，`createCompileDelegate` 先调用 `this._createCall()` 方法，把返回值赋值给 `this[name]` 。

`this._createCall()` 里面本质是调用了`this.compiler` 方法，但是基类`Hook`上的`compiler()` 方法是一个空实现，顺着这条线索找下来，这是一条死胡同。

`this.compiler` 方法，真正是定义在衍生类 `SyncHook`上，也就是在 `SyncHook.js` 中，`SyncHook` 类重新定义了 `compiler` 方法来覆盖：

```javascript
const factory = new SyncHookCodeFactory();
class SyncHook extends Hook {
    compile(options) {
        factory.setup(this, options);
        return factory.create(options);
    }
}
```

这里的 factory ，就是本文开头提到的工厂实例。`factory.create` 的产物如下：

```javascript
ƒ anonymous() {
  "use strict";
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  _fn0();  
  var _fn1 = _x[1];
  _fn1();
}
```

`this._x` 是一个数组，里面存放的就是我们注册的 taps 方法。上面代码的核心就是，遍历我们注册的 taps 方法，并去执行。

`factory.create` 的核心是，根据传入的`type` 类型，拼接对应的字符串，代码如下：

```javascript
fn = new Function(
    this.args(),
    '"use strict";\n' +
    this.header() +
    this.content({
        onError: err => `throw ${err};\n`,
        onResult: result => `return ${result};\n`,
        resultReturns: true,
        onDone: () => "",
        rethrowIfPossible: true
    })
);
```

上面代码中， `content` 方法是定义在 `SyncHook` 的衍生类上的，

```javascript
class SyncHookCodeFactory extends HookCodeFactory {
    // 区分不同的类型的 工程
    // content 方法用于拼接字符串
    // HookCodeFactory 里面会调用 this.content(), 访问到的是这里的 content
    content({ onError, onDone, rethrowIfPossible }) {
        return this.callTapsSeries({
            onError: (i, err) => onError(err),
            onDone,
            rethrowIfPossible
        });
    }
}
```

到这里为止一目了然，我们可以看到我们的注册回调是怎样在`this.call`方法中一步步执行的。

在这里的优化， `tapable` 用到了《javascript 高级程序设计》中的『惰性函数』，缓存下来 this.__createCall `call`，从而提升性能

#### 惰性函数

什么是惰性函数？ 惰性函数有什么作用？

比如说，我们定义一个函数，我们需要在这个函数里面判断不同的浏览器环境，走不同的逻辑。

```javascript
function addEvent (type, element, fun) {
 if (element.addEventListener) {
 element.addEventListener(type, fun, false);
 } else if(element.attachEvent){
 element.attachEvent('on' + type, fun);
 } else{
 element['on' + type] = fun;
 }
}
```

上面 `addEvent` 方法，每执行一遍，都需要判断一次，有没有什么优化方法呢？
答案就是惰性函数。

```javascript
function addEvent (type, element, fun) {
	if (element.addEventListener) {
		addEvent = function (type, element, fun) {
			element.addEventListener(type, fun, false);
		}
	} else if(element.attachEvent){
		addEvent = function (type, element, fun) {
			element.attachEvent('on' + type, fun);
		}
	} else{
		addEvent = function (type, element, fun) {
			element['on' + type] = fun;
		}
	}
	return addEvent(type, element, fun);
}
```

上面的惰性函数，只会在第一次执行的时候判断环境，之后每次执行，其实是执行被重新赋值的 `addEvent` 方法，判断的结果被缓存了下来。

`tapable` 里用到惰性函数的地方，大概可以简化成如下：

```javascript
this._call = function(){
    this.call = this._creteCall(type)
    return this.call()
}
```

`this._call` 只有在第一次执行的时候，才会拼接生产出字符串方法，之后再执行时，就会执行被缓存下来的字符串方法，从而优化了性能。

## factory工厂的产物

Tapable有一系列Hook方法，但是这么多的Hook方法都是无非是为了控制注册事件的**执行顺序**以及**异常处理**。

最简单的`SyncHook` 的factory 的工厂产物，前面已经讲过，我们从`SyncBailHook`开始看。

### SyncBailHook

这类钩子的特点是，判断 `handler` 的返回值，是否`===undefined`, 如果是 `undefined` , 则执行，如果有返回值，则 return 返回值

```javascript
// fn, 调用 call 时，实际执行的代码
function anonymous(/*``*/) {
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _result0 = _fn0();
    if (_result0 !== undefined) {
        return _result0;
    } else {
        var _fn1 = _x[1];
        var _result1 = _fn1();
        if (_result1 !== undefined) {
            return _result1;
        } else {
        }
    }
}
```

通过打印fn，我们可以轻易的看出，`SyncBailHook`提供了中止注册函数执行的机制，只要在某个注册回调中返回一个非`undefined`的值，运行就会中止。

### SyncWaterfallHook

```javascript
function anonymous(arg1) {
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    var _result0 = _fn0(arg1);
    if (_result0 !== undefined) {
        arg1 = _result0;
    }
    var _fn1 = _x[1];
    var _result1 = _fn1(arg1);
    if (_result1 !== undefined) {
        arg1 = _result1;
    }
    return arg1;
}
```

可以看出`SyncWaterfallHook`就是将上一个事件注册回调的返回值作为下一个注册函数的参数，这就要求在`new SyncWaterfallHook(['arg1']);`需要且只能传入一个形参。

### SyncLoopHook

```javascript
// 打印fn
function anonymous(arg1) {
    "use strict";
    var _context;
    var _x = this._x;
    var _loop;
    do {
        _loop = false;
        var _fn0 = _x[0];
        var _result0 = _fn0(arg1);
        if (_result0 !== undefined) {
            _loop = true;
        } else {
            var _fn1 = _x[1];
            var _result1 = _fn1(arg1);
            if (_result1 !== undefined) {
                _loop = true;
            } else {
                if (!_loop) {
                }
            }
        }
    } while (_loop);
}
```

`SyncLoopHook`只有当上一个注册事件函数返回undefined的时候才会执行下一个注册函数，否则就不断重复调用。

### AsyncSeriesHook

Series有顺序的意思，这个Hook用于按顺序执行异步函数。

```javascript
function anonymous(_callback) {
    "use strict";
    var _context;
    var _x = this._x;
    var _fn0 = _x[0];
    _fn0(_err0 => {
        if (_err0) {
            _callback(_err0);
        } else {
            var _fn1 = _x[1];
            _fn1(_err1 => {
                if (_err1) {
                    _callback(_err1);
                } else {
                    _callback();
                }
            });
        }
    });
}
```

从打印结果可以发现，两个事件之前是串行的，并且next中可以传入err参数，当传入err，直接中断异步，并且将err传入我们在call方法传入的完成回调函数中。

### AsyncParallelHook

`asyncParallelHook` 是异步并发的钩子，适用场景：一些情况下，我们去并发的请求不相关的接口，比如说请求用户的头像接口、地址接口。

`factory.create` 的产物是下面的字符串

```javascript
function anonymous(_callback) {
    "use strict";
    var _context;
    var _x = this._x;
    do {
        // _counter 是 注册事件的数量
        var _counter = 2;
        var _done = () => {
            _callback();
        };

        if (_counter <= 0) break;

        var _fn0 = _x[0];

        _fn0(_err0 => {
            // 这个函数是 next 函数
            // 调用这个函数的时间不能确定，有可能已经执行了接下来的几个注册函数
            if (_err0) {
                // 如果还没执行所有注册函数，终止
                if (_counter > 0) {
                    _callback(_err0);
                    _counter = 0;
                }
            } else {
                // 检查 _counter 的值，如果是 0 的话，则结束
                // 同样，由于函数实际调用时间无法确定，需要检查是否已经运行完毕，
                if (--_counter === 0) {
                    _done()
                };
            }
        });

        // 执行下一个注册回调之前，检查_counter是否被重置等，如果重置说明某些地方返回err，直接终止。
        if (_counter <= 0) break;

        var _fn1 = _x[1];

        _fn1(_err1 => {
            if (_err1) {
                if (_counter > 0) {
                    _callback(_err1);
                    _counter = 0;
                }
            } else {
                if (--_counter === 0) _done();
            }
        });

    } while (false);
}
```

从打印结果看出Event2的调用在AsyncCall in Event1之前，说明异步事件是并发的。
