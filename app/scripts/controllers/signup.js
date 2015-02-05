'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:NewUserCtrl
 * @description
 * # NewUserCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('NewUserCtrl', ['$scope', '$location', '$http', 'URLS', '$routeParams', 'AuthService',
    function ($scope, $location, $http, URLS, $routeParams, AuthService) {
      $scope.signupData = {
        username:     null,
        password:     null,
        confirmation: null,
        fullname:     null,
        public:       null,
        email:        null,
        contact:      null,
        isDeveloper:  false
      };

      $scope.create = function (data, isValid) {
        if (isValid !== true) {
          return;
        }

        var payload = {
          username:     data.username,
          password:     data.password,
          fullname:     data.fullname,
          'public':     data['public'],
          email:        data.email,
          contact:      data.contact,
          isDeveloper:  data.isDeveloper
        };

        var signupURL = URLS.current + 'user/new';

          $http.post(signupURL, payload)
          .then(
            /* USER SIGNUP might have been ok */
            function (response) {
              if (response.data.result === true) {
                //yay! it worked
                //redirect to verification page
                $location.url('/notify');
              }
              else {
                alert('We could not complete the signup process. Please try again.');
                alert(response.data.errMsg.join('<br>'));
              }
            },
            /* USER SIGNUP FAILED */
            function () {
              alert('There was a failure in the signup process. Please try again.');
            }
        ); //end API call
      }; //end scope.create

      /* VERIFICATION CODE BELOW */
      $scope.vToken = $routeParams.verificationToken;

      if ($scope.vToken) {
        var verifyUrl = URLS.current + 'user/verify/' + $scope.vToken.toString();
        $http.post(verifyUrl, {}) //send an empty JSON
        .then(
          /* SUCCESS */
          function (response) {
            //var credentials = { sessionToken: response.data.sessionToken };
            AuthService.saveToken(response.data.sessionToken);
            AuthService.cloneSession()
              .then(
                /* SUCCESS */
                function () {
                  $location.url('/my_paradrop');
                },
                /* FAILURE */
                function () {
                  alert('We could not set us your new account. Please try reverifying using the email we sent you.');
                }
             );
          },
          /* FAILURE */
          function () {
            $location.url('/user/new');
          }
        );
      }
    }
  ]);
