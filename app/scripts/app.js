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
    'paradropServices'
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
        controller: 'MyParadropCtrl',
        permissions: []//[USER_ROLES] //TODO
      })
      .when('/user/new', {
        templateUrl: 'views/signup_form.html',
        controller: 'NewUserCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(
    //protect from minification?
    function ($rootScope, AUTH_EVENTS, AuthService) {
      $rootScope.$on('$stateChangeStart',
        function (event, next) {
          //window.alert('hello world!');
          //TODO
        }
      );
    }
  )
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
  .constant('AUTH_EVENTS', {
    loginSuccess: 'auth-login-success',
    loginFailed: 'auth-login-failed',
    logoutSuccess: 'auth-logout-success',
    sessionTimeout: 'auth-session-timeout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
  })
  .constant('USER_ROLES', {
    all: '',
    enabled:    'isEnabled',
    verified:   'isVerified',
    developer:  'isDeveloper',
    admin:      'isAdmin',
    loggedIn:   'isEnabled'
  });
