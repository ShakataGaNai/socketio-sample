var version = 2;
var io = require('socket.io').listen(3000);
var chat = io
	.of('/chat')
	.on('connection', function (socket) {
		socket.on('chat', function(msg){
			var address = socket.handshake.address;
			chat.emit('chat', msg);
			console.log('Chat -- ', address, ' -- ', msg[0], ' -- ', msg[1]);
    		});
  	});

var color = io
	.of('/color')
	.on('connection', function (socket) {
		socket.on('color', function(msg){
			var address = socket.handshake.address;
			color.emit('color', msg);
			console.log('Color -- ', address, ' -- ', msg);
    		});
  	});

var server = io
	.of('/server')
	.on('connection', function (socket) {
		var address = socket.handshake.address;
		socket.emit('server', "Welcome " + address);
		socket.emit('version', version);
	});


io.on('connection', function(socket){
	var address = socket.handshake.address;
	socket.emit('server', address);

//	socket.on('chat', function(msg){
//		console.log("Msg: ",msg);
//	});

	console.log('Connected: ', address);

	socket.on('disconnect', function(){
		console.log('Disconnected: ', address);
	});
});
