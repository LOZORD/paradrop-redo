'use strict';

angular.module('paradropApp')
  .controller('AppStoreCtrl', ['$scope', '$http', 'URLS', '$rootScope',
      function ($scope /*, $http, URLS, $rootScope*/) {
        // TODO: Eventually check if they have a session

        // TODO: make API call

        var APP_DATA = [
          {
            name: 'App1',
            id: 1,
            genre: 'Networking',
            author: 'Albert Einstein',
            releaseDate: Date.now(),
            metaData: {},
            iconUrl: ''
          },
          {
            name: 'App2',
            id: 2,
            genre: 'Entertainment',
            author: 'Alan Turing',
            releasteDate: Date.now(),
            metaData: {},
            iconUrl: ''
          }
        ];

        // Assuming the API call works...

        $scope.appData = APP_DATA;
        $scope.queryStr = '';
        $scope.genres = $scope.appData.reduce(function(prev, currData) {
          // if it's a new genre, add it
          if (prev.indexOf(currData.genre) === -1) {
            prev.push(currData.genre);
          } else {
            // do nothing
          }

          return prev;
        }, []);
      }]);
