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
    '$routeParams', 'AuthService', 'ipCookie', 'MODES',
    function ($scope, $location, $http, URLS, $routeParams, AuthService, ipCookie, MODES) {
      /*
        first attempt to login the user b/c if they have a valid
        session, they should be required to log out if they want to
        create a new user
      */
      $scope.initCurrentUser.promise.then(function() {
        //redirect to the my_paradrop page if they're logged in
        if ($scope.isAuthenticated()) { // || $scope.hasSessionCookie()) {
          $location.url('/my_paradrop');
        }

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

        $scope.MODES = MODES;

        if (MODES.restrictedSignup) {
          $scope.signupData.question = null;
        }

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

          if (MODES.restrictedSignup) {
            payload['reg_code'] = data.question;
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
                if (response.data.result === true) {
                  //yay! it worked
                  //redirect to verification page
                  $location.url('/notify');
                }
                else {
                  window.alert('We could not complete the signup process. Please try again.');
                  window.alert(response.data);
                }
              },
              /* USER SIGNUP FAILED */
              function (response) {
                if (MODES.restrictedSignup &&
                  msgContainsFailedQuestionResp(response.data)) {
                  $location.url('/modes/restricted_signup');
                }
                else {
                  window.alert('There was a failure in the signup process. Please try again.');
                  if (response.data) {
                    window.alert(response.data);
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
              ipCookie('sessionToken', response.data.sessionToken);
              AuthService.cloneSession()
                .then(
                  /* SUCCESS */
                  function () {
                    $location.url('/my_paradrop');
                  },
                  /* FAILURE */
                  function () {
                    window.alert('We could not set us your new account. Please try reverifying using the email we sent you.');
                  }
               );
            },
            /* FAILURE */
            function () {
              $location.url('/user/new');
            }
          );
        }
      }); //end initCurrentUser check
    }
  ]);
