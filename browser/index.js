/****************************************************************************
 * Initial setup
 ****************************************************************************/

// *** SETTING UP LOGIN DETAILS
var app = angular.module('app', ['ui.router']);
app.config(function($urlRouterProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
});
app.run(function($rootScope) {
    $rootScope.$on('$stateChangeError', function(e, n, np, p, pp, err) {
        console.error('State Change Error:', err);
    });
});



// var name = prompt("Enter your name:");
// var password = CryptoJS.SHA3(prompt("Enter your password:"), { outputLength: 512 });
// Receive databases from peers

// Check if name exists in most of the databases

// If name does not exist in most of the databases then send login details (name and password) to peers

// If name does exist, get the hashed password from the databases and compare to local password value

// If does not match, then throw error and show error message

// If it does match, then allow rest of app to continue




var configuration = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };
// {"url":"stun:stun.services.mozilla.com"}



// var roomURL = document.getElementById('url');
// var video = document.getElementsByTagName('video')[0];
// var photo = document.getElementById('photo');
// var canvas = photo.getContext('2d');
// var trail = document.getElementById('trail');
// var snapBtn = document.getElementById('snap');
// var sendBtn = document.getElementById('send');
// var snapAndSendBtn = document.getElementById('snapAndSend');
// var canvasWidth;
// var canvasHeight;

// // Attach even handlers
// video.addEventListener('play', setCanvasDimensions);
// snapBtn.addEventListener('click', snapPhoto);
// sendBtn.addEventListener('click', sendPhoto);
// snapAndSendBtn.addEventListener('click', snapAndSend);

// Create a random room if not already present in the URL.
var isInitiator;
var mySocketId;
var connectedSockets;
var room = window.location.pathname.substring(1);
// if (!room) {
//     room = window.location.hash = randomToken();
// }


/****************************************************************************
 * Signaling server 
 ****************************************************************************/

// Connect to the signaling server
var socket = io.connect();

// socket.on('ipaddr', function(ipaddr) {
//     console.log('Server IP address is: ' + ipaddr);
//     updateRoomURL(ipaddr);
// });

socket.on('created', function(room, clientId) {
    console.log('Created room', room, '- my client ID is', clientId);
    isInitiator = true;
});

socket.on('joined', function(room, clientId) {
    console.log('This peer has joined room', room, 'with client ID', clientId);
    mySocketId = clientId;
    isInitiator = false;
});

socket.on('ready', function(socketId, allConnectedSockets) {
    allConnectedSockets.splice(allConnectedSockets.indexOf(mySocketId),1);
    connectedSockets = allConnectedSockets;
    createPeerConnection(isInitiator, configuration, socketId);
});

socket.on('log', function(array) {
    console.log.apply(console, array);
});

socket.on('message', function(message, fromSocketId) {
    console.log('Client received message:', message);
    signalingMessageCallback(message, fromSocketId);
});

// Join a room
socket.emit('create or join', room);

// if (location.hostname.match(/localhost|127\.0\.0/)) {
//     socket.emit('ipaddr');
// }

/**
 * Send message to signaling server
 */
function sendMessage(message, socketId) {
    console.log('Client sending message: ', message);
    socket.emit('message', message, socketId);
}

// /**
//  * Updates URL on the page so that users can copy&paste it to their peers.
//  */
// function updateRoomURL(ipaddr) {
//     var url;
//     if (!ipaddr) {
//         url = location.href
//     } else {
//         url = location.protocol + '//' + ipaddr + ':2013/#' + room
//     }
//     roomURL.innerHTML = url;
// }
