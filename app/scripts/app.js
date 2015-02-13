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
        controller: 'MainCtrl',
        auths: {}
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        auths: {}
      })
      .when('/blog', {
        templateUrl: 'views/blog/index.html',
        controller: 'BlogCtrl',
        auths: {}
      })
      //this mirrors the /blog path (duplicate)
      .when('/blog/posts', {
        templateUrl: 'views/blog/index.html',
        controller: 'BlogCtrl',
        auths: {}
      })
      .when('/blog/posts/:ts', {
        templateUrl: 'views/blog/posts/show.html',
        controller: 'BlogCtrl',
        auths: {}
      })
      .when('/blog/topics', {
        templateUrl: 'views/blog/topics/index.html',
        controller: 'BlogCtrl',
        auths: {}
      })
      .when('/blog/topics/:topic', {
        templateUrl: 'views/blog/topics/show.html',
        controller: 'BlogCtrl',
        auths: {}
      })
      .when('/contact', {
        templateUrl: 'views/contact.html',
        controller: 'ContactCtrl',
        auths: {}
      })
      .when('/login', {
        templateUrl: 'views/login_form.html',
        controller: 'LoginCtrl',
        auths: {noSession: true}
      })
      .when('/my_paradrop', {
        controller: 'MyParadropCtrl',
        templateUrl: 'views/mypdp/index.html',
        auths: {session: true}
      })
      .when('/my_paradrop/configs', {
        templateUrl: 'views/mypdp/configs/index.html',
        controller: 'ConfigCtrl',
        auths: { session: true }
      })
      .when('/my_paradrop/configs/:cDeviceID/update', {
        templateUrl: 'views/mypdp/configs/update.html',
        controller: 'ConfigCtrl',
        auths: { session: true }
      })
      .when('/user/new', {
        templateUrl: 'views/signup/form.html',
        controller: 'NewUserCtrl',
        auths: {noSession: true}
      })
      .when('/notify', {
        templateUrl: 'views/signup/notify.html',
        auths: {}
      })
      .when('/verify', {
        redirectTo: '/',
        auths: {}
      })
      .when('/verify/:verificationToken', {
        templateUrl: 'views/signup/verify.html',
        controller:   'NewUserCtrl',
        auths: {}
      })
      .when('/recon/map/:group_id*', {
        templateUrl: 'views/recon/map.html',
        controller: 'ReconMapCtrl',
        auths: {group: true, session: true}
      })
      .when('/recon/home/:group_id*', {
        templateUrl: 'views/recon/home.html',
        controller: 'ReconHomeCtrl',
        auths: {group: true, session: true}
      })
      .when('/recon/settings/:group_id*', {
        templateUrl: 'views/recon/settings.html',
        controller: 'ReconSettingsCtrl',
        auths: {group: true, session: true}
      })
      .when('/recon/dashboard/:group_id*', {
        templateUrl: 'views/recon/dashboard.html',
        controller: 'ReconDashboardCtrl',
        auths: {group: true, session: true}
      })
      .when('/calibrate', {
        templateUrl: 'views/calibrate.html',
        controller: 'CalibrateCtrl',
        auths: {admin: true, session: true}
      })
      .when('/modes/restricted_signup', {
        templateUrl: 'views/modes/restricted_signup.html',
        auths: {}
      })
      .otherwise({
        redirectTo: '/',
        auths: {}
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
  })
  .run(function($rootScope, $window, $location, $q){
    //create session promise
    $rootScope.sessionBuilt = $q.defer();
    var track = function() {
      $window.ga('send', 'pageview', { page: $location.path() });
    };
    $rootScope.$on('$viewContentLoaded', track);
  })
  .run(function($rootScope, Recon) {
    //hack to avoid jshint complaint
    Recon.nothing();
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
      //TODO refactor...
      if(timeDiff < 5){
        $rootScope.granularity = 1800;
      }
      if(timeDiff < 3){
        $rootScope.granularity = 900;
      }
      $rootScope.openTime = Math.floor(openTime.getTime() / 1000);
      $rootScope.closeTime = Math.floor(closeTime.getTime() / 1000);
    
  }) 
  .run(function(AuthService, $q, $rootScope) {
    //setup some promises for services
    $rootScope.chartsBuilt = $q.defer();
    $rootScope.reconInit = $q.defer();
  })
  .constant('URLS', {
    //Change the current url to change all calls globally
    current: 'https://dbapi.paradrop.io/v1/'
  })
  .constant('MODES', {
    restrictedSignup: true
  })
  .constant('DEV_MODE', false);
