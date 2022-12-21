var irc = require('irc')
  , net = require('net')
  , fs = require('fs');

module.exports.irc = irc;
if (irc.Client.prototype.getXdcc) return;

function uint32ToIP(n) {
  var byte1 = n & 255
    , byte2 = ((n >> 8) & 255)
    , byte3 = ((n >> 16) & 255)
    , byte4 = ((n >> 24) & 255);

  return byte4 + "." + byte3 + "." + byte2 + "." + byte1;
}

function parseSendParams(text) {
  var parts = text.match(/(?:[^\s"]+|"[^"]*")+/g);
  return {
    file: parts[2].replace(/^"(.+)"$/, '$1'),
    ip: uint32ToIP(parseInt(parts[3], 10)),
    port: parseInt(parts[4], 10),
    length: parseInt(parts[5], 10)
  };
}

/*
 * `path` is treated as a folder by default
 */
irc.Client.prototype.getXdcc = function(hostUser, hostCommand, path, isFile) {
  var self = this, handler;

  function detach() {
    self.removeListener('ctcp-privmsg', handler);
  }

  self.on('ctcp-privmsg', handler = function(from, to, text) {
    if (to !== self.nick || from !== hostUser) return;
    detach();

    if (text.substr(0, 9) !== 'DCC SEND ') return;

    var filePath = (path + '');
    var details = parseSendParams(text);
    details.nick = from;
    if (!isFile) {
      filePath = filePath + '/' + details.file;
    }

    // Yes, overwrite the file.
    var file = fs.createWriteStream(filePath);

    file.on('open', function() {
      var received = 0
        , sendBuffer = Buffer.alloc(details.length > 0xffffffff ? 8 : 4);
        
      var client = net.connect(details.port, details.ip, function() {
        self.emit('xdcc-connect', details);
      });

      client.on('data', function(data) {
        file.write(data);
        received += data.length;
        if (sendBuffer.length == 8) {
          sendBuffer.writeUInt64BE(BigInt(received), 0);
        }else {
          sendBuffer.writeUInt32BE(received, 0);
        }
        client.write(sendBuffer);
        self.emit('xdcc-data', received, details);
      });

      client.on('end', function() {
        file.end();
        self.emit('xdcc-end', received, details);
      });

      client.on('error', function(err) {
        file.end();
        self.emit('xdcc-error', err, details);
      });
    });
  });

  self.once('error', detach);
  self.say(hostUser, hostCommand);
};

