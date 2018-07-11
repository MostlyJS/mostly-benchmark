const mostly = require('mostly-node');
const nats = require('nats').connect("nats://localhost:4222");

const loop = 30000;
const hash = 100;
let received = 0;
let failed = 0;

const trans1 = new mostly(nats);
const trans2 = new mostly(nats);

trans1.ready(() => {
  let start = new Date();

  trans1.add({
    topic: 'math',
    cmd: 'add'
  }, function (req, cb) {
    cb(null, { total: req.a + req.b });
  });

  //trans1.close(function() {
    for (let i = 0; i < loop; i++) {
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
          let stop = new Date();
          let rps = parseInt(loop / ((stop - start) / 1000));
          console.log('\nTotal ' + received + '/' + failed + ' received/failed');
          console.log('Avg ' + rps + ' request-responses/sec');
          let lat = parseInt(((stop - start) * 1000) / (loop * 2)); // Request=2, Reponse=2 RTs
          console.log('Avg roundtrip latency: ' + lat + ' microseconds');
          process.exit();
        } else if ((failed + received) % hash === 0) {
          process.stdout.write('+');
        }
      });
    }
  //});
});
