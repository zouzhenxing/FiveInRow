var express = require('express');
var app = express(); //创建服务器
app.use(express.static('public'));
var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});

var online = {};
var rooms = new Array();
for(var i = 1;i <= 16;i++) {
	rooms.push({"roomid":i,"player1":"","player2":"","count":0});
}

var io = require('socket.io')(server);
io.on("connect",function( socket ){ //表示与客户的一个联接
	socket.join("public");
	
	socket.on("user.add",function( data ){
		online[socket.id] = {"uname":data.username,"room":"public"};
		
		io.sockets.in("public").emit("user.list",online);
		io.sockets.in("public").emit("room.list",rooms);
	});
	
	socket.on("disconnect",function(){
			//如果在public房间中，直接将用户信息删除
			var roomid = online[socket.id].room; //当前玩家的房间id
			if( roomid == "public" ) {
				delete online[socket.id];
				io.sockets.in("public").emit("user.list",online);
			} else {
				var failder = online[socket.id].uname;
				//在rooms中找到当前的room
				var room;
				for( var i = 0;i < rooms.length;i++ ) {
					if( rooms[i].roomid == roomid ) {
						room = rooms[i];
						break;
					}
				}
				var winer = room.player1 == failder ? room.player2 : room.player1;
				room.player1 = room.player2 = "";
				room.count = 0;
			
				io.of("/").in(roomid).clients(function( err,clients ) {
					io.sockets.sockets[clients[0]].emit("game.over",{"iswin":true});
					io.sockets.sockets[clients[0]].leave(roomid).join("public");
					
					delete online[socket.id];
					io.sockets.in("public").emit("message.list",{"uname":winer,"message":failder + "小样你输了吧!"});
					io.sockets.in("public").emit("room.list",rooms);
					io.sockets.in("public").emit("user.list",online);
				});
			}
	});
	
	socket.on("message.add",function( data ) {
		var user = online[socket.id];
		data.uname = user.uname;
		
		//广播当前房间
		io.sockets.in(user.room).emit("message.list",data);
	});
	
	socket.on("room.change",function( data ) {
		//从public房间退出，进入data.roomname的房间
		socket.leave("public").join(data.roomid);
		online[socket.id].room = data.roomid;
		var room;
	  for( var i = 0;i < rooms.length;i++ ) {
	  	  if( rooms[i].roomid == data.roomid  ) {
	  	  	  room = rooms[i];
	  	  }
	  }
	  
	  io.of("/").in(data.roomid).clients(function( error,clients ){
	  	room.count = clients.length;
	  	room.player1 =  clients[0] ? online[clients[0]].uname : "";
	  	room.player2 =  clients[1] ? online[clients[1]].uname : "";
	  	
	  	//广播public，改房间
	  	io.sockets.in("public").emit("room.list",rooms);
	  	//改变自己的房间
	  	io.sockets.in(data.roomid).emit("room.join",room);
	  	
	  	if( clients.length == 2 ) {
	  		socket.in(data.roomid).emit("game.start",{"flag":true,"color":1});//玩家一先手执白
	  		socket.emit("game.start",{"flag":false,"color":0});//玩家二后手执黑
	  	}
	  });
	});

	//交换游戏的数据
	socket.on("game.change",function( data ){
		socket.in(online[socket.id].room).emit("game.change",data);
	});
	
	//游戏结束
	socket.on("game.over",function(){
		var roomid = online[socket.id].room; //当前玩家的房间
		//在rooms中找到当前的room
		var room;
		for( var i = 0;i < rooms.length;i++ ) {
			if( rooms[i].roomid == roomid ) {
				room = rooms[i];
				break;
			}
		}
		
		var winer = online[socket.id].uname; //赢家的名称
		var failder = room.player1 == winer ? room.player2 : room.player1;
		
		//清空room
		room.player1 = room.player2 = "";
		room.count = 0;
		
		//通知玩家一、玩家二
		socket.emit("game.over",{"iswin":true});
		socket.in(roomid).emit("game.over",{"iswin":false});
		
		//进入server roomid的房间
		io.of("/").in(roomid).clients(function( err,clients ) {
			io.sockets.sockets[clients[0]].leave(roomid).join("public");
			io.sockets.sockets[clients[1]].leave(roomid).join("public");
			//当前的房间号
			online[clients[0]].room = "public";
			online[clients[1]].room = "public";
			
			io.sockets.in("public").emit("message.list",{"uname":winer,"message":failder + "小样你输了吧!"});
			io.sockets.in("public").emit("room.list",rooms);
		});
	});
});