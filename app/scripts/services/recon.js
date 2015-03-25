'use strict';

/**
 * @ngdoc service
 * @name paradropApp.Recon
 * @description
 * # Recon
 * Service in the paradropApp.
 */
angular.module('paradropApp')
  .service('Recon',[ 'Session', 'URLS', '$http', '$rootScope', '$q', 'chartBuilder', function (Session, URLS, $http, $rootScope, $q, chartBuilder) {

    function enableButtons(){
      $rootScope.enable = true;
    }

    this.recon = null;
    this.nothing = function(){};
    var self = this;

    $rootScope.sessionBuilt.promise.then(function(){
      if(Session.defaultGroup){
        var post = function(url, args){
          //Inject the session token into the args list to POST
          args.sessionToken = Session.id;
          console.log('POST to: ' + URLS.current.substr(0, URLS.current.length-4) + url);
          var call = $http.post(URLS.current.substr(0, URLS.current.length-4) + url, args);
          return call;
        };


        self.recon = new Recon( { postFunc: post} );
        //setup prev day recon dictionary
        self.storedData = {0: self.recon, 1: null , 2: null, 3: null, 4: null, 5: null, 6: null, 7: null };
        //setup opts for prefetch

        var opts = {
          start: $rootScope.openTime,
          stop: $rootScope.closeTime,
          groupName: Session.defaultGroup
        };

        var today = new Date();
        today.setHours(18);
        today.setMinutes(59);
        today.setSeconds(59);
        today.setMilliseconds(0);
        today = Math.floor(today.getTime() / 1000);

        self.prevOpts = function(offset) {
          var close;
            if((new Date()).getHours() < 10){
              close = $rootScope.closeTime - offset*86400;
            }else{
              close = today - offset*86400;
            }
          return {
            start: $rootScope.openTime - offset*86400,
            stop: close,
            groupName: Session.defaultGroup
          };
        };

        var currDay = 0;
        self.prevDay = function (buildCharts) {
          if(currDay < 7){
            currDay++;
            if(!self.storedData[currDay+1]){
              $rootScope.enable = false;
            }else if(!self.storedData[currDay+1].data){
              $rootScope.enable = false;
            }
            self.recon = self.storedData[currDay];
            $rootScope.reconDate = self.recon.dateString;
            var graphData = self.recon
                            .getTotalGroupByTS(self.recon.myOpts.start, 
                              self.recon.myOpts.stop, 3600);
            chartBuilder.buildTotalUsers(graphData, 3600);
            graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
            chartBuilder.buildEngagementChart(graphData);
            graphData = self.recon.getRepeatVisits();
            chartBuilder.buildRepeatVisitsChart(graphData);
            buildCharts();
            if(!self.storedData[currDay+1] && currDay !== 7){
              self.storedData[currDay+1] = new Recon({postFunc: post});
              self.storedData[currDay+1].myOpts = self.prevOpts(currDay+1); 
              self.storedData[currDay+1].dateString = 'on ' + 
                (new Date(self.storedData[currDay+1].myOpts.start*1000))
                .toDateString();
              self.storedData[currDay+1].prefetch(self.prevOpts(currDay+1))
                .then(enableButtons);
            }else if(currDay ===7){
              enableButtons();
            }
          }else{
            alert('You can only look at the last 7 days of data.');
          }
          return {};
        };

        self.nextDay = function (buildCharts) {
          if(currDay > 0){
            currDay--;
            self.recon = self.storedData[currDay];
            $rootScope.reconDate = self.recon.dateString;
            var graphData = self.recon.getTotalGroupByTS(self.recon.myOpts.start,
                              self.recon.myOpts.stop, 3600);
            chartBuilder.buildTotalUsers(graphData, 3600);
            graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
            chartBuilder.buildEngagementChart(graphData);
            graphData = self.recon.getRepeatVisits();
            chartBuilder.buildRepeatVisitsChart(graphData);
            buildCharts();
            enableButtons();
          }else{
            buildCharts();
            alert('Today is the most recent day you can view data for.');
          }
          return {};
        };

        self.recon.myOpts = opts;
        self.recon.dateString = 'so far Today';
        self.recon.prefetch(opts)
        .then(function(){
          $rootScope.reconInit.resolve();
          var stopts = $rootScope.closeTime;
          var startts = $rootScope.openTime;
          var graphData = self.recon.getTotalGroupByTS(startts, stopts,
                            $rootScope.granularity);
          chartBuilder.buildTotalUsers(graphData, $rootScope.granularity);
          graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
          chartBuilder.buildEngagementChart(graphData);
          graphData = self.recon.getRepeatVisits();
          chartBuilder.buildRepeatVisitsChart(graphData);
          chartBuilder.chartsBuilt();
        });

        self.storedData[currDay+1] = new Recon( { postFunc: post } );
        self.storedData[currDay+1].myOpts = self.prevOpts(currDay+1); 
        self.storedData[currDay+1].dateString = 'on ' + 
          (new Date(self.storedData[currDay+1].myOpts.start*1000))
          .toDateString();
        self.storedData[currDay+1].prefetch(self.prevOpts(currDay+1))
          .then(enableButtons);

      }

    });
    return this.recon;
  }]);
