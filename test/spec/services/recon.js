'use strict';

describe('Service: Recon', function () {

  // load the service's module
  beforeEach(module('paradropApp'));

  // instantiate service
  var Recon;
  beforeEach(inject(function (_Recon_) {
    Recon = _Recon_;
  }));

  it('should do something', function () {
    expect(!!Recon).toBe(true);
  });

});
