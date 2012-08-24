var irc = require('./lib/xdcc').irc;


require('crypto').randomBytes(2, function(ex, buf) {
  var user = 'bad_connection' + buf.toString('hex');
  var hostUser = 'Doki|Nanoha';
  var pack = 750;
  var det;

  var client = new irc.Client('irc.rizon.net', user, {
    channels: [ '#doki' ],
    userName: user,
    realName: user
  });

  client.on('join', function(channel, nick, message) {
    if (nick == user) {
      console.log('joined ' + channel);
      client.getXdcc(hostUser, 'xdcc send #' + pack, '/home/jli');
    }
  });

  client.on('xdcc-connect', function(details) {
    det = details;
    console.log('Connected: ' + details.ip + ':' + details.port);
  });

  client.on('xdcc-data', function(received) {
    console.log((received / det.length * 100).toFixed(2) + "%");
  });

  client.on('xdcc-end', function(received) {
    console.log('Done.');
  });

  client.on('notice', function(from, to, message) {
    if (to == user && from == hostUser) {
      console.log("NOTICE " + message);
    }
  });

  client.on('error', function(message) {
    console.error(message);
  });
});
