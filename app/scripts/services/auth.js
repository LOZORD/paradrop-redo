'use strict';

angular.module('paradropServices', ['ngResource', 'ngCookies'])
  .factory('AuthService', ['$http', 'Session', '$cookieStore',
    function($http, Session, $cookieStore) {
      var authService = {};

      authService.login = function (credentials) {
        //TODO connect to backend API

        console.log('GOT CREDENTIALS AS:\n');
        console.log(credentials);

        credentials.already_hashed = false;

        var loginURL = 'http://paradrop.wings.cs.wisc.edu:30333/v1/authenticate/signin';

        console.log('USING URL:\n');
        console.log(loginURL);

        //XXX needed?
        var credStr = angular.toJson(credentials);

        var retData = $http
          .post(loginURL, credentials)
          .then(function (result) {
            console.log('GOT RESULT:\n');
            console.log(result);

            //FIXME
            //Session.create(result.data.id, result.data.user.id,
            //  result.data.user.role);

            $cookieStore.put('sessionToken', result.data.sessionToken);
            Session.create('dale', result.data.sessionToken);
            return result.data.user;
          });

        return retData;
      };

      authService.isAuthenticated = function () {
        return !!Session.userId;
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
