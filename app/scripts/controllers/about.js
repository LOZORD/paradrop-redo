'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
