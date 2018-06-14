# loader 匹配规则
loader 的匹配规则中有两个最关键的因素：一个是匹配条件，一个是匹配规则后的应用。


## 匹配条件
```js
module.exports = {
  // ...
  module: {
    rules: [ 
      {
        test: /\.jsx?/, // 条件
        include: [ 
          path.resolve(__dirname, 'src'),
        ], // 条件
        use: 'babel-loader', // 规则应用结果
      }, // 一个 object 即一条规则
    
    ],
  },
}
```
大部分情况下，我们只匹配文件的后缀名决定用什么loader

1. { test: ... } 匹配特定条件
2. { include: ... } 匹配特定路径
3. { exclude: ... } 排除特定路径
4. { and: [...] }必须匹配数组中所有条件
5. { or: [...] } 匹配数组中任意一个条件
6. { not: [...] } 排除匹配数组中所有条件

上述的所谓条件的值可以是：

- 字符串：必须以提供的字符串开始，所以是字符串的话，这里我们需要提供绝对路径
- 正则表达式：调用正则的 test 方法来判断匹配
- 函数：(path) => boolean，返回 true 表示匹配
- 数组：至少包含一个条件的数组
- 对象：匹配所有属性值的条件...


```js
rules: [
  {
    test: /\.jsx?/, // 正则
    include: [
      path.resolve(__dirname, 'src'), // 字符串，注意是绝对路径
    ], // 数组
    // ...
  },
  {
    test: {
      js: /\.js/,
      jsx: /\.jsx/,
    }, // 对象，不建议使用
    not: [
      (value) => { /* ... */ return true; }, // 函数，通常需要高度自定义时才会使用
    ],
  },
]
```

## 匹配后的配置
我们可以使用 use 字段：
```js
rules: [
  {
    test: /\.less/,
    use: [
      'style-loader', // 直接使用字符串表示 loader
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1
        },
      }, // 用对象表示 loader，可以传递 loader 配置等
      {
        loader: 'less-loader',
        options: {
          noIeCompat: true
        }, // 传递 loader 配置
      },
    ],
  },
],
```

use 字段可以是一个数组，也可以是一个字符串或者表示 loader 的对象。如果只需要一个 loader，也可以这样：use: { loader: 'babel-loader', options: { ... } }。


# loader的应用顺序
先说规则：同一个rule里面从后向前，在rules数组里面如果匹配到同一个，看enforce

## 在一个rule里面，从后向前
前面提到，一个rule可以配置使用多个 loader，执行顺序是从最后配置的 loader 开始，一步步往前。
例如，对于上面的 less 规则配置，一个 style.less 文件会途径 less-loader、css-loader、style-loader 处理，成为一个可以打包的模块。

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180615_005531.png)

## 在rules数组里面看enforce
每一个rule都提供了enforce的属性，默认是普通，还可以配置`pre`和`post`
执行顺序是`pre` > `普通` > `post`
```js
rules: [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "eslint-loader",
    enforce: 'pre'
  },
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: "babel-loader",
  },
]
```
上面的`eslint`会先执行。


# 小结

loader 在 module.rules 数组里面配，`rule`里面需要有匹配条件：`test`,`exclude`,`include`,`not`, 需要有对loader的配置：
 `use`配置loader
 注意loader的顺序，在rule内是从后向前，在rules数组内是看enforce


