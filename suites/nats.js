let Benchmarkify = require("benchmarkify");

let benchmark = new Benchmarkify("Mostly microservices benchmark").printHeader();

const bench = benchmark.createSuite("Call remote actions");

// mostly-node barebone
let mostly1;
let mostly2;
(function () {

  const mostly = require('mostly-node');
  const nats = require('nats').connect("nats://localhost:4222");

  mostly1 = new mostly(nats, { logLevel: 'error' });
  mostly2 = new mostly(nats, { logLevel: 'error' });

  mostly2.ready(() => {
    mostly2.add({ topic: 'math', cmd: 'add' }, (resp, cb) => {
      cb(null, resp.a + resp.b);
    });
  });

  bench.add("mostly-node", done => {
    mostly1.act({ topic: 'math', cmd: 'add', a: 5, b: 3 }, (err, res) => {
      if (err)
        console.error(err);
      done();
    });
  });

})();

// mostly-feathers
let feather1;
let feather2;
(function () {

  const mostly = require('mostly-node');
  const feathers = require('mostly-feathers');
  const memory = require('feathers-memory');
  const nats = require('nats').connect("nats://localhost:4222");

  feather1 = new mostly(nats, { logLevel: 'error' });
  feather2 = new mostly(nats, { logLevel: 'error' });

  const service = new memory();

  feather2.ready(() => {
    const app = feathers(feather2);
    app.service.call(app, 'memory', service);
  });

  bench.add("mostly-feathers", done => {
    feather1.act({
      topic: 'feathers.memory',
      cmd: 'find',
      path: '/api/memory',
      args: [],
      params: {}
    }, (err, res) => {
      if (err)
        console.error(err);
      done();
    });
  });

})();

// mostly-mongoose
/*
let mongoose1;
(function () {

  const mostly = require('mostly-node');
  const nats = require('nats').connect("nats://localhost:4222");

  mongoose1 = new mostly(nats, { logLevel: 'error' });

  bench.add("mostly-mongoose", done => {
    mongoose1.act({
      topic: 'feathers.dummies',
      cmd: 'find',
      path: '/api/dummies',
      args: [],
      params: {}
    }, (err, res) => {
      if (err)
        console.error(err);
      done();
    });
  });

})();
*/

setTimeout(() => {

  benchmark.run([bench]).then(() => {
    mostly1.close();
    mostly2.close();

    feather1.close();
    feather2.close();

    //mongoose1.close();
  });

}, 10000);
