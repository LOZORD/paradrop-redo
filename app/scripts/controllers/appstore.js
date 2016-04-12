'use strict';

angular.module('paradropApp')
  .controller('AppStoreCtrl', ['$scope', '$routeParams',
      function ($scope, $routeParams) {
        $scope.appData = null;
        $scope.specificApp = null;
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
            releaseDate: Date.now(),
            metaData: {},
            iconUrl: ''
          },
          {
            name: 'App3',
            id: 3,
            genre: 'Security',
            author: 'George Jetson',
            releaseDate: Date.now(),
            metaData: {},
            iconUrl: ''
          },
          {
            name: 'App4',
            id: 4,
            genre: 'Entertainment',
            author: 'Grace Hopper',
            releaseDate: Date.now(),
            metaData: {},
            iconUrl: ''
          },
          {
            name: 'App5',
            id: 5,
            genre: 'Entertainment',
            author: 'Count Dracula',
            releaseDate: Date.now(),
            metaData: {},
            iconUrl: ''
          },
          {
            name: 'App6',
            id: 6,
            genre: 'Entertainment',
            author: 'Doctor Frankenstein',
            releaseDate: Date.now(),
            metaData: {},
            iconUrl: ''
          }
        ];

        // Assuming the API call works...

        // Set default values
        // TODO: make this a map of appId => appData
        var processAppData = function(data) {
          return data.map(function(someAppData) {
            return {
              name: someAppData.name,
              id: someAppData.id,
              genre: someAppData.genre              || 'Miscellaneous',
              author: someAppData.author            || 'Unknown Author',
              releaseDate: someAppData.releaseDate,
              metaData: someAppData.metaData        || {},
              iconUrl: someAppData.iconUrl          || 'images/logo.png',
              description: someAppData.description  || 'No description given.'
            };
          });
        };

        $scope.launchAppModal = function(appId) {
          $scope.specificApp = $scope.appData.find(function(someApp) {
            return someApp.id === appId;
          });

          // need to append to body so that modal appears on top of background
          $('#appModal').appendTo('body').modal();
        };

        $scope.modalClick = function(appId) {
          window.alert('modal click: ' + appId.toString());
        };

        $scope.appData = processAppData(APP_DATA);
        $scope.genres = $scope.appData.reduce(function(prevResult, currData) {
          // if it's a new genre, add it
          if (prevResult.indexOf(currData.genre) === -1) {
            prevResult.push(currData.genre);
          } else {
            // do nothing
          }

          return prevResult;
        }, []);

        if ($routeParams.appId) {
          // XXX: expecting int id
          var appId = parseInt($routeParams.appId, 10);
          $scope.launchAppModal(appId);
        }
      }]);
