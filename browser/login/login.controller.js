'use strict';

app.controller('LoginCtrl', function($scope, LoginFactory, SocketFactory, $state, RTCFactory) {
	$scope.submitLogin = function() {
		var password = CryptoJS.SHA3($scope.user.password, { outputLength: 256 }).words.join('');
		var thisUser = {
			username: $scope.user.username,
			password: password
		};
		if(isCreator)	{
			LoginFactory.addSelfToUserList(thisUser);
			LoginFactory.setMyUsername(thisUser.username);
			LoginFactory.addLoggedInUser(thisUser.username);
			$state.go('main');
		} else {
			RTCFactory.sendData(LoginFactory.prepareUserToBeChecked(thisUser));
		}		
	};
});


// Send validate request to all other peers

// Peers receive request and send their userList to all peers

// Each peer checks each userList they receive and goes with the most similar list

// If username exists in most similar userList and password matches, then login

// If username exists in most similar userList but password does not match, then disconnect peer making request
	// for peer making request, disconnect all other peers and maybe refresh login page

// If name does not exist in most similar userList, then add new user to userList 
	// peer goes to game state