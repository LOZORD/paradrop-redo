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
    'ngStorage',
    'ngTouch',
    'highcharts-ng',
    'paradropServices',
    'ipCookie',
    'ngMap',
    'snap',
    'ui.bootstrap.datetimepicker'
  ])
  .config(function(snapRemoteProvider) {
    snapRemoteProvider.globalOptions.disable = 'right';
    snapRemoteProvider.globalOptions.tapToClose = true;
    snapRemoteProvider.globalOptions.touchToDrag = false;
  })
  .config(['$routeProvider', function ($routeProvider) {
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
      .when('/my_paradrop/configs/:apName/update', {
        templateUrl: 'views/mypdp/configs/update.html',
        controller: 'ConfigCtrl',
        auths: { session: true }
      })
      .when('/my_paradrop/configs/:apName/chutes', {
        templateUrl: 'views/mypdp/configs/chutes/index.html',
        controller: 'ChuteCtrl',
        auths: { session: true }
      })
      .when('/my_paradrop/configs/:apName/chutes/vnets/:chuteid', {
        templateUrl: 'views/mypdp/configs/chutes/vnets/show.html',
        controller: 'ChuteCtrl',
        auths: { session: true }
      })
      .when('/my_paradrop/configs/:apName/chutes/vnets/:chuteid/update', {
        templateUrl: 'views/mypdp/configs/chutes/vnets/update.html',
        controller: 'ChuteCtrl',
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
      .when('/recon/map/:group_id', {
        templateUrl: 'views/recon/tracking.html',
        controller: 'ReconTrackingCtrl',
        auths: {group: true, session: true}
      })
      .when('/recon/map/:group_id/:height/:width', {
        templateUrl: 'views/recon/tracking.html',
        controller: 'ReconTrackingCtrl',
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
      .when('/calibrate/:group_id', {
        templateUrl: 'views/calibrate.html',
        controller: 'CalibrateCtrl',
        auths: { session: true}
      })
      .when('/modes/restricted_signup', {
        templateUrl: 'views/modes/restricted_signup.html',
        auths: {}
      })
      .when('/localization', {
        templateUrl: 'views/localization.html',
        controller: 'LocalizationCtrl',
        auths: {admin: true, session: true}
      })
      .when('/map_settings', {
        templateUrl: 'views/map_settings.html',
        controller: 'MapSettingsCtrl',
        auths: {admin: true, session: true}
      })
      .when('/map_settings/:group_id', {
        templateUrl: 'views/map_settings.html',
        controller: 'MapSettingsCtrl',
        auths: { session: true}
      })
      .when('/recon/tracking/:group_id', {
        templateUrl: 'views/recon/tracking.html',
        controller: 'ReconTrackingCtrl',
        auths: { group: true, session: true}
      })
      .when('/recon/tracking/:group_id/:height/:width', {
        templateUrl: 'views/recon/tracking.html',
        controller: 'ReconTrackingCtrl',
        auths: { group: true, session: true}
      })
      .when('/info/users', {
        templateUrl: 'views/infousers.html',
        controller: 'InfousersCtrl'
      })
      .when('/info/developers', {
        templateUrl: 'views/infodevs.html',
        controller: 'InfodevsCtrl'
      })
      .when('/privacy-policy', {
        templateUrl: 'views/privacy-policy.html',
      })
      .when('/terms-and-conditions', {
        templateUrl: 'views/terms-and-conditions.html',
      })
      .when('/apps', {
        templateUrl: 'views/apps.html',
        controller: 'AppStoreCtrl'
      })
      .otherwise({
        redirectTo: '/',
        auths: {}
      });
  }])
  .config(function($locationProvider) {
    //setup urls for crawler to get static html
      $locationProvider
    .html5Mode(true);
  })
  .config(function ($httpProvider) {
    //disregard browser pre-flight checks
    var contentType = { 'Content-Type' : 'application/x-www-form-urlencoded' };
    for (var verb in $httpProvider.defaults.headers)
    {
      $httpProvider.defaults.headers[verb] = contentType;
    }
  })
  .config(['$httpProvider', function ($httpProvider) {
    //intercept http errors and show alert
    $httpProvider.interceptors.push(function ($q, $rootScope) {

      $rootScope.httpErrorAlert = function(text){
        $rootScope.httpErrorText = text;
        $rootScope.showHttpErrorAlert = true;
      };
      $rootScope.closeHttpErrorAlert = function(){
        $rootScope.showHttpErrorAlert = false;
      };

      return {
        'response': function (response) {
          //Will only be called for HTTP up to 300
          return response;
        },
        'responseError': function (rejection) {
          if(rejection.status !== 403){
            $rootScope.httpErrorAlert('<strong>' + rejection.status + ' Error: ' + rejection.statusText + 
              '</strong><br>Additional Info: ' + rejection.data); 
          }
          return $q.reject(rejection);
        }
      };
    });
  }])
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
    //setup alert system
    $rootScope.closeAlerts = function(){
      $rootScope.showSuccessAlert = false;
      $rootScope.showDangerAlert = false;
      $rootScope.showWarningAlert = false;
      $rootScope.showInfoAlert = false;
    };

    $rootScope.closeSuccessAlert = function(){
      $rootScope.showSuccessAlert = false;
    };

    $rootScope.closeWarningAlert = function(){
      $rootScope.showWarningAlert = false;
    };

    $rootScope.closeDangerAlert = function(){
      $rootScope.showDangerAlert = false;
    };

    $rootScope.closeInfoAlert = function(){
      $rootScope.showInfoAlert = false;
    };

    $rootScope.warningAlert = function(text){
      $rootScope.warningText = text;
      $rootScope.showWarningAlert = true;
    };

    $rootScope.dangerAlert = function(text){
      $rootScope.dangerText = text;
      $rootScope.showDangerAlert = true;
    };

    $rootScope.successAlert = function(text){
      $rootScope.successText = text;
      $rootScope.showSuccessAlert = true;
    };

    $rootScope.infoAlert = function(text){
      $rootScope.infoText = text;
      $rootScope.showInfoAlert = true;
    };
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
    current: 'https://dbapi.paradrop.io/v1/'//1 ? 'http://paradrop.wings.cs.wisc.edu:20330/v1/' : 'https://dev.dbapi.paradrop.io'
  })
  .constant('MODES', {
    restrictedSignup: true
  });
