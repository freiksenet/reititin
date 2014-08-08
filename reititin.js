"use strict";

var qs = require('query-string');
var Route = require('route-parser');

var isArray = Array.isArray || function (arg) {
  return Object.prototype.toString.call(arg) === '[object Array]';
};

var inherits = function (ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var Router = function (routes) {
  this.names = {};
  this.routes = {};
  this.defaultRoute = undefined;

  if (routes) {
    for (var route in routes) {
      var routeName;
      var routeCallback = routes[route];

      if (isArray(routeCallback)) {
        routeName = routeCallback[0];
        routeCallback = routeCallback[1];
      } else if (routeCallback.name.length > 0) {
        routeName = routeCallback.name;
      } else {
        routeName = route;
      }

      this.add(routeName, route, routeCallback);
    }
  }
};

Router.prototype._getByName = function (name) {
  return this.routes[this.names[name]];
};

Router.prototype.add = function (name, route, callback) {
  if (route === '*') {
    this.defaultRoute = {
      name: 'default',
      matcher: new Route('*url'),
      callback: callback
    };
  } else {
    this.remove(name);
    this.remove(route);

    this.names[name] = route;
    this.routes[route] = {
      name: name,
      matcher: new Route(route),
      callback: callback
    };
  }

  return this;
};

Router.prototype.remove = function (name) {
  if (name === '*') {
    this.defaultRoute = undefined;
  } else if (this.names[name]) {
    var route = this.names[name];
    delete this.routes[route];
    delete this.names[name];
  } else if (this.routes[name]) {
    var routeName = this.routes[name].name;
    delete this.names[routeName];
    delete this.routes[name];
  }

  return this;
};

function matchOne (route, url) {
  var matcher = route.matcher;
  var match = matcher.match(url);
  if (match !== false) {
    var query = {};
    var parts = url.split('?');
    if (parts.length > 1) {
      query = qs.parse(parts[1]);
    }
    return {
      name: route.name,
      url: url,
      params: match,
      query: query
    };
  } else {
    return false;
  }
}

Router.prototype.match = function (url) {
  for (var routeKey in this.routes) {
    var route = this.routes[routeKey];
    var result = matchOne(route, url);
    if (result !== false) {
      return result;
    }
  }
  if (this.defaultRoute) {
    var defaultMatch = matchOne(this.defaultRoute, url);
    defaultMatch.params = {};
    return defaultMatch;
  }
  return false;
};

Router.prototype.route = function (url) {
  var match = this.match(url);
  if (match !== false) {
    this._getByName(match.name).callback(match);
    return match;
  } else {
    throw "Couldn't match url '" + url + "'.";
  }
};

Router.prototype.find = function (name, params, query) {
  var rule = this._getByName(name);
  if (!rule) {
    rule = this.routes[name] || {};
  }

  var matcher = rule.matcher;
  if (matcher) {
    var match = matcher.reverse(params);
    var queryString = "";
    if (query !== undefined) {
      queryString = qs.stringify(query);
    }
    if (queryString.length > 0) {
      match = match + "?" + queryString;
    }
    return match;
  } else {
    return false;
  }
};

Router.prototype.reverse = function (name, params, query) {
  var url = this.find(name, params, query);
  if (url !== false) {
    return url;
  } else {
    throw "Couldn't reverse " + name + " with given params " + params + ".";
  }
};

var HashRouter = function (routes) {
  HashRouter.super_.call(this, routes);
  this.started = false;
};

inherits(HashRouter, Router);

HashRouter.prototype.navigate = function (name, params, query) {
  window.location.hash = '#' + this.reverse(name, params, query);
};

HashRouter.prototype.start = function () {
  if (!this.started) {
    this.started = true;
    this.listener = function () {
      var location = window.location.hash;
      if (window.location.hash.length > 0) {
        location = location.slice(1);
      } else {
        location = '/';
      }
      this.route(location);
    }.bind(this);
    window.addEventListener('hashchange', this.listener);
    this.listener();
  }
};

HashRouter.prototype.end = function () {
  if (this.started) {
    window.removeEventListener('hashchange', this.listener);
    delete this.listener;
    this.started = false;
  }
};

module.exports = {
  Router: Router,
  HashRouter: HashRouter
};
