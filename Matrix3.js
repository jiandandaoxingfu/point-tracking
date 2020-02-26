//3×3矩阵的方法
//矩阵用一维数组表示[1, 2, ..., 9];
var matrix3 = {
	transpose: function(M) {
		//求3×3矩阵的转置矩阵
		return [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]];
	},

	inverse: function(A) {
		//利用高斯消元法求3×3矩阵的逆（不精确）
		//(A, E)   ——>   (E, A^-1);
		//        行变换
		M = [
			[A[0], A[1], A[2], 1, 0, 0],
			[A[3], A[4], A[5], 0, 1, 0],
			[A[6], A[7], A[8], 0, 0, 1]
		];
		let n = M.length;
		//将左半部份化为上三角
		for (let i = 0; i < n; i++) {
			//交换使得对角元素非零
			if (M[i][i] === 0) {
				if (i === n - 1) {
					alert('矩阵不可逆');
					return;
				}
				let k = i + 1;
				while (k < n) {
					if (M[k][i] !== 0) {
						alternate_row(0, k, M);
					}
					k = k + 1;
				}
			}
			//使对角元素为1
			if (M[i][i] !== 1) {
				row_scale(i, M[i][i], M);
			}
			//将其下方元素全化为0
			for (let j = i + 1; j < n; j++) {
				row_add(-M[j][i], i, j, M);
			}
		}
		//将左半部份化为单位阵
		for (let i = 1; i < n; i++) {
			for (let j = 0; j < i; j++) {
				row_add(-M[j][i], i, j, M);
			}
		}
		//右半部份为逆
		return [M[0][3], M[0][4], M[0][5],
				M[1][3], M[1][4], M[1][5],
				M[2][3], M[2][4], M[2][5]
			   ];
	}, 

	alternate_row: function(i, j, M) {
		//alternate row i and j of M
		let p;
		for (let k = 0; k < 6; k++) {
			p = M[i][k];
			M[i][k] = M[j][k];
			M[j][k] = p;
		}
	}, 

	row_add: function(c, i, j, M) {
		//row j plus c times row i of M
		for (let k = 0; k < 6; k++) {
			M[j][k] += M[i][k] * c;
		}
	}, 

	row_scale: function(i, c, M) {
		//第i行除以c
		for (let k = 0; k < 6; k++) {
			M[i][k] = M[i][k] / c;
		}
	},

	multiply : function(a, b) {
		//矩阵相乘
		let A = [a.slice(0, 3), a.slice(3, 6), a.slice(6, 9)];
		let B = [b.slice(0, 3), b.slice(3, 6), b.slice(6, 9)];
		let C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
		for(let i=0; i<3; i++) {
			for(let j=0; j<3; j++) {
				C[i][j] = A[i][0]*B[0][j] + A[i][1]*B[1][j] + A[i][2]*B[2][j];
			}
		}
		return [C[0][0], C[0][1], C[0][2], 
				C[1][0], C[1][1], C[1][2], 
				C[2][0], C[2][1], C[2][2]];
	} 
}