var meetingPlannerApp = angular.module('meetingPlanner', [ 'ngRoute',
		'ngResource', 'ngDragDrop', 'ngCookies']);

meetingPlannerApp.config([ '$routeProvider', function($routeProvider) {
	$routeProvider.when('/schedule', {
		templateUrl : 'views/schedule.html',
		controller : 'scheduleCtrl'
	}).when('/schedule2', {
		templateUrl : 'views/schedule2.html',
		controller : 'scheduleCtrl'
	}).when('/newactivity', {
		templateUrl : 'views/newActivity.html',
		controller : 'ActivityCtrl'
	}).when('/homepage', {
		templateUrl : 'views/homePage.html',
		controller : 'HomePageCtrl'
	}).when('/editactivity', {
		templateUrl : 'views/editActivity.html',
		controller : 'ActivityCtrl'
	}).otherwise({
		redirectTo : '/homepage'
	});
} ],['$httpProvider', function($httpProvider) {
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }
]);
