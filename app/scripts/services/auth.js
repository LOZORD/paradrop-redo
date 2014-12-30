'use strict';

angular.module('paradropServices', ['ngResource', 'ngCookies', 'ipCookie'])
  .factory('AuthService', ['$http', 'Session', 'ipCookie', 'URLS', '$rootScope',
    function($http, Session, ipCookie, URLS, $rootScope) {
      var authService = {};

      //this function is used by login and cloneSession
      function buildSession (result) {
        var theUser = null;

        theUser = Session.create(
          result.data.username,
          result.data.sessionToken,
          result.data.isdeveloper,
          result.data.admin,
          result.data.aps
        );

        return theUser;
      }

      //log in the user via login form
      //TODO first check if they have a cookie
      //if they do, run cloneSession instead
      /*
        For example, if the user has two tabs open:
        1) Logs in using tab A (NOT cloneSession, assume no valid cookie yet)
        2) Navigates to login page on tab B
        3) Our app should detect that they now have a valid cookie
        4) They should be automatically logged in on Tab B using the new cookie & cloneSession
      */
      authService.login = function (credentials) {

          credentials.already_hashed = false;

          var loginURL = URLS.current + 'authenticate/signin';

          var retData = $http
            .post(loginURL, credentials)
            .then(buildSession)
            .then(function (someSession) {
              if (credentials.persist) {
                ipCookie('shouldPersist', true, { expires: 7 });
                ipCookie('sessionToken', someSession.id, { expires: 7 });
              }
              else {
                ipCookie('sessionToken', someSession.id);
              }
            });
          return retData;
      };

      //restore session from token
      authService.cloneSession = function () {
          var credentials = {sessionToken: ipCookie('sessionToken')};
          var loginURL = URLS.current + 'authenticate/cloneSession';
          var retData = $http
            .post(loginURL, credentials)
            .then(buildSession)
            .then(function (someSession) {
              var shouldPersist = ipCookie('shouldPersist');

              if (shouldPersist) {
                ipCookie('shouldPersist', true, { expires: 7 });
                ipCookie('sessionToken', someSession.id, { expires: 7 });
              }
              else {
                ipCookie('sessionToken', someSession.id);
              }
            });
          return retData;
      };
      
      authService.isAuthenticated = function () {
        return !!Session.id;
      };

      authService.logout = function () {
        var logoutURL = URLS.current + 'authenticate/signout';
        var payload = { sessionToken: ipCookie('sessionToken') };
        ipCookie.remove('sessionToken');
        ipCookie.remove('shouldPersist');

        Session.destroy();

        var retData = $http
          .post(logoutURL, payload)
          .then(function(result) {
            return result;
          });

        return retData;
      };

      authService.getSession = function () {
        return Session.getSession();
      };

      authService.destroySession = function () {
        Session.destroy();
      };

      return authService;
    }
  ])
  .service('Session',
    function () {
      this.username = null;
      this.id = null;
      this.isDeveloper = null;
      this.isAdmin = null;
      this.aps = null;

      this.getSession = function () {
        return {
          username: this.username,
          id: this.id,
          isDeveloper: this.isDeveloper,
          isAdmin: this.isAdmin,
          aps: this.aps
        };
      };

      this.create = function (username, sessionId, isDeveloper, isAdmin, aps) {
        this.username = username;
        this.id = sessionId;
        //boolean (binary) fields, default to 0 (false)
        this.isDeveloper = parseInt(isDeveloper, 2) || 0;
        this.isAdmin = parseInt(isAdmin, 2)         || 0;
        //array of AP objects
        this.aps = aps;

        return this;
      };

      this.destroy = function () {
        this.username = null;
        this.id = null;
        this.isDeveloper = null;
        this.isAdmin = null;
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
