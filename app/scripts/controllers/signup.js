'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:NewUserCtrl
 * @description
 * # NewUserCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('NewUserCtrl', ['$scope', '$location', '$http',
    function ($scope, $location, $http) {
      if ($scope.isAuthenticated()) {
        $location.url('/my_paradrop');
      }

      $scope.data = {
        username:     null,
        password:     null,
        confirmation: null,
        fullname:     null,
        publicname:   null,
        email:        null,
        contact:      null
      };

      $scope.create = function (data) {
        for (var key in data) {
          if (!data[key]) {
            alert('bad data!');
            return;
          }
        }

        if (data.password !== data.confirmation) {
          alert('password does not match confirmation');
          return;
        }

        var loginURL = 'http://paradrop.wings.cs.wisc.edu:30333/v1/user/new';

        var sendResult = $http
          .post(loginURL, data)
          .then(
            /* USER SIGNUP might have been ok */
            function (response) {
              if (response.result === true) {
                //yay! it worked
                //login
                //TODO
                //then redirect
                //TODO
                console.log('it worked!');
              }
              else {
                alert('errors in signing up');
                var errors = response.errorMessages;

                for (var e in errors) {
                  console.log(errors[e]);
                }
              }
            },
            /* USER SIGNUP FAILED */
            function (response) {
              alert('ya done goofed!');
            }
        );

      };
    }
  ]);
