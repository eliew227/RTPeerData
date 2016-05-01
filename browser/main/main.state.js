'use strict';

app.config(function($stateProvider) {
	$stateProvider.state('main', {
		url: '/game',
		templateUrl: '/main/main.template.html',
		controller: 'MainCtrl'
	});
});