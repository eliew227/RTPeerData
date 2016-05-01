app.factory('SocketFactory', function(RTCFactory) {
	var SocketFactory = {};

	var isInitiator;
    var configuration = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }, {"url":"stun:stun.services.mozilla.com"}] };

	// Connect to the signaling server
	var socket = io.connect();
	var room = window.location.pathname.substring(1);

	// Join a room
	socket.emit('create or join', room);

	socket.on('created', function(room, clientId) {
	    console.log('Created room', room, '- my client ID is', clientId);
	    mySocketId = clientId;
	    isInitiator = true;
	    isCreator = true;
	});

	socket.on('joined', function(room, clientId) {
	    console.log('This peer has joined room', room, 'with client ID', clientId);
	    mySocketId = clientId;
	    isInitiator = false;
	});

	socket.on('someone joined', function () {
		isInitiator = true;
	});

	socket.on('ready', function(socketId, allConnectedSockets) {
	    allConnectedSockets.splice(allConnectedSockets.indexOf(mySocketId),1);
	    connectedSockets = allConnectedSockets;

	    RTCFactory.createPeerConnection(isInitiator, configuration, socketId);
	});

	socket.on('log', function(array) {
	    console.log.apply(console, array);
	});

	socket.on('message', function(message, fromSocketId) {
	    console.log('Client received message:', message);
	    RTCFactory.signalingMessageCallback(message, fromSocketId);
	});


	/**
	 * Send message to signaling server
	 */
	sendMessage = function (message, socketId) {
	    console.log('Client sending message: ', message);
	    socket.emit('message', message, socketId);
	};


	return SocketFactory;
});