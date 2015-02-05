// Set up some general variables
var version = 3;
var usernames = {};

// Open connection on port 3000
var io = require('socket.io').listen(3000);

// Start listening to "chat" namespace
var chat = io
	.of('/chat')
	.on('connection', function (socket) {

		//If we get a chat event (in the chat namespace)
		socket.on('chat', function(msg){

			//Get the senders socket IP address, for logging/debug
			var address = socket.handshake.address;
			var date = new Date();

			//add the current timestamp to the msg object
			msg.time = date.toISOString();

			//send the msg back to all clients, log it
			chat.emit('chat', msg);
			console.log('Chat - '+ address +' - '+ msg.nick +' - '+ msg.time +' - '+ msg.message);
    		});
  	});

// Start listening to the "color" namespace
var color = io
	.of('/color')
	.on('connection', function (socket) {
		socket.on('color', function(msg){
			var address = socket.handshake.address;

			//Sends the color back to all
			color.emit('color', msg);
			console.log('Color -- ', address, ' -- ', msg);
    		});
  	});

// Start listening to the "server" namespace
var server = io
	.of('/server')
	.on('connection', function (socket) {
		var address = socket.handshake.address;

		// As soon as a new client connects, send them the server version
		socket.emit('version', version);

		// Handle the "joinnick" event, sent by the client on first connect
		socket.on('joinnick', function(msg){

			// Add their username to our list
			usernames[msg] = msg;

			// Assign their username to the socket
			socket.username = msg;

			// Send all users a welcome message
			server.emit('server', "Welcome " + msg + " hailing from "+ address);

			// Welcome just the user
			socket.emit('server', "Welcome user " + socket.id);
			console.log('Nick join: ' + address +' - '+ socket.id +' - '+ msg);
		});

		// Handle the "nickchange" event
		socket.on('nickchange', function(msg){

			// msg is an unnamed array, break out the components
			var bef = msg[0];
			var aft = msg[1];
			console.log('nickchange requested by ' + socket.id +' -- '+ bef +' -- '+ aft);
			
			// A list of banned usernames, must be lowercase
			var bannedNames = ["jod","server","god","shakataganai","snofox"];

			// Check to make sure that:
			//   - The new username isn't used by someone else
			//   - The currently sent username matches what is on their socket (so you can't change someone else)
			//   - The new username isn't in the list of banned usernames (Above)
			//   - The new username is more than 3 characters
			if(usernames[aft] != null || socket.username != bef || bannedNames.indexOf(aft.toLowerCase()) > -1 || aft.length < 3){

				// Checks above failed, let that client know their request was denied
				console.log('Rejecting nickchange ' + socket.id);
				socket.emit('server', "Nick change rejected");
			}else{
				// All checks above passed

				// Tell that client to change their username
				socket.emit('nickchange',[bef,aft]);

				// Tell all users that a nick was changed
				server.emit('server', bef + " is now known as " + aft);

				// Remove old username from array, add the new one
				delete usernames[bef];
				usernames[aft] = aft;

				// Change the sockets assigned username to the new one
				socket.username = aft;
				console.log('Completed nickchange ' + socket.id);
			}
		});

	});


// Handle non-namespace events
io.on('connection', function(socket){
	var address = socket.handshake.address;

	// On first connect, send back clients IP address - for debug
	socket.emit('server', address);

	// Log newly connected clients
	console.log('Connected: ', address, socket.id);

	socket.on('disconnect', function(){

		// Client disconnected - Remove username from array & log
		delete usernames[socket.username];
		console.log('Disconnected: ', address, socket.id);
	});
});
