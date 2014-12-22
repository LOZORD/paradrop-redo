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
      /*
        first attempt to login the user b/c if they have a valid
        session, they should be required to log out if they want to
        create a new user
      */
      $scope.initCurrentUser.promise.then(function() {
        //redirect to the my_paradrop page if they're logged in
        if ($scope.isAuthenticated() || $scope.hasSessionCookie()) {
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

        $scope.create = function (data) {
          for (var key in data) {
            console.log('GOT ' + key + ' -> ' + data[key]);
          }

          console.log('removing confirmation field');
          delete data.confirmation;

          /*
          if (data.password !== data.confirmation) {
            alert('password does not match confirmation');
            return;
          }

          //can do more validation below...

          //TODO actually, we can do live validation with angular!

          */

          console.log('SENDING:');

          console.log(data);

          var signupURL = URLS.https + 'user/new';

          console.log(signupURL);

          var sendResult = $http
            .post(signupURL, data)
            .then(
              /* USER SIGNUP might have been ok */
              function (response) {
                console.log(result);
                if (response.result === true) {
                  //yay! it worked
                  console.log('it worked!');
                  //display success modal
                  //TODO
                  //redirect to verification page
                }
                else {
                  alert('errors in signing up');
                  var errors = response.errorMessages;

                  //TODO
                  for (var e in errors) {
                    console.log(errors[e]);
                  }
                }
              },
              /* USER SIGNUP FAILED */
              function (response) {
                console.log(response);
                alert('ya done goofed!');
                alert('errors in signing up');
                var errors = response.errorMessages;

                //TODO
                for (var e in errors) {
                  console.log(errors[e]);
                }
              }
          ); //end API call
        }; //end scope.create
      }); //end initCurrentUser check
    }
  ]);
