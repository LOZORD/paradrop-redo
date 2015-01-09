'use strict';

/**
 * @ngdoc function
 * @name paradropApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the paradropApp
 */
angular.module('paradropApp')
  .controller('DashboardCtrl', [ '$q', '$scope', '$routeParams', '$sce', 'URLS', '$http', 'Recon', 'd3Service', function ($q, $scope, $routeParams, $sce, URLS, $http, Recon, d3Service) {
    $scope.initCurrentUser.promise
    .then(function(){ $scope.authorizePage();})
    .then(
      function(){
        $scope.group_id = $sce.trustAsResourceUrl($routeParams.group_id);
        var credentials = { sessionToken: $scope.currentUser.id, startts: 1419175301 /*new Date().getTime() / 1000 - 86400*/, stopts: new Date().getTime() / 1000 };
        var groupURL = URLS.current + 'recon/data/get/' + $scope.group_id;
        $http.post(groupURL, credentials).then(
          function(json){
            Recon.parseData(json.data);
            $scope.graphData = Recon.getTotalGroupByTS(1419175642, 1419262042, 3600);
            var plot = [];
            var xTimes = [];
            for(var i = 0; i < $scope.graphData.x.length; i++){ 
              var time = new Date($scope.graphData.x[i] * 1000);
              var hours = time.getHours();
              var suffix = '';
              if(hours >= 12){
                suffix = 'PM';
                if(hours >= 13){
                  hours -= 12;
                }
              }else{
                suffix = 'AM';
              }
              xTimes.push(hours + ':' + time.getMinutes() + suffix);
              plot.push({name: xTimes[i], y: $scope.graphData.y[i]});
            }
            $scope.initChart = $q.defer();
            $scope.chartConfig = {
              //This is not a highcharts object. It just looks a little like one!
              options: {
                //This is the Main Highcharts chart config. Any Highchart options are valid here.
                //will be ovverriden by values specified below.
                chart: {
                  type: 'line'
                },
                tooltip: {
                  style: {
                    padding: 10,
                    fontWeight: 'bold'
                  }
                }
              },

              //The below properties are watched separately for changes.

              //Series object (optional) - a list of series using normal highcharts series options.
              series: [{
                data: plot,
                name: 'Total Users'
              }],
              //Title configuration (optional)
              title: {
                text: 'Total Users'
              },
              //Boolean to control showng loading status on chart (optional)
              //Could be a string if you want to show specific loading text.
              loading: false,
              //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
              //properties currentMin and currentMax provied 2-way binding to the chart's maximimum and minimum
              xAxis: {
                categories: xTimes,
                title: {text: 'Time'},
                labels: {
                  step: 3,
                  maxStaggerLines: 1
                }
              },
              yAxis: {
               title: {text: 'Total Users'},
               floor: 0
              },
              //Whether to use HighStocks instead of HighCharts (optional). Defaults to false.
              useHighStocks: false,
              //size (optional) if left out the chart will default to size of the div or something sensible.
              //function (optional)
              func: function (chart) {
                //setup some logic for the chart
                $scope.chart = chart;
                $scope.initChart.resolve();
              }

            };
            
            $scope.initChart.promise.then(
              function() {
                $scope.contentLoaded = true;
                setTimeout(function(){$scope.chart.reflow();},0);
              }
            );
          });
      });
  }]);
