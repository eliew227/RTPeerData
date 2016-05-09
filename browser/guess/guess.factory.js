app.factory('GuessFactory', function() {
	var GuessFactory = {};
	
	var guessHistory = [];
	var scoreHistory = []; //[[{username: Bob, score: 100}, {username: Adam, score: 0}], [{username: Bob, score: 0}, {username: Adam, score: 100}], ...]
	var totalScores = [];
	var currentGuesses = [];
	var myCurrentGuessNumber;
	var winners = [];

	GuessFactory.setWinners = function (theWinners) {
		angular.copy(theWinners, winners);
	};

	GuessFactory.getWinners = function () {
		return winners;
	};

	GuessFactory.setMyCurrentGuessNumber = function (number) {
		myCurrentGuessNumber = number;
	};
	
	GuessFactory.getMyCurrentGuessNumber = function () {
		return myCurrentGuessNumber;
	};

	GuessFactory.clearMyCurrentGuessNumber = function () {
		myCurrentGuessNumber = null;
	};

	GuessFactory.addCurrentGuess = function (guess) {
		currentGuesses.push(guess);
		currentGuesses.sort();
	};

	GuessFactory.addToScoreHistory = function (scoreboard) {
		scoreHistory.push(scoreboard);
		setTotalScores(scoreHistory);
	};

	GuessFactory.setScoreHistory = function (history) {
		console.log('setting score history', scoreHistory);
		if (history.length !== 0) {
			angular.copy(history, scoreHistory);
			setTotalScores(scoreHistory);
		}
	};	

	GuessFactory.getScoreHistory = function () {
		return scoreHistory;
	};

	GuessFactory.addToGuessHistory = function (guesses) {
		guessHistory.push(guesses);
	};

	GuessFactory.getGuessHistory = function () {
		return guessHistory;
	};	

	GuessFactory.getCurrentGuesses = function () {
		return currentGuesses;
	};

	GuessFactory.setCurrentGuesses = function (guesses) {
		angular.copy(guesses, currentGuesses);
	};

	GuessFactory.clearCurrentGuesses = function () {
		angular.copy([], currentGuesses);
	};

	GuessFactory.getTotalScores = function () {
		return totalScores;
	};

	function setTotalScores(history) {
		var obj = {}; // {Bob: 100, Adam: 100}
		var totalScoresTemp = [];
		scoreHistory.forEach(function(scorecard) {
			scorecard.forEach(function(score) {
				obj[score.username] = obj[score.username] || 0;
				obj[score.username] = obj[score.username] + score.score;
			});
		});
		for (var key in obj) {
			totalScoresTemp.push({
				username: key,
				totalScore: obj[key]
			});
		}
		console.log('totalScoresTemp', totalScoresTemp);
		angular.copy(totalScoresTemp, totalScores);		
	}

	return GuessFactory;
});