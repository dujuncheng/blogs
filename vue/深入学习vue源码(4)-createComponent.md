## 前言

上一章我们在分析 `createElement` 的实现的时候，它最终会调用 `_createElement` 方法，其中有一段逻辑是对参数 `tag` 的判断，如果是一个普通的 html 标签，像上一章的例子那样是一个普通的 div，则会实例化一个普通 VNode 节点，否则通过 `createComponent` 方法创建一个组件 VNode。

```
if (typeof tag === 'string') {
  // 当tag类型是 string的逻辑
} else {
  // direct component options / constructor
  vnode = createComponent(tag, data, context, children)
}
```

在我们这一节,  为了模拟渲染组件的状态，我们的vue的配置对象的代码如下：

```
import page from './components/page.vue'

new Vue({
  el:'#app',
  data () {
    return {
      name:'dudu'
    }
  },
  render (createElement) {
    return createElement(page)
  }
})
```

本文下面的部分都是基于该代码的讲解：



## createComponent

所以接下来我们来看一下 `createComponent` 方法的实现，它定义在 `src/core/vdom/create-component.js` 文件中：

```js
export function createComponent (
  Ctor: Class<Component> | Function | Object | void,
  data: ?VNodeData,
  context: Component,
  children: ?Array<VNode>,
  tag?: string
): VNode | Array<VNode> | void {
  if (isUndef(Ctor)) {
    return
  }

  const baseCtor = context.$options._base

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    // extend() 方法是构建一个Vue构造函数的子类，会在下面着重介绍
    // 返回一个Vue的子类方法
    Ctor = baseCtor.extend(Ctor)
  }

  // 如果不是方法，则报错
  if (typeof Ctor !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      warn(`Invalid Component definition: ${String(Ctor)}`, context)
    }
    return
  }

  // 下面的逻辑是处理异步组件，暂时先不看
  let asyncFactory
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context)
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {}

  // 在子类构造器创建的时候，可能子类构造器的option会被全局的mixin影响
  resolveConstructorOptions(Ctor)

  // transform component v-model data into props & events
  // 此时先不看这里的代码
  if (isDef(data.model)) {
    transformModel(Ctor.options, data)
  }

  // extract props
  // 此时先不看这里的代码
  const propsData = extractPropsFromVNodeData(data, Ctor, tag)

  // functional component
  // 此时先不看这里的代码
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  const listeners = data.on
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    const slot = data.slot
    data = {}
    if (slot) {
      data.slot = slot
    }
  }

  // install component management hooks onto the placeholder node
  // 这里是重点，要特别关注
  installComponentHooks(data)

  // return a placeholder vnode
  const name = Ctor.options.name || tag
  const vnode = new VNode(
    `vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
    data, undefined, undefined, undefined, context,
    { Ctor, propsData, listeners, tag, children },
    asyncFactory
  )

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  if (__WEEX__ && isRecyclableComponent(vnode)) {
    return renderRecyclableComponentTemplate(vnode)
  }

  return vnode
}
```

可以看到，`createComponent` 的逻辑也会有一些复杂，但是分析源码比较推荐的是只分析核心流程，分支流程可以之后针对性的看，所以这里针对组件渲染这个 case 主要就 3 个关键步骤：

1. 构造子类构造函数
2. 安装组件钩子函数
3. 实例化 `vnode`。

## 构造子类构造函数

```js
const baseCtor = context.$options._base

// 把一个普通的对象转化为 constructor
// 传入一个组件对象
if (isObject(Ctor)) {
Ctor = baseCtor.extend(Ctor)
}
```

在这里 `baseCtor` 是在上面第一行被声明的，代码如下：w

```js
// context是当前上下文，也就是当前的vue实例：vm
// options 被经过了合并，增加了_base属性

