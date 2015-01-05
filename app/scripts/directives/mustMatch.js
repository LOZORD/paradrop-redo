'use strict';

angular.module('paradropApp')
  .directive('mustMatch', function() {
    /*
    scope is the current scope
    slaveInput is the confirmation input (the one with the directive)
    attrs is the list of attributes on elem
    attrs is the list of ng/$ attributes on elem
    */
    function link(scope, slaveInput, attrs, ctrl) {
      console.log('you are using must-match!');
      //console.log(scope, slaveInput, attrs, ctrl);
      var masterQuery = 'input#' + attrs.mustMatch;
      var masterInput = $(masterQuery);

      ctrl.$validators.mustMatch = function() {
        //do not trim passwords
        var mVal = masterInput.val();
        var sVal =  slaveInput.val();

        if (mVal === sVal) {
          console.log('MATCH!');
          return true;
        }
        else {
          console.log('NO MATCH!');
          return false;
        }

      };

      //scope.$watch(masterInput, ctrl.$validators.mustMatch);
      masterInput.focus(ctrl.$validators.mustMatch);
    }

    //return obj
    return {
      require:  'ngModel',
      link:     link
    };
  });
