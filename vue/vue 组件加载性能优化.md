# 前言

一般来说，你不需要太关心vue的运行时性能，它在运行时非常快，但付出的代价是初始化时相对较慢。在最近开发的一个Hybrid APP里，Android Webview初始化一个较重的vue页面竟然用了1200ms ~ 1400ms，这让我开始重视vue的初始化性能，并最终优化到200 ~ 300ms，这篇文章分享我的优化思路。

# 性能瓶颈在哪里？

先看一下常见的vue写法：在html里放一个app组件，app组件里又引用了其他的子组件，形成一棵以app为根节点的组件树。

```
<body>
    <app></app> 
</body>
```

而正是这种做法引发了性能问题，要初始化一个父组件，必然需要先初始化它的子组件，而子组件又有它自己的子组件。那么要初始化根标签`<app>`，就需要从底层开始冒泡，将页面所有组件都初始化完。所以我们的页面会在所有组件都初始化完才开始显示。

这个结果显然不是我们要的，更好的结果是页面可以从上到下按顺序流式渲染，这样可能总体时间增长了，但首屏时间缩减，在用户看来，页面打开速度就更快了。

要实现这种渲染模式，我总结了下有3种方式实现。第3种方式是我认为最合适的，也是我在项目中实际使用的优化方法。

# 第一种：不使用根组件

这种方式非常简单，例如：

```
<body>
    <A></A>
    <B></B>
    <C></C>
</body>
```

抛弃了根组件`<app>`，从而使A、B、C每一个组件初始化完都立刻展示。但根组件在SPA里是非常必要的，所以这种方式只适用小型页面。

# 第二种：异步组件

异步组件在官方文档已有说明，使用非常简单：

```
<app>
    <A></A>
    <B></B>
</app>
```

```
new Vue({
    components: {
        A: { /*component-config*/ },
        B (resolve) {
            setTimeout(() => {
                resolve({ /*component-config*/ })
            }, 0);
        }
    }
})
```

这里`<B>`组件是一个异步组件，会等到手动调用resolve函数时才开始初始化，而父组件`<app>`也不必等待`<B>`先初始化完。

我们利用setTimeout(fn, 0)将`<B>`的初始化放在队列最后，结果就是页面会在`<A>`初始化完后立刻显示，然后再显示`<B>`。如果你的页面有几十个组件，那么把非首屏的组件全设成异步组件，页面显示速度会有明显的提升。

你可以封装一个简单的函数来简化这个过程：

```
function deferLoad (component, time = 0) {
    return (resolve) => {
        window.setTimeout(() => resolve(component), time)
    };
}

new Vue({
    components: {
        B: deferLoad( /*component-config*/ ),
        // 100ms后渲染
        C: deferLoad( /*component-config*/, 100 )
    }
})
```

看起来很美好，但这种方式也有问题，考虑下这样的结构:

```
<app>
    <title></title>
    <A></A>
    <title></title>
    <B></B>
    <title></title>
    <C></C>
</app>
```

还是按照上面的异步组件做法，这时候就需要考虑把哪些组件设成异步的了。如果把A、B、C都设成异步的，那结果就是3个`<title>`会首先渲染出来，页面渲染的过程在用户看来非常奇怪，并不是预期中的从上到下顺序渲染。

# 第三种：v-if 和 terminal指令

这是我推荐的一种做法，简单有效。还是那个结构，我们给要延迟渲染的组件加上v-if：

```
<app>
    <A></A>
    <B v-if="showB"></B>
    <C v-if="showC"></C>
</app>
```

```
new Vue({
    data: {
        showB: false,
        showC: false
    },
    created () {
        // 显示B
        setTimeout(() => {
            this.showB = true;
        }, 0);
        // 显示C
        setTimeout(() => {
            this.showC = true;
        }, 0);
    }
});
```

这个示例写起来略显啰嗦，但它已经实现了我们想要的顺序渲染的效果。页面会在A组件初始化完后显示，然后再按顺序渲染其余的组件，整个页面渲染方式看起来是流式的。

有些人可能会担心`v-if`存在一个编译/卸载过程，会有性能影响。但这里并不需要担心，因为`v-if`是惰性的，只有当第一次值为true时才会开始初始化。

这种写法看起来很麻烦，如果我们能实现一个类似`v-if`的组件，然后直接指定多少秒后渲染，那就更好了，例如：

```
<app>
    <A></A>
    <B v-lazy="0"></B>
    <C v-lazy="100"></C>
</app>
```

一个简单的指令即可，不需要js端任何配合，并且可以用在普通dom上面，Nice！

在vue里，类似`v-if`和`v-for`这种是terminal指令，会在指令内部编译组件。如果你想要自己实现一个terminal指令，需要加上`terminal: true`，例如：

```
Vue.directive('lazy', {
    terminal: true,
    bind () {},
    update () {},
    unbind () {}
});
```

这是vue在1.0.19+新增的功能，由于比较冷门，文档也没有特别详细的叙述，最好的方式是参照着`v-if`和`v-for`的源码来写。

我已经为此封装了一个terminal指令，你可以直接使用：
<https://github.com/Coffcer/vue-lazy-component>

# 其他的优化点

除了组件上的优化，我们还可以对vue的依赖改造入手。初始化时，vue会对data做getter、setter改造，在现代浏览器里，这个过程实际上挺快的，但仍然有优化空间。

`Object.freeze()`是ES5新增的API，用来冻结一个对象，禁止对象被修改。vue 1.0.18+以后，不会对已冻结的data做getter、setter转换。

如果你确保某个data不需要跟踪依赖，可以使用Object.freeze将其冻结。但请注意，被冻结的是对象的值，你仍然可以将引用整个替换调。看下面例子：

```
<p v-for="item in list">{{ item.value }}</p>
```

```
new Vue({
    data: {
        // vue不会对list里的object做getter、setter绑定
        list: Object.freeze([
            { value: 1 },
            { value: 2 }
        ])
    },
    created () {
        // 界面不会有响应
        this.list[0].value = 100;

        // 下面两种做法，界面都会响应
        this.list = [
            { value: 100 },
            { value: 200 }
        ];
        this.list = Object.freeze([
            { value: 100 },
            { value: 200 }
        ]);
    }
})
```

# 后记

vue 1.0+ 的组件其实不算轻量，初始化一个组件包括依赖收集、转换等过程，但其实有些是可以放在编译时提前完成的。vue 2.0+ 已经在这方面做了不少的改进：分离了编译时和运行时、提供函数组件等，可以预见，vue 2.0的性能将有很大的提升。

v-lazy-component: <https://github.com/Coffcer/vue-lazy-component>