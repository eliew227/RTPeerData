'use strict';

app.config(function($stateProvider) {
	$stateProvider.state('login', {
		url: '/',
		templateUrl: '/login/login.template.html',
		controller: 'LoginCtrl'
	});
});