app.factory('GuessFactory', function() {
	var GuessFactory = {};
	
	var guessHistory = [];
	var currentGuesses = [];
	var myCurrentGuessNumber;

	GuessFactory.setMyCurrentGuessNumber = function (number) {
		myCurrentGuessNumber = number;
	};
	
	GuessFactory.getMyCurrentGuessNumber = function () {
		return myCurrentGuessNumber;
	};

	GuessFactory.addCurrentGuess = function (guess) {
		currentGuesses.push(guess);
		currentGuesses.sort();
	};

	GuessFactory.getCurrentGuesses = function () {
		return currentGuesses;
	};

	return GuessFactory;
});