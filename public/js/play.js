var cav,pen;
var width = height = 600;
var color = 0;//0表黑  1表白
var data = new Array();

function init( id ) {
	cav = document.getElementById(id);
	cav.width = 600;
	cav.height = 600;
	
	pen = cav.getContext("2d");
	
	//画横线
	pen.save();
	var y = 20;
	for( var i = 1;i < 16;i++ ) {
		pen.beginPath();
		pen.moveTo(y,0);
		pen.lineTo(y,600);
		pen.closePath();
		pen.stroke();
		
		pen.beginPath();
		pen.moveTo(0,y);
		pen.lineTo(600,y);
		pen.closePath();
		pen.stroke();
		
		y += 40;
	}
	pen.restore();
	
	for( var col = 0;col < 15;col++ ) {
		var temp = new Array();
		for( var row = 0;row < 15;row++ ) {
			temp[row] = -1;
		}
		data.push(temp);
	}
}

function play( flag ) {
	if( flag ) {
		cav.onmousedown = draw;
	} else {
		cav.onmousedown = null;
	}
}

function draw( event ) {
	var y = event.clientX - cav.offsetLeft;
	var x = event.clientY - cav.offsetTop;
	
	var row = Math.floor(x / 40);
	var col = Math.floor(y / 40);
	
	if( data[row][col] != -1 ) {
		return;
	} else {
		data[row][col] = color;
	}
	
	show(row,col,color);
	
	if( gameOve(row,col,color) ) {
		cav.onmousedown = null;
		socket.emit("game.over");
//		alert( (color ? "白子" : "黑子") + "赢了");
	}
	
	socket.emit("game.change",{"row":row,"col":col});
	cav.onmousedown = null;
}

function show( row,col,color ) {
	pen.beginPath();
	pen.arc(col * 40 + 20,row * 40 + 20,15,0,2 * Math.PI);
	if( color ) {
		pen.stroke();
	} else {
		pen.fill();
	}
	pen.closePath();
}

function gameOve( row,col,color ) {
	var count = 1;//计数
	
	//左找
	for( var i = col - 1;i >= 0;i-- ) { //向左，列在减小
		if( data[row][i] == color ) {
			count++;
		} else {
			break;
		}
	}
	//向右找
	for( var i = col + 1;i < 15;i++ ) {
		if( data[row][i] == color ) {
			count++;
		} else {
			break;
		}
	}
	
	if( count == 5 ) {
		return true;
	}
	
	count = 1;
	//上下找
	for( var i = row - 1; i >= 0;i-- ) {
		if( data[i][col] == color ) {
			count++;
		} else {
			break;
		}
	}
	for( var i = row + 1; i < 15;i++ ) {
		if( data[i][col] == color ) {
			count++;
		} else {
			break;
		}
	}
	
	if( count == 5 ) {
		return true;
	}
	
	count = 1;
	//左上右下
	for( var i = row - 1,j = col - 1;i >=0,j>=0;i--,j-- ) {
		if( data[i][j] == color ) {
			count++;
		} else {
			break;
		}
	}
	for( var i = row + 1,j = col + 1;i < 15,j < 15;i++,j++ ) {
		if( data[i][j] == color ) {
			count++;
		} else {
			break;
		}
	}
	
	if( count == 5 ) {
		return true;
	}
	
	count = 1;
	//右上左下
	for( var i = row - 1,j = col + 1;i >= 0,j < 15;i--,j++ ) {
		if( data[i][j] == color ) {
			count++;
		} else {
			break;
		}
	}
	for( var i = row + 1,j = col - 1;i < 15,j >= 0;i++,j-- ) {
		if( data[i][j] == color ) {
			count++;
		} else {
			break;
		}
	}
	
	if( count == 5 ) {
		return true;
	} else {
		return false;
	}
}