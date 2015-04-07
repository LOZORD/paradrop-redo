'use strict';
hidden = $scope.macData[mac].poly.hidden;

/**
 * @ngdoc service
 * @name paradropApp.chartBuilder
 * @description
 * # chartBuilder
 * Factory in the paradropApp.
 */
angular.module('paradropApp')
  .factory('chartBuilder',['$rootScope', function ($rootScope) {
    // Service logic
    // ...

    var charts = {};

    charts.getBuiltCharts = function(){
      return this.builtCharts;
    };

    charts.chartsBuilt = function(){
      $rootScope.chartsBuilt.resolve();
    };

    // Public API here
    charts.buildTotalUsers = function(graphData, granularity){
      var chartInfo = {};
      var plot = [];
      var xTimes = [];
      var step = 4;
      for(var i = 0; i < graphData.x.length; i++){ 
        var time = new Date(graphData.x[i] * 1000);
        var hours = time.getHours();
        var minutes = time.getMinutes();
        var suffix = '';
        if(hours >= 12){
          suffix = 'PM';
          if(hours >= 13){
            hours -= 12;
          }
        }else{
          suffix = 'AM';
          if(hours === 0){
            hours = 12;
          }
        }
        var endHours = (hours+1)%12;
        if(endHours === 0){
          endHours = 12;
          suffix = 'PM';
        }
        xTimes.push(hours + (minutes===0?'':':' + minutes) +'-' + 
            ((minutes +(granularity / 60))===60?
            endHours.toString():hours.toString()) + 
            ((minutes +(granularity / 60))===60?'':':' + 
            (minutes + (granularity / 60))) + suffix);

        plot.push({name: xTimes[i], y: graphData.y[i]});
        if(xTimes.length < 6){
          step = 1;
        }else if(xTimes.length < 12){
          step = 2;
        }else if(xTimes.length < 18){
          step = 3;
        }
      }
      var chartConfig = {
        //This is not a highcharts object. It just looks a little like one!
        options: {
          //This is the Main Highcharts chart config. Any Highchart options are valid here.
          //will be ovverriden by values specified below.
          chart: {
            type: 'column'
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
          name: 'Number of Customers',
          color: '#7cb5ec'
        }],
        //Title configuration (optional)
        title: {
          text: 'Number of Customers ' + $rootScope.reconDate
        },
        //Boolean to control showng loading status on chart (optional)
        //Could be a string if you want to show specific loading text.
        loading: false,
        //Configuration for the xAxis (optional). Currently only one x axis can be dynamically controlled.
        //properties currentMin and currentMax provied 2-way binding to the chart's maximimum and minimum
        xAxis: {
          categories: xTimes ,
          title: {text: 'Time'},
          labels: {
            step: step,
            maxStaggerLines: 2
          }
        },
        yAxis: {
         title: {text: 'Number of Customers'},
         floor: 0
        },
        //Whether to use HighStocks instead of HighCharts (optional). Defaults to false.
        useHighStocks: false,
        //size (optional) if left out the chart will default to size of the div or something sensible.
        //function (optional)
        func: function (chart) {
          //setup some logic for the chart
          chartInfo.chart = chart;
        }

      };
      chartInfo.chartConfig = chartConfig;
      if(!this.builtCharts){
        this.builtCharts = {};
      }
      this.builtCharts.totalUsers = chartInfo;
      return chartInfo;
    };

    charts.buildEngagementChart = function(graphData){
      var chartInfo = {};

      var chartConfig = {
        //This is not a highcharts object. It just looks a little like one!
        options: {
          //This is the Main Highcharts chart config. Any Highchart options are valid here.
          //will be ovverriden by values specified below.
          chart: {
            type: 'pie'
          },
          tooltip: {
            style: {
              padding: 10,
              fontWeight: 'bold'
            }
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
              }
            }
          }
        },

        //The below properties are watched separately for changes.

        //Series object (optional) - a list of series using normal highcharts series options.
        series: [{
          data: [['0-5 min', graphData.y[0]], ['5-10 min', graphData.y[1]],['10-15 min', graphData.y[2]],['15+ min', graphData.y[3]]],
          name: '# of Customers',
        }],
        //Title configuration (optional)
        title: {
          text: 'Length of Customer Engagement'
        },
        //Boolean to control showng loading status on chart (optional)
        //Could be a string if you want to show specific loading text.
        loading: false,
        useHighStocks: false,
        //function (optional)
        func: function (chart) {
          //setup some logic for the chart
          chartInfo.chart = chart;
        }

      };
      chartInfo.chartConfig = chartConfig;
      if(!this.builtCharts){
        this.builtCharts = {};
      }
      this.builtCharts.engagement = chartInfo;
      return chartInfo;
    };

    charts.buildRepeatVisitsChart = function(graphData){
      var chartInfo = {};
      var chartConfig = {
        //This is not a highcharts object. It just looks a little like one!
        options: {
          //This is the Main Highcharts chart config. Any Highchart options are valid here.
          //will be ovverriden by values specified below.
          chart: {
            type: 'pie'
          },
          tooltip: {
            style: {
              padding: 10,
              fontWeight: 'bold'
            }
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                style: {
                    color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
                }
              }
            }
          }
        },

        //The below properties are watched separately for changes.

        //Series object (optional) - a list of series using normal highcharts series options.
        series: [{
          data: [['New Customers', graphData.total - graphData.repeat], ['Repeat Customers', graphData.repeat]],
          name: 'Number of Customers',
        }],
        //Title configuration (optional)
        title: {
          text: 'New vs. Repeat Customers'
        },
        //Boolean to control showng loading status on chart (optional)
        //Could be a string if you want to show specific loading text.
        loading: false,
        useHighStocks: false,
        //function (optional)
        func: function (chart) {
          //setup some logic for the chart
          chartInfo.chart = chart;
        }

      };
      chartInfo.chartConfig = chartConfig;
      chartInfo.totalCusts = graphData.total;
      if(!this.builtCharts){
        this.builtCharts = {};
      }
      this.builtCharts.repeatVisits = chartInfo;
      return chartInfo;
    };

    return charts;
  }]);
