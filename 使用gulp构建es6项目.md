## 什么是gulp
理想中前端开发流程是
>1. 写业务代码，es6, sass
>2. 处理成浏览器认识的
>3. 刷新浏览器

后两步（也就是 2 和 3）应该是自动化的, 交由构建工具来做, gulp就是一种流行的构建工具。
开发工作中痛苦耗时的任务有哪些？
>1. 用 es6，typescript编译成javascript
>2. 用 scss，less编译成css
>3. 检查代码，单元测试和集成测试
>4. 开发环境sourcemaps 的话调试，热更新
>5. 生产环境中代码需要压缩合并资源


这些痛苦的过程，gulp可以帮我们自动化的完成

## 如何使用gulp
全局安装和本地安装
```
npm install gulp -g 
npm install gulp --save-dev
```
根目录下新建gulpfile.js文件，是gulp的配置文件
>gulpfile.js大小写不敏感，最好放在根目录下，否则需要`gulp yourtask --gulpfile yourpath`来指定
>

### 最简单的gulp任务
gulpfile.js里面就是gulp脚本
```
// 引入gulp脚本
var gulp = require('gulp')
// 创建一个sayhi的任务
gulp.task('sayhi', ()=>{
  console.log('hi')
})
```
然后在命令行里面执行`gulp sayhi`的命令就可以了。

### gulpfile.js和es6的关系
gulpfile.js里面不能写es6
gulp3.9版本之后可以和babel配合在gulpfile.babel.js里面写es6

1、 安装babel
```
cnpm install babel-core babel-preset-es2015 --save-dev
```
2、 创建.babelrc文件
```
touch .babelrc
```
```
注意是JSON格式
{
  "presets":["es2015"]
}
```
3. 创建gulpfile.babel.js (之前创建的是gulpfile.js, 需要把该文件删除)
```
// 引入gulp脚本
import gulp from 'gulp'
// 创建一个sayhi的任务
gulp.task('sayhi', ()=>{
  console.log('hi')
})
```
到现在，我们就可以在gulpfile.babel.js里面开心的使用es6的语法了

### 稍微难一点的gulp任务
通常会有两个特定的gulp方法和一些gulp插件
gulp.src()是打开路径的文件，gulp.dest()是把文件放在指定路径
```
gulp.task('task-name', ()=>{
  return gulp.src('source-files')
  .pipe(gulpPlugin())
  .pipe(gulp.dest('destination'))
})
```

下面以sass文件的编译为例：
安装gulp-sass
```
cnpm install gulp-sass --save-dev
```

新建测试用的sass文件
```
// app/sass/styles.scss
.testing {
  width: percentage(5/7)
}
```
编写脚本
```
import gulp from 'gulp'
import sass from 'gulp-sass'
gulp.task('css', ()=> {
  return gulp.src('app/css/styles.scss')
  .pipe(sass())
  .pipe(gulp.dest('app/css'))
})
```
`app/css/styles.scss`目录里就会被编译到gulp.dest('app/css')里面

### Node中的通配符
使用通配符，计算机检查文件名和路径进行匹配。
常用的4种匹配模式：
`*.scss`：*号匹配当前目录任意文件
`**/*.scss`：匹配当前目录及其子目录下的所有scss文件。
`!not-me.scss`：！号移除匹配的文件，这里将移除not-me.scss
`*.+(scss|sass)`：+号后面会跟着圆括号，里面的元素用|分割，匹配多个选项。这里将匹配scss和sass文件。

上面的例子改造一下：
```
gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss') 
    .pipe(sass())
    .pipe(gulp.dest('app/css'))
})
```

### 监听文件
Gulp提供watch方法给我们，语法如下：
```
gulp.watch('file-to-watch',['tasks', 'to', 'run'])
```
我们把watch方法放在任务里面：
```
gulp.task('watch', ()=>{
  gulp.watch('app/**/*.scss',['css'])
})
```
有了监听，每次修改文件，Gulp都将自动为我们执行任务。

### 自动刷新浏览器
Browser Sync 帮助我们搭建简单的本地服务器并能实时刷新浏览器
```
npm install browser-sync --save-dev
```
这里没有gulp-前缀，因为browser-sync支持Gulp，所以没有人专门去搞一个给Gulp用哈哈
我们创建一个broswerSync任务，我们需要告知它，根目录在哪里。

