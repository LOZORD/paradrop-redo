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
      .when('/blog', {
        templateUrl: 'views/blog/index.html',
        controller: 'BlogCtrl'
      })
      //this mirrors the /blog path (duplicate)
      .when('/blog/posts', {
        templateUrl: 'views/blog/index.html',
        controller: 'BlogCtrl'
      })
      .when('/blog/posts/:ts', {
        templateUrl: 'views/blog/posts/show.html',
        controller: 'BlogCtrl'
      })
      .when('/blog/topics', {
        templateUrl: 'views/blog/topics/index.html',
        controller: 'BlogCtrl'
      })
      .when('/blog/topics/:topic', {
        templateUrl: 'views/blog/topics/show.html',
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
        templateUrl: 'views/signup/form.html',
        controller: 'NewUserCtrl'
      })
      .when('/notify', {
        templateUrl: 'views/signup/notify.html'
      })
      .when('/verify', {
        redirectTo: '/'
      })
      .when('/verify/:verificationToken', {
        templateUrl: 'views/signup/verify.html',
        controller:   'NewUserCtrl'
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
  .run(function($rootScope) {
    //determine the date  and open times for recon fetching
      var openTime = new Date();
      var closeTime = new Date();
      $rootScope.granularity = 3600;//default
      $rootScope.reconDate = 'so far Today';
      if(openTime.getHours() < 10){
        openTime.setDate(openTime.getDate() -1);
        $rootScope.reconDate = 'on ' + openTime.toLocaleDateString();
        closeTime.setDate(closeTime.getDate() -1);
        closeTime.setHours(18);
        closeTime.setMinutes(59);
        closeTime.setSeconds(59);
        closeTime.setMilliseconds(0);
      }
      openTime.setHours(9);
      openTime.setMinutes(0);
      openTime.setSeconds(0);
      openTime.setMilliseconds(0);
      if(closeTime.getHours() > 19){
        closeTime.setHours(18);
        closeTime.setMinutes(59);
        closeTime.setSeconds(59);
        closeTime.setMilliseconds(0);
      }
      var timeDiff = closeTime.getHours() - openTime.getHours();
      if(timeDiff < 5){
        $rootScope.granularity = 1800;
      }
      if(timeDiff < 3){
        $rootScope.granularity = 900;
      }
      $rootScope.openTime = Math.floor(openTime.getTime() / 1000);
      $rootScope.closeTime = Math.floor(closeTime.getTime() / 1000);
    
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
    //Change the current url to change all calls globally
    current: 'https://dbapi.paradrop.io/v1/'
  })
  .constant('DEV_MODE', false);
