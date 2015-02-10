'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconDashboardCtrl
 * @description
 * # ReconDashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconDashboardCtrl',['$rootScope', '$scope', '$sce', '$routeParams', 'chartBuilder', 'Recon', '$q',
    function ($rootScope, $scope, $sce, $routeParams, chartBuilder, Recon, $q) {
      $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
      $scope.authorizePage()
      .then(function(authorized){
        if(authorized){
          $rootScope.chartsBuilt.promise.then(buildCharts).then(enableButtons);
          $scope.date = function(){
            if($rootScope.reconDate.indexOf('Today') !== -1){
              return 'Today';
            }else{
              return $rootScope.reconDate.substring(3);
            }
          }

          $scope.prevDay = function(){
            $rootScope.chartsBuilt = $q.defer()
            $scope.enable = false;
            Recon.prevDay(enableButtons);
            $rootScope.chartsBuilt.promise.then(buildCharts);
          }

          $scope.nextDay = function(){
            $rootScope.chartsBuilt = $q.defer()
            $scope.enable = false;
            Recon.nextDay(enableButtons);
            $rootScope.chartsBuilt.promise.then(buildCharts);
          }
        }

        function enableButtons(){
          $scope.enable = true;
        }

        function buildCharts(){
            var charts = chartBuilder.getBuiltCharts();
            //chart 1
            $scope.chartInfo = charts.totalUsers; 
            $scope.chartConfig = $scope.chartInfo.chartConfig;
            $scope.contentLoaded = true;
            //chart 2
            $scope.chartInfo2 = charts.engagement; 
            $scope.chartConfig2 = $scope.chartInfo2.chartConfig;
            $scope.content2Loaded = true;
            //chart 3
            /*
            $scope.chartInfo3 = charts.repeatVisits; 
            $scope.chartConfig3 = $scope.chartInfo3.chartConfig;
            $scope.totalCusts = $scope.chartInfo3.totalCusts;
            $scope.content3Loaded = true;
            */
            return {};
        }
      });
  }]);
