'use strict';

var compareTo = function () {
  return {
    require: 'ngModel',
    scope: {
      otherModelValue: '=compareTo'
    },
    link: function(scope, element, attributes, ngModel) {
      
      ngModel.$validates.compareTo = function (modelValue) {
        return modelValue == scope.otherModelValue;
      };

      scope.$watch('otherModelValue', function () {
        ngModel.$validate();
      });
    }
  };
};

angular.module('paradropApp').directive('compareTo', compareTo);
