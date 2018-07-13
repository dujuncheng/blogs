# 第二步：layout

在上一节我们提到了 **render object tree**， **render object** 的节点第一次被创建然后添加到 render object tree时，它身上没有关于位置和尺寸的信息。接下来，确定每一个render object的**位置和尺寸**的过程被称为layout。

我们能在不同的文章中看到不同的名词： ` 布局 ` ，` layout ` ,  ` 回流 ` ， ` reflow ` , 这些名词说的都是一回事，不同浏览器的叫法不同。

每一个renderer(节点) 都有layout 方法。 

```java
 void layout()
```

layout 是一个递归的过程。layout 过程究竟是谁来负责的呢？ **一个名为 `FrameView` 的 class。** `FrameView` 表示document所包含区域的视图。

`FrameView` 可以运行下面两种类型的 layout :

1. 全局layout

   render tree 的根节点自身的layout方法被调用，然后整个render tree 被更新。

2. 局部layout

   只是区域性的更新，只适用于某个分支的改动不会影响到周围的分支。

   目前局部layout只会在 text 更新的时候使用



## Dirty Bits (脏位)

在layout 阶段，采用一种称为 **Dirty Bits **的机制去判断一个节点是否需要layout。当一个新的节点被插到tree中时，它不仅仅“弄脏“了它自身，还“弄脏“了**相关的祖先**（the relevant ancestor chain，下面会介绍）。有没有被“弄脏”是通过设置bits （set bits）来标识的。

```java
bool needsLayout() const { return m_needsLayout || m_normalChildNeedsLayout || m_posChildNeedsLayout; }
```

上面 needsLayout 为 true 有三种情况：

1. selfNeedsLayout 

   Rederer 自身是 “脏”的。当一个 rederer 自身被设置为“脏”的，它相关的父亲节点也会被设置一个标识来指出它们有一个“脏”的子节点

2. posChildNeedsLayout

   设置了postion不为static的子节点被弄脏了

3. normalChildNeedsLayout

   在文档流中的子节点被弄脏了

上面之所以要区分子节点是否在文档流中，是为了layout过程的优化。



## Containing Block （包含块）

上面提到了**相关祖先**（the relevant ancestor chain），那么究竟是如何判断哪个节点是 **相关祖先 **？

Container Block(包含块) 身份有两个

1. 子节点的相关的父节点

2. 子节点的相对坐标系

   子节点都有 XPos 和 YPos 的坐标，这些坐标都是相对于他们的Containing Block （包含块）而言的。

   

下面介绍Container Block(包含块) 概念。

### 包含块的定义

