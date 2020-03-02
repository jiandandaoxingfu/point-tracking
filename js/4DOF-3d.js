class Robot {
	// 考虑三维四自由度机械臂。
	constructor(arm_lengths, radius) {
		this.canvas = null;
		this.arm_lengths = arm_lengths;
		this.joint_radius = radius;
		this.joint_angles = [0, 0, 0, 0];
		this.robot = null;
		this.last_pos = [];
		this.cur_pos = [];
		this.trace = null
	}

	init() {
		let world = new THREE.Group();
		let texture = new THREE.TextureLoader().load('../images/floor.jpg');
		plane = new THREE.Mesh(
			new THREE.CircleGeometry(width, 50, 50), 
			new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide, transparent: true, opacity: 0.9})
		)
		plane.rotation.x = -pi/2;

		// robot
		let robot = new THREE.Group();

		// arm0
		arm0 = new THREE.Mesh(
			new THREE.CylinderGeometry(this.joint_radius - 0.5, this.joint_radius - 0.5, this.arm_lengths[0], 30),
   			new THREE.MeshLambertMaterial({wireframe: !1, color: '#dd4411'}) 
   		)
   		arm0 = change_origin([0, -this.arm_lengths[0]/2, 0], arm0);
   		arm0.position.y = 0;
		let arm0_bottom = new THREE.Mesh(
			new THREE.CylinderGeometry(5, 5, 2, 5),
   			new THREE.MeshLambertMaterial({wireframe: !1, color: '#c0c0c0'})
   		)
		arm0_bottom.position.y = 1; 
   		arm0.add(arm0_bottom);

   		// arm 1-3
   		[arm1, arm2, arm3] = [1, 2, 3].map( i => {
   			let arm = new THREE.Mesh(
				new THREE.CylinderGeometry(this.joint_radius - 0.5, this.joint_radius - 0.5, this.arm_lengths[i], 30),
   				new THREE.MeshPhongMaterial({wireframe: !1, color: '#dd4411'})
   			);
   			arm = change_origin([0, -this.arm_lengths[i]/2, 0], arm);
   			arm.position.y = this.arm_lengths[i-1];
			let arm_bottom = new THREE.Mesh(
				new THREE.SphereGeometry(this.joint_radius, 50, 50),
				new THREE.MeshPhongMaterial({ wireframe: !1, color: 'white'})
			);
			arm.add(arm_bottom);
			return arm;
   		})

		target = new THREE.Mesh(
			new THREE.SphereGeometry(1.5, 50, 50), 
			new THREE.MeshLambertMaterial({color: 'yellow'})	
		);

		// 末端运动空间边界
		let s1 = new THREE.Mesh(
			new THREE.SphereGeometry(min_r, 10, 10), 
			new THREE.MeshBasicMaterial({color: 'blue', wireframe: !0})	
		);
		s1.position.z = this.arm_lengths[0];

		let s2 = new THREE.Mesh(
			new THREE.SphereGeometry(width, 20, 20), 
			new THREE.MeshBasicMaterial({color: 'red', wireframe: !0})	
		);
		s2.position.z = this.arm_lengths[0];

		robot.add(arm0);	
		arm0.add(arm1);
		arm1.add(arm2);
		arm2.add(arm3);
		plane.add(target);
		// plane.add(s1);
		// plane.add(s2);
		world.add(plane);
		world.add(robot);
   		scene.add(world);
   		this.robot = robot;
   		world.position.y = -height/2;

 		// x-红色，y-绿色，z-蓝色
 		plane.rotation.z = pi/2;
		plane.add(new THREE.AxisHelper( width ));
		
		// 灯光
   		var pos_arr = [
			[0, height, 0],
			[0, 0, height],
			[height, 0, 0],
			[0, -height, 0],
			[0, 0, -height],
			[-height, 0, 0]
		]
		for(let i=0; i<6; i++) {
			let light = new THREE.DirectionalLight( i%2 == 1 ? 0xffffff : 0x444444, 1); //  太阳光-平行光
			light.position.set(...pos_arr[i]);
			scene.add(light);
		}
		
		scene.add( new THREE.AmbientLight( 0x444444 ) );
	}

	get_joint_angle(x, y) {
		// 逆向动力学，求夹角。
		let lens = this.arm_lengths.slice(1);
		let theta123, phi, theta12, theta12_, psi,
			 theta1, theta1_, theta2, theta3, joint_angles;
		phi = theta123 = Math.atan2(y, x);
		let a = 2 * (x -  lens[2] * Math.cos(phi)) * lens[1];
		let b = 2 * (y -  lens[2] * Math.sin(phi)) * lens[1];
		let c = x*x + y*y + lens[1]*lens[1] + lens[2]*lens[2] - lens[0]*lens[0] - 2*lens[2]*( x*Math.cos(phi) + y*Math.sin(phi) );
		let d = b*b + a*a - c*c;
		if( d < 0 ) { // 无法到达
			return !1;
		} else {
			psi = theta12 = 2*Math.atan( (b + Math.sqrt(d) ) / (a + c) );
			theta12_ = 2*Math.atan( (b - Math.sqrt(d) ) / (a + c) );
			theta1 = Math.acos( (x - lens[2]*Math.cos(phi) - lens[1]*Math.cos(psi)) / lens[0] );
			theta1_ = Math.asin( (y - lens[2]*Math.sin(phi) - lens[1]*Math.sin(psi)) / lens[0] )
			theta2 = theta12 - theta1;
			theta3 = theta123 - theta12;
			if( theta1_ < 0 ) {
				theta1 = -theta1;
				theta2 = theta12 - theta1;
			}
			
			[theta1, theta2, theta3].forEach( (theta, i) => {
				if( theta > pi ) {
					theta -= 2*pi;
				} else if( theta < -pi ) {
					theta += 2*pi;
				}
				this.joint_angles[i+1] = theta;
			});
			return !0;
		}
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
					// M 超出边界
				}
			}
		}
		let points = '';
		pos_arr.forEach( p => {
			points += (p[0] + 300) + ',' + (p[1] + 300) + ' ';
		})
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

	show_trace(pos_arr, beta, delta) {
		let curve = [];
		pos_arr = [...pos_arr];
		pos_arr = [...pos_arr, pos_arr.pop()];
		pos_arr.forEach( p => {
			// frame0 在 frame1 中的坐标，转化为在 frame0 中的坐标。
			let x = p[0] * Math.cos(beta);
			let y = p[0] * Math.sin(beta);
			let z = p[1] + this.arm_lengths[0];
			curve.push(new THREE.Vector3(x, y, z) );
			beta += delta;
		})
		curve = new THREE.CatmullRomCurve3(curve);
		this.trace = new THREE.Mesh(
			new THREE.TubeGeometry(curve, 100, 0.3, 50, false),	
			new THREE.MeshPhongMaterial({color: 'blue'})
		);
		plane.add(this.trace);
	}

	interpolation(pos_arr) {
		// 根据端点长度，线性插值
		let arr = [];
		for(let i=0; i<pos_arr.length-1; i++) {
			let d = Math.sqrt(Math.pow(pos_arr[i+1][0] - pos_arr[i][0], 2) + Math.pow(pos_arr[i+1][1] - pos_arr[i][1], 2));
			let speed = 0.3/(Math.round(5*d/max_r) + 3);
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
		this.robot.rotation.y = this.joint_angles[0];
		arm1.rotation.x = this.joint_angles[1] - pi/2;
		arm2.rotation.x = this.joint_angles[2];
		arm3.rotation.x = this.joint_angles[3];
	}

	render(pos_arr, delta_beta) {
		if( pos_arr.length > 0 ) {
			setTimeout( () => {
				this.get_joint_angle(...pos_arr[0]);
				this.joint_angles[0] += delta_beta;
				this.update();
				this.render(pos_arr.slice(1), delta_beta);
			}, 80)
		} else {
			this.last_pos = this.cur_pos;
			setTimeout(() => {
				plane.remove(this.trace);
				this.trace = null;
				this.start();
			}, 500)
		}
	}

	start() {
		let x = width*(1 - 2*Math.random());
		let y = width*(1 - 2*Math.random());
		let z = height*Math.random();
		let r2 = x*x + y*y + Math.pow(z - this.arm_lengths[0], 2);
		let len = this.arm_lengths.slice(1);
		if( z < 0 || r2 > max_r*max_r || r2 < min_r*min_r ) {
			this.start();
		} else {
			target.position.set(x, y, z);
			let beta = Math.atan2(y, x);
			let x1 = x*Math.cos(beta) + y*Math.sin(beta);
			let z1 = z - this.arm_lengths[0];
			let last_beta = this.joint_angles[0];
			this.joint_angles = [last_beta];
			this.cur_pos = [x1, z1];
			let pos_arr = this.via_point();
			pos_arr = this.interpolation(pos_arr);
			let delta = (beta - last_beta) % (2*pi);
			if( delta < -pi ) {
				delta += 2*pi;
			} else if ( delta > pi ){
				delta -= 2*pi;
			}
			delta = delta/pos_arr.length;
			this.show_trace(pos_arr, last_beta, delta);
			this.render(pos_arr, delta);
		}
	}
}

const pi = Math.PI;
var target, plane;
var arm0, arm1, arm2, arm3;
var len = [20, 15, 12, 16];
var width = len.slice(1).reduce( (i, j) => i+j);
var height = width + len[0];
var max_r = width;
var min_r = Math.max(len[2] + len[1] - len[0], len[0], len[2] + len[0] - len[1]);
var robot = new Robot(len, 2);
robot.last_pos = [max_r - 5, 1];
robot.init();
setTimeout( () => {
	robot.canvas = document.querySelector('canvas');
	robot.start();
}, 2000);


//通过x,y,z指定旋转中心改变x，y，z的顺序，obj是要旋转的对象
// position改变的是几何体相对于父级坐标系的位置而非中心。
function change_origin(pos, obj){
   	let wrapper = new THREE.Object3D();
    wrapper.position.set(...pos);
    wrapper.add(obj);
    obj.position.set(...pos.map(d => -d));
    return wrapper;
}

camera.position.set(0, height, 2*height);
camera.lookAt(new THREE.Vector3(0, 0, 0));
var controls = new THREE.TrackballControls(camera);
(function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
})();