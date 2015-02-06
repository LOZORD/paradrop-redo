'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ContactCtrl
 * @description
 * # ContactCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ContactCtrl', ['$scope', function ($scope) {
    $scope.authorizePage();
  }]);
