class ArmLink {
	// 考虑三自由度机械臂。
	constructor(canvas, link_length) {
		this.canvas = canvas;
		this.link_length = link_length;
		this.arm_joint_arr = [];
		this.joint_angles = [];
		this.is_render = true;
	}

	update_joint() {
		// 正向运动学(forward kinematics)，绘制机械臂。
		let arm_joint_arr = [[0, 0]];
		for(let i=0; i<this.joint_angles.length; i++) {
			let angle = this.joint_angles.slice(0, i+1).reduce( (i, j) => i+j );
			arm_joint_arr[i+1] = this.transform([this.link_length[i], 0], angle, arm_joint_arr[i]);
		}
		this.arm_joint_arr = arm_joint_arr;
	}

	plot() {
		let points = '', circle = '';
		this.arm_joint_arr.forEach( p => {
			let x = fix(p[0] + 300, 3);
			let y = fix(p[1] + 300, 3);
			circle += `<circle cx="${x}" cy="${y}" r="3" style="stroke-width: 2;  fill: black;"/>`;
			points += x + ',' + y + ' ';
		})
		document.querySelector('#arm').innerHTML = `<polyline points="${points}" style="fill: none; stroke:red; stroke-width:3"/>` + circle;
	}

	get_joint_angle(x, y) {
		// 逆向动力学，求夹角。
		let lens = this.link_length;
		let theta123, phi, theta12, theta12_, psi, theta1, theta1_, theta2, theta3;
		phi = theta123 = atan2(y, x);
		let a = 2 * (x -  lens[2] * cos(phi)) * lens[1];
		let b = 2 * (y -  lens[2] * sin(phi)) * lens[1];
		let c = x*x + y*y + lens[1]*lens[1] + lens[2]*lens[2] - lens[0]*lens[0] - 2*lens[2]*( x*cos(phi) + y*sin(phi) );
		let d = b*b + a*a - c*c;
		if( d < 0 ) {
			// 无法到达
			if( x*x+y*y <= length*length ) {
				this.canvas.innerHTML +=`<circle cx="${fix(x + 300, 3)}" cy="${fix(y + 300, 3)}" r="2" style="stroke-width: 0; fill: gray;"/>`;
			}
			return false;
		} else {
			psi = theta12 = 2*atan( (b + sqrt(d) ) / (a + c) ); // b +/- sqrt(d)都可以。
			theta12_ = 2*atan( (b - sqrt(d) ) / (a + c) );
			theta1 = acos( (x - lens[2]*cos(phi) - lens[1]*cos(psi)) / lens[0] );
			theta1_ = asin( (y - lens[2]*sin(phi) - lens[1]*sin(psi)) / lens[0] )
			theta2 = theta12 - theta1;
			theta3 = theta123 - theta12;
			if( theta1_ < 0 ) {
				theta1 = -theta1;
				theta2 = theta12 - theta1;
			}

			this.joint_angles = [theta1, theta2, theta3].map( theta => {
				if( theta > pi ) {
					theta -= 2*pi;
				} else if( theta < -pi ) {
					theta += 2*pi;
				}
				return theta;
			});
			return true;
		}
	}

	render(x, y) {
		this.is_render = !1; // 控制更新频率
		setTimeout(() => {
			this.is_render = !0;
		}, 25);
		if( this.get_joint_angle(x, y) ) {
			this.update_joint();
			this.plot();	
		}
	}

	mousemove() {
		document.addEventListener('mousemove', e => {
			let ele = e.target;
			if( ele.id && ele.id === 'canvas' ) {
				let box = this.canvas.getBoundingClientRect()
				let x = (e.clientX - box.left) - 300;
				let y = 300 - (e.clientY - box.top);
				if( this.is_render ) {
					this.render(x, y);
				}
			}
		})
	}

	transform(OA, alpha, translate) {
		// 以原点为端点的线段做旋转平移。
		let mat = [
			[cos(alpha), -sin(alpha)],
			[sin(alpha), cos(alpha)]
		];
		return [mat[0][0] * OA[0] + mat[0][1] * OA[1] + translate[0], mat[1][0] * OA[0] + mat[1][1] * OA[1] + translate[1]];
	}

	beyond_reach(i) {
		// 显示出机械手不能到达的区域。
		if( i<3000 ) {
			setTimeout(() => {
				let x = 2*length*random() - 300;
				let y = 2*length*random() - 300;
				if( x*x+y*y < length*length ) {
					this.get_joint_angle(x, y);
				}
				this.beyond_reach(i+1);
			}, 2)
		}
	}
}

var sqrt = Math.sqrt;
var sin = Math.sin;
var cos = Math.cos; 
var asin = Math.asin; // [-pi/2, pi/2]
var acos = Math.acos; // [0, pi]
var atan = Math.atan; // [-pi/2, pi/2]
var atan2 = Math.atan2; // // [-pi, pi]
var random = Math.random;
var fix = (d, i) => parseFloat( d.toFixed(i) );
const pi = Math.PI;

var link_length = [70, 70, 70].map(d => d +  fix(30*random(), 0) );
var length = link_length.reduce( (i, j) => i+j);
var armLink = new ArmLink(document.querySelector('#canvas'), link_length);
armLink.canvas.innerHTML += `<circle cx="300" cy="300" r="${length + 5}" style="stroke-width: 2; stroke: black; fill: none;"/>`;
armLink.mousemove();
armLink.beyond_reach(0);
armLink.render(length, 0);