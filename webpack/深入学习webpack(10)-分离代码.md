# 为什么要分离代码?

1. 缓存

如果所有的依赖都打包到一个文件里面，比如说vue、react和频繁改动的业务代码都打包到index.js里面，每一次改动都需要加载一个新的文件。

为了更好地利用缓存，我们js、css文件名带上唯一的hash,同时强缓存阶段`cache-control`字段设置较长的时间。下次访问同名的的文件，就可以直接走缓存。
如果vue这种依赖分离出来打包，每次改动业务代码，不会影响vue打包，用户不需要重复下载。

2. 多页面

如果a页面和b页面都依赖了一个公共资源。把公共资源分离出来，用户从a页面浏览到b页面，不需要重复下载。

# webpack3 和 webpack4的区别
`webpack 4.x` 和 `webpack 3.x` 在代码分离这一块的内容差别比较大,

3.x 以前的版本是使用 CommonsChunkPlugin 来做代码分离的，而 webpack 4.x
则是把相关的功能包到了 optimize.splitChunks 中。

webpack的官方文档在这一块写的糟糕，连国外的大佬都不禁吐槽。

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180615_195501.png)

> 这就像，我只想知道如何把汽车打着火，但汽车使用说明书上却写着密密麻麻的配置教程。

> “汽车轮胎上螺丝是高度可配置非常灵活的，使用螺丝可以加固两个相邻物体，你可以把它作为非常合适的连接器，共有6种配置方式，它们分别是……”

然而我只想知道，**我应该怎么第一二三步的开车**，**为什么要这样操作**，**这样操作的原理是什么**，一些细枝末节细节可以放在日后再慢慢熟悉。


# 如何使用splitChunk?
代码中引入公共的依赖是一种很常见的场景, 就像下面这样

utilites/user.js
```
export default [
    {name: 'a', age: 20},
    {name: 'b', age: 20},
    {name: 'c', age: 20},
]
```

a.js
```js
import _ from 'lodash';
import users from './users';

const person = _.find(users, {name:'a'})
```

b.js
```js
import _ from 'lodash';
import users from './users';

const lucy = _.find(users, { name: 'b' });
```

webpack.config.js
```
module.exports = {
  entry: {
    a: './src/a.js',
    b: './src/b.js'
  },
  output: {
    filename: '[name].[hash].bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
}
```
通过webpack打包，会发现打包出来两个文件：`a.[chunkhash].bundle.js`,
`b.[chunkhash].bundle.js` ，每一个文件里面，都有一份`lodash`的库。

webpack4的官方文档说，把公共的库抽出来是默认的操作。

这里之所以没有帮我们把`lodash`抽离出来，是因为webpack只会帮我们抽出来`async
chunk`, 也就是通过动态`import()`引入的依赖，之后我们会介绍。

现在需要修改配置，把 `lodash` 抽离出来：
```
module.exports = {
  entry: {
    a: './src/a.js',
    b: './src/b.js'
  },
  output: {
      filename: '[name].[hash].bundle.js',
      path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
        chunks: 'all'
    }
  }
}
```
这样打包之后会多得一个 `vendors~a~b.[chunkhash].bundle.js`, 里面会有`lodash`库

默认情况下，我们有一些开箱即用的`cacheGroups配置`:
```
module.exports = {
    entry: {
        a: './src/a.js',
        b: './src/b.js'
      },
      output: {
          filename: '[name].[hash].bundle.js',
          path: path.resolve(__dirname, 'dist')
      },
      optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_module[\\/]/,
                    priority: -10
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
      }
}
```
第一个是从`node_module`里面打包出来的`vendors`, 第二个是从其他公共的依赖打出来的。

但是这里需要注意，`users.js`并没有被打包出来，这是因为`splitChunksPlugin`只会打包30kb以上的。

我们可以这样修改:
```
module.exports = {
  entry: {
    a: "./src/a.js",
    b: "./src/b.js"
  },
  output: {
    filename: "[name].[chunkhash].bundle.js",
    path: __dirname + "/dist"
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      minSize: 0
    }
  }
};
```
这样`user.js`就会被打包到`a~b.[chunkhash].bundle.js`了。




