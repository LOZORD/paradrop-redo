'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('LoginCtrl', ['$scope', '$rootScope', 'AUTH_EVENTS', 'AuthService', '$location', 'URLS',
    function ($scope, $rootScope, AUTH_EVENTS, AuthService, $location, URLS) {

      if ($scope.currentUser && $scope.isAuthenticated()) {
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
          alert('The username field cannot be blank. Please enter your username.');
          return;
        }else if(!credentials.password){
          alert('The password field cannot be blank. Please enter your password.');
          return;
        }
        AuthService.cloneSession().then(
            //Successful session restore
            function() {
              $scope.setCurrentUser();
                  //then redirect to their homepage
                  $location.url('/my_paradrop');
            },
            //failed to restore a session
            function(){
              AuthService.login(credentials).then(
                /* SUCCESSFUL LOGIN */
                function (user) {
                  $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                  //set the currentUser as this user in the ApplicationCtrl scope
                  $scope.setCurrentUser(user);
                  //then redirect to their homepage
                  $location.url('/my_paradrop');
                },
                /* FAILED LOGIN */
                function (error) {
                  $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
                  if(error.data === 'User is not verified!'){
                    alert('Your account has not yet been verified! Please check your email for instructions and a link to verify your account. If you just created your account you should recieve the email shortly.');
                  }else if(error.data === 'User is disabled!'){
                    alert('Your account has been disabled. Please contact us at admin@paradrop.io if you think there has been an error.');
                  }else if(error.data === 'Threshold Met!'){
                    alert('Your account has been temporarily frozen due to too many failed attempts to login. If you think there has been an error contact admin@paradrop.io');
                  }else if(error.data){
                    alert(error.data);
                  }else{
                    alert('Login Failed! This site is currently in development if you are seeing this error please visit ' + URLS.current +' and add an exception to trust our ssl certificate. You will not be able to login and recieve data otherwise.');
                  }
                }
              );
            }
        );
      };
    }
  ]
);
