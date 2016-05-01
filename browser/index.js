/****************************************************************************
 * Initial setup
 ****************************************************************************/

// *** SETTING UP LOGIN DETAILS
var app = angular.module('app', ['ui.router']);
var sendMessage;
var connectedSockets;
var isCreator;
var mySocketId;

app.config(function($urlRouterProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/');
});
app.run(function($rootScope, SocketFactory) {
    $rootScope.$on('$stateChangeError', function(e, n, np, p, pp, err) {
        console.error('State Change Error:', err);
    });
});



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
