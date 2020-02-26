# 三自由度机械臂

## 算法
关键在于DH-table的引入。

![图片无法加载](images/示意图.jpg)

设终点坐标(相对于x_0-y_0坐标系)为(x, y)。利用正向运动学，可得如下关系

![图片无法加载](images/eq1.png)

以及

![图片无法加载](images/eq2.png)

其中

![图片无法加载](images/eq3.png)

由此可得

![图片无法加载](images/eq4.png)

其中

![图片无法加载](images/eq5.png)

由以上结果就可以得到theta_1, theta_2, theta_3。然后利用正向运动学即可得到节点处的坐标，从而绘制出图形。

## Demo

机械臂跟随鼠标当前位置，[demo](https://jiandandaoxingfu.github.io/point-tracking)。

## 参考资料 

- 知乎专栏：[何小白：机器人学学习笔记](https://zhuanlan.zhihu.com/c_1208050340920299520).

## 问题
- 当theta1， theta2达到临界值(180, 0, -180)时，无法正确跟踪目标点。