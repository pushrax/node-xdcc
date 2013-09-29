var irc = require('irc')
  , net = require('net')
  , fs = require('fs');

/*
 * `path` is treated as a folder by default
 */
irc.Client.prototype.getXdcc = function(hostUser, hostCommand, path, isFile) {

  function parseSendParams(text) {
    function uint32ToIP(n) {
      var byte1 = n & 255
        , byte2 = ((n >> 8) & 255)
        , byte3 = ((n >> 16) & 255)
        , byte4 = ((n >> 24) & 255);

      return byte4 + "." + byte3 + "." + byte2 + "." + byte1;
    }

    var parts = text.match(/(?:[^\s"]+|"[^"]*")+/g);
    return {
      file: parts[2],
      ip: uint32ToIP(parseInt(parts[3], 10)),
      port: parseInt(parts[4], 10),
      length: parseInt(parts[5], 10)
    };
  }

  var self = this;
  self.say(hostUser, hostCommand);

  self.on('ctcp-privmsg', function(from, to, text) {
    if (to == self.nick && from == hostUser) {
      if (text.substr(0, 9) == 'DCC SEND ') {
        var details = parseSendParams(text);
        if (!isFile) {
          path = path + '/' + details.file;
        }

        // Yes, overwrite the file.
        var file = fs.createWriteStream(path);

        file.on('open', function() {
          var received = 0
            , sendBuffer = new Buffer(4);

          var client = net.connect(details.port, details.ip, function() {
            self.emit('xdcc-connect', details);
          });

          client.on('data', function(data) {
            file.write(data);
            received += data.length;
            sendBuffer.writeUInt32BE(received, 0);
            client.write(sendBuffer);
            self.emit('xdcc-data', received);
          });

          client.on('end', function() {
            file.end();
            self.emit('xdcc-end', received, details);
          });
        });
      }
    }
  });

};

module.exports.irc = irc;
