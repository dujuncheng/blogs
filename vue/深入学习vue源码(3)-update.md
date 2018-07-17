# update

在上面的分析中，其实就是`vm._render()`之后的调用过程。`vm._render()` 会返回一个创建好的vnode, 接着调用vm._update 方法。

```js
updateComponent = () => {
  vm._update(vm._render(), hydrating)  
}
```

Vue 的 `_update` 是实例的一个私有方法，它被调用的时机有 2 个，一个是首次渲染，一个是数据更新的时候；由于我们这一章节只分析首次渲染部分，数据更新部分会在之后分析响应式原理的时候涉及。

`_update` 方法的作用是把 VNode 渲染成真实的 DOM。

那么`_update` 的方法定义在哪里呢？之前我们看到下面的代码：

```
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)
```

在lifecycleMixin（）函数中，可以看到定义了 `_update`方法。

![image-20180717003104464](http://p8cyzbt5x.bkt.clouddn.com/2018-07-16-163104.png)

我们把代码展开：

```js
Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
  // 声明了一堆变量是干什么用的？
  // _update在两种情况下会被调用，1. 初次渲染， 2. 数据更新。 这些变量主要是在数据更新的时候用的
  const vm: Component = this
  const prevEl = vm.$el
  const prevVnode = vm._vnode
  const prevActiveInstance = activeInstance
  activeInstance = vm
  vm._vnode = vnode
  // Vue.prototype.__patch__ is injected in entry points
  // based on the rendering backend used.
  
  // 下面就是判断是第一种情况，还是第二种情况
  // 根据prevVnode是否为空来判断，如果为空，则初始化render, 否则updata
  // 都是调用vm.__patch__方法
  // 在不同的平台，比如 web 和 weex , __patch__定义是不一样的，因此在 web 平台中它的定义在 src/platforms/web/runtime/index.js
  if (!prevVnode) {
    // initial render
    vm.$el = vm.__patch__(vm.$el, vnode, hydrating, false /* removeOnly */)
  } else {
    // updates
    vm.$el = vm.__patch__(prevVnode, vnode)
  }
  activeInstance = prevActiveInstance
  // update __vue__ reference
  if (prevEl) {
    prevEl.__vue__ = null
  }
  if (vm.$el) {
    vm.$el.__vue__ = vm
  }
  // if parent is an HOC, update its $el as well
  if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
    vm.$parent.$el = vm.$el
  }
  // updated hook is called by the scheduler to ensure that children are
  // updated in a parent's updated hook.
}
```

`_update` 的核心就是调用 `vm.__patch__` 方法，这个方法实际上在不同的平台，比如 web 和 weex 上的定义是不一样的，因此在 web 平台中它的定义在 `src/platforms/web/runtime/index.js` 中：

```js
// 判断当前环境是否是在浏览器环境中
Vue.prototype.__patch__ = inBrowser ? patch : noop
```

这里主要是为了判断当前环境是否是在浏览器环境中（因为现在的vue是可以跑在服务端的），也就是是否存在`Window`对象。这里也是为了做跨平台的处理，如果是在`server render`环境，那么无法操作DOM, `patch`就是一个空操作。 而在浏览器端渲染中，它指向了 `patch` 方法，它的定义在 `src/platforms/web/runtime/patch.js`中：

```JS
import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

// 看这一行，是调用了createPatchFunction()的返回值
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

该方法的定义是调用 `createPatchFunction` 方法的返回值，这里传入了一个对象，包含 `nodeOps` 和 `modules` 。

其中，我们看一下`nodeOps`里面有什么：

![image-20180717004430686](http://p8cyzbt5x.bkt.clouddn.com/2018-07-16-164431.png)

`nodeOps` 封装了一系列 DOM 操作的方法。这些方法具体是如何实现的，我们之后再详细的去看。

还有另外一个参数是 modules, 在 `patch.js` 中， modules 的定义如下：

```js
import baseModules from 'core/vdom/modules/index'
import platformModules from 'web/runtime/modules/index'

const modules = platformModules.concat(baseModules)
```

是 platformModules 和 baseModules 两个数组的拼接。

platformModules:

![image-20180717004843732](http://p8cyzbt5x.bkt.clouddn.com/2018-07-16-164843.png)

引入了 module 目录下面的其他文件，导出了一个数组的合集。这个数组里面有 atts (处理dom节点属性的模块)， class (处理dom节点class的模块)，events(处理dom节点事件的模块)，style(处理dom节点样式的模块) 等等。

我们创建DOM节点，DOM节点上的这些东西都是这些模块帮我们做的。先不细看，之后会有介绍。现在我们只需要知道，`modules` 定义了一些DOM模块的钩子函数的实现。

还是回到这一行代码：

```js
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

下面来看一下 `createPatchFunction` 的实现，它定义在 `src/core/vdom/patch.js` 中：

因为代码分支太多了，我们下面的浏览思路是基于下面的示例

```js
export default {
  el: '#app',
  name: 'App',
  components: {
    HelloWorld
  },
  data () {
    return {
      name: 'dudu'
    }
  },
  render (createElement) {
    return createElement('div', {
      atts: {
        id: "#app"
      }
    }, this.name)
  }
}
```



```js
const hooks = ['create', 'activate', 'update', 'remove', 'destroy']

export function createPatchFunction (backend) {
  let i, j
  const cbs = {}
  // 看到这里，解构赋值，拿到了modules数组合集，和nodeOps
  const { modules, nodeOps } = backend
  
  // hooks钩子 第一行有定义
  // 遍历hook, 对于 modules 中的每一个模块，都要看该模块的各个hook钩子是否被定义了，如果定义了，就存放在cbs中。
  // 在创建dom的过程中，钩子函数会依次的被调用
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = []
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]])
      }
    }
  }

  // 中间是一大堆的辅助函数，先不看，
  // 直接看最后的返回的 patch
  // 之前的patch： export const patch: Function = createPatchFunction({ nodeOps, modules })
  // 就是返回下面的patch 方法
  // 接受6个参数
  return function patch (oldVnode, vnode, hydrating, removeOnly) {
    // 如果vnode不存在但oldVnode存在，则表示要移除旧的node
    // 那么就调用invokeDestroyHook(oldVnode)来进行销毁
    
    // 这是删除时的逻辑 不走该逻辑
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) invokeDestroyHook(oldVnode)
      return
    }

    let isInitialPatch = false
    const insertedVnodeQueue = []
    // 如果oldVnode不存在，vnode存在，则创建新节点
    // 不走该逻辑
    if (isUndef(oldVnode)) {
      isInitialPatch = true
      createElm(vnode, insertedVnodeQueue)
    } else {
    // nodeType 节点的类型，详细：https://developer.mozilla.org/zh-CN/docs/Web/API/Node/nodeType
      const isRealElement = isDef(oldVnode.nodeType)
      // 新旧节点都存在，并且是同一个节点，调用pathVnode去比较
      // 不走该逻辑
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly)
      } else {
        // 走这里的逻辑
        if (isRealElement) {
          // 如果是一个真实的节点，存在 data-server-rendered属性
          // 示例不是服务端渲染，不走该逻辑
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR)
            hydrating = true
          }
          // 需要用hydrate函数将虚拟DOM和真实DOM进行映射
          // hydrating为false, 不走该逻辑
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true)
              return oldVnode
            } else if (process.env.NODE_ENV !== 'production') {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              )
            }
          }
          // 走这里的逻辑，创建一个空的vnode来替换
          oldVnode = emptyNodeAt(oldVnode)
        }

        // 走到这里的逻辑了
        // oldVnode.elm 是 <div id="app"></div>
        // parentElm 是 body
        const oldElm = oldVnode.elm
        const parentElm = nodeOps.parentNode(oldElm)
        
        // 把vnode 挂载到真实的dom上
        // createElm 定义下下面：
        createElm(
          vnode,
          insertedVnodeQueue,
          oldElm._leaveCb ? null : parentElm,
          nodeOps.nextSibling(oldElm)
        )

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          let ancestor = vnode.parent
          const patchable = isPatchable(vnode)
          while (ancestor) {
            for (let i = 0; i < cbs.destroy.length; ++i) {
              cbs.destroy[i](ancestor)
            }
            ancestor.elm = vnode.elm
            if (patchable) {
              for (let i = 0; i < cbs.create.length; ++i) {
                cbs.create[i](emptyNode, ancestor)
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              const insert = ancestor.data.hook.insert
              if (insert.merged) {
                // start at index 1 to avoid re-invoking component mounted hook
                for (let i = 1; i < insert.fns.length; i++) {
                  insert.fns[i]()
                }
              }
            } else {
              registerRef(ancestor)
            }
            ancestor = ancestor.parent
          }
        }

        // destroy old node
        if (isDef(parentElm)) {
          removeVnodes(parentElm, [oldVnode], 0, 0)
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode)
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch)
    return vnode.elm
  }
}
```

`createPatchFunction` 内部定义了一系列的方法，最后返回了一个 `patch` 方法：

```
export const patch: Function = createPatchFunction({ nodeOps, modules })
```

`patch`方法被赋值给了patch， 也就是 `vm._update` 函数里调用的 `vm.__patch__`。

`patch` 不同平台上走的逻辑肯定不一样，因为在 Web 和 Weex 环境，它们把虚拟 DOM 映射到 “平台 DOM” 的方法是不同的，如果我们自己写patch方法，肯定是下面这种：

```
 if () {
    // 浏览器环境
 } else {
   // weex 环境
 }
```

然后每次更新dom, 都需要走这样一次判断。而vue的作者在这里采用了一个函数柯里化的技巧。

首先，不同平台的 `nodeOps` 和 `modules`是不同的，但是不同平台的 `patch` 的主要逻辑部分是相同的，所以差异化部分是通过参数来区别，都是调用`__patch__` 方法，这样不用每次调用 `patch` 的时候都传递 `nodeOps` 和 `modules` 了，这种编程技巧也非常值得学习。

通过`createPatchFunction`函数，来创建返回一个`patch`函数。

![image-20180717011840276](http://p8cyzbt5x.bkt.clouddn.com/2018-07-16-171840.png)

`patch`接收6个参数：

1. oldVnode: 旧的虚拟节点或旧的真实dom节点
2. vnode: 新的虚拟节点
3. hydrating: 是否要跟真是dom混合, 先不管
4. removeOnly: 特殊flag，用于组件，先不管
5. parentElm:父节点，先不管
6. refElm: 新节点将插入到refElm之前 具体解析看代码注释~抛开调用生命周期钩子和销毁就节点不谈，我们发现代码中的关键在于`sameVnode`、 `createElm` 和 `patchVnode` 方法。



#### sameVnode

判断2个节点，是否是同一个节点

```js
/**
 * 节点 key 必须相同
 * tag、注释、data是否存在、input类型是否相同
 * 如果isAsyncPlaceholder是true，则需要asyncFactory属性相同
 */
function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}
```

#### createElm

```js
function createElm (vnode, insertedVnodeQueue, parentElm, refElm, nested) {
  vnode.isRootInsert = !nested // for transition enter check
  // 用于创建组件，在调用了组件初始化钩子之后，初始化组件，并且重新激活组件。
  // 在重新激活组件中使用 insert 方法操作 DOM
  // 这个逻辑不走
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }

  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  
  // 走这里的逻辑
  if (isDef(tag)) {
    // 错误检测，主要用于判断是否正确注册了component，这个错误还是比较常见
    if (process.env.NODE_ENV !== 'production') {
      if (data && data.pre) {
        inPre++
      }
      if (
        !inPre &&
        !vnode.ns &&
        !(
          config.ignoredElements.length &&
          config.ignoredElements.some(ignore => {
            return isRegExp(ignore)
              ? ignore.test(tag)
              : ignore === tag
          })
        ) &&
        config.isUnknownElement(tag)
      ) {
        warn(
          'Unknown custom element: <' + tag + '> - did you ' +
          'register the component correctly? For recursive components, ' +
          'make sure to provide the "name" option.',
          vnode.context
        )
      }
    }

    // 还记得吗？nodeOps是封装的操作dom的合集
    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      // nodeOps.createElement就是对原生createElement方法的封装
      : nodeOps.createElement(tag, vnode)
    //vnode.elm 就是我们创建的一个dom节点
    setScope(vnode) // 用于为 scoped CSS 设置作用域 ID 属性

    
    // weex处理
    if (__WEEX__) {
      ...
    } else {

      // 用于创建子节点，如果子节点是数组，则遍历执行 createElm 方法.
      // 如果子节点的 text 属性有数据，则使用 nodeOps.appendChild(...) 在真实 DOM 中插入文本内容。
      createChildren(vnode, children, insertedVnodeQueue)
      if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue)
      }
      // insert 用于将元素插入真实 DOM 中
      insert(parentElm,    .elm, refElm)
    }
    ...
  } else if (isTrue(vnode.isComment)) { // 注释
    vnode.elm = nodeOps.createComment(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  } else { // 文本
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  }
}
```

通过以上的注释，我们可以知道：`createElm` 方法的最终目的就是创建真实的 `DOM` 对象



#### patchVnode

```js
function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
  // 如果新老 vnode 相等
  if (oldVnode === vnode) {
    return
  }

  const elm = vnode.elm = oldVnode.elm
  // 异步占位
  if (isTrue(oldVnode.isAsyncPlaceholder)) {
    if (isDef(vnode.asyncFactory.resolved)) {
      hydrate(oldVnode.elm, vnode, insertedVnodeQueue)
    } else {
      vnode.isAsyncPlaceholder = true
    }
    return
  }

  // 复用新老节点被标记为static，新老节点key相同，新 vnode 是克隆所得；新 vnode 有 v-once 的属性
  // 如果新节点没有被克隆，这意味着渲染函数已经被hot-reload-api重置，我们需要做一个适当的重新渲染。
  if (isTrue(vnode.isStatic) &&
    isTrue(oldVnode.isStatic) &&
    vnode.key === oldVnode.key &&
    (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
  ) {
    vnode.componentInstance = oldVnode.componentInstance
    return
  }

  let i
  const data = vnode.data
  // 执行 data.hook.prepatch 钩子
  if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
    i(oldVnode, vnode)
  }

  const oldCh = oldVnode.children
  const ch = vnode.children
  if (isDef(data) && isPatchable(vnode)) {
    // 遍历调用 cbs.update 钩子函数
    for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode)
    // 执行 data.hook.update 钩子
    if (isDef(i = data.hook) && isDef(i = i.update)) i(oldVnode, vnode)
  }
  // 旧 vnode 的 text 选项为 undefined
  if (isUndef(vnode.text)) {
    if (isDef(oldCh) && isDef(ch)) {
      // 新老节点的 children 不同，执行 updateChildren 方法。
      if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly)
    } else if (isDef(ch)) {
      // 旧 vnode children 不存在 执行 addVnodes 方法
      if (isDef(oldVnode.text)) nodeOps.setTextContent(elm, '')
      addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue)
    } else if (isDef(oldCh)) {
      // 新 vnode children 不存在 执行 removeVnodes 方法
      removeVnodes(elm, oldCh, 0, oldCh.length - 1)
    } else if (isDef(oldVnode.text)) {
      // 如果新旧 vnode 都是 undefined，且老节点存在 text，清空文本
      nodeOps.setTextContent(elm, '')
    }
  } else if (oldVnode.text !== vnode.text) {
    // 新老节点文本不同，更新文本内容
    nodeOps.setTextContent(elm, vnode.text)
  }
  if (isDef(data)) {
    // 执行 data.hook.postpatch 钩子，至此 patch 完成
    if (isDef(i = data.hook) && isDef(i = i.postpatch)) i(oldVnode, vnode)
  }
}
```

 



```
function createElm (
  vnode,
  insertedVnodeQueue,
  parentElm,
  refElm,
  nested,
  ownerArray,
  index
) {
  if (isDef(vnode.elm) && isDef(ownerArray)) {
    // This vnode was used in a previous render!
    // now it's used as a new node, overwriting its elm would cause
    // potential patch errors down the road when it's used as an insertion
    // reference node. Instead, we clone the node on-demand before creating
    // associated DOM element for it.
    vnode = ownerArray[index] = cloneVNode(vnode)
  }

  vnode.isRootInsert = !nested // for transition enter check
  if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
    return
  }

  const data = vnode.data
  const children = vnode.children
  const tag = vnode.tag
  if (isDef(tag)) {
    if (process.env.NODE_ENV !== 'production') {
      if (data && data.pre) {
        creatingElmInVPre++
      }
      if (isUnknownElement(vnode, creatingElmInVPre)) {
        warn(
          'Unknown custom element: <' + tag + '> - did you ' +
          'register the component correctly? For recursive components, ' +
          'make sure to provide the "name" option.',
          vnode.context
        )
      }
    }

    vnode.elm = vnode.ns
      ? nodeOps.createElementNS(vnode.ns, tag)
      : nodeOps.createElement(tag, vnode)
    setScope(vnode)

    /* istanbul ignore if */
    if (__WEEX__) {
      // ...
    } else {
      createChildren(vnode, children, insertedVnodeQueue)
      if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue)
      }
      insert(parentElm, vnode.elm, refElm)
    }

    if (process.env.NODE_ENV !== 'production' && data && data.pre) {
      creatingElmInVPre--
    }
  } else if (isTrue(vnode.isComment)) {
    vnode.elm = nodeOps.createComment(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  } else {
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm, refElm)
  }
}
```

`createElm` 的作用是通过虚拟节点创建真实的 DOM 并插入到它的父节点中。 我们来看一下它的一些关键逻辑，`createComponent` 方法目的是尝试创建子组件，这个逻辑在之后组件的章节会详细介绍，在当前这个 case 下它的返回值为 false；接下来判断 `vnode` 是否包含 tag，如果包含，先简单对 tag 的合法性在非生产环境下做校验，看是否是一个合法标签；然后再去调用平台 DOM 的操作去创建一个占位符元素。

```
vnode.elm = vnode.ns
  ? nodeOps.createElementNS(vnode.ns, tag)
  : nodeOps.createElement(tag, vnode)
```

接下来调用 `createChildren` 方法去创建子元素：

```
createChildren(vnode, children, insertedVnodeQueue)

function createChildren (vnode, children, insertedVnodeQueue) {
  if (Array.isArray(children)) {
    if (process.env.NODE_ENV !== 'production') {
      checkDuplicateKeys(children)
    }
    for (let i = 0; i < children.length; ++i) {
      createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i)
    }
  } else if (isPrimitive(vnode.text)) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
  }
}
```

`createChildren` 的逻辑很简单，实际上是遍历子虚拟节点，递归调用 `createElm`，这是一种常用的深度优先的遍历算法，这里要注意的一点是在遍历过程中会把 `vnode.elm` 作为父容器的 DOM 节点占位符传入。

接着再调用 `invokeCreateHooks` 方法执行所有的 create 的钩子并把 `vnode` push 到 `insertedVnodeQueue` 中。

```
 if (isDef(data)) {
  invokeCreateHooks(vnode, insertedVnodeQueue)
}

function invokeCreateHooks (vnode, insertedVnodeQueue) {
  for (let i = 0; i < cbs.create.length; ++i) {
    cbs.create[i](emptyNode, vnode)
  }
  i = vnode.data.hook // Reuse variable
  if (isDef(i)) {
    if (isDef(i.create)) i.create(emptyNode, vnode)
    if (isDef(i.insert)) insertedVnodeQueue.push(vnode)
  }
}
```

最后调用 `insert` 方法把 `DOM` 插入到父节点中，因为是递归调用，子元素会优先调用 `insert`，所以整个 `vnode` 树节点的插入顺序是先子后父。来看一下 `insert` 方法，它的定义在 `src/core/vdom/patch.js` 上。

```
insert(parentElm, vnode.elm, refElm)

function insert (parent, elm, ref) {
  if (isDef(parent)) {
    if (isDef(ref)) {
      if (ref.parentNode === parent) {
        nodeOps.insertBefore(parent, elm, ref)
      }
    } else {
      nodeOps.appendChild(parent, elm)
    }
  }
}
```

`insert` 逻辑很简单，调用一些 `nodeOps` 把子节点插入到父节点中，这些辅助方法定义在 `src/platforms/web/runtime/node-ops.js` 中：

```
export function insertBefore (parentNode: Node, newNode: Node, referenceNode: Node) {
  parentNode.insertBefore(newNode, referenceNode)
}

export function appendChild (node: Node, child: Node) {
  node.appendChild(child)
}
```

其实就是调用原生 DOM 的 API 进行 DOM 操作，看到这里，很多同学恍然大悟，原来 Vue 是这样动态创建的 DOM。

在 `createElm` 过程中，如果 `vnode` 节点如果不包含 `tag`，则它有可能是一个注释或者纯文本节点，可以直接插入到父元素中。在我们这个例子中，最内层就是一个文本 `vnode`，它的 `text` 值取的就是之前的 `this.message` 的值 `Hello Vue!`。

再回到 `patch` 方法，首次渲染我们调用了 `createElm` 方法，这里传入的 `parentElm` 是 `oldVnode.elm` 的父元素， 在我们的例子是 id 为 `#app` div 的父元素，也就是 Body；实际上整个过程就是递归创建了一个完整的 DOM 树并插入到 Body 上。

最后，我们根据之前递归 `createElm` 生成的 `vnode` 插入顺序队列，执行相关的 `insert` 钩子函数，这部分内容我们之后会详细介绍。

## [#](https://ustbhuangyi.github.io/vue-analysis/data-driven/update.html#%E6%80%BB%E7%BB%93)总结

那么至此我们从主线上把模板和数据如何渲染成最终的 DOM 的过程分析完毕了，我们可以通过下图更直观地看到从初始化 Vue 到最终渲染的整个过程。

我们这里只是分析了最简单和最基础的场景，在实际项目中，我们是把页面拆成很多组件的，Vue 另一个核心思想就是组件化。那么下一章我们就来分析 Vue 的组件化过程。