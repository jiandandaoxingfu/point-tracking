[TOC]

# 平面三自由度机械臂

## 算法

### 正向运动学与逆向运动学

关键在于DH表示法的引入(实质是坐标架之间的变换矩阵)。

![图片无法加载](images/示意图.jpg)

设终点坐标(相对于x_0-y_0坐标系)为(x, y)。利用正向运动学，可得如下关系

![图片无法加载](images/eq1.PNG)

以及

![图片无法加载](images/eq2.PNG)

其中

![图片无法加载](images/eq3.PNG)

由此可得

![图片无法加载](images/eq4.PNG)

其中

![图片无法加载](images/eq5.PNG)

由以上算法，我们可以根据末端坐标得到三个角度值(逆运动学)。也可以利用三个角度值(顺运动学)，绘制机械臂。

### 路径规划

上面考虑了从一个点到另一个点，这里我们还要考虑如何过去。这里我们对末端点的路径进行规划。考虑最简单的情形，即路径为折线段，如下图

<img src="images/path.jpg" alt="无法加载" style="zoom: 33%;" />

两个圆之间为末端点运动空间。P为起始点，Q为终点，路径分两种情况：P --> Q', P --> M --> Q。其中M是两条切线的交点。需要注意的是后一种情况并非最短路(最短路应该是中间部分沿两切点之间的圆弧)。M的求解点到直线的距离，圆的切线及切线交点等。

​	此外，我们还可以考虑速度，加速度。考虑到实际情况，应该有P,M,Q(Q')的速度是0。

### 三维四自由度机械臂

我们可以将平面三自由度机械臂推广到如下的三维四自由度机械臂，

<img src="images/4DOF.gif" alt="图片无法加载" style="zoom:50%;" />

其中从上倒下，第一个杆可以左右旋转，上面三个可以上下旋转且始终在一个平面内。

​	首先，我们求末端位置(相对于frame-0)转化为相对于frame-1。此时相当于平面三自由度问题。

## Demo

平面三自由度机械臂[Demo.](https://jiandandaoxingfu.github.io/point-tracking)

三维四自由度机械臂[Demo](https://jiandandaoxingfu.github.io/point-tracking).

## 参考资料

- 知乎专栏：[何小白：机器人学学习笔记](https://zhuanlan.zhihu.com/c_1208050340920299520).
- Github：[Robot Arm Manipulator.](https://github.com/jiandandaoxingfu/Interactive_Graphics)

## 问题
- 当theta1， theta2达到临界值(180, 0, -180)时，无法正确跟踪目标点。
- 路径规划中当M跑出大圆外，则需要重新规划。
