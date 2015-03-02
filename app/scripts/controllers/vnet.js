'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:VNetCtrl
 * @description
 * # VNetCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('VNetCtrl', ['$scope', '$http', 'URLS', '$routeParams', '$location',
    function ($scope, $http, URLS, $routeParams, $location) {
    $scope.authorizePage()
    .then(function(isAuthorized) {
      if (isAuthorized) {
        //TODO
        $scope.togglerBtn = false;
      }
    });
  }]);
