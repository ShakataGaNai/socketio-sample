var version = 3;
var usernames = {};

var io = require('socket.io').listen(3000);
var chat = io
	.of('/chat')
	.on('connection', function (socket) {
		socket.on('chat', function(msg){
			var address = socket.handshake.address;
			var date = new Date();
			msg.time = date.toISOString();
			chat.emit('chat', msg);
			console.log('Chat - '+ address +' - '+ msg.nick +' - '+ msg.time +' - '+ msg.message);
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
		socket.emit('version', version);

		socket.on('joinnick', function(msg){
			usernames[msg] = msg;
			socket.username = msg;
			server.emit('server', "Welcome " + msg + " hailing from "+ address);
			socket.emit('server', "Welcome user " + socket.id);
			console.log('Nick join: ' + address +' - '+ socket.id +' - '+ msg);
		});

		socket.on('nickchange', function(msg){
			var bef = msg[0];
			var aft = msg[1];
			console.log('nickchange requested by ' + socket.id +' -- '+ bef +' -- '+ aft);
			
			var bannedNames = ["jod","server","god","shakataganai","snofox"];

			if(usernames[aft] != null || socket.username != bef || bannedNames.indexOf(aft.toLowerCase()) > -1 || aft.length < 3){
				console.log('Rejecting nickchange ' + socket.id);
				socket.emit('server', "Nick change rejected");
			}else{
				socket.emit('nickchange',[bef,aft]);
				server.emit('server', bef + " is now known as " + aft);
				delete usernames[bef];
				usernames[aft] = aft;
				socket.username = aft;
				console.log('Completed nickchange ' + socket.id);
			}
		});

	});



io.on('connection', function(socket){
	var address = socket.handshake.address;
	socket.emit('server', address);

//	socket.on('chat', function(msg){
//		console.log("Msg: ",msg);
//	});

	console.log('Connected: ', address, socket.id);

	socket.on('disconnect', function(){
		delete usernames[socket.username];
		console.log('Disconnected: ', address, socket.id);
	});
});
