'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.version',
  'ngMaterial'
  //'plotly'
])
.config(['$locationProvider', '$routeProvider', '$mdThemingProvider', function($locationProvider, $routeProvider, $mdThemingProvider) {
  $locationProvider.hashPrefix('!');
  $mdThemingProvider.theme('dark')

  $routeProvider.otherwise({redirectTo: '/view1'});
}])
.factory('CryptoFactory', ['$rootScope', function ($rootScope) {

  var socket = io.connect('https://streamer.cryptocompare.com');

  return {
    on: function (eventName, callback) {
        socket.on(eventName, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                callback.apply(socket, args);
            });
        });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
            if (callback) {
                callback.apply(socket, args);
            }
        });
      })
    },
    getSocket: function() {
      return socket;
    }
  }
  
}])