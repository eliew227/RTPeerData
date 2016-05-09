app.factory('RTCFactory', function($log, $state, $rootScope, GuessFactory, LoginFactory) {
    var RTCFactory = {};

    var peerConn = {};
    var targetSocketId;
    var dataChannel = {};

    var userListArray = [];
    var guessArray = [];
    var guessNumberArray = [];    

    RTCFactory.signalingMessageCallback = function(message, fromSocketId) {
        if (message.type === 'offer') {
            console.log('Got offer. Sending answer to peer.');
            peerConn[fromSocketId].setRemoteDescription(new RTCSessionDescription(message), function() {}, $log.error);
            targetSocketId = fromSocketId;
            peerConn[fromSocketId].createAnswer(onLocalSessionCreated, $log.error);
        } else if (message.type === 'answer') {
            console.log('Got answer.');
            peerConn[fromSocketId].setRemoteDescription(new RTCSessionDescription(message), function() {}, $log.error);
        } else if (message.type === 'candidate') {
            peerConn[fromSocketId].addIceCandidate(new RTCIceCandidate({ candidate: message.candidate }));
        }
    };

    RTCFactory.createPeerConnection = function(isThisInitiator, config, socketId) {
        console.log('Creating Peer connection as initiator?', isThisInitiator, 'config:', config);

        if (isThisInitiator) {
            peerConn[socketId] = createRTCPeer(config, socketId);
            dataChannel[socketId] = peerConn[socketId].createDataChannel("photos", { 
                ordered: false,
                maxRetransmitTime: 3000
            });
            onDataChannelCreated(dataChannel[socketId]);

            targetSocketId = socketId;
            peerConn[socketId].createOffer(onLocalSessionCreated, $log.error);
        } else {
            connectedSockets.forEach(function(socketId) {
                peerConn[socketId] = createRTCPeer(config, socketId);
                peerConn[socketId].ondatachannel = function(event) {
                    dataChannel[socketId] = event.channel;
                    onDataChannelCreated(dataChannel[socketId]);
                };
            });
        }
    };

    function createRTCPeer(config, socketId) {
        var newRTCPeer = new RTCPeerConnection(config);

        newRTCPeer.onicecandidate = function(event) {
            console.log('onIceCandidate event:', event);
            if (event.candidate) {
                sendMessage({
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                }, socketId);
            }
        };

        return newRTCPeer;
    }

    function onDataChannelCreated(channel) {
        channel.onopen = function() {
            var readyState = channel.readyState;
            if (readyState == 'open') {
                console.log('************************** CHANNEL opened!!!', channel);
            }
        };

        channel.onclose = function () {
            console.log('CHANNEL closed');
        };

        channel.onmessage = receiveData();
        // channel.onmessage = (webrtcDetectedBrowser == 'firefox') ? 
        //     receiveDataFirefoxFactory() :
        //     receiveDataChromeFactory();
    }

    function onLocalSessionCreated(desc) {
        peerConn[targetSocketId].setLocalDescription(desc, function() {
            sendMessage(peerConn[targetSocketId].localDescription, targetSocketId);
        }, $log.error);
    }

    RTCFactory.sendData = function(data) {
        data = JSON.stringify(data);
        connectedSockets.forEach(function(socketId) {
            console.log('sending data to ', socketId);
            if (dataChannel[socketId] && dataChannel[socketId].readyState === 'open') dataChannel[socketId].send(data);
        });
    };

    function sendUserListAndScoreData (data, localUserList) {
        console.log('score history to send', GuessFactory.getScoreHistory());
        var dataToSend = {
            userList: localUserList,
            scoreHistory: GuessFactory.getScoreHistory(),
            type: 'userListAndScoreHistory',
            hash: CryptoJS.SHA3(JSON.stringify(localUserList), { outputLength: 256 }).words.join(''),
            userToCheck: { username: data.username, password: data.password, fromSocketId: data.fromSocketId },
            from: {socketId: mySocketId, username: LoginFactory.getMyUsername()}
        };
        console.log('data being sent', dataToSend);
        RTCFactory.sendData(dataToSend);
    }

    function handleLoginRequest (userData, localUserList) {
        var status = getUserAuthenticationStatus(userData, localUserList);
        var toAddThisUser = {
            username: userData.username,
            password: userData.password
        };
        if (status === 'invalid') {
            console.log('disconnecting invalid user');
            disconnectPeer(userData.fromSocketId);
        }
        if (status === 'newUser') {
            console.log('adding new user to userList');
            LoginFactory.addUser(toAddThisUser);
            LoginFactory.addLoggedInUser(toAddThisUser.username);
        }
        if (status === 'authenticated') {
            console.log('another user just logged in');
            LoginFactory.addLoggedInUser(toAddThisUser.username);
        }
    }

    function receiveData() {
        return function onmessage(event) {
            var localUserList = LoginFactory.getUsers().slice();
            var data = JSON.parse(event.data);
            var openDataChannels = [];
            for (var key in dataChannel) {
                if (dataChannel[key].readyState === 'open') {
                    openDataChannels.push(dataChannel[key]);
                }
            }

            if (data.type === 'loginUser') {
                sendUserListAndScoreData(data, localUserList);
                if (openDataChannels.length === 1) {
                    console.log('CREATOR CHECKING');
                    handleLoginRequest(data, localUserList);
                }
            }

            if (data.type === 'userListAndScoreHistory') {
                console.log('data received', data);
                userListArray.push(data);

                // Update list of logged in users as they come in
                LoginFactory.addLoggedInUser(data.from.username);

                var numberOfUserListsToReceive;
                if (data.userToCheck.fromSocketId === mySocketId) numberOfUserListsToReceive = openDataChannels.length;
                else numberOfUserListsToReceive = openDataChannels.length - 1;

                // Only proceed when all userLists from peers received
                if (userListArray.length === numberOfUserListsToReceive) {
                    console.log('ALL USERLIST RECEIVED');
                    // make sure to include local userList in userListArray
                    userListArray.push({
                        userList: localUserList,
                        scoreHistory: GuessFactory.getScoreHistory(),
                        type: 'userListAndScoreHistory',
                        hash: CryptoJS.SHA3(JSON.stringify(localUserList), { outputLength: 256 }).words.join('')
                    });

                    // Get the most common userList and update local userList
                    var mostCommonUserListAndScoreHistory = getMostCommonBasedOnHash(userListArray);
                    var mostCommonUserList = mostCommonUserListAndScoreHistory.userList;
                    LoginFactory.setUsers(mostCommonUserList);

                    var mostCommonScoreHistory = mostCommonUserListAndScoreHistory.scoreHistory;
                    console.log('mostCommonScoreHistory',mostCommonScoreHistory);

                    GuessFactory.setScoreHistory(mostCommonScoreHistory);

                    var potentialNewUser = {
                        username: data.userToCheck.username,
                        password: data.userToCheck.password
                    };

                    // Logic if this peer is the one being checked
                    if (data.userToCheck.fromSocketId === mySocketId) {
                        console.log('CHECKING SELF');
                        var userStatus = getUserAuthenticationStatus(data.userToCheck, mostCommonUserList);
                        if (userStatus === 'invalid') {
                            console.log('disconnecting as incorrect credentials');
                            connectedSockets.forEach(function(socketId) {
                                disconnectPeer(socketId);
                            });
                            document.location.reload(true);
                        }
                        if (userStatus === 'newUser') {
                            console.log('adding this user to userList');
                            LoginFactory.addUser(potentialNewUser);
                            LoginFactory.addLoggedInUser(data.userToCheck.username);
                            LoginFactory.setMyUsername(data.userToCheck.username);
                            $state.go('main');
                        }
                        if (userStatus === 'authenticated') {
                            console.log('Authenticated and logged in');
                            LoginFactory.addLoggedInUser(data.userToCheck.username);
                            LoginFactory.setMyUsername(data.userToCheck.username);

                            $state.go('main');
                        }
                    } else { //Logic if this peer is checking another peer
                        console.log('CHECKING ANOTHER PEER');
                        handleLoginRequest (data.userToCheck, mostCommonUserList);
                    }
                    //clear userListArray when done
                    angular.copy([], userListArray);
                }
            }
            if (data.type === 'guess') {
                console.log('guess received', data);
                GuessFactory.addCurrentGuess(data);
                LoginFactory.addSubmittedForLoggedInUser(data.from.username);

                console.log('rec guess current guesses', GuessFactory.getCurrentGuesses());
                console.log('rec guess logged in users', LoginFactory.getLoggedInUsers());
                if (GuessFactory.getCurrentGuesses().length === LoginFactory.getLoggedInUsers().length) {
                    console.log('got all guesses');
                    var allGuesses = {
                        type: 'guessCheck',
                        guesses: GuessFactory.getCurrentGuesses(),
                        hash: CryptoJS.SHA3(JSON.stringify(GuessFactory.getCurrentGuesses()), { outputLength: 256 }).words.join(''),
                        guessNumber: GuessFactory.getMyCurrentGuessNumber(),
                        from: {socketId: mySocketId, username: LoginFactory.getMyUsername()}
                    };
                    RTCFactory.sendData(allGuesses);
                    LoginFactory.clearSubmissionsForAllLoggedInUser();
                }
            }


            if (data.type === 'guessCheck') {
                console.log('guessCheck received');
                guessArray.push(data);
                guessNumberArray.push({
                    guessNumber: data.guessNumber,
                    from: data.from
                });

                console.log('guessNumberArray', guessNumberArray);

                console.log('guessArray', guessArray);
                console.log('logged in users', LoginFactory.getLoggedInUsers())
                if (guessArray.length === LoginFactory.getLoggedInUsers().length - 1) {
                    console.log('got all guessCheck data');

                    guessArray.push(GuessFactory.getCurrentGuesses());
                    var mostCommonCurrentGuesses = getMostCommonBasedOnHash(guessArray);

                    console.log('***MOST COMMON GUESSES', mostCommonCurrentGuesses);

                    // Add this peer's guess into guessNumberArray
                    guessNumberArray.push({
                        guessNumber: GuessFactory.getMyCurrentGuessNumber(),
                        from: {socketId: mySocketId, username: LoginFactory.getMyUsername()}
                    });
                    console.log('guessNumberArray', guessNumberArray);

                    // Need to check that guess numbers match encrypted submissions
                        // If not, remove guess numbers
                    guessNumberArray.forEach(function (guess, index) {
                        var encryptedNumber = mostCommonCurrentGuesses.guesses.filter(function(encryptedGuess) {
                            return guess.from.username === encryptedGuess.from.username;
                        })[0].number;

                        var guessNumberHash = CryptoJS.SHA3(guess.guessNumber + '', { outputLength: 256 }).words.join('');
                        if (guessNumberHash !== encryptedNumber) guessNumberArray.splice(index, 1);
                    });

                    // Need to calculate average and set winner with 100 points
                    console.log('guessNumberArray', guessNumberArray);
                    var average = guessNumberArray.reduce(function(prev, curr) {
                        return prev + Number(curr.guessNumber);
                    }, 0) / guessNumberArray.length;
                    console.log('average:', average);

                    var distanceFromAverage = guessNumberArray.map(function(guess) {
                        return {
                            guessNumber: guess.guessNumber,
                            from: guess.from,
                            distance: Math.abs(guess.guessNumber - average)
                        };
                    });

                    var minDistance = distanceFromAverage.map(function(guess){
                        return guess.distance;
                    })
                    .reduce(function(prev, curr) {
                        if (curr < prev) return curr;
                        else return prev;   
                    });

                    console.log(minDistance);
                    var scoreboard = [];
                    var winners = [];
                    distanceFromAverage.forEach(function(guess) {
                        if (guess.distance === minDistance) {
                            scoreboard.push({
                                username: guess.from.username,
                                score: 100
                            });
                            winners.push(guess.from.username);
                        } else {
                            scoreboard.push({
                                username: guess.from.username,
                                score: 0
                            });
                        }
                    });

                    console.log('scoreboard', scoreboard);

                    GuessFactory.addToScoreHistory(scoreboard);

                    // Need to set guess history and clear current guesses
                    GuessFactory.addToGuessHistory(mostCommonCurrentGuesses);
                    GuessFactory.setWinners(winners);

                    GuessFactory.clearCurrentGuesses();
                    GuessFactory.clearMyCurrentGuessNumber();

                    angular.copy([], guessArray);
                    angular.copy([], guessNumberArray);

                } 
            }
            $rootScope.$evalAsync();
        };
    }

    function disconnectPeer(socketId) {
        dataChannel[socketId].close();
        dataChannel[socketId] = null;
        peerConn[socketId].close();
        peerConn[socketId] = null;
    }

    function getUserAuthenticationStatus(userToCheck, listOfUsers) {
        var userExists = listOfUsers.filter(function(user) {
            return userToCheck.username === user.username;
        })[0];

        if (!userExists) return 'newUser';
        if (userExists && userExists.password === userToCheck.password) return 'authenticated';
        return 'invalid';
    }

    function getMostCommonBasedOnHash(array) {
        var mostCommonIndex = array
            .map(function(object) {
                return object.hash;
            })
            .reduce(function(prev, curr, index) {
                prev[curr] = prev[curr]++ || 1;
                if (prev[curr] > prev.max) {
                    prev.max = prev[curr];
                    prev.maxhash = curr;
                    prev.index = index;
                }
                return prev;
            }, { max: 0 })
            .index;

        return array[mostCommonIndex];
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



    return RTCFactory;
});