```
import browserSync from 'browser-sync'
gulp.task('browserSync', ()=> {
  browserSync({
    server: {
      baseDir: 'app'
    }
  })
})
```
我们稍微修改一下之前的代码，让每次css文件更改都刷新一下浏览器：

```
gulp.task('sass', function() {
  return gulp.src('app/scss/**/*.scss') // Gets all files ending with .scss in app/scss
    .pipe(sass())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
});
```
我们可以在watch任务之前告知Gulp，先把browserSync和Sass任务执行了再说。

```
gulp.task('watch', ['array', 'of', 'tasks', 'to', 'complete','before', 'watch'], function (){
  // ...
})
```

应用下来是这样：
```
gulp.task('watch', ['browserSync', 'sass'], function (){
  gulp.watch('app/scss/**/*.scss', ['sass']);
  // Other watchers
})
```

现在你执行gulp watch命令，在执行完browserSync和Sass，才会开始监听。


### 优化CSS和JavaScript文件
我们需要想到：压缩，拼接。也就是减少体积和HTTP次数
开发者面临的主要问题是很难按照正确的顺序合并文件。

gulp-useref会将多个文件拼接成单一文件，并输出到相应目录。

```
<!-- build:<type> <path> -->
... HTML Markup, list of script / link tags.
<!-- endbuild -->
```
`type` 可以是js,css,或者remove。如果你设为remove,Gulp将不会生成文件。

`path`指定产出路径。

我们想最终产出main.min.js。可以这样写：
```
<!--build:js js/main.min.js -->
<script src="js/lib/a-library.js"></script>
<script src="js/lib/another-library.js"></script>
<script src="js/main.js"></script>
<!-- endbuild -->
```

我们来安装gulp-useref。

```
npm install gulp-useref --save-dev
```
引用
```
var useref = require('gulp-useref');
```
使用也非常简单
```
gulp.task('useref', function(){

  return gulp.src('app/*.html')
        .pipe(useref())
        .pipe(gulp.dest('dist'));
});
```

执行useref命令，Gulp将合并三个script标签成一个文件，并保存到dist/js/main.min.js。

合并完之后，我们再来压缩。使用gulp-uglify插件。
```
npm install gulp-uglify --save-dev
```
使用
```
// Other requires...
var uglify = require('gulp-uglify');
gulp.task('useref', function(){
  return gulp.src('app/*.html')
    .pipe(uglify()) // Uglifies Javascript files
    .pipe(useref())
    .pipe(gulp.dest('dist'))
});
```

注意：执行完useref后，html中的script路径将只剩下main.min.js。

