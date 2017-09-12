'use strict'

const mostly = require('mostly-node');
const nats = require('nats');

const PORT = 4222;
const noAuthUrl = 'nats://localhost:' + PORT;

var loop = 250;
var hash = 10;
var received = 0;
var failed = 0;

const trans = new mostly(nats.connect(noAuthUrl));

trans.ready(() => {
  var start = new Date();

  for (var i = 0; i < loop; i++) {
    trans.act({
      topic: 'feathers.dummies',
      cmd: 'find',
      path: '/api/dummies',
      args: [],
      params: {
        query: {},
        provider: 'rest'
      },
      maxMessages$: 1
    }, function (err, resp) {
      if (err) {
        failed += 1;
      } else {
        received += 1;
      }
      // console.log(failed + received, err, resp);

      if (failed + received === loop) {
        var stop = new Date();
        var rps = parseInt(loop / ((stop - start) / 1000));
        console.log('\nTotal ' + received + '/' + failed + ' received/failed');
        console.log('Avg ' + rps + ' request-responses/sec');
        var lat = parseInt(((stop - start) * 1000) / (loop * 2)); // Request=2, Reponse=2 RTs
        console.log('Avg roundtrip latency: ' + lat + ' microseconds');
        process.exit();
      } else if ((failed + received) % hash === 0) {
        process.stdout.write('+');
      }
    });
  }
});
