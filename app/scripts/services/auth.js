'use strict';

angular.module('paradropServices', ['ngResource', 'ngCookies', 'ipCookie'])
  .factory('AuthService', ['$http', 'Session', 'ipCookie', 'URLS', '$rootScope', '$route', '$location',
    function($http, Session, ipCookie, URLS, $rootScope, $route, $location) {
      var authService = {};

      authService.getToken = function () {
        return ipCookie('sessionToken');
      };

      authService.persist = function () {
        return ipCookie('shouldPersist');
      };

      authService.deleteToken = function () {
        ipCookie.remove('sessionToken');
        ipCookie.remove('shouldPersist');
      };

      authService.saveToken = function (token, persist) {
        if (persist) {
          ipCookie('shouldPersist', true, { expires: 7 });
          ipCookie('sessionToken', token, { expires: 7 });
        }
        else {
          ipCookie('sessionToken', token);
        }
      };
      //this function is used by login and cloneSession
      function buildSession (result) {
        var theUser = null;

        theUser = Session.create(
          result.data.username,
          result.data.sessionToken,
          result.data.isdeveloper,
          result.data.admin,
          result.data.aps,
          result.data.fullname
        );
        //resolve session promise
        $rootScope.sessionBuilt.resolve();

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
          credentials.keep_token = true;

          var loginURL = URLS.current + 'authenticate/signin';

          var retData = $http
            .post(loginURL, credentials)
            .then(buildSession)
            .then(function (someSession) {
              authService.saveToken(someSession.id, credentials.persist);
            });
          return retData;
      };

      
      //restore session from token
      authService.cloneSession = function () {
          if(!authService.getToken()){
            throw function (){
              this.message = 'No Session Token';
              this.name = 'NoSessionTokenException';
            };
          }
          var credentials = {sessionToken: authService.getToken()};
          credentials.keep_token = true;
          var loginURL = URLS.current + 'authenticate/cloneSession';
          var retData = $http
            .post(loginURL, credentials)
            .then(buildSession)
            .then(function (someSession) {
              authService.saveToken(someSession.id, authService.persist());
            });
          return retData;
      };
      
      authService.isAuthenticated = function () {
        return !!Session.id;
      };

      authService.destroySession = function () {
        authService.deleteToken();
        Session.destroy();
      };

      authService.logout = function () {
        //TODO FIX THIS HACK
        var logoutURL = URLS.current + 'test';
        //var payload = { sessionToken: authService.getToken() };

        authService.destroySession();

        var retData = $http
          //TODO switch back to post request
          .get(logoutURL)
          .then(function(result) {
            return result;
          });

        return retData;
      };

      authService.getSession = function () {
        return Session;
      };

      authService.authorizePage = function ()  { 
        if ($route.current.auths.session && (!authService.isAuthenticated()  || !authService.getToken())) {
          //if the token exists for the client, but it is invalid by the server
          //or by previous (other tab) logout
          if (authService.isAuthenticated()) {
            authService.destroySession();
          }
          $location.url('/login');
          return false;
        }
        if($route.current.auths.noSession && Session){
          $location.url('/my_paradrop');
          return false;
        }
        if($route.current.auths.group && !Session.defaultGroup){
          $location.url('/my_paradrop');
          return false;
        }
        if($route.current.auths.admin && !Session.isAdmin){
          $location.url('/my_paradrop');
          alert('You must be an admin to view this page!');
          return false;
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
      this.aps = null;
      this.fullname = null;
      this.defaultGroup = null;

      this.create = function (username, sessionId, isDeveloper, isAdmin, aps, fullname) {
        this.username = username;
        this.fullname = fullname;
        this.id = sessionId;
        //boolean (binary) fields, default to 0 (false)
        this.isDeveloper = parseInt(isDeveloper, 2) || 0;
        this.isAdmin = parseInt(isAdmin, 2)         || 0;
        //array of AP objects
        this.aps = aps;
        for(var i = 0; i < aps.length; i++){
          if(aps[i].groupname){
            this.defaultGroup = aps[i].groupname;
            break;
          }
        }

        return this;
      };

      this.destroy = function () {
        this.username = null;
        this.id = null;
        this.isDeveloper = null;
        this.isAdmin = null;
        this.aps = null;
        this.fullname = null;
        this.defaultGroup = null;
      };


      return this;
    }
  );
