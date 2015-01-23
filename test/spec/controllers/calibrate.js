'use strict';

describe('Controller: CalibrateCtrl', function () {

  // load the controller's module
  beforeEach(module('paradropApp'));

  var CalibrateCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    CalibrateCtrl = $controller('CalibrateCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