var baseCtor = context.$options._base;
```

`context` 就是当前上下文，也就是vue实例。vue 实例的 $options 属性是在下面被定义的：

```js
vm.$options = mergeOptions(
  // vm.constructor指向的是Vue构造函数
  resolveConstructorOptions(vm.constructor),
  options || {},
  vm
)
```

通过mergeOptions方法，合并了三个参数到了 vm.$options 属性上。这三个参数分别为：

1. 调用 resolveConstructorOptions （Vue）方法的返回值
2. options，这个是我们自己写的配置对象，在这个案例中，options对象只有data, el ,  和 render 属性
3. vm, 这个是vm的实例，因为此时刚进入_init 方法，因此 vm 身上的属性并不多

第一个参数 resolveConstructorOptions 方法的定义如下，其实就是返回了 Vue构造函数的 options 属性

```js
function resolveConstructorOptions (Ctor) {
  // Ctor就是传入的Vue构造函数
  // Vue构造函数的私有属性options
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}
```

options 对象的快照如下：

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180718_161315.png)



Vue本质是构造函数，构造函数也是对象，因此构造函数也可以有自己的私有属性， Vue构造函数的私有属性options的`_base`指向的是Vue构造函数自身。`_base ` 定义如下：

```JS
Vue.options._base = Vue
```

`mergeOptions`  的三个参数已经介绍完了，`mergeOptions` 函数的实现我们会在后续章节中具体分析，现在只需要理解它的功能是把传入的对象合并，合并到 `vm.$options` 上。

在了解了 `baseCtor` 指向了 Vue 构造函数本身之后，我们来看一下 `Vue.extend` 函数，`Vue.extend` 是Vue构造函数的静态方法，定义在 `src/core/global-api/extend.js` 中。

```js
/**
 * Class inheritance
 */
Vue.extend = function (extendOptions: Object): Function {
  extendOptions = extendOptions || {}
  // 这里的this 就是 Vue构造函数
  const Super = this
  // Vue构造函数的cid
  const SuperId = Super.cid
  // extendOptions 是导入的组件，本质上就是供extend 使用的options
  const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
  // 导入的对象会有一个_Ctor 属性存放 Vue 构造函数的Id, 缓存策略
  if (cachedCtors[SuperId]) {
    return cachedCtors[SuperId]
  }

  // name 是我们在组件内声明的name属性，用来标识组件的名称
  const name = extendOptions.name || Super.options.name
  if (process.env.NODE_ENV !== 'production' && name) {
    // 检测组件的name是否为有效值
    // 必须是字母开头，同时不能是原生的html标签
    validateComponentName(name)
  }
  // 在这里声明了子构造器
  const Sub = function VueComponent (options) {
    this._init(options)
  }
  // 子构造器是继承了父构造器的
  Sub.prototype = Object.create(Super.prototype)
  // 子构造器需要重写一下 constructor
  Sub.prototype.constructor = Sub
  // 子构造器的 cid 
  Sub.cid = cid++
  // 子构造器的 option 是父亲构造器的option 和 导入组件
  Sub.options = mergeOptions(
    Super.options,
    extendOptions
  )
  Sub['super'] = Super

  // For props and computed properties, we define the proxy getters on
  // the Vue instances at extension time, on the extended prototype. This
  // avoids Object.defineProperty calls for each instance created.
  if (Sub.options.props) {
    initProps(Sub)
  }
  if (Sub.options.computed) {
    initComputed(Sub)
  }

  // 继承 静态方法
  Sub.extend = Super.extend
  Sub.mixin = Super.mixin
  Sub.use = Super.use

  // create asset registers, so extended classes
  // can have their private assets too.
  ASSET_TYPES.forEach(function (type) {
    Sub[type] = Super[type]
  })
  // enable recursive self-lookup
  if (name) {
    Sub.options.components[name] = Sub
  }

  // keep a reference to the super options at extension time.
  // later at instantiation we can check if Super's options have
  // been updated.
  
  // superOptions 是父类的Vue的配置对象
  Sub.superOptions = Super.options
  // extendOptions 是自己的Vue的配置对象
  Sub.extendOptions = extendOptions
  // Sub.options 是父类Vue的配置对象 merge 自己的 Vue的配置对象
  // 深拷贝
  Sub.sealedOptions = extend({}, Sub.options)

  // cache constructor
  cachedCtors[SuperId] = Sub
  return Sub
}
```

`Vue.extend` 的作用就是构造一个 `Vue` 的子类，它使用一种非常经典的原型继承的方式把一个纯对象转换一个继承于 `Vue` 的构造器 `Sub` 并返回，然后对 `Sub` 这个对象本身扩展了一些属性，如扩展 `options`、添加全局 API 等；并且对配置中的 `props` 和 `computed` 做了初始化工作；最后对于这个 `Sub` 构造函数做了缓存，避免多次执行 `Vue.extend` 的时候对同一个子组件重复构造。

这样当我们去实例化 `Sub` 的时候，就会执行 `this._init` 逻辑再次走到了 `Vue` 实例的初始化逻辑

```
const Sub = function VueComponent (options) {
  this._init(options)
}
```

## 安装组件钩子函数

```js
// install component management hooks onto the placeholder node
installComponentHooks(data)
```

我们之前提到 Vue.js 使用的 Virtual DOM 参考的是开源库 [snabbdom](https://github.com/snabbdom/snabbdom)，它的一个特点是在 VNode 的 patch 流程中对外暴露了各种时机的钩子函数，方便我们做一些额外的事情，Vue.js 也是充分利用这一点，在初始化一个 Component 类型的 VNode 的过程中实现了几个钩子函数：

```
const componentVNodeHooks = {
  init (vnode: VNodeWithData, hydrating: boolean): ?boolean {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      const mountedNode: any = vnode // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode)
    } else {
      const child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance
      )
      child.$mount(hydrating ? vnode.elm : undefined, hydrating)
    }
  },

  prepatch (oldVnode: MountedComponentVNode, vnode: MountedComponentVNode) {
    const options = vnode.componentOptions
    const child = vnode.componentInstance = oldVnode.componentInstance
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    )
  },

  insert (vnode: MountedComponentVNode) {
    const { context, componentInstance } = vnode
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true
      callHook(componentInstance, 'mounted')
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance)
      } else {
        activateChildComponent(componentInstance, true /* direct */)
      }
    }
  },

  destroy (vnode: MountedComponentVNode) {
    const { componentInstance } = vnode
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy()
      } else {
        deactivateChildComponent(componentInstance, true /* direct */)
      }
    }
  }
}

