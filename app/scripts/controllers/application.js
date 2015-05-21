'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ApplicationCtrl
 * @description
 * # ApplicationCtrl
 * Controller of the paradropApp
 * Included in the <body> tag, this controller has global scope
 */
angular.module('paradropApp')
  .controller('ApplicationCtrl', ['snapRemote', '$q', '$scope', '$location', 'AuthService', 'URLS', '$rootScope', '$routeParams', 'ipCookie', '$window', '$sce',
    function (snapRemote, $q, $scope, $location, AuthService, URLS, $rootScope, $routeParams, ipCookie, $window, $sce) {
      $scope.URL = URLS.current;
      $scope.currentUser = AuthService.getSession;
      if(ipCookie('DEV_MODE') === undefined){
        if($location.absUrl().indexOf('paradrop.io') != -1){
          $scope.DEV_MODE = false;
        }else{
          $scope.DEV_MODE = true;
        }
      }else{
        $scope.DEV_MODE = ipCookie('DEV_MODE');
      }

      $scope.toggleDevMode = function(){
        if($scope.currentUser().isAdmin){
          $scope.DEV_MODE = !$scope.DEV_MODE;
          ipCookie('DEV_MODE', $scope.DEV_MODE, { expires: 7, path: '/' });
          $window.location.reload();
        }
      };
      if($scope.DEV_MODE){
        $scope.reconURL = $sce.trustAsResourceUrl('https://www.paradrop.io/storage/recon.js');
      }else{
        $scope.reconURL = $sce.trustAsResourceUrl('https://www.paradrop.io/storage/recon.min.js');
      }

      //collapse dropdown on page changes
      $scope.$on('$routeChangeStart',
        function(){
          $scope.isCollapsed = true;
          $scope.closeAlerts();
        }
      );
      $scope.isAuthenticated = AuthService.isAuthenticated;

      $scope.hasSessionCookie = function() {
        return !!AuthService.getToken();
      };

      $scope.sessionToken = AuthService.getToken;

      $scope.authorizePage = AuthService.authorizePage;

      $scope.logout = AuthService.logout;

      $scope.isLoginPage = ($location.path().indexOf('/login') !== -1);

      $scope.containerStyle = function(){
        if($routeParams.height && $routeParams.width){
          return {margin: '0 0 0 50px'};
        }else{
          return {};
        }
      };

      /*
      XXX be sure to add rootScope in the params if you want to use it!
      $rootScope.reverterFactory = function (updateData, updateForm) {
        return function (origData) {
          updateData = angular.copy(origData);
          updateForm.$setPristine(true);
        };
      };
      $rootScope.reverter = function (origData, updateData, updateForm) {
        console.log('orig', origData);
        console.log('data', updateData);
        console.log('form', updateForm);
        updateData = angular.copy(origData);
        updateForm.$setPristine(true);
      };
      */

      $rootScope.anyDirtyAndInvalid = function (form, inputs) {
        return (inputs.some(function (inputName) {
          return form[inputName].$dirty && form[inputName].$invalid;
        }));
      };
    }
  ]);
