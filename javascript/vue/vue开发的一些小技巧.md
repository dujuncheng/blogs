

同一个方法被绑到了不同的节点上，如何在方法内确定点击的不同的节点：
1. 传参
2. 通过自定义属性
```html
<div class="container" data-isRemind="true" @click="jumpTo">
```
```js
let app = new Vue({
    data () {
        return {}
    },
    methods: {
        jumpTo (event) {
        //    event 是vue封装的
            if (event.target.getAttribute('data-isRemind')) {
                console.log(1)
            } else {
                console.log(2)
            }
        }
    }
})
```

