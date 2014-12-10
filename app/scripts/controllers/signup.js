'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:NewUserCtrl
 * @description
 * # NewUserCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('NewUserCtrl', ['$scope', '$location', '$http', 'URLS',
    function ($scope, $location, $http, URLS) {

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
        contact:      null,
        isDeveloper:  false
      };

      $scope.create = function (data) {
        for (var key in data) {
          if (!data[key]) {
            alert('bad data!');
            return;
          }
	  console.log('GOT ' + key + ' -> ' + data[key]);
        }

        if (data.password !== data.confirmation) {
          alert('password does not match confirmation');
          return;
        }

        //can do more validation below...

        var loginURL = URLS.http + 'user/new';

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
