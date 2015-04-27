'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('LoginCtrl', ['$scope', '$rootScope', 'AuthService', '$location', 'URLS',
    function ($scope, $rootScope, AuthService, $location, URLS) {

      if (AuthService.getToken()) {
        $location.url('/my_paradrop');
      }
      else {
        //allow access
      }

      $scope.credentials = {
        username:       null,
        password:       null,
        persist:        false,
        already_hashed: false,
        return_aps:     true
      };

      $scope.login = function (credentials) {
        if(!credentials.username){
          $scope.closeAlerts();
          $scope.dangerAlert('Error: The username field cannot be blank. Please enter your username.');
          return;
        }else if(!credentials.password){
          $scope.closeAlerts();
          $scope.dangerAlert('Error: The password field cannot be blank. Please enter your password.');
          return;
        }
        try{
          AuthService.cloneSession().then(
              //Successful session restore
              function() {
                //redirect to their homepage
                $location.url('/my_paradrop');
                $scope.closeAlerts();
                $scope.dangerAlert('You were already logged in. Please logout if you want to log in as a different user.');
              },
              //failed to restore a session
              function() {
                login(credentials);
              }
          );
        }catch(e){
          login(credentials);
        }
      };
      function login(credentials){
        AuthService.login(credentials).then(
          /* SUCCESSFUL LOGIN */
          function () {
            //redirect to their homepage
            $location.url('/my_paradrop');
          },
          /* FAILED LOGIN */
          function (error) {
            if(error.data === 'User is not verified!'){
              $scope.closeAlerts();
              $scope.dangerAlert('Your account has not yet been verified! Please check your email for instructions and a link to verify your account. If you just created your account you should recieve the email shortly.');
            }else if(error.data === 'User is disabled!'){
              $scope.closeAlerts();
              $scope.dangerAlert('Your account has been disabled. Please contact us at admin@paradrop.io if you think there has been an error.');
            }else if(error.data === 'Threshold Met!'){
              $scope.closeAlerts();
              $scope.dangerAlert('Your account has been temporarily frozen due to too many failed attempts to login. If you think there has been an error contact admin@paradrop.io');
            }else if(error.data){
              $scope.closeAlerts();
              $scope.dangerAlert('Error: ' + error.data);
            }else{
              $scope.closeAlerts();
              $scope.dangerAlert('<b>Error:</b>Login Failed! This site is currently in development if you are seeing this error please visit <a href="' + URLS.current +'test" class="alert-link">' + URLS.current + 'test</a> and add an exception to trust our ssl certificate. You will not be able to login and recieve data otherwise.');
            }
          }
        );
      }
    }
  ]
);
