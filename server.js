var express = require('express');
var log = require('winston');
var fs = require('fs');
var BinaryServer = require('binaryjs').BinaryServer;
var async = require('async');
var exec = require('child_process').exec;

async.parallel([
function() {
exec('ps aux | grep [r]aspistill', function(err, stdout, stderr) {
   if (stdout) {
       //console.log(stdout);
       try {
       var pid = stdout.match(/\s+(\d{4,6})+\s+/gi)[0].trim();
       if (pid) {
       console.log('Raspistill running ' + pid);
       return true;
       }
       } catch (err) {
          console.log('pid not found'); 
          return false;
       }
   }
 });
}
], function(isRunning) {

if (isRunning) return;

    console.log('Starting raspistill');

    var spawn = require('child_process').spawn,
        raspistill = spawn('raspistill', ['-w', '640', '-h', '480', '-q', '5', '-o', '/tmp/stream/pic.jpg', '-tl', '100', '-t', '9999999', '-th', '0:0:0', '-n', '-rot', '180']);


    raspistill.on('close', function(code, signal) {
        console.log('child process terminated due to receipt of signal ' + signal);
     });

    raspistill.stdout.on('data', function(data) {
        console.log('stdout:' + data);
      });

    raspistill.stderr.on('data', function(data) {
        console.log('stdrr:' + data);
      });

    raspistill.stdin.on('data', function(data) {
        console.log('stdin:' + data);
      });
});

var app = express();
var port = process.env.PORT || 9000;

app.get('/', function(req, res) {
  log.info('/ route called');
  res.sendfile(__dirname + '/index.html');
});

app.listen(port, function() {
  log.info('Listening on port ' + port);
});

var server = BinaryServer({port: 9001});

server.on('connection', function(client){
  log.info('BinaryJS connected');
  function next() {
      console.log('sending stream');
      var file = fs.createReadStream('/tmp/stream/pic.jpg');
      client.send(file);
      setTimeout(next, 200);
  }
  next();
});

process.on('exit', function() {
    console.log('Fatal error. Exiting..'); 
    });

//raspistill.kill('SIGHUP');
