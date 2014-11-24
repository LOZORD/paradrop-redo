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
  .run(
    //protect from minification?
    function ($rootScope, AUTH_EVENTS, AuthService) {
      $rootScope.$on('$stateChangeStart',
        function (event, next) {
          var authorizedRoles = next.data.authorizedRoles;

          if (!AuthService.isAuthorized(authorizedRoles)) {
            event.preventDefault();

            if (AuthService.isAuthenticated()) {
              //logged in user is not allowed access to the next page
              $rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
            }
            else {
              //user is not logged in
              $rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
            }
          }
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
  //TODO remove?
  .constant('USER_ROLES', {
    all: '*',
    admin: 'admin',
    editor: 'editor',
    guest: 'guest'
  });
