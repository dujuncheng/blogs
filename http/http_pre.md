#http发展历史

## http/0.9
只有一个命令get
没有header等描述数据的信息
服务器发送完毕，就关闭TCP链接

## http/1.0
增加了很多命令
增加了status code和header
多字符集支持，多部分发送，权限，缓存等


## http/1.1
持久连接（创建连接的成本比较高）
pipeline (在服务端会先发送比较快的) 
增加了host 和其他一些命令

## http2
所有的数据都是二进制传输的
同一个连接里面发送多个请求不再需要按照顺序来
头信息压缩以及推送(服务端主动发送内容)等提高的效率的功能


# http三次握手
在客户端和服务端请求和返回数据的时候，需要创建`TCP connection`, 因为http是没有连接的概念的的，只有请求和响应的概念
请求和响应都是数据包，数据包的通道是`TCP connection`, 在`TCP connection`上面，可以发送多个http请求

http/1.1之后，`TCP connect`可以被保持住，`http`可以多次复用(减少三次握手的开销)，可以并发

三次握手

![](http://p8cyzbt5x.bkt.clouddn.com/UC20180607_092457.png)




