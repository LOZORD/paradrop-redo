'use strict';

angular.module('paradropApp')
  .controller('AppStoreCtrl', ['$scope', '$http', 'URLS', '$rootScope',
      function ($scope /*, $http, URLS, $rootScope*/) {
        $scope.appData = null;
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
        var processAppData = function(data) {
          return data.map(function(someAppData) {
            return {
              name: someAppData.name,
              id: someAppData.id,
              genre: someAppData.genre            || 'Miscellaneous',
              author: someAppData.author          || 'Unknown Author',
              releaseDate: someAppData.releaseDate,
              metaData: someAppData.metaData      || {},
              iconUrl: someAppData.iconUrl        || 'images/logo.png'
            };
          });
        };

        $scope.doTheThing = function(id) {
          // TODO: maybe open a modal for details?
          window.alert(id);
        };

        $scope.appData = processAppData(APP_DATA);
        //$scope.queryStr = '';
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
