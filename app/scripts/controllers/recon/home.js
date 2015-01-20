'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:ReconHomeCtrl
 * @description
 * # ReconHomeCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('ReconHomeCtrl',['$scope', '$sce', '$routeParams', 'Recon', 'chartBuilder', 'ipCookie', '$http', 'URLS', '$q', '$rootScope', function ($scope, $sce, $routeParams, Recon, chartBuilder, ipCookie, $http, URLS, $q, $rootScope) {
  $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
  $scope.initCurrentUser.promise
  .then(function(){ $scope.authorizePage();})
  .then(
    function(){
      var charts = chartBuilder.getBuiltCharts();
      if(charts){
        //skip building charts
        //$scope.totalCusts = charts.repeatVisits.totalCusts;
        $scope.totalCusts = Recon.recon.getNumberCustomersInside();
        $scope.contentLoaded = true;
      }else{ 
          $rootScope.reconInit.promise.then(function(){
          console.log('promise resolved');

          $scope.totalCusts = Recon.recon.getNumberCustomersInside();
          //build charts ahead of time
          $scope.contentLoaded = true;
          chartBuilder.buildTotalUsers(); 
          console.log('Total Users Chart Built');
          chartBuilder.buildEngagementChart(); 
          console.log('Engagement Chart Built');
          Recon.recon.setupRepeatVisits().then(
            function(){
              var repeatChart = chartBuilder.buildRepeatVisitsChart(); 
              $scope.contentLoaded = true;
            }
          );
        });
      }
    }
    );
}]);
