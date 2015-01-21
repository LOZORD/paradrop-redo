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

      var blogUrl = URLS.https + 'blog/get';
      var payload = {};

      /* FOR /blog/:ts ---> SPECIFIC BLOG POST */
      if ($routeParams.ts) {
        payload.ts = parseInt($routeParams.ts, 10);
        //then check if $scope.posts contains that ts (first occur.)
        //if not, then ajax it!
      }

      //TODO if given a range or something...

      $http.post(blogUrl, payload)
        .success(
          function(data) {

            data.forEach(function (post, index, postArr) {
              post.title    = decodeURIComponent(post.title);
              post.author   = decodeURIComponent(post.publicName);
              post.topic    = decodeURIComponent(post.topic);
              post.content  = decodeURIComponent(post.content);
              //because JS does things in milliseconds
              post.ts = post.ts * 1000;
            });

            //sort in descending order
            data.sort(function (a,b) {
              return b.ts - a.ts;
            });

            $scope.posts = data;
          }
      );
    }
  ]);
