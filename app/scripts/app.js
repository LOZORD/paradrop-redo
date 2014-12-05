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
  .constant('USER_ROLES', {
    all: '',
    stranger:   'STRANGER',
    enabled:    'isEnabled',
    verified:   'isVerified',
    developer:  'isDeveloper',
    admin:      'isAdmin',
    loggedIn:   'isEnabled'
  })
  .config(function ($routeProvider, USER_ROLES) {
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
        permissions: [USER_ROLES.loggedIn]
      })
      .when('/user/new', {
        templateUrl: 'views/signup_form.html',
        controller: 'NewUserCtrl',
        permissions: [
          //don't allow already logged in users to create a new user
          USER_ROLES.stranger
        ]
      })
      .otherwise({
        redirectTo: '/'
      });
  })
  .run(
    //protect from minification?
    function ($rootScope, AUTH_EVENTS, AuthService, $location) {
      $rootScope.$on('$routeChangeStart',
        function (event, next) {
          var authorizedRoles = next.permissions || [];

          if (!AuthService.isAuthorized(authorizedRoles))
          {
            event.preventDefault();

            if (AuthService.isAuthenticated())
            {
              //user is not allowed
              //$rootScope.$broadcast(AUTH_EVENTS.notAuthorized);
              alert('you are logged in but not authenticated');
            }
            else
            {
              //user is not logged in
              //$rootScope.$broadcast(AUTH_EVENTS.notAuthenticated);
              alert('access denied - not logged in');
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
  .constant('URLS', {
    http: 'http://paradrop.wings.cs.wisc.edu:30333/v1/',
    https: 'https://paradrop.wings.cs.wisc.edu:30332/v1/',
  });
