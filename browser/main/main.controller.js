'use strict';

app.controller('MainCtrl', function($scope, RTCFactory, LoginFactory, SocketFactory, GuessFactory) {
	$scope.shouldDisableSubmit = function() {
		return GuessFactory.getMyCurrentGuessNumber();
	};
	
	$scope.lastRoundWinners = GuessFactory.getWinners();

	$scope.submitNumber = function() {
		var data = {
			type: 'guess',
			number: CryptoJS.SHA3($scope.numberInput + '', { outputLength: 256 }).words.join(''),
			from: {socketId: SocketFactory.mySocketId, username: $scope.myUsername}
		};
		GuessFactory.setMyCurrentGuessNumber($scope.numberInput);
		GuessFactory.addCurrentGuess(data);
		LoginFactory.addSubmittedForLoggedInUser($scope.myUsername);
		RTCFactory.sendData(data);
		// If last one submitting guess, then also need to send out all guesses
		console.log('current guesses', GuessFactory.getCurrentGuesses());
		console.log('logged in users', LoginFactory.getLoggedInUsers());
		if (GuessFactory.getCurrentGuesses().length === LoginFactory.getLoggedInUsers().length) {
			console.log('last to submit');
			var allGuesses = {
                type: 'guessCheck',
                guesses: GuessFactory.getCurrentGuesses(),
                hash: CryptoJS.SHA3(JSON.stringify(GuessFactory.getCurrentGuesses()), { outputLength: 256 }).words.join(''),
                guessNumber: GuessFactory.getMyCurrentGuessNumber(),
                from: {socketId: SocketFactory.mySocketId, username: LoginFactory.getMyUsername()}
            };
            RTCFactory.sendData(allGuesses);
            LoginFactory.clearSubmissionsForAllLoggedInUser();
		}
		$scope.numberInput = '';
	};

	$scope.myUsername = LoginFactory.getMyUsername();
	$scope.loggedInUsers = LoginFactory.getLoggedInUsers();

	$scope.totalScores = GuessFactory.getTotalScores();
	
});