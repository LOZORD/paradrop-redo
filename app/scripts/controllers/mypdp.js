'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MyParadropCtrl
 * @description
 * # MyParadropCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MyParadropCtrl', ['$scope', '$location',
    function ($scope, $location) {
      //TODO
      $scope.initCurrentUser.promise.then(function(){
        if (!$scope.isAuthenticated()) {
          $location.url('/login');
        }
      });
    }
  ]);
