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
		if (loggedInUsers.indexOf(username) === -1) loggedInUsers.push(username);
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