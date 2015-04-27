'use strict';
/*
This directive attempts to mimic the functionality of the 'disable' modifiers
used in Angular 1.4.0+ select ng-options directives.

Main usage: disabling select options
*/
angular.module('paradropApp')
  .directive('selectOptionsDisable', function() {

    return {
      require:  'ngModel',
      scope:    {
        masterValue: ''
      },
      link:     linkFunc
    };
  });
