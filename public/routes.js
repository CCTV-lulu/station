var app = angular.module('routingDemoApp',['ngRoute','ngMaterial']);

app.config(['$routeProvider','$mdThemingProvider', function($routeProvider,$mdThemingProvider){
    $mdThemingProvider.theme('default')
        .primaryPalette('blue-grey')
        .accentPalette('light-blue');
    $routeProvider
        .otherwise({redirectTo:'/'});
}]);