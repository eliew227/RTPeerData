'use strict';

app.directive('appNavbar', function() {
	return {
		restrict: 'E',
		templateUrl: '/navbar/navbar.template.html',
		controller: function($scope, $rootScope) {
			$scope.logout = function() {
				$rootScope.loggedInUser = null;
			};
		}
	};
});