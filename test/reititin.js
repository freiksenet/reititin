"use strict";

var _ = require('lodash');

/* jshint unused:false */
var routeDefs = [
  // Basic route with callback and name 'routes'
  ['/route', function (match) {}, 'routes'],
  // Route with url name, name is '/route/good'
  ['/route/good', function (match) {}],
  // Route with parameters, name is 'route', :id is parameter
  ['/route/:id', function (match) {}, 'route'],
  // Route with *splat, matches url fragment
  ['/splat/*splat', function (match) {}, 'splat'],
  // Route with (optional) fragment
  ['/optional(/thing)', function (match) {}, 'option']
];

var routeDefsWithDefault = [['*', function (match) {}]].concat(routeDefs);
/* jshint ignore:end */

describe("Router", function () {
  it("must accept all ways to construct routes", function () {
    var Reititin = require('../reititin');
    var router = new Reititin.Router(routeDefs);
    var routerWithDefault = new Reititin.Router(routeDefsWithDefault);

    expect(router.routeList).toEqual([
      'routes', '/route/good', 'route', 'splat', 'option'
    ]);
    expect(_.keys(router.routes).length).toEqual(5);
    expect(_.keys(router.names).length).toEqual(5);
    expect(router.defaultRoute).toBeUndefined();

    expect(routerWithDefault.routeList).toEqual([
      'routes', '/route/good', 'route', 'splat', 'option'
    ]);
    expect(_.keys(routerWithDefault.routes).length).toEqual(6);
    expect(_.keys(routerWithDefault.names).length).toEqual(6);
    expect(routerWithDefault.defaultRoute).toBeDefined();
  });

  it("must match all the defined routes", function () {
    var Reititin = require('../reititin');
    var router = new Reititin.Router(routeDefs);
    var routerWithDefault = new Reititin.Router(routeDefsWithDefault);

    expect(router.match('/ueou')).toEqual(false);

    expect(routerWithDefault.match('/ueoe?foo=2')).toEqual({
      name: '*',
      url: '/ueoe?foo=2',
      params: {
        url: '/ueoe'
      },
      query: {
        foo: '2'
      }
    });

    expect(router.match('/route')).toEqual({
      name: 'routes',
      url: '/route',
      params: {},
      query: {}
    });

    expect(router.match('/route/good')).toEqual({
      name: '/route/good',
      url: '/route/good',
      params: {},
      query: {}
    });

    expect(router.match('/route/5')).toEqual({
      name: 'route',
      url: '/route/5',
      params: {id: '5'},
      query: {}
    });

    expect(router.match('/route/5?foo=baz&gar=brak')).toEqual({
      name: 'route',
      url: '/route/5?foo=baz&gar=brak',
      params: {id: '5'},
      query: {
        foo: 'baz',
        gar: 'brak'
      }
    });

    expect(router.match('/optional')).toEqual({
      name: 'option',
      url: '/optional',
      params: {},
      query: {}
    });

    expect(router.match('/optional/thing')).toEqual({
      name: 'option',
      url: '/optional/thing',
      params: {},
      query: {}
    });

    expect(router.match('/splat/foo/bar/baz')).toEqual({
      name: 'splat',
      url: '/splat/foo/bar/baz',
      params: {splat: 'foo/bar/baz'},
      query: {}
    });
  });

  it("must call callback when routing", function () {
    var routeCallback1 = jasmine.createSpy('routeCallback1');
    var routeCallback2 = jasmine.createSpy('routeCallback2');
    var routes = [
      ['/route1', routeCallback1],
      ['/route2', routeCallback2],
      ['/route/:id', routeCallback1]
    ];

    var Reititin = require('../reititin');
    var router = new Reititin.Router(routes);

    router.route('/route1');
    expect(routeCallback1).toHaveBeenCalledWith({
      name: '/route1',
      url: '/route1',
      params: {},
      query: {}
    });
    routeCallback1.calls.reset();

    router.route('/route1?foo=bar');
    expect(routeCallback1).toHaveBeenCalledWith({
      name: '/route1',
      url: '/route1?foo=bar',
      params: {},
      query: {
        foo: 'bar'
      }
    });
    routeCallback1.calls.reset();

    router.route('/route/5?foo=baz');
    expect(routeCallback1).toHaveBeenCalledWith({
      name: '/route/:id',
      url: '/route/5?foo=baz',
      params: {
        id: '5'
      },
      query: {
        foo: 'baz'
      }
    });
    expect(routeCallback2).not.toHaveBeenCalled();
  });

  it("must error routing to non-existant route", function () {
    var Reititin = require('../reititin');
    var router = new Reititin.Router(routeDefs);
    var routerWithDefault = new Reititin.Router(routeDefsWithDefault);

    expect(function () {
      router.route('/bogus/url');
    }).toThrow();

    expect(function () {
      routerWithDefault.route('/bogus/url');
    }).not.toThrow();
  });

  it("must reverse the route from the name and parameters", function () {
    var Reititin = require('../reititin');
    var router = new Reititin.Router(routeDefs);

    expect(router.find('routes')).toBe('/route');
    expect(router.find('routes')).toBe(
      router.reverse('routes')
    );

    expect(router.find('routes', {}, {foo: 1, bar: 2})).toBe(
      "/route?foo=1&bar=2"
    );

    expect(router.find('ohblargargh')).toBe(false);
    expect(function () {
      router.reverse('ohblargarght');
    }).toThrow();
    expect(router.find('routes', {id: 5})).not.toBe(false);
    expect(function () {
      router.find('routes', {id: 5});
    }).not.toThrow();

    expect(router.find('route', {id: 5})).toBe('/route/5');
    expect(router.find('route', {pk: 5})).toBe(false);
    expect(function () {
      router.reverse('route', {pk: 5});
    }).toThrow();

    expect(router.find('option')).toBe('/optional/thing');
    expect(router.find('splat', {splat: 'baz/barg'})).toBe('/splat/baz/barg');
  });

  it("must be possible to add or remove a route", function () {
    var Reititin = require('../reititin');
    var router = new Reititin.Router(routeDefs);

    expect(router.match('/route')).not.toBe(false);

    router.remove('/route');
    expect(router.match('/route')).toBe(false);
    router.remove('option');
    expect(router.match('/optional')).toBe(false);

    router.append('pkRoute', '/route/:pk', function () {});
    expect(router.match('/route/5')).toEqual({
      name: 'route',
      url: '/route/5',
      params: {
        id: '5'
      },
      query: {}
    });
    expect(router.find('route', {id: 5})).toBe('/route/5');
    expect(router.find('pkRoute', {pk: 5})).toBe('/route/5');

    router.prepend('pkRoute', '/route/:pk', function () {});
    expect(router.match('/route/5')).toEqual({
      name: 'pkRoute',
      url: '/route/5',
      params: {
        pk: '5'
      },
      query: {}
    });
    expect(router.find('route', {id: 5})).toBe('/route/5');
    expect(router.find('pkRoute', {pk: 5})).toBe('/route/5');
  });
});

