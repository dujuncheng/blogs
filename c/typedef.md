给已经有的类型取别名

```c
typedef 已经有的类型 别名
```

不是造类型的，不是定义变量的，只是取别名的。

```c
typedef int ARR[10];
ARR a,b[2]; <=> int a[10], b[2][10]
```

```C
typedef char *POINT;
POINT P1, *P2,
```

