'use strict';

angular.module('paradropServices', ['ngResource', 'ngCookies', 'ipCookie'])
  .factory('AuthService', ['$http', 'Session', 'ipCookie', 'URLS', '$rootScope',
    function($http, Session, ipCookie, URLS, $rootScope) {
      var authService = {};

      authService.login = function (credentials) {

          credentials.already_hashed = false;

          var loginURL = URLS.https + 'authenticate/signin';

          var retData = $http
            .post(loginURL, credentials)
            .then(function (result) {

              var theUser = null;

              //store session token for restoring session
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
      };
      authService.cloneSession = function (credentials) {
          //restore session from token
          var loginURL = URLS.https + 'authenticate/cloneSession';
          var retData = $http
            .post(loginURL, credentials)
            .then(function (result) {

              var theUser = null;

              //validate cookie for 7 more days
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
      };
      
      authService.isAuthenticated = function () {
        return !!Session.id;
      };

      authService.logout = function () {
        var logoutURL = URLS.http + 'authenticate/signout';
        var payload = { sessionToken: Session.id };

        Session.destroy();

        var retData = $http
          .post(logoutURL, payload)
          .then(function(result) {
            return result;
          });

        return retData;
      };

      authService.isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
          authorizedRoles = [authorizedRoles];
        }

        if (authorizedRoles.length === 0) {
          return true;
        }

        //if the user is a stranger and their session DNE
        //FIXME don't trust this code just yet!
        if (authorizedRoles.length === 1 && authorizedRoles[0] === 'STRANGER'
          && !authService.isAuthorized()) {
          return true;
        }

        /* Not neccessarily a permanent constraint
        if (!authService.isAuthenticated()) {
          return false;
        }
        */

        for (var i in authorizedRoles) {

          var theRole = authorizedRoles[i];

          /*if (angular.isString(theRole)) {
            if (!Session.hasOwnProperty(theRole)) {
              alert('Bad str property: ' + theRole);
              return false;
            }
            else if (!Session[theRole]) {
              return false;
            }
          }
          else if (angular.isObject(theRole)) {
            if (!Session.hasOwnProperty(theRole.property)) {
              alert('Bad obj property: ' + theRole.property);
              return false;
            }
            else if (Session[theRole.property] !== theRole.value) {
              return false;
            }
          }
          else {
            alert('Don\'t know what to do with ' + theRole.toString());
            return false;
          }*/
        }

        return true;
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
      this.isVerified = null;
      this.isEnabled = null;
      this.aps = null;

      this.create = function (username, sessionId, isDeveloper, isAdmin, isVerified, isDisabled, aps) {
        this.username = username;
        this.id = sessionId;
        //boolean (binary) fields
        this.isDeveloper = parseInt(isDeveloper, 2) || 0;
        this.isAdmin = parseInt(isAdmin, 2)         || 0;
        this.isVerified = parseInt(isVerified, 2)   || 0;

        var temp  = parseInt(isDisabled, 2);

        if (temp === 0)
        {
          this.isEnabled = 1;
        }
        else
        {
          this.isEnabled = 0;
        }

        //array of AP objects
        this.aps = aps;

        return this;
      };

      this.destroy = function () {
        this.username = null;
        this.id = null;
        this.isDeveloper = null;
        this.isAdmin = null;
        this.isVerified = null;
        this.isEnabled = null;
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
