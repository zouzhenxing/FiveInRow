var socket
$(function(){
	socket = io('http://127.0.0.1',{"autoConnect":false,"reconnection":false});
	
	$("#conn").click(function(){
		if( $(this).val() == "连接" ) {
			if( $("#username").val() == "" ) {
				alert("用户名不能为空!");
				return;
			}
			
			socket.connect();//连接服务器
		} else if( $(this).val() == "断开" ) {
			socket.close();
		}
	});
	
	$("#send").click(function(){ //发送消息
		socket.emit("message.add", {"message":$("#sendmes").val()});
	});
	
	socket.on("room.join",function( data ){
		$(".right").empty();
		var html = "<div><p>房间号：" + data.roomid + "<p>";
		html += "<p>玩家一：" + data.player1 + "</p>";
		html += "<p>玩家二：" + data.player2 + "</p>";
		$(".right").append(html);
		
		$("#message").append("<div>提示：进入房间"+ data.roomid+ "成功</div>");
	});
	socket.on("room.list",function( data ){
		$(".right").empty();
		for( var i = 0;i < data.length;i++ ) {
			var html = "<div><p>房间号：" + data[i].roomid + "<p>";
			html += "<p>玩家一：" + data[i].player1 + "</p>";
			html += "<p>玩家二：" + data[i].player2 + "</p>";
			if( data[i].count < 2) {
				html += "<p><input type='button' class='roomchange' roomid=" + data[i].roomid + " value='加入'></p></div>";
			}
			$(".right").append(html);
		}
		
		$(".right .roomchange").click(function(){
			socket.emit("room.change",{"roomid":$(this).attr("roomid")});
		});
	});
	//消息
	socket.on("message.list",function( data ){ //显示广播的消息
		$("#message").append("<div>" + data.uname + "说：" + data.message  +  "</div>");
		$("#message").scrollTop($("#message").height());
	});
	socket.on('connect', function(){
		socket.emit("user.add",{"username":$("#username").val()});
		$("#conn").val("断开");
		$("#username").attr("disabled",true);
		$("#message").append("<div>提示：连接服务器成功!</div>");
	});
	socket.on("user.list",function( online ){
		//清除原来的用户列表
		$("#online").empty();
		
		for(var id in online) {
			$("#online").append("<div>" + online[id].uname + "</div>")
		}
	});
	socket.on("disconnect",function() {
		$("#conn").val("连接");
		$("#username").attr("disabled",false);
		
		//清除原来的用户列表
		$("#online").empty();
		$("#message").append("<div>提示：与服务器断开成功!</div>");
	});
	
	socket.on("game.start",function( data ){
		$("#message").append("<div>提示：游戏开始，您是:"+ (data.flag?"先手":"后手") +"执" + (data.color ? "白":"黑") + "</div>");
		$(".right").empty().append("<canvas id='cav'></canvas>");
		
		color = data.color;
		init("cav");
		play(data.flag);
	});
	
	socket.on("game.change",function( data ) {
		show(data.row,data.col, color ? 0 : 1 );
		play( true );
	})
	
	socket.on("game.over",function( data ){
		if( data.iswin ) {
			alert("你赢了");
		} else {
			alert("你输了");
		}
	});
});
