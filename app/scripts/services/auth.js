'use strict';

angular.module('paradropServices', ['ngResource', 'ngCookies', 'ipCookie'])
  .factory('AuthService', ['$http', 'Session', 'ipCookie',
    function($http, Session, ipCookie) {
      var authService = {};

      authService.login = function (credentials, isCloneSession) {

        if(!isCloneSession){
          credentials.already_hashed = false;

          var loginURL = 'http://paradrop.wings.cs.wisc.edu:30333/v1/authenticate/signin';

          var retData = $http
            .post(loginURL, credentials)
            .then(function (result) {

              var theUser = null;

              //store session token for restoring session
              ipCookie('sessionToken', result.data.sessionToken, { expires: 7});
            
              theUser = Session.create(
                credentials.username,
                result.data.sessionToken,
                result.data.isdeveloper,
                result.data.admin,
                result.data.isverified,
                result.data.disabled,
                result.data.aps
              );

              return theUser;
            });
          return retData;
        }else{
          //restore session from token
          var loginURL = 'http://paradrop.wings.cs.wisc.edu:30333/v1/authenticate/cloneSession';
          var retData = $http
            .post(loginURL, credentials)
            .then(function (result) {

              var theUser = null;

              ipCookie('sessionToken', result.data.sessionToken, { expires: 7});

              theUser = Session.create(
                result.data.username,
                result.data.sessionToken,
                result.data.isdeveloper,
                result.data.admin,
                result.data.isverified,
                result.data.disabled,
                result.data.aps
              );
              return theUser;
            });
          return retData;
        }
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
        this.isDeveloper = parseInt(isDeveloper, 2) || 0;
        this.isAdmin = parseInt(isAdmin, 2)         || 0;
        this.isVerified = parseInt(isVerified, 2)   || 0;
        this.isDisabled = parseInt(isDisabled, 2)   || 0;
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
