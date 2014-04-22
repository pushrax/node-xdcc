var irc = require('./lib/xdcc').irc;
var ProgressBar = require('progress');

var user = 'desu' + Math.random().toString(36).substr(7, 3);
var hostUser = 'Doki|Kotomi', pack = 10, progress;

console.log('Connecting...');
var client = new irc.Client('irc.rizon.net', user, {
  channels: [ '#doki' ],
  userName: user,
  realName: user
});

client.on('join', function(channel, nick, message) {
  if (nick !== user) return;
  console.log('Joined', channel);
  client.getXdcc(hostUser, 'xdcc send #' + pack, '.');
});

client.on('xdcc-connect', function(meta) {
  console.log('Connected: ' + meta.ip + ':' + meta.port);
  progress = new ProgressBar('Downloading... [:bar] :percent, :etas remaining', {
    incomplete: ' ',
    total: meta.length,
    width: 20
  });
});

var last = 0;
client.on('xdcc-data', function(received) {
  progress.tick(received - last);
  last = received;
});

client.on('xdcc-end', function(received) {
  console.log('Download completed');
});

client.on('notice', function(from, to, message) {
  if (to == user && from == hostUser) {
    console.log("[notice]", message);
  }
});

client.on('error', function(message) {
  console.error(message);
});