describe("HashRouter", function () {
  it("must route using location hash", function (done) {
    var Reititin = require('../reititin');

    var routeCallback1 = jasmine.createSpy('routeCallback1');
    var routeCallback2 = jasmine.createSpy('routeCallback2');
    var routes = [
      ['/', routeCallback1],
      ['/route2', routeCallback2]
    ];
    var router = new Reititin.HashRouter(routes);

    router.start();
    expect(routeCallback1).toHaveBeenCalled();
    routeCallback1.calls.reset();

    window.location.hash = '#/route2';

    setTimeout(function () {
      expect(routeCallback2).toHaveBeenCalled();
      routeCallback2.calls.reset();
      router.stop();

      window.location.hash = '#/';

      setTimeout(function () {
        expect(routeCallback1).not.toHaveBeenCalled();
        done();
      }, 100);
    }, 100);
  });
  it("must navigate to the reversed url", function (done) {

    var Reititin = require('../reititin');

    var routeCallback1 = jasmine.createSpy(
      'routeCallback1'
    );
    var routeCallback2 = jasmine.createSpy(
      'routeCallback2'
    );

    var routes = [
      ['/', routeCallback1],
      ['/route2', routeCallback2],
    ];

    var router = new Reititin.HashRouter(routes);
    router.start();

    router.navigate('/route2');

    setTimeout(function () {
      expect(routeCallback2).toHaveBeenCalled();
      router.stop();
      done();
    }, 100);
  });
});

describe("HistoryRouter", function () {
  it("must route using location url", function (done) {
    var Reititin = require('../reititin');

    var routeCallback1 = jasmine.createSpy('routeCallback1');
    var routeCallback2 = jasmine.createSpy('routeCallback2');
    var routes = [
      ['/', routeCallback1],
      ['/route2', routeCallback2],
    ];
    var router = new Reititin.HistoryRouter(routes);

    window.history.pushState({}, '/route2', '/route2');
    router.start();

    expect(routeCallback2).toHaveBeenCalled();
    routeCallback2.calls.reset();

    router.stop();
    window.history.pushState({}, '/', '/');
    router.start();

    expect(routeCallback1).toHaveBeenCalled();

    window.history.back();

    setTimeout(function () {
      expect(routeCallback2).toHaveBeenCalled();
      router.stop();
      done();
    }, 100);
  });

  it("must navigate to reversed url", function (done) {
    var Reititin = require('../reititin');

    var routeCallback1 = jasmine.createSpy('routeCallback1');
    var routeCallback2 = jasmine.createSpy('routeCallback2');
    var routes = [
      ['/', routeCallback1],
      ['/route2', routeCallback2],
    ];
    var router = new Reititin.HistoryRouter(routes);
    router.start();

    router.navigate('/route2');
    expect(routeCallback2).toHaveBeenCalled();
    routeCallback2.calls.reset();
    router.navigate('/');
    expect(routeCallback1).toHaveBeenCalled();
    routeCallback1.calls.reset();

    window.history.back();
    setTimeout(function () {
      expect(routeCallback2).toHaveBeenCalled();
      window.history.forward();
      setTimeout(function () {
        expect(routeCallback1).toHaveBeenCalled();
        done();
      }, 100);
    }, 100);
  });
});
