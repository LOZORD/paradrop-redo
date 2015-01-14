'use strict';

describe('Controller: ReconDashboardCtrl', function () {

  // load the controller's module
  beforeEach(module('paradropApp'));

  var ReconDashboardCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ReconDashboardCtrl = $controller('ReconDashboardCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
