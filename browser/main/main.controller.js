'use strict';

app.controller('MainCtrl', function($scope) {
	$scope.submitNumber = function() {
		console.log($scope.numberInput);
		sendData($scope.numberInput);
	};
});