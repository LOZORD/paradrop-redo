angular.module('paradropApp')
  .controller('DashboardCtrl', ['$scope',
      function($scope) {
        $scope.user = null;
        $scope.aps  = null;
        $scope.chutes = null;

        // TODO: use http...

        var USER_DATA = {
          name: 'Bucky Badger',
          username: 'buckyb',
          aps: [
            {
              ssid: 'APOne',
              encryption: 'none',
              chutes: [
                'App1',
                'App2',
                'App3'
              ]
            },
            {
              ssid: 'ApTwo',
              encryption: 'none',
              chutes: [
                'App3',
                'App4',
                'App5',
                'App6'
              ]
            }
          ]
        };

        $scope.user = USER_DATA;

        $scope.aps = USER_DATA.aps;

        $scope.chutes = $scope.aps
        .map(function(ap) {
          return ap.chutes;
        });
        /* flatten
        .reduce(function(acc, cur) {
          return acc.concat(cur);
        }, []);
        */
      }]);
