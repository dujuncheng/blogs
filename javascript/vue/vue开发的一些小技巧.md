

### 同一个方法被绑到了不同的节点上，如何在方法内确定点击的不同的节点：
1. 传参
2. 通过自定义属性
> 自定义属性不区分大小写
```html
<div class="container" data-isremind="true" @click="jumpTo">
```
```js
let app = new Vue({
    data () {
        return {}
    },
    methods: {
        jumpTo (event) {
        //    event 是vue封装的
            if (event.target.getAttribute('data-isremind')) {
                console.log(1)
            } else {
                console.log(2)
            }
        }
    }
})
```

### 组件style为scoped 在组件中用js动态创建的dom，添加样式不生效

```vue
<template>
     <div class="test"></div>
</template>
<script>
    let a=document.querySelector('.test');
    let newDom=document.createElement("div"); // 创建dom
    newDom.setAttribute("class","testAdd" ); // 添加样式
    a.appendChild(newDom); // 插入dom
</script>
<style scoped>
.test{
   background:blue;
    height:100px;
    width:100px;
}
.testAdd{
    background:red;
    height:100px;
    width:100px;
}
</style>
```
结果：

```vue
// test生效   testAdd 不生效
<div data-v-1b971ada class="test"><div class="testAdd"></div></div>
.test[data-v-1b971ada]{ // 注意data-v-1b971ada
    background:blue;
    height:100px;
    width:100px;
}
```
当 <style> 标签有 scoped 属性时，它的 CSS 只作用于当前组件中的元素。
它会为组件中所有的标签和class样式添加一个scoped标识，就像上面结果中的data-v-1b971ada。
所以原因就很清楚了：因为动态添加的dom没有scoped添加的标识，没有跟testAdd的样式匹配起来，导致样式失效。


## Vue 数组/对象更新 视图不更新
很多时候，我们习惯于这样操作数组和对象:
```vue
    data() { // data数据
        return {
          arr: [1,2,3],
          obj:{
              a: 1,
              b: 2
          }
        };
      },
    // 数据更新 数组视图不更新
    this.arr[0] = 'OBKoro1';
    this.arr.length = 1;
    console.log(arr);// ['OBKoro1'];
    // 数据更新 对象视图不更新
    this.obj.c = 'OBKoro1';
    delete this.obj.a;
    console.log(obj);  // {b:2,c:'OBKoro1'}

```
     

由于js的限制，Vue不能检测以上`数组的变动`，以及`对象的添加/删除`，很多人会因为像上面这样操作，出现视图没有更新的问题。
### 解决方式一： $set

```js
this.$set(arr, index,，你要改成什么value)
this.$set(this.arr, 0, "OBKoro1"); // 改变数组
this.$set(this.obj, "c", "OBKoro1"); // 改变对象
```


如果还是不懂的话，可以看看这个codependemo。

数组原生方法触发视图更新:

Vue可以监测到数组变化的，数组原生方法:
    splice()、 push()、pop()、shift()、unshift()、sort()、reverse()

意思是使用这些方法不用我们再进行额外的操作，视图自动进行更新。
推荐使用splice方法会比较好自定义,因为slice可以在数组的任何位置进行删除/添加操作，这部分可以看看我前几天写的一篇文章:【干货】js 数组详细操作方法及解析合集

替换数组/对象

比方说:你想遍历这个数组/对象，对每个元素进行处理，然后触发视图更新。
   // 文档中的栗子: filter遍历数组，返回一个新数组，用新数组替换旧数组
    example1.items = example1.items.filter(function (item) {
      return item.message.match(/Foo/)
    })

举一反三：可以先把这个数组/对象保存在一个变量中，然后对这个变量进行遍历，等遍历结束后再用变量替换对象/数组。
并不会重新渲染整个列表:
Vue 为了使得 DOM 元素得到最大范围的重用而实现了一些智能的、启发式的方法，所以用一个含有相同元素的数组去替换原来的数组是非常高效的操作。
如果你还是很困惑，可以看看Vue文档中关于这部分的解释。




v-if尽量不要与v-for在同一节点使用:

v-for 的优先级比 v-if 更高,如果它们处于同一节点的话，那么每一个循环都会运行一遍v-if。

如果你想根据循环中的每一项的数据来判断是否渲染，那么你这样做是对的:

    <li v-for="todo in todos" v-if="todo.type===1">
      {{ todo }}
    </li>

如果你想要根据某些条件跳过循环，而又跟将要渲染的每一项数据没有关系的话，你可以将v-if放在v-for的父节点：
    // 根据elseData是否为true 来判断是否渲染，跟每个元素没有关系    
     <ul v-if="elseData">
      <li v-for="todo in todos">
        {{ todo }}
      </li>
    </ul>
    // 数组是否有数据 跟每个元素没有关系
    <ul v-if="todos.length">
      <li v-for="todo in todos">
        {{ todo }}
      </li>
    </ul>
    <p v-else>No todos left!</p>

如上，正确使用v-for与v-if优先级的关系，可以为你节省大量的性能。

深度watch与watch立即触发回调
watch很多人都在用，但是这watch中的这两个选项deep、immediate，或许不是很多人都知道，我猜。
选项：deep
在选项参数中指定 deep: true，可以监听对象中属性的变化。
选项：immediate
在选项参数中指定 immediate: true, 将立即以表达式的当前值触发回调，也就是立即触发一次。
    watch: {
        obj: {
          handler(val, oldVal) {
            console.log('属性发生变化触发这个回调',val, oldVal);
          },
          deep: true // 监听这个对象中的每一个属性变化
        },
        step: { // 属性
          //watch
          handler(val, oldVal) {
            console.log("默认立即触发一次", val, oldVal);
          },
          immediate: true // 默认立即触发一次
        },
      },

这两个选项可以同时使用，另外：是的，又有一个demo。
还有下面这一点需要注意。

