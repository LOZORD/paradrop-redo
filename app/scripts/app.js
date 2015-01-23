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
    'highcharts-ng',
    'paradropServices',
    'ipCookie',
    'ngMap',
    'snap'
  ])
  .config(function(snapRemoteProvider) {
    snapRemoteProvider.globalOptions.disable = 'right';
    snapRemoteProvider.globalOptions.tapToClose = true;
    snapRemoteProvider.globalOptions.touchToDrag = false;
  })
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
      .when('/recon/map/:group_id*', {
        templateUrl: 'views/recon/map.html',
        controller: 'ReconMapCtrl'
      })
      .when('/recon/home/:group_id*', {
        templateUrl: 'views/recon/home.html',
        controller: 'ReconHomeCtrl'
      })
      .when('/recon/settings/:group_id*', {
        templateUrl: 'views/recon/settings.html',
        controller: 'ReconSettingsCtrl'
      })
      .when('/recon/dashboard/:group_id*', {
        templateUrl: 'views/recon/dashboard.html',
        controller: 'ReconDashboardCtrl'
      })
      .when('/calibrate', {
        templateUrl: 'views/calibrate.html',
        controller: 'CalibrateCtrl'
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
  .run(function(AuthService, ipCookie, $q, $rootScope) {
    $rootScope.restoreSession = $q.defer();
    $rootScope.$on('$routeChangeStart', function (event, next) {
        //first check that they have a cookie
        var tokenCookie = ipCookie('sessionToken');
        //attempt to clone the session using the cookie data
        if (tokenCookie) {
          AuthService.cloneSession().then(
            /* SUCCESSFUL CLONING */
            function() {
              $rootScope.restoreSession.resolve();
            },
            /* UNSUCCESSFUL CLONING */
            function() {
              AuthService.destroySession();
              $rootScope.restoreSession.resolve();
            }
          );
        }
        //otherwise, just resolve the promise w/o using the cookie
        else {
          $rootScope.restoreSession.resolve();
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
    http: 'http://paradrop.wings.cs.wisc.edu:30333/v1/',
    https: 'https://paradrop.wings.cs.wisc.edu:30332/v1/',
    pdropvpn: 'https://10.1.0.214:30332/v1/',
    alldayvpn: 'https://10.1.0.230:30332/v1/',
    //Change the current url to change all calls globally
    current: 'https://dbapi.paradrop.io/v1/'
  })
  .constant('DEV_MODE', false);
