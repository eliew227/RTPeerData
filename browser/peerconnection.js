/**************************************************************************** 
 * WebRTC peer connection and data channel
 ****************************************************************************/

var peerConn = {};
var targetSocketId;
var dataChannel = {};

function signalingMessageCallback(message, fromSocketId) {
    if (message.type === 'offer') {
        console.log('Got offer. Sending answer to peer.');
        peerConn[fromSocketId].setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);
        targetSocketId = fromSocketId;
        console.log('***TargetSocketId in message callback', targetSocketId);
        peerConn[fromSocketId].createAnswer(onLocalSessionCreated, logError);

    } else if (message.type === 'answer') {
        console.log('Got answer.');
        peerConn[fromSocketId].setRemoteDescription(new RTCSessionDescription(message), function(){}, logError);

    } else if (message.type === 'candidate') {
        peerConn[fromSocketId].addIceCandidate(new RTCIceCandidate({candidate: message.candidate}));

    } else if (message === 'bye') {
        // TODO: cleanup RTC connection?
    }
}

function createRTCPeer (config, socketId) {
    var newRTCPeer = new RTCPeerConnection(config);

    // send any ice candidates to the other peer
    newRTCPeer.onicecandidate = function (event) {
        console.log('onIceCandidate event:', event);
        if (event.candidate) {
            sendMessage({
                type: 'candidate',
                label: event.candidate.sdpMLineIndex,
                id: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }, socketId);
        } else {
            console.log('End of candidates.');
        }
    };
    
    return newRTCPeer;    
}

function createPeerConnection(isThisInitiator, config, socketId) {
    console.log('Creating Peer connection as initiator?', isThisInitiator, 'config:', config);

    if (isThisInitiator) {
        peerConn[socketId] = createRTCPeer(config, socketId);
        console.log('Creating Data Channel');
        dataChannel[socketId] = peerConn[socketId].createDataChannel("photos");
        onDataChannelCreated(dataChannel[socketId]);

        console.log('Creating an offer');
        targetSocketId = socketId;
        console.log('***TargetSocketId in create', targetSocketId);
        peerConn[socketId].createOffer(onLocalSessionCreated, logError);
    } else {
        connectedSockets.forEach(function(socketId) {
            peerConn[socketId] = createRTCPeer(config, socketId);
            peerConn[socketId].ondatachannel = function (event) {
                console.log('ondatachannel:', event.channel);
                dataChannel[socketId] = event.channel;
                onDataChannelCreated(dataChannel[socketId]);
            };
        });
        isInitiator = true;
    }
}

function onLocalSessionCreated(desc) {
    console.log('local session created:', desc);
    peerConn[targetSocketId].setLocalDescription(desc, function () {
        console.log('sending local desc:', peerConn[targetSocketId].localDescription);
        sendMessage(peerConn[targetSocketId].localDescription, targetSocketId);
    }, logError);
}

function onDataChannelCreated(channel) {
    console.log('onDataChannelCreated:', channel);

    channel.onopen = function () {
        console.log('CHANNEL opened!!!');
    };

    channel.onmessage = receiveData();
    // channel.onmessage = (webrtcDetectedBrowser == 'firefox') ? 
    //     receiveDataFirefoxFactory() :
    //     receiveDataChromeFactory();
}

function sendData(data) {
    connectedSockets.forEach(function(socketId) {
        if(dataChannel[socketId]) dataChannel[socketId].send(data);
    });
}

function receiveData() {
    return function onmessage(event) {
        console.log(event.data);
    };
}

// function receiveDataChromeFactory() {
//     var buf, count;

//     return function onmessage(event) {
//         if (typeof event.data === 'string') {
//             buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
//             count = 0;
//             console.log('Expecting a total of ' + buf.byteLength + ' bytes');
//             return;
//         }

//         var data = new Uint8ClampedArray(event.data);
//         buf.set(data, count);

//         count += data.byteLength;
//         console.log('count: ' + count);

//         if (count == buf.byteLength) {
//             // we're done: all data chunks have been received
//             console.log('Done. Rendering photo.');
//             renderPhoto(buf);
//         }
//     }
// }

// function receiveDataFirefoxFactory() {
//     var count, total, parts;

//     return function onmessage(event) {
//         if (typeof event.data === 'string') {
//             total = parseInt(event.data);
//             parts = [];
//             count = 0;
//             console.log('Expecting a total of ' + total + ' bytes');
//             return;
//         }

//         parts.push(event.data);
//         count += event.data.size;
//         console.log('Got ' + event.data.size + ' byte(s), ' + (total - count) + ' to go.');

//         if (count == total) {
//             console.log('Assembling payload')
//             var buf = new Uint8ClampedArray(total);
//             var compose = function(i, pos) {
//                 var reader = new FileReader();
//                 reader.onload = function() { 
//                     buf.set(new Uint8ClampedArray(this.result), pos);
//                     if (i + 1 == parts.length) {
//                         console.log('Done. Rendering photo.');
//                         renderPhoto(buf);
//                     } else {
//                         compose(i + 1, pos + this.result.byteLength);
//                     }
//                 };
//                 reader.readAsArrayBuffer(parts[i]);
//             }
//             compose(0, 0);
//         }
//     }
// }
