"use strict";

var _ = require('lodash');

/* jshint unused:false */
var routeDefs = [
  // Basic route with callback and name 'routes'
  ['/route', function (match) {}, 'routes'],
  // Route with parameters, name is 'route', :id is parameter
  ['/route/:id', function (match) {}, 'route'],
  // Route with url name, name is '/route/good'
  ['/route/good', function (match) {}],
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
      'routes', 'route', '/route/good', 'splat', 'option'
    ]);
    expect(_.keys(router.routes).length).toEqual(5);
    expect(_.keys(router.names).length).toEqual(5);
    expect(router.defaultRoute).toBeUndefined();

    expect(routerWithDefault.routeList).toEqual([
      'routes', 'route', '/route/good', 'splat', 'option'
    ]);
    expect(_.keys(routerWithDefault.routes).length).toEqual(5);
    expect(_.keys(routerWithDefault.names).length).toEqual(5);
    expect(routerWithDefault.defaultRoute).toBeDefined();
  });

  it("must match all the defined routes", function () {
    var Reititin = require('../reititin');
    var router = new Reititin.Router(routeDefs);
    var routerWithDefault = new Reititin.Router(routeDefsWithDefault);

    expect(router.match('/ueou')).toEqual(false);

    expect(routerWithDefault.match('/ueoe')).toEqual({
      name: 'default',
      url: '/ueoe',
      params: {},
      query: {}
    });

    expect(router.match('/route')).toEqual({
      name: 'routes',
      url: '/route',
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

    expect(router.match('/splat/foo/bar/baz')).toEqual({
      name: 'splat',
      url: '/splat/foo/bar/baz',
      params: {splat: 'foo/bar/baz'},
      query: {}
    });
  });

  it("must call callback when routing", function () {
    // TODO
  });

  it("must reverse the route from the url", function () {
    // TODO
  });

  it("must be possible to add or remove a route", function () {
    // TODO
  });
});

describe("HashRouter", function () {
  it("must bind and unbind window event", function () {
    // TODO
  });

  it("must react to window changes", function () {
    // TODO
  });

  it("must navigate to the reversed url", function () {
    // TODO
  });
});
