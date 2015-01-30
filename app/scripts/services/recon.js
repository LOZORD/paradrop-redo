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
        //setup opts for prefetch

        var opts = {
          start: $rootScope.openTime,
          stop: $rootScope.closeTime,
          groupName: Session.defaultGroup
        };

        self.recon.prefetch(opts)
        .then(function(){
          $rootScope.reconInit.resolve();
          var stopts = $rootScope.closeTime;
          var startts = $rootScope.openTime;
          var graphData = self.recon.getTotalGroupByTS(startts, stopts,
                            $rootScope.granularity);
          chartBuilder.buildTotalUsers(graphData);
          graphData = self.recon.getEngagementByTS([0, 300, 600, 900]);
          chartBuilder.buildEngagementChart(graphData);
          graphData = self.recon.getRepeatVisits();
          chartBuilder.buildRepeatVisitsChart(graphData);
          chartBuilder.chartsBuilt();
        });
      }
    });
    return this.recon;
  }]);
