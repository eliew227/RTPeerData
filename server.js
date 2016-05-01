'use strict';

const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const socketio = require('socket.io');
const os = require('os');


const app = express();

const PORT = 4000;

const secureConfig = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};
const server = https.createServer(secureConfig, app);

server.listen(PORT, function() {
    console.log('Listening on port ' + PORT);
});

server.on('request', app);
const io = socketio(server);
let connectedSocketIds = [];

io.sockets.on('connection', function (socket){
    // keeping track of the connected sockets
    if(connectedSocketIds.indexOf(socket.id) === -1) connectedSocketIds.push(socket.id);
    console.log('Connected sockets:', connectedSocketIds);

    // convenience function to log server messages on the client
    function log(){
        var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('disconnect', function() {
        connectedSocketIds.splice(connectedSocketIds.indexOf(socket.id), 1);
        console.log('Remaining sockets:', connectedSocketIds);
    });

    socket.on('message', function (message, socketId) {
        log('Client said:', message);
        if (socketId) io.to(socketId).emit('message', message, socket.id);
        else console.log('no target recipient set');
        //socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function (room) {
        log('Request to create or join room ' + room);

        var numClients = connectedSocketIds.length;
        
        log('Room ' + room + ' has ' + numClients + ' client(s)');

        if (numClients === 1){
            socket.join(room);
            socket.emit('created', room, socket.id);
        } else {
            socket.join(room);
            socket.emit('joined', room, socket.id);
            socket.broadcast.to(room).emit('someone joined');
            io.sockets.in(room).emit('ready', socket.id, connectedSocketIds);
        } 

    });

});

app.use(express.static(path.join(__dirname, 'browser')));

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});