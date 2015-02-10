'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconHomeCtrl
 * @description
 * # ReconHomeCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconHomeCtrl',['$scope', '$sce', '$routeParams', 'Recon', '$rootScope', '$q',
    function ($scope, $sce, $routeParams, Recon, $rootScope, $q) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          $scope.date = function(){
            if($rootScope.reconDate.indexOf('Today') !== -1){
              return 'Today';
            }else{
              return $rootScope.reconDate.substring(3);
            }
          }
          $rootScope.reconInit.promise.then(updateTotal);

          $scope.prevDay = function(){
            $scope.contentLoaded = false;
            $rootScope.chartsBuilt = $q.defer()
            Recon.prevDay();
            $rootScope.chartsBuilt.promise.then(updateTotal);
          }

          $scope.nextDay = function(){
            $scope.contentLoaded = false;
            $rootScope.chartsBuilt = $q.defer()
            $rootScope.enable = false;
            Recon.nextDay();
            $rootScope.chartsBuilt.promise.then(updateTotal);
          }
        }

        function updateTotal(){
          $scope.totalCusts = Recon.recon.getNumberCustomersInside();
          $scope.contentLoaded = true;
        }

      });
    }
  ]);
