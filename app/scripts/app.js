'use strict';

/**
 * @ngdoc overview
 * @name paradropApp
 * @description
 * # paradropApp
 *
 * Main module of the application.
 */
angular.module('paradropApp', [
    'ngAnimate',
    'ngAria',
    'ngCookies',
    'ngMessages',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'paradropServices',
    'ipCookie'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/blog', {
        templateUrl: 'views/blog/index.html',
        controller: 'BlogCtrl'
      })
      .when('/blog/posts/:ts', {
        templateUrl: 'views/blog/show.html',
        controller: 'BlogCtrl'
      })
      .when('/blog/topics/:topic', {
        templateUrl: 'views/blog/topic.html',
        controller: 'BlogCtrl'
      })
      .when('/contact', {
        templateUrl: 'views/contact.html',
        controller: 'ContactCtrl'
      })
      .when('/login', {
        templateUrl: 'views/login_form.html',
        controller: 'LoginCtrl'
      })
      .when('/my_paradrop', {
        templateUrl: 'views/mypdp.html',
        controller: 'MyParadropCtrl'
      })
      .when('/user/new', {
        templateUrl: 'views/signup_form.html',
        controller: 'NewUserCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .config(function($locationProvider) {
    //setup urls for crawler to get static html
      $locationProvider
    .html5Mode(false)
    .hashPrefix('!');
  })
  .config(function ($httpProvider) {
    //disregard browser pre-flight checks
    var contentType = { 'Content-Type' : 'application/x-www-form-urlencoded' };
    for (var verb in $httpProvider.defaults.headers)
    {
      $httpProvider.defaults.headers[verb] = contentType;
    }

    //check page authorizations first
    $httpProvider.interceptors.push([
      '$injector',
      function ($injector) {
        return $injector.get('AuthInterceptor');
      }
    ]);
  })
  .run(function(Session, AuthService, ipCookie, $q, $rootScope) {
    $rootScope.restoreSession = $q.defer();
    $rootScope.$on('$routeChangeStart', function (event, next) {
      //attempt to clone the session if they are not logged in (has an id==token)
      if(!AuthService.getSession().id){
        //first check that they have a cookie
        var tokenCookie = ipCookie('sessionToken');
        //attempt to clone the session using the cookie data
        if (tokenCookie) {
          var credentials = { sessionToken: tokenCookie };
          AuthService.cloneSession(credentials).then(
            /* SUCCESSFUL CLONING */
            function() {
              $rootScope.restoreSession.resolve();
            },
            /* UNSUCCESSFUL CLONING */
            function() {
              $rootScope.restoreSession.resolve();
            }
          );
        }
        //otherwise, just resolve the promise w/o using the cookie
        else {
          $rootScope.restoreSession.resolve();
        }
      }
    });
  })
  .constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
  })
  .constant('URLS', {
    http:  'http://dbapi.paradrop.io/v1/',
    https: 'https://dbapi.paradrop.io/v1/'
  });
