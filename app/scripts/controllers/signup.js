'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:NewUserCtrl
 * @description
 * # NewUserCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('NewUserCtrl', ['$scope', '$location', '$http', 'URLS', '$routeParams', 'AuthService', 'MODES',
    function ($scope, $location, $http, URLS, $routeParams, AuthService, MODES) {

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

        $scope.MODES = MODES;

        if (MODES.restrictedSignup) {
          $scope.signupData.question = null;
        }

        if (MODES.restrictedSignup) {
          payload.reg_code = data.question;
        }

        var signupURL = URLS.current + 'user/new';
        var failedQuestionResp = 'wrong signup code';

        var msgContainsFailedQuestionResp = function (msg) {
          return msg.toLowerCase().indexOf(failedQuestionResp) !== -1;
        };

        $http
          .post(signupURL, payload)
          .then(
            /* USER SIGNUP might have been ok */
            function (response) {
              if (response.data === '') {
                //yay! it worked
                //redirect to verification page
                $location.url('/notify');
              }
              else {
                $scope.closeAlerts();
                $scope.dangerAlert('Error: We could not complete the signup process. Please try again.\n' + response.data);
              }
            },
            /* USER SIGNUP FAILED */
            function (response) {
              if (MODES.restrictedSignup &&
                msgContainsFailedQuestionResp(response.data)) {
                $location.url('/modes/restricted_signup');
              }
              else {
                $scope.closeAlerts();
                $scope.dangerAlert('Error: There was a failure in the signup process. Please try again.');
                if (response.data) {
                  $scope.dangerAlert('Error: There was a failure in the signup process. Please try again.\n' + response.data);
                }
              }
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
                  $scope.closeAlerts();
                  $scope.dangerAlert('Error: We could not set up your new account. Please try reverifying using the email we sent you.');
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
