# 前言
`intersection observer api`可以去测量某一个dom节点和其他节点，甚至是viewport的距离。

这个是实验性的api，你应该查阅https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#Browser_compatibility
查看其兼容性


在过去，检测一个元素是否在可视区内，或者两个元素之间的距离如何，是一个非常艰巨的任务。
获取这些信息是非常必要的：
1. 懒加载
2. 无限加载，就是微博那种刷到底接着请求新数据可以接着刷
3. 广告的可见性

在过去，我们需要不断的调用`Element.getBoundingClientRect()`方法去获取到我们想拿到的信息，然而这些代码会造成性能问题。


`intersection observer api`可以注册回调函数，当我们的目标元素，进入指定区域（比如说viewport，或者其他的元素）时，回调函数会被触发；

# 语法
```
  var handleFun = function() {}
  var boxElement = document.getElementById()
  
  var options = {
    root: null,
    rootMargin: "0px",
    threshold: 0.01
  };

  observer = new IntersectionObserver(handleFunc, options);
  observer.observe(boxElement);
```

# 写一个懒加载的库

html
```
<img class="js-lazy-image" data-src="burger.png">
```
你也许注意到上面的代码中，图片文件没有 src 属性么。这是因为它使用了称为 data-src 的 data 属性来指向图片源。我们将使用这来加载图片

js
```

const images = document.querySelectorAll('.js-lazy-image');
const config = {
  rootMargin: '50px 0px',
  threshold: 0.01
};


function onIntersection(entries) {
  entries.forEach(entry => {
    // Are we in viewport?
    if (entry.intersectionRatio > 0) {

      // Stop watching and load the image
      observer.unobserve(entry.target);
      preloadImage(entry.target);
    }
  });
}


// The observer for the images on the page
let observer = new IntersectionObserver(onIntersection, config);
  images.forEach(image => {
    observer.observe(image);
  });

```

首先，我选择了页面中所有包含 js-lazy-image 类的图片。然后我创建了一个新的 IntersectionObserver，并用它来观察所有我们已经选择的带有 js-lazy-image 类的图片。使用 IntersectionObserver 的默认选项，你的回调会在元素部分进入视区和完全离开视口时被调用。在这个例子中，我会传递一些额外的配置选项给 IntersectionObserver。使用 rootMargin 允许你指定根元素的 margin 值，让你可以扩展或者缩减 intersections 的使用区域。我们想确保如果图片进入了 Y 轴的 50px 内，我们将开始下载。


# 检测兼容性

```
('IntersectionObserver' in window)
```