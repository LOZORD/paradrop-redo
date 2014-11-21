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

        //XXX needed?
        var credStr = angular.toJson(credentials);

        var retData = $http.post(loginURL, credentials)
          .then(function (result) {

            var temp = result;

            console.log('GOT RESULT:\n');
            console.log(temp);

            result = { data : { id: 42, user: { id: 42, role: 'admin' } } };

            Session.create(result.data.id, result.data.user.id,
              result.data.user.role);
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

        var authIsGood = (authService.isAuthenticated()) &&
          (authorizedRoles.indexOf(Session.userRole) !== -1);

        return authIsGood;
      };

      return authService;
    }
  ])
  .service('Session',
    function () {
      this.create = function (sessionId, userId, userRole) {
        this.id = sessionId;
        this.userId = userId;
        this.userRole = userRole;
      };

      this.destroy = function () {
        this.id = null;
        this.userId = null;
        this.userRole = null;
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
