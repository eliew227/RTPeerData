app.factory('LoginFactory', function() {
	var LoginFactory = {};
	var userList = [];
	var loggedInUsers = [];
	var myUsername;

	LoginFactory.getMyUsername = function () {
		return myUsername;
	};

	LoginFactory.setMyUsername = function (username) {
		myUsername = username;
	};

	LoginFactory.getLoggedInUsers = function () {
		return loggedInUsers;
	};

	LoginFactory.addLoggedInUser = function (username) {
		var newUser = {
			username: username,
			submitted: false
		};
		if (loggedInUsers.filter(function(user) {return user.username === username;}).length === 0) {
			loggedInUsers.push(newUser);
		}
	};

	LoginFactory.addSubmittedForLoggedInUser = function (username) {
		for (var i = 0; i < loggedInUsers.length; i++) {
			if (loggedInUsers[i].username === username) loggedInUsers[i].submitted = true;
		}
	};

	LoginFactory.clearSubmissionsForAllLoggedInUser = function () {
		for (var i = 0; i < loggedInUsers.length; i++) {
			loggedInUsers[i].submitted = false;
		}
	};

	LoginFactory.getUsers = function () {
		return userList;
	};

	LoginFactory.setUsers = function (updatedUserList) {
		angular.copy(updatedUserList, userList);
	};

	LoginFactory.addUser = function (userData) {
		if (userList.map(function(user) {return user.username;}).includes(userData.username)) {
			userList.push(userData);
		}
	};

	LoginFactory.addSelfToUserList = function (thisUser) {
		userList.push(thisUser);
	};

	LoginFactory.prepareUserToBeChecked = function (thisUser) {
		return angular.merge(thisUser, {type: 'loginUser', fromSocketId: mySocketId});
	};

	return LoginFactory;
});