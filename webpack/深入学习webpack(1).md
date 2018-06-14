
# 背景
近年来，前端技术蓬勃发展，我们想在js更方便的实现html,
社区就出现了jsx，
我们觉得原生的css不够好用，
社区就提出了`scss`, `less`，
针对前端项目越来越强的模块化开发需求，社区出现了`AMD`, `CommonJS`, `ES2015 import`等等方案。
遗憾的是，这些方案大多并不直接被浏览器支持，往往伴随这些方案而生的还有另外一些，让这些新技术应用于浏览器的方案，我们用`babel`来转换下一代的js，转换jsx；
我们用各种工具转换`scss`, `less`为`css`；
我们发现项目越来越复杂，代码体积越来越大，又要开始寻找各种优化，压缩，分割方案。
前端工程化这个过程，真是让我们大费精力。我们也大多是在寻找前端模块化解决方案的过程中知晓了`webpack`。

# 前端为什么需要建构
## 前后端分离
之前前后端耦合，前端仅仅输出静态页面给后端，后端的同学通过模板引擎来渲染数据。
现在前后端分离，前端的逻辑复杂度增加，有自己的view层，model层。在管理的时候，需要打包。
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180612_233416.png)

## 框架的变化
之前的jQuery只能是库，提供一些静态的js方法，后来到了mvc的时代，backbone.js, underscore.js, require.js
再到现在的mvvm时代，三大代表性的框架, 一方面模块化开发要求打包，另一方面，es6的语法，typescript语法都要求编译一步。`Angular`,`react`,`vue`

## 语言的变化
### CSS的发展
一方面，我们希望写一套css多个浏览器运行，另一方面，我们希望更高效的编写css,比如说less，sass，这都要求需要对前端工程进行构建。
### 前端脚本语言的发展
!()[http://p8cyzbt5x.bkt.clouddn.com/UC20180612_233551.png]

## 包管理的发展
npm社区的完善，前端项目中也会引入越来越多的库和依赖，这就要求前端在上线的时候，需要使用工具对项目打包上线。

---------------------------

# 模块化开发
## js 模块化
### 命名空间
最开始，前端使用命名空间来解决模块化的问题。一个团队里面约定好，个人使用个人的命名空间，从而避免冲突的问题。
```
var nameSpace = {}
nameSpace.type = nameSpace.type || {}
nameSpace.type.method = function (){
  
}
```
但是有一个问题是，想访问一个命名空间一个具体的方法，路径会非常长，为了解决这个问题，YUI提供了解决方法：
```
// 方式一
YUI.add('davglass', function(Y){
  Y.davglass = function() {
    Y.log('hello')
  }
}, '3.4.0', { requires: ['test1','test2'] })

YUI().use('davglass',function(Y){
  Y.davglass()
})

// 方式二
YUI.applyConfig({
  modules:{
    'davglass': {
      fullpath: './davglass.js'
    }
  }
})
YUI().use('davglass',function(Y){
  Y.davglass()
})
```

### commonjs
在node端，发展出来了commonjs
在`modules/1.1.1`版本里，commonjs规定了
1. 一个文件为一个模块
2. 通过`module.export`暴露了接口
3. 通过`requir`e引入
4. 服务端，同步执行

### AMD / CMD / UMD
随后，在浏览器端，社区分别发展出了AMD / CMD / UMD 规范
#### AMD
1. 异步
2. 通过define来定义模块
3. 通过require来加载模块
4. 代表是 Requirejs
5. 依赖前置，提前执行
 依赖前置，不管是在代码哪里引入的

#### CMD
1. 通过define来定义模块
2. 通过require来加载模块
3. 代表是 Seajs
4. 尽可能的懒执行

#### UMD
1. Universal Module Definition
2. 首先会判断是否支持AMD, 判断是否支持CommonJS, 如果都没有，则定义为全局变量


### ES6 mudule
随着es6的发展，es6 module逐渐普及
1. 一个文件一个模块
2. export / import

### webpack支持程度
1. 支持AMD(requirejs)d
2. es module（推荐的）
3. Commonjs （服务端）


## CSS模块化
### OOCSS
面向对象的css, 结构和样式分理，内容和容器分理
### SMACSS
主要目的是减少代码量
base + layout + module + state + theme
### atomic css
原子的css,一个css类只负责一件事情
```
<div class = 'mt-10 w-5 h-10'>
```
### BEM
#### BLOCK
区域的划分，比如说header，menu
#### ELEMENT
一些小部分，比如说 checkbox
#### MODIFIDER
一些变化啊，比如说 hovered, actived


# webpack版本的演进
## webpack v1
1. 编译打包
2. 热更新
3. 代码分割
4. 对文件的处理，loader，plugin等等
## webpack v2
1. tree shaking, 体积更小，引入但是没有使用的，会被删掉
2. 支持原生es module
3. 动态Import, 不是es6的， import()
## webpack v3
1. scope hoisting 作用域提升，打包之后的代码性能提升
2. magic comments , 配合动态 import() 使用，指定打包以后的文件名

-------------------------------
# 写作目标
一直以来对webpack都没有专门研究过，
最近决定抽出时间对webpack进行一个深入的研究。
首先会讲webpack怎么用，配置文件怎么写，webpack官方文档写的不好。
之后，会更加深入的了解webapck, 深入的部分主要如下：

1. **常用的loader的实现原理**
    包括 babel-loader, css-loader, style-loader, url-loader, file-loader 等。
    通过源码来看他们的实现方式，并且尝试模仿他们自己动手写一个简单的loader。

2. **webpack 源码分析**
    webpack 本身是一个插件式的框架，他的功能都是通过插件实现的。
    而webpack源码中的插件有几十个之多，这里我们先看看webpack插件架构的实现，然后挑一两个核心的插件来分析他的源码。

3. **HMR实现原理** 
    探究HMR 是如何实现的

4. **tree-shaking**
    tree-shaking的探讨，以及大家可能对tree-shaking工作原理的一些误解

欢迎大家star, star是我的动力。