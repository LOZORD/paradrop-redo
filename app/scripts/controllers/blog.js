'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:BlogCtrl
 * @description
 * # BlogCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('BlogCtrl', ['$scope', '$location', '$http', '$routeParams', 'URLS', '$sce',
    function ($scope, $location, $http, $routeParams, URLS, $sce) {
      var ts = null;
      //a map of post's ts => index of post in $scope.posts
      var tsToPostIndMap = {};
      //a map of topic => Array of posts indices in $scope.posts with that topic
      $scope.topicToPostMap = {};
      $scope.numTopics      = 0;
      $scope.posts          = [];
      $scope.specificPost   = [];
      $scope.topicPosts     = [];

      var blogUrl = URLS.https + 'blog/get';
      var payload = {};

      /*
        We actually download all the (most recent as defnd by API) blog posts.
        Then we just filter according to url's and such.
      */
      $http.post(blogUrl, payload)
        .success(
          function(data) {
            data.forEach(reformatPost);

            //sort in descending order
            data.sort(function (a,b) {
              return b.ts - a.ts;
            });

            $scope.numTopics = 0;

            //gather extra data on the posts
            data.forEach(function (post, index) {
              tsToPostIndMap[post.ts] = index;

              if (!$scope.topicToPostMap.hasOwnProperty(post.topic)) {
                $scope.topicToPostMap[post.topic] = [ index ];
                $scope.numTopics++;
              }
              else {
                $scope.topicToPostMap[post.topic].push(index);
              }
            });

            $scope.posts = data;

            //first, check if the user wants to look at a specific post
            checkForSpecific();
            //then, if they want to look at a specific topic
            checkForTopic();
          }
      );

      //can also take an index and the calling array as args
      function reformatPost (post) {
        post.title    = decodeURIComponent(post.title);
        post.author   = decodeURIComponent(post.publicName);
        post.topic    = decodeURIComponent(post.topic);
        var content   = decodeURIComponent(post.content);
        //trust "foreign" tags like <iframe> (for youtube, etc.)
        post.content  = $sce.trustAsHtml(content);
        //because JS does things in milliseconds
        post.ts = post.ts * 1000;
        return post;
      }

      /* FOR /blog/:ts ---> SPECIFIC BLOG POST */
      function checkForSpecific () {
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
                  $location.url('/blog');
                }
              );
          }
        }
      }

      function checkForTopic() {
        if ($routeParams.topic) {
          $scope.currTopic = $routeParams.topic;
          //first filter the current blog posts by topic
          var topicPosts = [];
          topicPosts = $scope.posts.filter(function (somePost) {
            return somePost.topic === $routeParams.topic;
          });

          if (topicPosts.length) {
            $scope.topicPosts = topicPosts;
          }
          else {
            // use ajax to get more posts TODO
          }
        }
      }

      //TODO if given a range or something...

    }
  ]);
