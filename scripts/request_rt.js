'use strict'

const mostly = require('mostly-node');
const nats = require('nats').connect("nats://localhost:4222");

var loop = 30000;
var hash = 100;
var received = 0;
var failed = 0;

const trans1 = new mostly(nats);
const trans2 = new mostly(nats);

trans1.ready(() => {
  var start = new Date();

  trans1.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    cb(null, { total: req.a + req.b });
  });

  //trans1.close(function() {
    for (var i = 0; i < loop; i++) {
      trans2.act({
        topic: 'math',
        cmd: 'add',
        a: 1,
        b: 2
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
  //});
});