通俗来讲，Container Block 是决定子节点位置的父节点。每个子节点的位置都是相对于其container block来计算的。更详细的信息可以点这个 [css2.1 官方的解释点这里](https://www.w3.org/TR/CSS21/visuren.html#containing-block) 

有一种特殊的containing  block —— initial containing block (最初的container block)。

当Docuement 节点上的 renderer() 方法被调用时，会返回一个节点对象为render tree 的根节点，被称作 **RenderView**, RenderView 对应的containing bock 就是 initial containing block。

 initial containing block 的尺寸永远是viewport的尺寸，且永远是相对于整个文档的 position(0,0) 的位置。下面是图示：

![image-20180712172110827](http://p8cyzbt5x.bkt.clouddn.com/2018-07-12-092110.png)

黑色的框代表的是 initial containing block (最初的container block) , 灰色的框表示整个 document。当document往下滚动的时候， initial containing block (最初的container block) 就会被移出了屏幕。 initial containing block (最初的container block)  始终在document 的顶部，并且大小始终是 viewport 的尺寸。

那么render Tree上的节点，它们各自的 containing block 是什么？

- 根节点的 containing block 始终是 RenderView

- 如果一个renderer节点的css postion 的值为 relative 或 static，则其 containing block 为最近的父节点

- 如果一个renderer节点的css postion 的值为 absolute, 则其containing block 为最近的 css postion 的值不为static 的父节点。如果这样的父节点不存在，则为 RenderView，也就是根节点的containing block

- 如果一个renderer节点的css postion 的值为 fixed。这个情况有一些特殊，因为 [W3C](https://www.w3.org/TR/CSS21/visudet.html#containing-block-details) 标准和 [webkit core](https://webkit.org/blog/146/new-open-committer-and-reviewer-policy/) 介绍的不一样。W3C 最新的标准认为css postion 的值为 fixed的renderer节点的containing block是viewport ，原文如下：

  ![image-20180712230128732](http://p8cyzbt5x.bkt.clouddn.com/2018-07-12-150129.png)

  而webkit core 认为css postion 的值为 fixed的renderer节点的containing block是RenderView。RenderView并不会表现的和viewport一样，但是RenderView会根据页面滚动的距离算出css postion 的值为 fixed的renderer节点的位置。这是因为单独为viewport 生成一个renderer 节点并不简单。原文如下：

  ![image-20180712230517294](http://p8cyzbt5x.bkt.clouddn.com/2018-07-12-150518.png)



render tree 有两个方法判断 renderer 的position:

```
bool isPositioned() const;   // absolute or fixed positioning
bool isRelPositioned() const;  // relative positioning
```

render tree 有一个方法获取某一个块状 rederer 的containing block（相对父节点）

```
RenderBlock* containingBlock() const
```

render tree 还有一个方法是兼容了行内元素获取相对父节点的方法，用来代替containingBlock (因为containingBlock只适用于块状元素)

```
RenderObject* container() const
```

当一个 renderer 被标记为需要 layout的时候，就会通过`container()`找到相对父节点，把`isPositioned` 的状态传递给相对父节点。如果 renderer 的position是absolute 或 fixed ，则相对父节点的posChildNeedsLayout为true，如果 renderer的position 是 static 或 relative , 则相对父节点的 normalChildNeedsLayout 为 true。























HTML是流式的布局，从上往下，从左往右， 后面的元素的改动不会影响到前面的改动。

每一个节点都有一个layout() 方法，首先是根节点被安顿好，然后子节点对layout() 方法被一次调用。



需要注意的是，layout 必然会触发 paint , 但是 paint 不一定会触发layout 。所以相比于layout + repaint的代价，还是单纯的 repaint 代价更小一些。

## 会触发layout 的属性

1. 盒子模型相关的属性

   - width 

   - height

   - padding

   - margin

   - border

   - display

   - ###### ……

2. 定位属性和浮动

   - top
   - bottom
   - left
   - right
   - position
   - float
   - clear

3. 节点内部的文字结构

   - text - aligh
   - overflow
   - font-weight
   - font- family
   - font-size
   - line-height



上面只是一部分，更全部的可以点击 [csstriggers](https://csstriggers.com/) 来查阅；

csstrigger 里面需要注意的有几点。

1. opacity的改动，在blink内核和Gecko内核上不会触发layout 和 repaint ![image-20180706152622532](http://p8cyzbt5x.bkt.clouddn.com/2018-07-06-072622.png)
2. transform的改动，在blink内核和Gecko内核上不会触发layout 和 repaint 

   ![image-20180706152905325](http://p8cyzbt5x.bkt.clouddn.com/2018-07-06-072905.png)

1. visibility 的改动，在Gecko 内核上不会触发 layout repaint, 和 composite![image-20180706153256502](http://p8cyzbt5x.bkt.clouddn.com/2018-07-06-073256.png)



## 会触发layout 的方法

几乎任何测量元素的宽度，高度，和位置的方法都会不可避免的触发reflow, 包括但是不限于：

- elem.getBoundingClientRect()
- window.getComputedStyle()
- window.scrollY
- and a lot more…



## 如何避免重复Layout

#### 不要频繁的增删改查DOM

#### 不要频繁的修改默认根字体大小

#### 不要一条条去修改DOM样式，而是通过切换className

虽然切换className 也会造成性能上的影响，但是次数上减少了。

#### “离线”修改DOM

比如说一定要修改这个dom节点100次，那么先把dom的display设置为 none ( 仅仅会触发一次回流 )

#### 使用flexbox

老的布局模型以相对/绝对/浮动的方式将元素定位到屏幕上 Floxbox布局模型用流式布局的方式将元素定位到屏幕上，flex性能更好。

#### 不要使用table

使用table布局哪怕一个很小的改动都会造成重新布局

#### 避免强制性的同步layout

layout根据区域来划分的，分为全局性layout, 和局部的layout。比如说修改根字体的大小，会触发全局性layout。

全局性layout是同步的，会立刻马上被执行，而局部性的layout是异步的，分批次的。浏览器会尝试合并多次局部性的layout为一次，然后异步的执行一次，从而提高效率。

但是js一些操作会触发强制性的同步布局，从而影响页面性能，比如说读取 offsetHeight、offsetWidth 值的时候。

