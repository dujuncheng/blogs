# webpack是怎么找到依赖的

webpack 中有一个很关键的模块 enhanced-resolve 就是处理依赖模块路径的解析的，这个模块可以说是 Node.js 那一套模块路径解析的增强版本，有很多可以自定义的解析配置。

关于node的那个解析规则，可以参考朴灵《深入浅出nodejs》

加载优先级：
1. 如果是文件直接加载
2. 如果是文件夹找package.json的main字段
3. 没有main字段就找index.js

要注意的是`package.json`的main字段优先于index.js字段；
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_234816.png)

比如说在index.js里面引入了moduleA的方法
![UC20180614_234816](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_234816.png)


webpack关于路径解析的配置主要在 `resolve`

## resolve.alias
相当于依赖的简称

### 模糊模式
```js
module.exports = {
	resolve: {
		alias:{
			foo: path.resolve(__dirname, 'src/foo') 
		}
	}
}

```
上述的配置是模糊匹配，意味着只要模块路径中携带了 utils 就可以被替换掉，如：
```js
import 'utils/query.js' // 等同于 import '[项目绝对路径]/src/foo/query.js'
```

### 精准模式
```js
module.exports = {
	resolve: {
		alias: {
			foo$: path.resolve(__dirname, 'src/foo')
		}
	}
}
```
只会匹配 `import 'foo'`, 而`import 'foo/bar'` 不会被匹配到，还是会走普通解析

## resolve.extensions
帮忙补后缀，顺序代表优先级
```js
module.exports = {
	resolve: {
		alias: {
			foo: path.resolve(__dirname, 'path')
		}
	},
	extensions: ['.wasm','.mjs','.js']
}
```

## resolve.modules
指定`node_module`, 一般不需要改
```js
resolve: {
  modules: ['node_modules'],
}
```
node_modules写成绝对路径减少查找时间
放在其他奇怪路径下面的写在后面

```js
resolve: {
  modules: [
    path.resolve(__dirname, 'node_modules'), 
    'other_node_modules', 
  ]
}
```


## resolve.mainField
像下面这个目录：
![](http://p8cyzbt5x.bkt.clouddn.com/UC20180614_200800.png)
入口文件怎么找？
在`package.json`的`main`字段里面指定了入口文件。如果想修改的话，通过resolve.mainField

## resovle.mainFiles
当目录下没有 package.json 文件时，我们说会默认使用目录下的 index.js 这个文件，其实这个也是可以配置的，是的，使用 resolve.mainFiles 字段，默认配置是：
```js
resolve: {
  mainFiles: ['index'], // 你可以添加其他默认使用的文件名
},

```