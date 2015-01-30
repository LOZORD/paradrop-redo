'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconHomeCtrl
 * @description
 * # ReconHomeCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconHomeCtrl',['$scope', '$sce', '$routeParams', 'Recon', '$rootScope', 
    function ($scope, $sce, $routeParams, Recon, $rootScope) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.restoreSession.promise
      .then($scope.authorizePage)
      .then(function(authorized){
        if(authorized){
          $rootScope.reconInit.promise.then(function(){
            $scope.totalCusts = Recon.recon.getNumberCustomersInside();
            $scope.contentLoaded = true;
          });
        }
      });
    }
  ]);
