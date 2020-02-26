class ArmLink {
	// 正向运动学(forward kinematics)，绘制机械臂。
	// 考虑三自由度机械臂。
	constructor(canvas, link_length) {
		this.canvas = canvas;
		this.link_length = link_length;
		this.arm_joint_arr = [];
		this.joint_angles = [];
		this.isRender = true;
	}

	update_joint() {
		let arm_joint_arr = [[0, 0]];
		for(let i=0; i<this.joint_angles.length; i++) {
			let angle = this.joint_angles.slice(0, i+1).reduce( (i, j) => i+j );
			arm_joint_arr[i+1] = vector2.transform([this.link_length[i], 0], angle, arm_joint_arr[i]);
		}
		this.arm_joint_arr = arm_joint_arr;
	}

	plot() {
		let points = '', circle = '';
		this.arm_joint_arr.forEach( p => {
			circle += `<circle cx="${p[0] + 300}" cy="${p[1] + 300}" r="3" style="stroke-width: 1;  fill: black;"/>`;
			points += (p[0] + 300) + ',' + (p[1] + 300) + ' ';
		})
		document.querySelector('#canvas').innerHTML = `<polyline points="${points}" style="fill: none; stroke:red; stroke-width:1"/>` + circle;
	}

	get_joint_angle(x, y) {
		let lens = this.link_length;
		let theta123, phi, theta12, psi, theta1, theta2, theta3;
		phi = theta123 = atan2(y, x);
		let a = 2 * (x -  lens[2] * cos(phi)) * lens[1];
		let b = 2 * (y -  lens[2] * sin(phi)) * lens[1];
		let c = x*x + y*y + lens[1]*lens[1] + lens[2]*lens[2] - lens[0]*lens[0] - 2*lens[2]*( x*cos(phi) + y*sin(phi) );
		let d = b*b + a*a - c*c;
		if( d < 0 ) {
			console.log('无法达到');
			return false;
		} else {
			psi = theta12 = 2*atan( (b - sqrt(d) ) / (a + c) );
			theta1 = acos( (x - lens[2]*cos(phi) - lens[1]*cos(psi)) / lens[0] );
			theta2 = theta12 - theta1;
			theta3 = theta123 - theta12;
			console.log( [theta1, theta2, theta3, theta12, theta123].map( a => (a*180/pi).toFixed(3)) );
			if( abs(theta1*180/pi - 180) < 1 ) {
				console.log('theta1临界值');
				theta1 = -theta1;
			}
			if( abs(theta1*180/pi) < 1 ) {
				console.log('theta1临界值');
			}
			if( abs(theta2*180/pi + 180) < 1 ) {
				console.log('theta2临界值');
			}
			if( abs(theta3*180/pi + 180) < 1 ) {
				console.log('theta3临界值');
			}
			this.joint_angles = [theta1, theta2, theta3];
			// console.log('123, 12, 1: ' + [theta123, theta12, theta1].map( a => a*180/pi ));
			// console.log('1, 2, 3: ' + [theta1, theta2, theta3].map( a => a*180/pi ));
			return true;
		}
	}

	render(x, y) {
		this.isRender = !1;
		setTimeout(() => {
			this.isRender = !0;
		}, 100);
		if( this.get_joint_angle(x, y) ) {
			this.update_joint();
			this.plot();	
		}
	}

	click() {
		document.addEventListener('mousemove', e => {
			let ele = e.target;
			if( ele.id && ele.id === 'canvas' ) {
				let box = this.canvas.getBoundingClientRect()
				let x = Math.round(e.clientX - box.left) - 300;
				let y = 300 - Math.round(e.clientY - box.top);
				if( this.isRender ) {
					console.log([x, y]);
					this.render(x, y);
				}
			}
		})
	}
}


var armLink = new ArmLink(document.querySelector('#canvas'), [100, 100, 100]);
armLink.click();
armLink.render(300, 0);