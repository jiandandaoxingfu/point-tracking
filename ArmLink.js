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
			circle += `<circle cx="${p[0] + 300}" cy="${p[1] + 300}" r="3" style="stroke-width: 2;  fill: black;"/>`;
			points += (p[0] + 300) + ',' + (p[1] + 300) + ' ';
		})
		document.querySelector('#arm').innerHTML = `<polyline points="${points}" style="fill: none; stroke:red; stroke-width:3"/>` + circle;
	}

	get_joint_angle(x, y) {
		// 逆向动力学，求夹角。
		let lens = this.link_length;
		let theta123, phi, theta12, psi, theta1, theta1_, theta2, theta3;
		phi = theta123 = atan2(y, x);
		let a = 2 * (x -  lens[2] * cos(phi)) * lens[1];
		let b = 2 * (y -  lens[2] * sin(phi)) * lens[1];
		let c = x*x + y*y + lens[1]*lens[1] + lens[2]*lens[2] - lens[0]*lens[0] - 2*lens[2]*( x*cos(phi) + y*sin(phi) );
		let d = b*b + a*a - c*c;
		if( d < 0 ) {
			this.canvas.innerHTML +=`<circle cx="${x + 300}" cy="${y + 300}" r="2" style="stroke-width: 0; fill: gray;"/>`;
			return false;
		} else {
			psi = theta12 = 2*atan( (b + sqrt(d) ) / (a + c) ); // b +/- sqrt(d)都可以。
			theta1 = acos( (x - lens[2]*cos(phi) - lens[1]*cos(psi)) / lens[0] );
			theta1_ = asin( (y - lens[2]*sin(phi) - lens[1]*sin(psi)) / lens[0] )
			theta2 = theta12 - theta1;
			theta3 = theta123 - theta12;
			if( theta1_ < 0 ) {
				theta1 = -theta1;
				theta2 = theta12 - theta1;
			}
			this.joint_angles = [theta1, theta2, theta3];
			return true;
		}
	}

	render(x, y) {
		this.is_render = !1; // 控制更新频率
		setTimeout(() => {
			this.is_render = !0;
		}, 50);
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
				let x = round(e.clientX - box.left) - 300;
				let y = 300 - round(e.clientY - box.top);
				if( this.is_render ) {
				
					this.render(x, y);
				
				}
			}
		})
	}

	transform(OA, alpha, translate) {
		let mat = [
			[cos(alpha), -sin(alpha)],
			[sin(alpha), cos(alpha)]
		];
		return [mat[0][0] * OA[0] + mat[0][1] * OA[1] + translate[0], mat[1][0] * OA[0] + mat[1][1] * OA[1] + translate[1]];
	}
}

var sqrt = Math.sqrt;
var sin = Math.sin;
var asin = Math.asin;
var atan = Math.atan;
var atan2 = Math.atan2;
var cos = Math.cos;
var acos = Math.acos;
var round = Math.round;
var random = Math.random;
const pi = Math.PI;

var link_length = [70 + round(30*random()), 70 + round(30*random()), 70 + round(30*random())];
var length = link_length.reduce( (i, j) => i+j);
var armLink = new ArmLink(document.querySelector('#canvas'), link_length);
armLink.canvas.innerHTML += `<circle cx="300" cy="300" r="${length}" style="stroke-width: 2; stroke: black; fill: none;"/>`;
armLink.mousemove();
armLink.render(length, 0);