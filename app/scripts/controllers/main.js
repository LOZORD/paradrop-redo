'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
