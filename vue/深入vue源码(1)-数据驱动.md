## 如何在浏览器中调试

以一个常见的vue项目为例，如果我们通过`vue-cli`在初始化vue项目的时候，选择了`runtime + compiler` 版本，就会在webpack配置文件中，添加上下面这行代码：

```js
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
    }
  }
```

`resolve.alias`的配置项的作用是，指定vue的依赖是引入`'vue/dist/vue.esm.js'`文件。

如果我在``'vue/dist/vue.esm.js'` 里面打了一个debugger，就可以在google浏览器里面看到了：

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180703_224745.png)





## **数据驱动**

Vue.js 一个核心思想是数据驱动，也就是页面是由数据渲染出来的。我们直接修改数据，无需关注dom, 就可以修改页面的样式之类的。

```js
export default {
  name: 'HelloWorld',
  data () {
    return {
      name: 'dudu'
    }
  },
  mounted () {
     // 为什么我们可以在这里获取到 name
    console.log(this.name)
  }
}
```

上面的代码中，我在data里面定义了一个name变量，为什么会在mounted里面可以访问到呢？

我们接下来深入源码来分析：

我们找到 `node_modules/_vue@2.5.16@vue/src/core/instance/state.js` 里面`initState` 方法：

```js
export function initState (vm: Component) {
  vm._watchers = []
    // vm 指向的是vue的实例
    // vm.$options是我们写的vue的配置项(就是module.export的对象)
  const opts = vm.$options
   // 初始化 props
  if (opts.props) initProps(vm, opts.props)
    // 初始化 methods
  if (opts.methods) initMethods(vm, opts.methods)
    // 如果有 data ，则初始化Data
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

```
  const opts = vm.$options
```

vm指向的就是该vue实例，vm.$options 是我们写的vue代码，如果我们写的vue代码是这样的：

```js
new Vue({
  el:'#app',
  data () {
    return {
      name:'dudu'
    }
  },
  methods: {
    test () {
      
    }
  },
  render (createElement) {
    return createElement('div', {
      atts: {
        id: "test"
      }
    }, this.name + 's')
  }
})
```

则这里的options是这样的：

![image-20180717103428079](http://p8cyzbt5x.bkt.clouddn.com/2018-07-17-023428.png)



上面的代码的逻辑，走到了 `initData`方法来初始化data,  我们找到`initData` 的声明如下：

```js
function initData (vm: Component) {
  // 此时我们的data还是一个方法
  let data = vm.$options.data
  // 判断 vm._data 是否是方法
  data = vm._data = typeof data === 'function'
    // 如果vm._data是方法，则调用getData来拿
    ? getData(data, vm)
    : data || {}
    // 判断data 是否是一个object类型的
  if (!isPlainObject(data)) {
    data = {}
    process.env.NODE_ENV !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    )
  }
  // 遍历data，看是否有重名的
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  observe(data, true /* asRootData */)
}
```

下面是对上面代码的说明：

1.  第4行代码： `typeof data === 'function'` ，判断 `vm._data`是否是 function, 因为vue允许data是一个方法。比如说下面就是推荐的使用方法：

```js
module.export = {
    data () {
        return {
            name: 'dudu'
        }
    }
}
```

如果 data 是一个函数的话，需要使用 getData() 方法来拿。

```js
export function getData (data: Function, vm: Component): any {
  // #7573 disable dep collection when invoking data getters
  // 先不管这个逻辑
  pushTarget()
  try {
     // 其实很简单，就是调用 vm.data()方法，期待会返回一个对象
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, `data()`)
    return {}
  } finally {
    popTarget()
  }
}
```

2.  isPlainObject 是判断是否是一个对象；其实很简单，就是调用 toString 的方法，判断是否等于 `[object Object]`

   ```js
   export function isPlainObject (obj) {
       return Object.prototype.toString.call(obj) === '[object Object]'
   }
   ```

3. 循环遍历data,  看data中有没有定义的字段和method 或者 prop 重名的

   ```js
   let keys = Object.key(data);
   let i = keys.length;
   while(i -- ) {
      keys[i]
   }
   ```

   然后调用 `hasOwn` 方法，hasOwn 方法声明如下：

   ```js
   const hasOwnProperty = Object.prototype.hasOwnProperty;
   function hasOwn (obj, key) {
     return hasOwnProperty.call(obj, key)
   }
   ```

   hasOwnProperty（）就是对 Objet.prototype.hasOwnProperty()的封装。之所以采用call 的方式，是为了防止 hasOwnProperty 被同名的属性名重写。

   我们在vue中声明变量时，不能用$ 和 _ 开头，这个判断是通过isReserved来实现的。

   ```js
   // 判断变量名称是否是 $ 或者 _ 开头
   function isReserved (str) {
     const c = (str + '').charCodeAt(0);
     return c === 0x24 || c === 0x5F
   }
   ```

   

4.  proxy 方法用来代理 `this._data` , 说白了，就是让 `this.name` 实际上访问的是`this._data.name`

   ```js
   const sharedPropertyDefinition = {
     enumerable: true,
     configurable: true,
     get: noop,
     set: noop
   }
   export function proxy (target: Object, sourceKey: string, key: string) {
     sharedPropertyDefinition.get = function proxyGetter () {
       return this[sourceKey][key]
     }
     sharedPropertyDefinition.set = function proxySetter (val) {
       this[sourceKey][key] = val
     }
     Object.defineProperty(target, key, sharedPropertyDefinition)
   }
   ```

   

接下里，我们要弄清楚模板和数据如何渲染成最终的 DOM，至于修改数据如何驱动视图变化，会在之后的章节里里面介绍。

## **new Vue 发生了什么**

从入口代码开始分析，我们先来分析 new Vue 背后发生了哪些事情。我们都知道，new 关键字在 Javascript 语言中代表实例化是一个对象，而 Vue 实际上是一个类，类在 Javascript 中是用 Function 来实现的，来看一下源码，在`src/core/instance/index.js` 中。

```js
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}
```

可以看到 Vue就是一个普通的构造函数。只能通过 new 关键字初始化，然后会调用 this.\_init 方法， 该方法在` src/core/instance/init.js `中定义。

```js
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
```



Vue 初始化主要就干了几件事情，合并配置，初始化生命周期，初始化事件中心，初始化渲染，初始化 data、props、computed、watcher 等等。

在初始化的最后，检测到如果有 el 属性，则调用 vm.\$mount 方法挂载 vm，挂载的目标就是把模板渲染成最终的 DOM，那么接下来我们来分析 Vue 的挂载过程。



## **Vue 实例挂载的实现**

Vue 中我们是通过 `$mount` 实例方法去挂载 `vm`的，`$mount` 方法在多个文件中都有定义，如 `src/platform/web/entry-runtime-with-compiler.js`、`src/platform/web/runtime/index.js`、`src/platform/weex/runtime/index.js`。因为 `$mount` 这个方法的实现是和平台、构建方式都相关的。接下来我们重点分析带 `compiler` 版本的 `$mount` 实现，因为抛开 webpack 的 vue-loader，我们在纯前端浏览器环境分析 Vue 的工作原理，有助于我们对原理理解的深入。



我们找到 $mount方法的定义，在`node_modules/_vue@2.5.16@vue/src/platforms/web/entry-runtime-with-compiler.js`文件里面。

这里的$mount方法做得事情：

1. 清洗一下el, 
2. 清洗一下template,  compileToFunction(template) 来得到render 。$option.render = render 

```js
// 先缓存原来的$mount方法
const mount = Vue.prototype.$mount
// 再重新定义$mount方法
// 之所以再重新定义一个 mount方法，是因为我们分析的是runtime + compiler版本
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  // query很简单，就是封装了一个document.querySelect()
  el = el && query(el)

  // el 不能是html,body等根节点, 因为el会覆盖原有的挂载点，所以body和html肯定不能覆盖呀
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // 下面是关键点了
  // 把template转变成render函数
  if (!options.render) {
    let template = options.template
    // 先清洗一波template
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      template = getOuterHTML(el)
    }
  
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile')
      }
	  // 关键是 调用compileToFunctions方法处理template
      const { render, staticRenderFns } = compileToFunctions(template, {
        shouldDecodeNewlines,
        shouldDecodeNewlinesForHref,
        delimiters: options.delimiters,
        comments: options.comments
      }, this)
      options.render = render
      options.staticRenderFns = staticRenderFns

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
        mark('compile end')
        measure(`vue ${this._name} compile`, 'compile', 'compile end')
      }
    }
  }
   // 现在这个是新的mount方法
   // 用旧的mount方法来挂载 el
  return mount.call(this, el, hydrating)
}
```

下面是对上面代码的解读：

1. query 方法很简单，就是封装了一下 document.querySelect()

   ```js
   export function query (el: string | Element): Element {
     if (typeof el === 'string') {
       const selected = document.querySelector(el)
       if (!selected) {
         process.env.NODE_ENV !== 'production' && warn(
           'Cannot find element: ' + el
         )
         return document.createElement('div')
       }
       return selected
     } else {
       return el
     }
   }
   ```

2. el 不能覆盖body 和HTML

   ```js
   el === document.body || el === document.documentElement
   ```

   因为都是dom节点，可以通过全等来判断是否是同一个节点：

   ```js
   document.querySelector('#id2') === document.body  // true
   document.querySelector('#id1') === document.documentElement // true
   ```

3.  对template 进行处理

   这里为什么会对`template` 进行处理呢？

   无论我们是用单文件` .vue` 方式开发组件，还是写了 `el` 或者 `template` 属性，最终都会转换成 `render` 方法，

   getOuterHTML()  pollyfill

4. 最后是mount.call(this, el, hydrating)，本质调的还是`compileToFunctions` 方法



原先原型上的 `$mount` 方法在 `src/platform/web/runtime/index.js` 中定义，之所以这么设计完全是为了复用，因为它是可以被 `runtime only` 版本的 Vue 直接使用的。

```js
// public mount method
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && inBrowser ? query(el) : undefined
  return mountComponent(this, el, hydrating)
}
```

`$mount` 方法实际上会去调用 `mountComponent` 方法，这个方法定义在 `src/core/instance/lifecycle.js` 文件中：

```js
export function mountComponent (
  vm: Component,
  el: ?Element,
  hydrating?: boolean
): Component {
  vm.$el = el
    // 如果没有render函数，也就是说，template编译成render失败了
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode
    if (process.env.NODE_ENV !== 'production') {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        )
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        )
      }
    }
  }
  callHook(vm, 'beforeMount')
	
	// let + if 声明updateComponent方法
  let updateComponent
  /* istanbul ignore if */
	
	// 不是在生产环境 + 性能打点
  if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
    updateComponent = () => {
      const name = vm._name
      const id = vm._uid
      const startTag = `vue-perf-start:${id}`
      const endTag = `vue-perf-end:${id}`

      mark(startTag)
      const vnode = vm._render()
      mark(endTag)
      measure(`vue ${name} render`, startTag, endTag)

      mark(startTag)
      vm._update(vnode, hydrating)
      mark(endTag)
      measure(`vue ${name} patch`, startTag, endTag)
    }
  } else {
    updateComponent = () => {
    	// 去掉打点，本质是这一句话
      vm._update(vm._render(), hydrating)
    }
  }


  new Watcher(vm, updateComponent, noop, null, true)
  hydrating = false

	// vm.$vnode 表示 Vue 实例的父虚拟 Node，所以它为 Null 则表示当前是根 Vue 的实例。
  if (vm.$vnode == null) {
    vm._isMounted = true
    callHook(vm, 'mounted')
  }
  return vm
}
```

1. 如果没有render函数，说明编译失败了，会报错。这个坑我曾经就遇到过，当时花了很长的时间去排查，因为我本地开发使用的是 runtime + compiler 版本的，所以写了 `template` 也会被编译成 `render`函数，但是线上的vue版本是 runtime版本的，于是就报错了。
2. 上面的代码本质就是一句话：`vm._update(vm._render(), hydrating)` 



上面的代码中，最核心的是 `vm._render` 和 `vm._update`, 我们下面来看这两个方法。



## vue._render

Vue 的 `_render` 方法是实例的一个私有方法，它用来把实例渲染成一个虚拟 Node。它的定义在 `src/core/instance/render.js` 文件中：

```js
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
      // 从vm.$options 中拿到 render 函数
      // 这是因为 render 函数有可能是用户自己写的，也有可能是编译生成的
    const { render, _parentVnode } = vm.$options

    // reset _rendered flag on slots for duplicate slot check
    if (process.env.NODE_ENV !== 'production') {
      for (const key in vm.$slots) {
        // $flow-disable-line
        vm.$slots[key]._rendered = false
      }
    }

    if (_parentVnode) {
      vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject
    }

  
    vm.$vnode = _parentVnode
    let vnode
    try {
       // call 方法的第一个参数是当前上下文，
       // vm._renderProxy在生产环境下就是vm, 也就是this, 在开发环境可能是一个proxy对象
      vnode = render.call(vm._renderProxy, vm.$createElement)
    } catch (e) {
      handleError(e, vm, `render`)
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== 'production') {
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e)
          } catch (e) {
            handleError(e, vm, `renderError`)
            vnode = vm._vnode
          }
        } else {
          vnode = vm._vnode
        }
      } else {
        vnode = vm._vnode
      }
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }
```

下面是对上面代码的解读：

1. render 可以是编译出来的，也可以是用户自己写的。下面的代码调用了 render 方法。

   ```
   vnode = render.call(vm._renderProxy, vm.$createElement)
   ```

   上面的代码中，render 函数在调用的时候，会传入一个 creatElement 方法。如果你之前写过 render 函数的话，就会对该方法有印象。

   ```js
   new Vue({
     el: '#app',
     data () {
       return {
         name: 'hhahah'
       }
     },
     render (createElement) {
       // 生成的节点会完全的覆盖之前的节点，el不能是body 或者 html
       return createElement('div', {
         attrs: {
           id: 'app1'
         }
       }, this.name)
     }
   })
   ```

    

   

这段代码最关键的是 `render` 方法的调用，render 方法的第二个参数是 createElement 方法，该方法在 Vue 的官方文档中被介绍了，那么结合之前的例子：

```
<div id="app">
  {{ message }}
</div>
```

相当于我们编写如下 `render` 函数： 

```vue
render: function (createElement) {
  return createElement('div', {
     attrs: {
        id: 'app'
      },
  }, this.message)
}
```



再回到 `_render` 函数中的 `render` 方法的调用：

```
vnode = render.call(vm._renderProxy, vm.$createElement)
```

可以看到，`render` 函数中的 `createElement` 方法就是 `vm.$createElement` 方法：

```js
export function initRender (vm: Component) {
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
}
```

实际上，`vm.$createElement` 方法定义是在执行 `initRender` 方法的时候，可以看到除了 `vm.$createElement` 方法，还有一个 `vm._c` 方法，它是被模板编译成的 `render` 函数使用，而 `vm.$createElement` 是用户手写 `render` 方法使用的， 这俩个方法支持的参数相同，并且内部都调用了 `createElement` 方法.



render 方法的第一个参数是 `_renderProxy` 方法，那么这个方法是在哪里被定义的呢？

在 `/src/core/instance/init.js` 文件里面，我们可看到下面的代码：

```js
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
```

如果是在生产环境，`vm._renderProxy` 就是 `vm`，也就是`this`。如果是在开发环境，则是调用了`initProxy` 的方法， `initProxy` 方法是定义在 `src/core/instance/proxy.js` 文件中:

```js
  initProxy = function initProxy (vm) {
    // 判断浏览器是否支持 Proxy
    if (hasProxy) {
      // determine which proxy handler to use
      const options = vm.$options
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
```

在我们这个case下，会调用 new Proxy 方法，传入 hasHandler 方法，hasHandler 方法定义如下：

```js
  const hasHandler = {
    has (target, key) {
      const has = key in target
      // isAllowed 不能是js中的关键字，不能是下划线_开头的
      const isAllowed = allowedGlobals(key) || key.charAt(0) === '_'
      // 如果找不到，或者命名冲突了js中的关键字或者下划线_开头的，则发出警告
      if (!has && !isAllowed) {
        warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }
```



接下来，我们进入下一节了解 virtual dom 的相关知识。