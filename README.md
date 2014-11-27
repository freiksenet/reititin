# reititin - sane routing library

![Build status](https://travis-ci.org/freiksenet/reititin.svg?branch=master)

reititin (Finnish for 'router') is a small library to do essential routing.
In my search for a router, I couldn't find one that matches all of the following
criteria:

- does both route matching and route reversal
- match context is passed to routing function
- handles query string
- is packaged sanely (usable from any CommonJS module consumer like
  Webpack/Browserify without hacks)
- is a library, not a framework or global context eating monstrosity

reititin tries to do all the above.

## Installation

If you use browserify or webpack

```
npm install reititin
```

If you use require.js or want to use it standalone, then UMD version is
available in [Releases](https://github.com/freiksenet/reititin/releases).

If you want to build from source

```
git clone https://github.com/freiksenet/reititin.git
cd reititin
npm install
npm run umd(-min)
```

`build/reititin.(min.)js` will be created.

Tests can be run with

```
npm test # or npm run test-watch for continious testing
```

## Usage

Examples are using CommonJS modules, just substitute require statements with
your favorite ~~poison~~module system or alternatively window.Reititin.

`Reititin.Router` is the main constructor function, that accepts an array of
route definitions, which are arrays of route and callback or route, name and
callback. Callbacks to be called on successful routing with match object.

All routes in Reititin have unique names. Reititin can get route in 2 different
ways:

1. By getting name of a named function as a routing function
2. Using route path

```js
var Reititin = require('reititin');

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

// Creating router
var router = new Reititin.Router(routeDefs);

// Optional catch all match
routeDefs['*'] = function (match) {};
var routerWithDefault = new Reititin.Router(routeDefs);
```

### Router.match(url)

Tries to match the url against the router rules.

If router fails to match, and there is no catch-all rule, the method will return
false. If router matches, then method will return match object. Match object has
4 fields, `name` is route name, `url` is full url that was matched, `params` is
object of all url parameters and their value and, finally, `query` is a parsed
querystring. Priority of routes is defined by the order in the list.

```js
router.match('/ueou');
// ==> false

routerWithDefault.match('/ueoe?foo=2');
// ==> {name: '*', url: '/ueoe', params: {url: '/ueoe'}, query: {foo: '2'}}

router.match('/route');
// ==> {name: 'routes', url: '/route', params: {}, query: {}}

router.match('/route/5');
// ==> {name: 'route', url: '/route/5', params: {id: 5}, query: {}}

router.match('/route/5?foo=baz&gar=brak');
// ==> {name: 'route', url: '/route/5?foo=baz&gar=brak', params: {id: 5}, query: {foo: 'baz', gar: 'brak'}}

router.match('/splat/foo/bar/baz');
// ==> {name: 'splat', url: '/splat/foo/bar/baz', params: {splat: 'foo/bar/baz'}, query: {}}

```

### Router.route(url)

Tries to match the route with Route.match and calls the given callback with
match object, if match is successful.

If router can't match, throws an error. If router matches, returns match object.

```js
router.route('/ueou');
// ==> throws error

router.route('/route');
// ==> {name: 'routes', url: '/route', params: {}, query: {}}
```

### Router.find(name, params, query)

If there is a named route by name that matches given params, returns the route
reconstructed url with querystring matching the query. Returns false if no match
is found.

```js
router.find('ueauo'); // ==> false
router.find('route', {foo: 'bar'}); // ==> false
router.find('routes'); // ==> '/route'
router.find('route', {id: 5}); // ==> '/route/5'
router.find('routes', {}, {foo: [5, 2], bar: 'foo'}); // ==> '/route?foo=5&foo=2&bar=foo
router.find('/route/good'); // ==> '/route/good'
```

Splats are parameters too.

```js
router.find('splat', {splat: 'baz/barg}); // >== '/splat/baz/barg'
```

Urls with optional fragments return with all the fragments in there.

```js
router.find('option'); // ==> '/optional/thing'
```

### Router.reverse(name, params, query)

Same as Router.find, but throws an error, if there is no match. Use this method
for reversing the urls that will be consumed as is (for `href` in anchor,
$.ajax, etc.), so that browser won't go to '/false'.

```js
$.getJSON(router.reverse('routes'));
```

### Router.append(name, route, callback), Router.preend(name, route, callback)

Add a new route with given `name`, `route` and `callback`. Returns router itself
for chaining. It will override existing routes if there is one with both name
*or* route definition.

Difference between 'append' and 'prepend' is whether they add the routes to the
beginning or end of the route list (for priority).

### Router.remove(name)

Removes a route, `name` is either a route name or route definition. Removes
matching both by name and route definition.

## Hooking up the real life - HistoryRouter and HashRouter

In general you can hook up router manually to any kind of url handling, be it
server, client HistoryAPI or hash-url. Therefore Reititin is isomorphic (same
code can be used on client in server). However, reititin provides ready made
solutions for routing on client with hash urls and with History API. If you are
using reititin both on client and server, you should inject client helper
implementation.

## HistoryRouter

`Reititin.HistoryRouter` is a wrapper around `Reititin.Router` that uses History
API for url handling. It has same interface as normal router, with 3 additional
methods.

### HistoryRouter.start()

Binds `window.onpopstate` event, to react to browser forward/back button. Also
tries to route with current url.

### HistoryRouter.stop()

Unbinds the `window.onpopstate` event.

### HistoryRouter.navigate(name, params, query, replace)

Reverses the url with given name, params and query and then updates
window.history. If `replace` is true, uses replaceState, uses pushState
otherwise.

## HashRouter

`Reititin.HashRouter` is a wrapper around `Reititin.Router` that uses
document.location.hash urls. It has same interface as normal router, with 3
additional methods.

### HashRouter.start()

Binds `window.onhashchange` event, will try to route when hash changes. Also
tries to route with current url, if there is no url after hash, then '/' is
assumed.

### HashRouter.stop()

Unbinds the `window.onhashchange` event.

### HashRouter.navigate(name, params, query)

Reverses the url with given name, params and query and then changes page has to
it.
