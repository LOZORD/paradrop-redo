'use strict';

angular.module('paradropServices', ['ngResource'])
  .factory('AuthService', ['$http', 'Session'],
    function($http, Session) {
      var authService = {};

      authService.login = function (credentials) {
        var ret_data = $http.post('/login', credentials)
          .then(function (result) {
            Session.create(result.data.id, result.data.user.id,
              result.data.user.role);
            return result.data.user
          });

        return ret_data;
      };

      authService.isAuthenticated = function () {
        return !!Session.userId;
      };

      authService.isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
          authorizedRoles = [authorizedRoles];
        }

        var auth_is_good = (authService.isAuthenticated())
          && (authorizedRoles.indexOf(Session.userRole) !== -1);

        return auth_is_good;
      };

      return authService;
    }
  )
  .service('Session',
    function () {
      this.create = function (sessionId, userId, userRole) {
        this.id = sessionId;
        this.userId = userId;
        this.userRole = userRole;
      }

      this.destroy = function () {
        this.id = null;
        this.userId = null;
        this.userRole = null;
      }

      return this;
    }
  )
  .config(function ($httpProvider) {
    $httpProvider.interceptors.push([
      '$injector',
      function ($injector) {
        return $injector.get('AuthInterceptor');
      }
    ]);
  })
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
