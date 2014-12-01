'use strict';

angular.module('paradropServices', ['ngResource'])
  .factory('AuthService', ['$http', 'Session',
    function($http, Session) {
      var authService = {};

      authService.login = function (credentials) {
        //TODO connect to backend API

        console.log('GOT CREDENTIALS AS:\n');
        console.log(credentials);

        credentials.already_hashed = false;

        var loginURL = 'http://paradrop.wings.cs.wisc.edu:30333/v1/authenticate/signin';

        console.log('USING URL:\n');
        console.log(loginURL);

        var retData = $http
          .post(loginURL, credentials)
          .then(function (result) {
            console.log('GOT RESULT:\n');
            console.log(result);

            //FIXME
            //Session.create(result.data.id, result.data.user.id,
            //  result.data.user.role);


            //TODO check that the user is valid

            var theUser = null;

            if (result.data.hasOwnProperty('username'))
            {
              theUser = Session.create(
                result.data.username,
                result.data.sessionId,
                result.data.isdeveloper,
                result.data.admin,
                result.data.isverified,
                result.data.disabled,
                result.data.aps
              );
            }
            else
            {
              //build a fake user object
              theUser = Session.create('dale', 'deadbeef123', '1', '1', '1', '0', { '123': 'FirstAP', '456': 'OtherAP' });
            }

            console.log(theUser);

            //Session.create('dale', result.data.sessionId);
            //return result.data.user;

            return theUser;
          });

        return retData;
      };

      authService.isAuthenticated = function () {
        return !!Session.id;
      };

      authService.isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
          authorizedRoles = [authorizedRoles];
        }

        if (!authService.isAuthenticated()) {
          return false;
        }

        for (var role in authorizedRoles) {
          if (!Session[role]) {
            return false;
          }
        }

        return true;
      };

      return authService;
    }
  ])
  .service('Session',
    function () {
      this.create = function (username, sessionId, isDeveloper, isAdmin, isVerified, isDisabled, aps) {
        this.username = username;
        this.id = sessionId;
        //boolean (binary) fields
        this.isDeveloper = parseInt(isDeveloper, 2);
        this.isAdmin = parseInt(isAdmin, 2);
        this.isVerified = parseInt(isVerified, 2);
        this.isDisabled = parseInt(isDisabled, 2);
        this.aps = aps;
        return this;
      };

      this.destroy = function () {
        this.username = null;
        this.id = null;
        this.isDeveloper = null;
        this.isAdmin = null;
        this.isVerified = null;
        this.isDisabled = null;
        this.aps = null;
      };

      return this;
    }
  )
  .factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
    return  {
      responseError: function (response) {
        $rootScope.$broadcast({
          401: AUTH_EVENTS.notAuthenticated,
          403: AUTH_EVENTS.notAuthorized,
          419: AUTH_EVENTS.sessionTimeout,
          440: AUTH_EVENTS.sessionTimeout,
        }[response.status], response);

        return $q.reject(response);
      }
    };
  });