const hooksToMerge = Object.keys(componentVNodeHooks)

function installComponentHooks (data: VNodeData) {
  const hooks = data.hook || (data.hook = {})
  for (let i = 0; i < hooksToMerge.length; i++) {
    const key = hooksToMerge[i]
    const existing = hooks[key]
    const toMerge = componentVNodeHooks[key]
    if (existing !== toMerge && !(existing && existing._merged)) {
      hooks[key] = existing ? mergeHook(toMerge, existing) : toMerge
    }
  }
}

function mergeHook (f1: any, f2: any): Function {
  const merged = (a, b) => {
    // flow complains about extra args which is why we use any
    f1(a, b)
    f2(a, b)
  }
  merged._merged = true
  return merged
}
```

整个 `installComponentHooks` 的过程就是把 `componentVNodeHooks` 的钩子函数合并到 `data.hook`中，在 VNode 执行 `patch` 的过程中执行相关的钩子函数，具体的执行我们稍后在介绍 `patch` 过程中会详细介绍。这里要注意的是合并策略，在合并过程中，如果某个时机的钩子已经存在 `data.hook` 中，那么通过执行 `mergeHook` 函数做合并，这个逻辑很简单，就是在最终执行的时候，依次执行这两个钩子函数即可。

## 实例化 VNode

```
const name = Ctor.options.name || tag
const vnode = new VNode(
`vue-component-${Ctor.cid}${name ? `-${name}` : ''}`,
data, undefined, undefined, undefined, context,
{ Ctor, propsData, listeners, tag, children },
asyncFactory
)
return vnode
```

最后一步非常简单，通过 `new VNode` 实例化一个 `vnode` 并返回。需要注意的是和普通元素节点的 `vnode` 不同，组件的 `vnode` 是没有 `children` 的，这点很关键，在之后的 `patch` 过程中我们会再提。

## [#](https://ustbhuangyi.github.io/vue-analysis/components/create-component.html#%E6%80%BB%E7%BB%93)总结

这一节我们分析了 `createComponent` 的实现，了解到它在渲染一个组件的时候的 3 个关键逻辑：构造子类构造函数，安装组件钩子函数和实例化 `vnode`。`createComponent` 后返回的是组件 `vnode`，它也一样走到 `vm._update` 方法，进而执行了 `patch` 函数，我们在上一章对 `patch` 函数做了简单的分析，那么下一节我们会对它做进一步的分析。

 