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