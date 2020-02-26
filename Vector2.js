class Vector2 {
	rotate(AB, alpha) {
		//线段AB逆时针(以原点为中心)旋转alpha。
		let mat = [
			[Math.cos(alpha), -Math.sin(alpha)],
			[Math.sin(alpha), Math.cos(alpha)]
		];
		return [mat[0][0] * AB[0] + mat[0][1] * AB[1], mat[1][0] * AB[0] + mat[1][1] * AB[1]];
	}

	translate(point, translate_) {
		return [point[0] + translate_[0], point[1] + translate_[1] ];
	}

	transform(OA, alpha, translate_) {
		// 旋转alpha，然后平移
		OA = this.rotate(OA, alpha);
		return this.translate(OA, translate_);
	}

	normlize(v) {
		//单位化
		let length_v = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
		return [v[0] / length_v, v[1] / length_v];
	}

	distance(a, b) {
		if(b == undefined) b = [0, 0];
		return Math.sqrt((a[0] - b[0])*(a[0] - b[0]) + (a[1] - b[1])*(a[1] - b[1]));
	}

	dot(a, b) {
		//向量点乘
		return a[0] * b[0] + a[1] * b[1];
	}

	a_angle_b(a, b) {
		//获取向量a，b的夹角。
		return Math.acos(this.dot(a, b) / (this.distance(a)*this.distance(b)));
	}
}

vector2 = new Vector2();