HMR 全称是 Hot Module Replacement，即模块热替换。

# HMR配置
需要提前安装`webpack-dev-server`, 需要两个插件：NamedModulesPlugin 、HotModuleReplacementPlugin

webpack的热更新竟然不能开箱即用，差评！

# HMR的原理
webpack 内部运行时，会维护一份用于管理构建代码时各个模块之间交互的表数据，webpack 官方称之为 Manifest，其中包括入口代码文件和构建出来的 bundle 文件的对应关系。可以使用 WebpackManifestPlugin 插件来输出这样的一份数据。...