![](leanote://file/getImage?fileId=5aefadcb6ef9100865000003)

gulp-useref同样可以用在css上。除了压缩，需要区分，其它内容同js一样。所以我们使用gulp-if来做不同处理。

使用gulp-minify-css压缩css。
```
npm install gulp-if gulp-minify-css --save-dev
```

```
var gulpIf = require('gulp-if');
var minifyCSS = require('gulp-minify-css');

gulp.task('useref', function(){

  return gulp.src('app/*.html')
    // Minifies only if it's a CSS file
    .pipe(gulpIf('*.css', minifyCSS()))
    // Uglifies only if it's a Javascript file
    .pipe(gulpIf('*.js', uglify()))
    .pipe(useref())
    .pipe(gulp.dest('dist'))
});

```

### 优化图片
使用gulp-imagemin插件。

```
npm install gulp-imagemin --save-dev
```

```
var imagemin = require('gulp-imagemin');
gulp.task('images', function(){
  return gulp.src('app/images/**/*.+(png|jpg|gif|svg)')
  .pipe(imagemin())
  .pipe(gulp.dest('dist/images'))
});
```

### 清理生成文件
我们不想旧文件掺杂进来，使用del
```
npm install del --save-dev
```

```
var del = require('del');
gulp.task('clean', function() {
  del('dist');
});
```
但是我们又不想图片被删除（图片改动的几率不大）,启用新的任务。
```
gulp.task('clean:dist', function(callback){
  del(['dist/**/*', '!dist/images', '!dist/images/**/*'], callback)
});
```

### 组合Gulp任务
废话了这么多，我们主要有两条线路。

第一条是开发过程，我们便以Sass，监听文件，刷新浏览器。

第二条是优化，我们优化CSS,JavaScript,压缩图片，并把资源从app移动到dist。

开发过程上面已经写好了，下面我们主要来写优化过程

```
gulp.task('build', [`clean`, `sass`, `useref`, `images`, `fonts`], function (){
  console.log('Building files');
})
```
但是这样Gulp会同时触发[]的事件。我们要让clean在其他任务之前完成, 需要用到run-sequence
```
var runSequence = require('run-sequence');

gulp.task('task-name', function(callback) {
  runSequence('task-one', 'task-two', 'task-three', callback);
});
```

执行task-name时，Gulp会按照顺序执行task-one,task-two,task-thre。
RunSequence也允许你同时执行多个任务。

```
gulp.task('task-name', function(callback) {
  runSequence('task-one', ['tasks','two','run','in','parallel'], 'task-three', callback);
});
```

```
gulp.task('build', function (callback) {
  runSequence('clean:dist',
    ['sass', 'useref', 'images', 'fonts'],
    callback
  )
})
```


### 小结
上面的的内容搭建了一个基本的Gulp工作流。还有更精彩的内容等着你去开发。这里提供些插件：
开发过程：

使用 Autoprefixer，你不再需要写CSS浏览器内核前缀
增加 Sourcemaps，让你更方便的调试Sass,coffeescript
使用 sprity创建精灵图
gulp-changed 只允许通过修改的文件
Babel 或 Traceur 写ES6
Browserify , webpack , jspm 模块化JavaScript
Handlebars ,Swing 模块化Html
require-dir 分割gulpfile成多个文件
gulp-moderinizr 自动生成Modernizr脚本
优化：

unCSS 移除多余的CSS
CSSO 更深入地优化CSS
Critical 生成行内CSS
除了开发和优化过程，你可以使用gulp-jasmine写JavaScript单元测试，甚至使用gulp-rync直接部署dist文件到生产环境。


接下来是使用gulp更大型的一个项目：
假设我们的项目目录为：

# 项目目录

```
-- es6-gulp     项目的根目录
    -- app      前端业务代码
        -- js
            -- class 类目录
                -- index 
        -- css 
        -- views  模板目录
            -- error.ejs
            -- index.ejs (ejs)
    -- server   服务器代码
        -- 使用express来创建
    -- tasks    自动化构建工具
        -- util
             -- args

```

在server目录下，运行 `express -e . ` `cd install`, 就可以初始化服务器的目录啦

到目前为止，我们已经创建了app（前端代码）、server（服务器代码）、tasks(前端构建)

### 创建并配置package.json
在根目录下，运行npm init命令，生成package.json文件
### 创建.babelrc 
在根目录下，运行touch .babelrc, 生成babel的配置文件
### 创建gulp文件
在根目录下，运行`touch gulpfile.babel.js`, 生成gulp文件。
> gulp官网上建议是`gulpfile.js`, 我们这里`gulpfile.babel.js`的原因是该文件我们使用es6的语法编写，如果是运行`touch gulpfile.js`, 会进行报错

截止现在，我们的准备工作已经做好了。

### 编写脚手架工具

创建tasks/utils/args.js文件，处理命令行内容
```
import yargs from 'yargs'

const args = yargs
		// 命令行中是否有production参数 区分是否是开发环境
		.options('production', {
			boolean: true,
			default: false,
			describe: ' '
		})
		// 是否监听文件
		.options('watch', {
			boolean: true,
			default: false,
			describe: ''
		})
		// will autoly create the log files
		.options('verbose',{
			boolean: true,
			default: false,
			describe: ''
		})
		.options('sourcemaps',{
			describe:'force the creation of sourcemap'
		})
		.options('port',{
			string: true,
			default: 8080,
			describe: "watch the port"
		})
		.argv
```

使用watch模式可以更高效的开发，监听到改动就自动执行任务，但是如果过程中遇到错误，gulp就会报错并终止watch模式，必须重新启动gulp，简直神烦！
利用gulp-plumber可以实现错误自启动，这样就能开心的在watch模式下开发且不用担心报错了。
```
gulp.task('scripts', ()=>{
	// gulp.src是打开目录的文件
	return gulp.src(['app/js/index.js'])
		//  处理错误逻辑，集中处理错误
		.pipe(plumber({
			errorHandle: function(){

			}
		}))
		// 对文件重新命名
		.pipe(named())
		// 进行编译, 借助webpack的功能gulpwebpack, webpack - module - loaders
		.pipe(gulpwebpack({
			module:{
				loaders:[
						{
							test: /\.js$/,
							loader: 'babel'
						}
						],
			}
		}), null, (err, stats) => {
			log('finished ')
		})
		// 编译完了放在哪里 gulp.dest()api 放在server里面
		.pipe(gulp.dest('server/publick/js'))
		// 混淆压缩,先拷贝一份重命名
		.pipe(rename({
			basename: 'cp',
			extname: '.min.js'
		}))
		.pipe(uglify(
				{
					compress:{properties: false},
					output:{'quoto_keys': true}
				}
				))
		.pipe(gulp.dest('server/public/js'))
		// 监听热更新
		.pipe(gulpif(args.watch, livereload()))
	
})
```

接下是监听编译模板

```
import gulp from 'gulp'
import gulpif from 'gulp-if'
import livereload from 'gulp-livereload'
import args from './util/args'

gulp.task('pages', ()=>{
	// 监听app 目录下的所有的ejs
	return gulp.src('app/**/*.ejs')
			// 拷贝到 server的目录下
			.pipe.dest('server')
			// 热更新
			.pipe(gulpif(args.watch, livereload()))
})
```

接下来是监听css文件
```
import gulp from 'gulp'
import gulpif from 'gulp-if'
import livereload from 'gulp-livereload'
import args from './util/args'

gulp.task('css', () => {
	return gulp.src('app/**/*.css')
			.pipe(gulp.dest('server/public'))
})
```

构建服务器脚本
```
import gulp from 'gulp'
import gulpif from 'gulp-if'
// 启动服务器
import liveserver from 'gulp-live-server'

import args from './util/args'

gulp.task('server',()=> {
	if(!args.watch) return cb()
	// 创建一个服务器
	var server = liveserver.new(['--harmony','server/bin/www'])
	server.start()
	
//	实现浏览器的自动刷新
	gulp.watch(['server/public/**/*.js', 'server/views/**/*.ejs'], function (file) {
		// 通知服务器做响应的改变
		server.notify.apply(server, [file])
	})
	
	gulp.watch(['server/routes/**/*.js','server/app.js'], function () {
		server.start.bind(server)()
	})
})
```

接下来，我们需要让所有的任务都自动化，app是我们前端的原始目录，如何让我们app下的文件发生了变化，自动写入到public的目录下面呢
```
import gulp from 'gulp'
import gulpif from 'gulp-if'
import gutil from 'gulp-util'
import args from './util/args'

gulp.task('browser', (cb) => {
	if(!args.watch) return cb()
	// 第一个参数指定监听的目录，第二个参数指定执行的脚本
	gulp.watch('app/**/*.js', ['scripts'])
	gulp.watch('app/**/*.css', ['css'])
	gulp.watch('app/**/*.ejs', ['pages'])
	
})
```

同时，我们还需要要一个清空指定目录文件的脚本
```
import gulp from 'gulp'
import args from './util/args'
import def from 'del'

gulp.task('clean', ()=>{
	return del(['server/public','server/views'])
	
})
```

build.js把任务都关联起来，处理任务之间的先后顺序，server.js启动之前，pages.js和script.js必须先执行。
```
import gulp from 'gulp'
import gulpSequence from 'gulp-sequence'

// serve 一定要放在最后面
gulp.task('build', gulpSequence('clean','css','pages','scripts',['browser','serve']))
```

`gulp scripts`这个命令是执行名为scripts的gulp脚本，如果`gulp` 不指定脚本，则是执行default这个gulp脚本
```
import gulp from 'gulp'

gulp.task('default', ['build'])
```

