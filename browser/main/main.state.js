'use strict';

app.config(function($stateProvider) {
	$stateProvider.state('main', {
		url: '/:room',
		templateUrl: '/main/main.template.html',
		controller: 'MainCtrl'
	});
});