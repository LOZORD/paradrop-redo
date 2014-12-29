'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:NewUserCtrl
 * @description
 * # NewUserCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('NewUserCtrl', ['$scope', '$location', '$http', 'URLS', '$routeParams',
    function ($scope, $location, $http, URLS, $routeParams) {
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

        $scope.create = function (data, isValid) {
          for (var key in data) {
            console.log('GOT ' + key + ' -> ' + data[key]);
          }

          if (isValid !== true) {
            console.log('got isValid as falsy ', isValid);
            return;
          }

          //TODO something with loginForm[fieldNames].$valid

          if (data.password !== data.confirmation) {
            alert('password does not match confirmation');
            return;
          }

          //can do more validation below...
          //TODO actually, we can do live validation with angular!

          var payload = {
            username:     data.username,
            password:     data.password,
            fullname:     data.fullname,
            'public':     data['public'],
            email:        data.email,
            contact:      data.contact,
            isDeveloper:  data.isDeveloper
          };

          //$scope.signupData = payload;

          console.log('SENDING:');

          console.log(payload);

          var signupURL = URLS.https + 'user/new';

          console.log(signupURL);

          var sendResult = $http
            .post(signupURL, payload)
            .then(
              /* USER SIGNUP might have been ok */
              function (response) {
                console.log(response);
                if (response.data.result === true) {
                  //yay! it worked
                  console.log('it worked!');
                  //redirect to verification page
                  $location.url('/notify');
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

        $scope.vToken = $routeParams.verificationToken;

        if ($scope.vToken) {
          console.log('got verf token as ', $scope.vToken);
          var verifyUrl = URLS.https + 'verify/' + $scope.vToken.toString();
          $http.post(verifyUrl, {})
          .then(
            /* SUCCESS */
            function (response) {
              console.log(response);
              //TODO
              console.log('NOW DO CLONE SESSION WITH ', response.data.sessionToken);
              //then redirect to my_pdp
            },
            /* FAILURE */
            function (response) {
              console.log('ERROR VERIFYING USER!!!');
            }
          );
        }
      }); //end initCurrentUser check
    }
  ]);
