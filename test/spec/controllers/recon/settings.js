'use strict';

describe('Controller: ReconSettingsCtrl', function () {

  // load the controller's module
  beforeEach(module('paradropApp'));

  var ReconSettingsCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ReconSettingsCtrl = $controller('ReconSettingsCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
