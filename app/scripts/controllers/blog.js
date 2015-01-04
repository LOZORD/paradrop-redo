'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:BlogCtrl
 * @description
 * # BlogCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('BlogCtrl', ['$scope', '$location', '$http', '$routeParams', 'URLS',
    function ($scope, $location, $http, $routeParams, URLS) {
      var ts = null;
      $scope.posts = [];

      var blogUrl = URLS.https + '/blog/';
      var payload = {};

      if ($routeParams.ts) {
        payload.ts = parseInt($routeParams.ts, 10);
      }

      //TODO if given a range or something...

      $http.get(blogUrl, payload)
        .success(
          function(data) {
            $scope.posts = data;
          }
      );
    }
  ]);
