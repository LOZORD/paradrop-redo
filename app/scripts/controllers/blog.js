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
      //a map of post's ts => index of post in $scope.posts
      var tsToPostIndMap = {};
      $scope.posts = null;
      $scope.specificPost = null;

      var blogUrl = URLS.https + 'blog/get';
      var payload = {};

      $http.post(blogUrl, payload)
        .success(
          function(data) {
            data.forEach(reformatPost);

            //sort in descending order
            data.sort(function (a,b) {
              return b.ts - a.ts;
            });

            data.forEach(function (post, index) {
              tsToPostIndMap[post.ts] = index;
            });

            $scope.posts = data;

            checkForSpecific();
          }
      );

      //can also take an index and the calling array as args
      function reformatPost (post) {
        post.title    = decodeURIComponent(post.title);
        post.author   = decodeURIComponent(post.publicName);
        post.topic    = decodeURIComponent(post.topic);
        post.content  = decodeURIComponent(post.content);
        //because JS does things in milliseconds
        post.ts = post.ts * 1000;
        return post;
      }

      /* FOR /blog/:ts ---> SPECIFIC BLOG POST */
      function checkForSpecific() {
        if ($routeParams.ts) {
          payload.ts = ts = parseInt($routeParams.ts, 10);
          if (tsToPostIndMap.hasOwnProperty(ts)) {
            var tsIndex = tsToPostIndMap[ts];
            $scope.specificPost = $scope.posts[tsIndex];
          }
          //if not, then ajax it!
          else {
            $http.post(blogUrl, payload)
              .then(
                /* SUCCESS */
                function (result) {
                  if (result.length === 0) {
                    $location.url('/blog');
                  }
                  else if (!result.data[0] || $.isEmptyObject(result.data[0])) {
                    $location.url('/blog');
                  }
                  else {
                    var somePost = result.data[0];
                    $scope.specificPost = reformatPost(somePost, null, null);
                  }
                },
                /* FAILURE */
                function (result) {
                  console.log(result);
                  $location.url('/blog');
                }
              );
          }
        }
      }

      //TODO if given a range or something...

    }
  ]);
