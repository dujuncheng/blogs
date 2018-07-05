先上结论：

1. 费力优化选择符是无用的，大部分的选择符的耗时的差异都差不多，最差和最优的选择器之间只相差10ms
2. 大量无用的css样式会造成性能问题
3. 如果我们维护一个很多人接手过的css样式，使用[**uncss**](https://github.com/uncss/uncss)去自动化的清除掉没有用过的样式
4. 避免使用耗时的 css 样式





# 不同的选择器，匹配的效率差距不大

我们用一个有1000个DOM节点的页面来测试，分别在5个浏览器中尝试以下20种匹配器：

```
	1. Data Attribute (unqualified)
	*/
	[data-select] {
		color: red;
	}

	/*
		2. Data Attribute (qualified)
	

	a[data-select] {
		color: red;
	}
	*/
	

	/*
		3. Data Attribute (unqualified with value)
	

	[data-select="link"] {
		color: red;
	}
	*/


	/*
		4. Data Attribute (qualified with value)
	

	a[data-select="link"] {
		color: red;
	}
	*/


	/*
		5. Multiple Data Attributes (qualified with values)
	

	div[data-div="layer1"] a[data-select="link"] {
		color: red;
	}
	*/


	/*
		6. Solo Pseudo selector
	

	a:after {
		content: "after";
		color: red;
	}
	*/


	/*
		7. Combined classes
	

	.tagA.link {
		color: red;
	}
	*/


	/*
		8. Multiple classes 
	

	.tagUl .link {
		color: red;
	}
	*/


	/*
		9. Multiple classes (using child selector)
	
	.tagB > .tagA {
		color: red;
	}
	*/


	/*
		10. Partial attribute matching

	[class^="wrap"] {
		color: red;
	}	
	*/


	/*
		11. Nth-child selector
	
	.div:nth-of-type(1) a {
		color: red;
	}
	*/


	/*
		12. Nth-child selector followed by nth-child selector
	
	.div:nth-of-type(1) .div:nth-of-type(1) a {
		color: red;
	}
	*/


	/*
		13. Insanity selection (unlucky for some)
	
	div.wrapper > div.tagDiv > div.tagDiv.layer2 > ul.tagUL > li.tagLi > b.tagB > a.TagA.link {
		color: red;
	}
	*/


	/*
		14. Slight insanity
	
	.tagLi .tagB a.TagA.link {
		color: red;
	}
	*/


	/*
		15. Universal
	
	* {
		color: red;
	}
	*/


	/*
		16. Element single
	
	a {
		color: red;
	}
	*/


	/*
		17. Element double
	
	div a {
		color: red;
	}
	*/


	/*
		18. Element treble
	
	div ul a {
		color: red;
	}
	*/


	/*
		19. Element treble pseudo
	
	div ul a:after; {
		content: "after";
		color: red;
	}
	*/


	/*
		20. Single class
	
	.link {
		color: red;
	}
```

测试的结果如下：

| Test          | Chrome 34 | Firefox 29 | Opera 19 | IE9   | Android 4 |
| ------------- | --------- | ---------- | -------- | ----- | --------- |
| 1             | 56.8      | 125.4      | 63.6     | 152.6 | 1455.2    |
| 2             | 55.4      | 128.4      | 61.4     | 141   | 1404.6    |
| 3             | 55        | 125.6      | 61.8     | 152.4 | 1363.4    |
| 4             | 54.8      | 129        | 63.2     | 147.4 | 1421.2    |
| 5             | 55.4      | 124.4      | 63.2     | 147.4 | 1411.2    |
| 6             | 60.6      | 138        | 58.4     | 162   | 1500.4    |
| 7             | 51.2      | 126.6      | 56.8     | 147.8 | 1453.8    |
| 8             | 48.8      | 127.4      | 56.2     | 150.2 | 1398.8    |
| 9             | 48.8      | 127.4      | 55.8     | 154.6 | 1348.4    |
| 10            | 52.2      | 129.4      | 58       | 172   | 1420.2    |
| 11            | 49        | 127.4      | 56.6     | 148.4 | 1352      |
| 12            | 50.6      | 127.2      | 58.4     | 146.2 | 1377.6    |
| 13            | 64.6      | 129.2      | 72.4     | 152.8 | 1461.2    |
| 14            | 50.2      | 129.8      | 54.8     | 154.6 | 1381.2    |
| 15            | 50        | 126.2      | 56.8     | 154.8 | 1351.6    |
| 16            | 49.2      | 127.6      | 56       | 149.2 | 1379.2    |
| 17            | 50.4      | 132.4      | 55       | 157.6 | 1386      |
| 18            | 49.2      | 128.8      | 58.6     | 154.2 | 1380.6    |
| 19            | 48.6      | 132.4      | 54.8     | 148.4 | 1349.6    |
| 20            | 50.4      | 128        | 55       | 149.8 | 1393.8    |
| Biggest Diff. | 16        | 13.6       | 17.6     | 31    | 152       |
| Slowest       | 13        | 6          | 13       | 10    | 6         |

**解释**

在浏览器的引擎内部，这些选择器会被重新的拆分，组合，优化，编译。而不同的浏览器内核采用不同的方案，所以几乎没有办法预测，选择器的优化究竟能带来多少收益。

- `[type="..."]` 选择器比 `input[type="..."]` 更耗性能。



-  下面的css trick 需要优化，因为只有在ie7上有效，在非ie7上

````
a.remove > * { /* some styles */ }
.ie7 a.remove > * { margin-right: 0.25em }
````





**结论：** 

合理的使用选择器，比如说层级更少的class，的确会提高匹配的速度，但是速度的提高是有限的 。

如果你通过dev tool 发现匹配选择器的确是瓶颈，那么就选择优化它。



# 大量无用代码会拖慢浏览器的解析速度

用一个3000行的无用css样式表和1500行的无用样式表，进行测试：

| Test | Chrome 34 | Firefox 29 | Opera 19 | IE9   | Android 4 |
| ---- | --------- | ---------- | -------- | ----- | --------- |
| 3000 | 64.4      | 237.6      | 74.2     | 436.8 | 1714.6    |
| 1500 | 51.6      | 142.8      | 65.4     | 358.6 | 1412.4    |

对于火狐来说，在其他环节一致的情况下，页面渲染的速度几乎提升了一倍 



尽管现在的惯例是把css 打包成一个巨大单一的css文件。这样做的确是有好处的，减少http请求的数量。但是拆分css文件可以让加载速度更快，浏览器的解析速度更快。



这一项的优化是非常显著的，通常可以省下来 2ms ~ 300ms的时间。



# 避免使用耗性能的css属性

[测试连接](https://benfrain.com/selector-test/3-01.html)

```
.link {
    background-color: red;
    border-radius: 5px;
    padding: 3px;
    box-shadow: 0 5px 5px #000;
    -webkit-transform: rotate(10deg);
    -moz-transform: rotate(10deg);
    -ms-transform: rotate(10deg);
    transform: rotate(10deg);
    display: block;
}
```

测试结果：

| Test             | Chrome 34 | Firefox 29 | Opera 19 | IE9   | Android 4 |
| ---------------- | --------- | ---------- | -------- | ----- | --------- |
| Expensive Styles | 65.2      | 151.4      | 65.2     | 259.2 | 1923      |

需要注意的是，高耗css样式如果不会频繁的触发回流和重绘，只会在页面渲染的时候被执行一次，那么对页面的性能影响是有限的。如果频繁的触发回流和重绘，那么最基本的css样式也会影响到页面的性能。



那么哪些 css 样式会造成页面性能的问题呢？

下面的内容整理自 [连接](http://perfectionkills.com/profiling-css-for-fun-and-profit-optimization-notes/)



border - radius > shadow  gradients

尽管border - radius 是仅仅会触发 repaint  但是确是最消耗性能的。

https://github.com/kangax/perfectionkills.com/blob/master/css_perf/css_perf_test.html

opacity 

Box - shadow  （0 1px 1px 0）要优于  (`0 2px 3px 0`)

旋转 rotating 即使 0.01 deg 也是非常昂贵的。



- 











https://benfrain.com/css-performance-revisited-selectors-bloat-expensive-styles/

