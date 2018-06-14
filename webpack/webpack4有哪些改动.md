Webpack 4发布之后，议论最多的两大特性，其一是零配置，其二是速度快（号称提速上限98%）。听起来十分美妙，在实地测试之前，首先从理论上分析一下可能性。

# 零配置
一言以蔽之，约定优于配置。通过mode属性将开发/生产（development/production）环境中常用的功能设置好默认值，用户即来即用。

# 打包速度快
##  Optimization
Webpack 4取消了四个常用的用于性能优化的`plugin`（`UglifyjsWebpackPlugin`，`CommonsChunkPlugin`，`ModuleConcatenationPlugin`，`NoEmitOnErrorsPlugin`），转而提供了一个名为optimization的配置项，用于接手以上四位的工作。
![](https://pic2.zhimg.com/80/v2-ee213b1ff1ceead751e2ea1cb27bb060_hd.jpg)

- Tree Shaking & Minimize
废弃插件：UglifyjsWebpackPlugin
新增属性：sideEffects，minimize等

影响tree shaking的根本原因在于side effects（副作用），其中最广为人知的一条side effect就是动态引入依赖的问题。

得益于ES6的模块化实现思路，所有的依赖必须位于文件顶部，静态引入（然而import（）的出现打破了这个规则），Webpack可以在绘制依赖图的时候进行静态分析，从而将真正被引用的exports添加到bundle文件中，减少打包体积。然而很多热度较高的第三方库为了考虑兼容性往往采用UMD实现，而其所支持的动态引入依赖的功能则导致真实的依赖图可能要到运行时才能确定，使得静态分析难以发挥真正威力，tree shaking采用了保守策略，导致我们发现没有被用到的方法依然出现在了bundle文件中。

许多第三方库相继推出了es版，配合tree-shaking食用，口感更佳。坏消息是ES6其实也提供import（）方法支持动态引入依赖，所以以下写法其实也是完全行的通的
```js
if(Math.random() > 0.5) {
    import('./a.js').then(() => {
        ...
    })
} else {
    import('./b.js').then(() => {
        ...
    })
}
```
除此以外，为了防止用户不小心修改输出元素的属性，有些库会将最终的输出元素用Object.freeze方法包裹起来，这也属于side effects之一，同样也会对tree shaking产生影响。

回到Webpack 4，官方提供了sideEffects属性，通过将其设置为false，可以主动标识该类库中的文件只执行简单输出，并没有执行其他操作，可以放心shaking。除了可以减小bundle文件的体积，同时也能够提升打包速度。为了检查side effects，Webpack需要在打包的时候将所有的文件执行一遍。而在设置sideEffects之后，则可以跳过执行那些未被引用的文件，毕竟已经明确标识了“我是平民”。因此对于一些我们自己开发的库，设置sideEffects为false大有裨益。

Minimize属性就没啥可多说的了，混淆压缩文件。


- Scope hoisting
废弃插件：ModuleConcatenationPlugin

新增属性：concatenateModules

```js
//开启前
[
    /* 0 */
    function(module, exports, require) {
        var module_a = require(1)
        console.log(module_a['default'])
    }
    /* 1 */
    function(module, exports, require) {
        exports['default'] = 'module A'
    }
]

//开启后
[
    function(module, exports, require) {
        var module_a_defaultExport = 'module A'
        console.log(module_a_defaultExport)
    }
]
```
concatenateModules被开启之后，可以看出bundle文件中的函数声明变少了，因而可以带来的好处，其一，文件的体积比之前更小了，其二，运行代码时创建的函数作用域变少了，开销也随之变少了。不过scope hoisting的效果同样也依赖于静态分析，无奈命不由我。


- Code splitting
废弃插件：CommonsChunkPlugin

新增属性：splitChunks，runtimeChunk， occurrenceOrder等

splitChunks在Webpack 4里取代了我们熟悉的CommonsChunkPlugin。这是否意味着DllPlugin和CommonsChunkPlugin（splitChunks）可以共存了呢？

在Webpack 4之前，两者并不能一起使用，原因如下：

1. DllPlugin场景是develop环境，因为第三方依赖（输出文件暂称为vendors）的不怎么变，每次rebuild将第三方依赖重新打包不值当。
通过DllPlugin，将第三方依赖从业务代码的中独立出来，可以缩短develop启动时间。
同时通过hash值，可以利用浏览器对这部分文件的缓存，提升加载效率。

而在production环境，DllPlugin打包出的文件笨重，很多重复的内容被多次打包进了bundle文件。
在这种场景下，CommonsChunkPlugin更优，因为我们不需要为打包时间操心过多，加载效率是我们唯一需要关注的内容。


通过CommonsChunkPlugin设置两个entry point, 一个作为业务代码的入口，一个作为vendors的入口。有两个问题：
1. 尽管vendors被单独设置了entry point，但是在每次启动本地服务的时候，尽管打包的结果不变，hash值不变，浏览器的缓存文件也被充分利用了，它的打包过程依然会执行，所以启动时间并不会缩短.
2. 许多人在使用CommonsChunkPlugin的时候并没有注意到Webpack会将runtime一起打包进vendors文件，所以每次启动的时候，尽管你并没有修改任何第三方依赖，但是vendors文件的hash值却变了，导致浏览器缓存实际上并没有被利用起来。

到了webpack4,这些问题就被解决了。

- noEmitOnErrors
废弃插件：NoEmitOnErrorsPlugin

新增属性：noEmitOnErrors

noEmitOnErrors用于在编译出现错误时跳过输出阶段。



