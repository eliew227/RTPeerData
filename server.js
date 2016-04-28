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

io.sockets.on('connection', function (socket){

    // convenience function to log server messages on the client
    function log(){
        var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('message', function (message) {
        log('Client said:', message);
        // for a real app, would be room only (not broadcast)
        socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function (room) {
        log('Request to create or join room ' + room);

        var clients = io.sockets.adapter.rooms[room]; 
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 1;
        
        log('Room ' + room + ' has ' + numClients + ' client(s)');

        if (numClients === 1){
            socket.join(room);
            socket.emit('created', room, socket.id);
        } else if (numClients === 2) {
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');

        } else { // max two clients
            socket.emit('full', room);
        }
    });

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family=='IPv4' && details.address != '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
          });
        }
    });

});




// app.use(express.static(__dirname + '/node_modules'));
app.use(express.static(path.join(__dirname, 'browser')));
// app.use(express.static(path.join(__dirname, 'public')));

app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});
