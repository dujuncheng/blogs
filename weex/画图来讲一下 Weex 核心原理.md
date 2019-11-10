> 本文首发于 本人掘金专栏https://juejin.im/user/5a676894f265da3e2b16921c/posts， 欢迎关注交流

## 背景

从前，如果我们打算实现某个需求，通常需要三种程序员（IOS, 安卓，前端）写三份代码。这就带来了非常大的开发成本，所以业界也一直在探索跨平台方案——从最早的H5, Hybrid 到现在的weex, React Native。这些方案的本质目的都是，一套代码，多端运行。

### H5和Hybrid的发展

早期H5和Hybrid方案的本质是，利用客户端App的内置浏览器（也就是webview）功能，通过开发前端的H5页面满足跨平台需求。

该方案提升开发效率，同时也满足了跨端的需求。但有一个问题就是，前端H5的性能和客户端的性能相差甚远。

### weex的发展

于是后来, 业界继续探索可以媲美原生体验app的方案，比如说WEEX 。

WEEX依旧采取前端H5页面进行开发，同时app在终端的运行体验不输native app。即可以保证快速响应需求，又可以保证用户体验。

那么WEEX是如何实现的？

本质来说，WEEX是用客户端Native 的能力，去做了部分浏览器（webview）的工作。

在2016年2月， WeexSDK 发布了v0.10.0版本，在这个版本里面，集成了v2 版本的Vue。

> 为啥是Vue 2.x 版本呢？
>
> Vue 2.x加入了 Virtual-DOM 和预编译器的设计，使得该框架在运行时能够脱离 HTML 和 CSS 解析，只依赖 JavaScript；同时 Virtual-DOM 也使得 Vue 2.x 渲染成原生 UI 成为了可能。

## weex 原理探究

我们先来看一下 weex 的整体框架。

### weex 整体架构

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d3741beef1?w=1246&h=1052&f=jpeg&s=96130)

从上图中可以看到weex的大致工作流程：

1. 前端开发可以写熟悉vue语法的单文件，然后打包成出来一份dist —— JS Bundle，然后部署到服务器上
2. 客户端打开某一个页面，通过网络下载`JS Bundle`，然后在客户端本地执行该`JS Bundle`
3. 客户端提供了JS的执行引擎(JSCore)用于执行远程加载到`JS Bundle`
4. JS执行引擎执行`JS Bundle`，和浏览器的过程类似，`JS Bundle` 的代码被执行，生成VNode 树进行patch，找出最小操作DOM节点的操作，把对DOM节点的操作转变为`Native DOM API`, 调用`WXBridge` 进行通信
5. `WXBridge`将渲染指令分发到native（Andorid、iOS）渲染引擎，由native渲染引擎完成最终的页面渲染

看完上述整体流程后，可以大致理解为何WEEX可以达到媲美原生的体验，因为其页面渲染并不是像H5方案一样使用浏览器的渲染能力，而是原生渲染，所以本质上渲染出来的页面就是一个native页面。

下面会具体的介绍下面几个过程：

### 第一步： 生成 JS bundle

`JS bundle` 是前端同学写好代码后打包出来的`dist`.

前端同学可以在`.vue` 的单文件中，写`<template>`,`<style>`和`<script>`标签，然后把这些标签转换为`JS Bundle`用于部署在服务端，之后客户端会去请求这些`JS Bundle`。

比如说，下图中左边是vue源代码，右边是打包出来到`JS Bundle`

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d379c0e875?w=1342&h=540&f=jpeg&s=85117)

熟悉Vue 原理的同学清楚，上面右边其实就是Vue打包生成的`render` 函数。

JS代码比较简单，逻辑就不介绍了。接下来重点介绍，当客户端获取到如上图右侧的js bundle后，如何进行加载、渲染以及后续的相关逻辑执行。

### 第二步： WEEX SDK初始化

weex在真正打开一个页面之前，会先做一些准备的初始化工作，这一点有一点像微信小程序。在初始化阶段,WEEX SDK 会初始化好下面几样东西：

- 初始化 `js`的执行环境——`js Core` 或者是 `v8`
- 加载`weex-vue-framework` 的代码
- 初始化`WXBridge`
      

如下图所示：

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d374213db5?w=1382&h=822&f=jpeg&s=83403)

##### js的执行环境

在初始化阶段, WEEX SDK 会准备好一个js的执行环境。因为我们是要在客户端跑`js` 代码的，所以需要一个js执行环境，这个执行环境类似于浏览器的`v8` 引擎， 在IOS 上，则是客户端自带的 `js core`。

这个`js执行环境`，可以看成是一个在客户端上的沙盒，或者是一个虚拟机。

为了提升性能，js 执行环境只用在初始化的时候初始化一次，之后每个页面都无须再初始化了。也就是说不管客户端打开多少个weex页面，多个页面的 JS 都是跑在同一个js执行环境中的。

#### weex-vue-famework 框架

`weex-vue-framework` 框架 是什么呢？

你可以把 `weex-vue-framework` 框架当成被改造的`Vue.js`。语法和内部机制都是一样的，只不过`Vue.js`最终创建的是 DOM 元素，而`weex-vue-framework`则是向原生端发送渲染指令，最终渲染生成的是原生组件。

同时，`Weex`为了提高`Native`的极致性能，做了很多优化的工作。前端优化性能时，会把业务代码和 `vue.js` 这类的依赖包分开打包，一个份是业务代码，一份是打包的框架依赖。

