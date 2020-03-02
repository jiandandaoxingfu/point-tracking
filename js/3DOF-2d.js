class ArmLink {
	// 考虑三自由度机械臂。
	constructor(canvas, arm_lengths) {
		this.canvas = canvas;
		this.arm_lengths = arm_lengths;
		this.arm_joint_arr = [];
		this.joint_angles = [];
		this.last_pos = [];
		this.cur_pos = [];
	}

	update_joint() {
		// 正向运动学(forward kinematics)，绘制机械臂。
		let arm_joint_arr = [[0, 0]];
		for(let i=0; i<this.joint_angles.length; i++) {
			let angle = this.joint_angles.slice(0, i+1).reduce( (i, j) => i+j );
			arm_joint_arr[i+1] = this.transform([this.arm_lengths[i], 0], angle, arm_joint_arr[i]);
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

	get_joint_angle(pos) {
		let [x, y] = pos;
		// 逆向动力学，求夹角。
		let lens = this.arm_lengths;
		let theta123, phi, theta12, theta12_, psi, theta1, theta1_, theta2, theta3;
		phi = theta123 = Math.atan2(y, x);
		let a = 2 * (x -  lens[2] * Math.cos(phi)) * lens[1];
		let b = 2 * (y -  lens[2] * Math.sin(phi)) * lens[1];
		let c = x*x + y*y + lens[1]*lens[1] + lens[2]*lens[2] - lens[0]*lens[0] - 2*lens[2]*( x*Math.cos(phi) + y*Math.sin(phi) );
		let d = b*b + a*a - c*c;
		if( d < 0 ) return;
		psi = theta12 = 2*Math.atan( (b + Math.sqrt(d) ) / (a + c) ); // b +/- Math.sqrt(d)都可以。
		theta12_ = 2*Math.atan( (b - Math.sqrt(d) ) / (a + c) );
		theta1 = Math.acos( (x - lens[2]*Math.cos(phi) - lens[1]*Math.cos(psi)) / lens[0] );[[]]
		theta1_ = Math.asin( (y - lens[2]*Math.sin(phi) - lens[1]*Math.sin(psi)) / lens[0] )
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
	}

	via_point() {
		let [x0, y0] = this.last_pos; // P
		let [x, y] = this.cur_pos; // Q
		// P --> Q
		let pos_arr = [this.last_pos, this.cur_pos];
		// 圆心到PQ距离
		let d = Math.abs( x0*(y-y0) - (x-x0)*y0 )/Math.sqrt( (y-y0)*(y-y0) + (x-x0)*(x-x0) );
		// 相交与两点
		if( d < min_r ) {
			// 在圆的两侧(过圆心垂直PQ的线与PQ的交点N，NP，NQ内积<0)
			d = x0*x0 - 2*x0*x + x*x + y0*y0 - 2*y0*y + y*y;
			let Nx = -(x0*y - x*y0)*(y0 - y)/d;
			let Ny = (x0*y - x*y0)*(x0 - x)/d;
			let NP = [x0 - Nx, y0 - Ny];
			let NQ = [x - Nx, y - Ny];
			if( NP[0]*NQ[0] + NP[1]*NQ[1] < 0 ) {
				// P --> M --> Q.
				let theta = Math.atan( (y-y0)/(x-x0) );
				let k0 = this.get_slope(theta, x0, y0);
				let k1 = this.get_slope(theta, x, y);
				// 求切线交点M
				let Mx = (k0*x0 - k1*x - y0 + y) / (k0-k1);
				let My = (k0*k1*x0 - k0*k1*x + k0*y - k1*y0) / (k0-k1);
				if( Mx*Mx + My*My <= max_r*max_r ) {
					pos_arr = [this.last_pos, [Mx, My], this.cur_pos];
				} else {

				}
			}
		}
		let points = '';
		pos_arr.forEach( p => {
			points += (p[0] + 300) + ',' + (p[1] + 300) + ' ';
		})
		let n = pos_arr.length - 1;
		let circle = `<circle cx="${pos_arr[0][0] + 300}" cy="${pos_arr[0][1] + 300}" r="5" style="stroke-width: 1;  fill: gray;"/>`
			+ `<circle cx="${pos_arr[n][0] + 300}" cy="${pos_arr[n][1] + 300}" r="5" style="stroke-width: 1;  fill: blue;"/>`;
		document.querySelector('#trace').innerHTML = `<polyline points="${points}" style="fill: none; stroke:gray; stroke-width:1"/>` + circle;
		return pos_arr;
	}

	get_slope(angle, x, y) {
		// 返回与弦夹角最小的切线斜率
		let r2 = min_r*min_r;
		let d = Math.sqrt( r2*( x*x + y*y - r2 ) );
		let k1 = (d - x*y)/(r2 - x*x);
		let k2 = -(d + x*y)/(r2 - x*x);
		let a1 = Math.atan(k1);
		let a2 = Math.atan(k2);
		[angle, a1, a2] = [angle, a1, a2].map( a => a < 0 ? a+pi : a);
		return (Math.abs(angle - a1) > Math.abs(angle - a2) ) ? k2 : k1;
	}

	interpolation(pos_arr) {
		let arr = [];
		for(let i=0; i<pos_arr.length-1; i++) {
			let d = Math.sqrt(Math.pow(pos_arr[i+1][0] - pos_arr[i][0], 2) + Math.pow(pos_arr[i+1][1] - pos_arr[i][1], 2));
			let speed = 0.3/(Math.round(5*d/max_r) + 1);
			for(let t=0; t<1; t+=speed) {
				let x = pos_arr[i][0] + t*(pos_arr[i+1][0] - pos_arr[i][0]);
				let y = pos_arr[i][1] + t*(pos_arr[i+1][1] - pos_arr[i][1]);
				arr.push([x, y]);
			}
		}
		arr.push(pos_arr.pop());
		return arr;
	}

	update() {
		let pos_arr = this.via_point();
		pos_arr = this.interpolation(pos_arr);
		this.render(pos_arr);
	}

	render(pos_arr) {
		if( pos_arr.length > 0 ) {
			setTimeout( () => {
				this.get_joint_angle(pos_arr[0]);
				this.update_joint();
				this.plot();
				this.render(pos_arr.slice(1));
			}, 50)
		} else {
			this.last_pos = this.cur_pos;
			document.querySelector('#trace').innerHTML = '';
			setTimeout( () => {
				this.start();
			}, 500);
		}
	}

	start() {
		let x = max_r * (1 - 2*Math.random());
		let y = max_r * (1 - 2*Math.random());
		let r2 = x*x + y*y;
		if( r2 >= min_r*min_r && r2 <= max_r*max_r) {
			this.cur_pos = [x, y];
			this.update();
		} else {
			this.start();
		}
	}

	transform(OA, alpha, translate) {
		// 以原点为端点的线段做旋转平移。
		let mat = [
			[Math.cos(alpha), -Math.sin(alpha)],
			[Math.sin(alpha), Math.cos(alpha)]
		];
		return [mat[0][0] * OA[0] + mat[0][1] * OA[1] + translate[0], mat[1][0] * OA[0] + mat[1][1] * OA[1] + translate[1]];
	}
}

var fix = (d, i) => parseFloat( d.toFixed(i) );
const pi = Math.PI;

var arm_lengths = [70, 70, 70].map(d => d +  fix(30*Math.random(), 3));
var length = arm_lengths.reduce( (i, j) => i+j);
var armLink = new ArmLink(document.querySelector('#canvas'), arm_lengths);
let len = armLink.arm_lengths;
var min_r = Math.max(len[2] + len[1] - len[0], len[0], len[2] + len[0] - len[1]);
var max_r = len[0] + len[1] + len[2];
armLink.canvas.innerHTML += `<circle cx="300" cy="300" r="${length+1}" style="stroke-width: 2; stroke: black; fill: none;"/>`;
armLink.canvas.innerHTML += `<circle cx="300" cy="300" r="${min_r}" style="stroke-width: 2; stroke: blue; fill: none;"/>`;
armLink.last_pos = [length - 10, 1];
armLink.start();