weex 把`weex-vue-framework` 这类框架依赖内置到了SDK中，客户端访问Weex页面时，只会网络请求JS Bundle。由于JSFramework在本地，所以就减少了JS Bundle的体积，每个JS Bundle都可以减少一部分体积，从而提升了性能。

##### WXBridge 通信

`WXBridge` 是 weex 实现的一种 js 和 客户端通信的机制。

js 执行环境和客户端是隔离的，为了和外界客户端的世界通信，需要有一个通信的桥梁。weex 实现了 `WXBrigde`, 主要通过 `callJS` 和 `callNative` 两个核心的方法，实现 `js` 代码和客户端代码双向通信。

在完成了上面的初始化之后，weex已经做好了准备，只等着下载 `JS bundle` 就可开始渲染页面了。

### 第三步：创建 weex 实例

实际上当WEEX SDK获取到JS Bundle后，第一时间并不是立马渲染页面，而是先创建WEEX的实例。

每一个`JS bundle`对应一个实例，同时每一个实例都有一个`instance id`。

我们上文中说过，由于所有的`js bundle`都是放入到同一个JS执行引擎中执行，那么当js执行引擎通过`WXBridge`将相关渲染指令传出的时候，需要通过`instance id`才能知道该指定要传递给哪个weex实例

在创建实例完成后，接下来才是真正将js bundle交给js执行引擎执行。

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d38026fe80?w=1384&h=876&f=jpeg&s=111590)

### 第四步 执行 JS bundle

在实例创建完成后，接下来就是执行`JS bundle` 了。`JS bundle` 的结果是生成Virtual DOM ，然后去patch 新旧 Vnode 树，根据`diff` 算法找出最佳的DOM操作，唯一和浏览器不同的是，调用的是 Native app api ，而不是浏览器里面对DOM节点增删改查的操作。

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d3815602a4?w=1484&h=952&f=jpeg&s=106408)

#### VNode

`bundle.js`会执行`new Vue（）`创建一个`vue`组件，并通过其`render`函数创建VNode节点，即virtual dom节点 ， 像下面这样：

```javascript
{
  tag: 'div',
  data: {
    staticStyle: { justifyContent: 'center' }
  },
  children: [{
    tag: 'text',
    data: {
      staticClass: 'freestyle'
    },
    context: {
      $options: {
        style: {
          freestyle: {
            textAlign: 'center',
            fontSize: 200
          }
        }
      }
    },
    children: [{
      tag: '',
      text: 'Hello World!'
    }]
  }]
}
```

#### patch

生成了VNode之后，接下来需要将VNode同步到真实的Dom之上，该过程在`Vue.js`中被称为`patch`，`patch`会比较新旧VNode之间的差异，最小化操作集。最后再将Virual Dom整体更新到真实Dom之上。

在执行 patch 之前的过程都是 Web 和 Weex 通用的，后面的流程就不一样了，因为客户端没有对 DOM 增删改查的API，所以这些更新的操作，需要经过`weex-vue-framework`的处理，统统映射为客户端的`Native DOM API`

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d387e46cb3?w=1302&h=512&f=jpeg&s=40135)

### 第五步 发送渲染指令

weex终端的执行引擎在执行到`Native DOM API`后，`WXBridge`将`Native DOM API`转化为`Platform API`

`Platform API` 是 Weex SDK 中原生模块提供的,不是 js 中方法，也不是浏览器中的接口，是 Weex 封装的一系列方法。

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d3a20b1e68?w=894&h=826&f=jpeg&s=53788)

#### 客户端 和 前端h5的不同

本人是一枚前端同学，不太了解客户端的页面是如何写出来的，问了客户端的大佬后，了解如下：

![](https://user-gold-cdn.xitu.io/2019/6/27/16b979d3a1a13e07?w=1470&h=762&f=jpeg&s=91277)

对于前端同学来说，写一个类似上面的框内带文字的效果非常简单：

```
.text {
    // css 样式
}

 哈哈哈哈 
```

只需要 `html` + `css` 就可以实现。

对于客户端的同学，则需要写非常多的代码来实现：

- 用逻辑代码写一个框（样式，大小，位置……）
- 用逻辑代码写一行文字（样式，大小，位置……）
- 用逻辑代码把两个合起来

所以，weex 会把上面一些系列复杂的代码封装好一个个现成的方法。

### 第六步 渲染引擎

原生渲染器接收上层传来的渲染指令，并且逐步将其渲染成原生组件。

这样，我们在js中的`<div>`, `<p>` 标签，就一一对应到了客户端的原生标签。

这个过程不是分阶段一个一个执行的，而是可以实现“流式”渲染的，有可能第一个`<div>`的原生组件还没渲染好，`<text>`的渲染指令又发过来了。当一个页面特别大时，能看到一块一块的内容逐渐渲染出来的过。

## 总结

通过前文的介绍，相信大家对WEEX有了一个初步的系统认识。简单来说，WEEX放弃了传统的`Webview`，而是搭建了一个`native化的浏览器`，因为用native的方式实现了一个浏览器的大部分核心组成成分：

- JS 执行引擎
- 渲染引擎
- DOM树管理
- 网络请求，持久层存储
- 等等能力.

另外为了保证整个SDK的运行效率，SDK维护了三个线程：

- bridge线程：完成js到native之间的通信
- dom线程：完成dom结构的构建
- 渲染线程：完成UI渲染，也就是UI线

以上就是WEEX SDK的大致框架和核心逻辑
