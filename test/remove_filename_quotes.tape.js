var test = require('tape');
var rewire = require('rewire');
var xdcc = rewire('..');

test("DCC send filename parsing: processing quotes", function(t) {
  var parseSendParams = xdcc.__get__('parseSendParams');
  var no_spaces = 'filename.bin';
  var spaces = '[Some] Particularry Long - 01 [Name] [ABCDEF01].bin';
  var dcc_prefix = 'DCC SEND ';
  var dcc_suffix = ' 2130706433 12345 1234567890';

  var input = dcc_prefix + no_spaces + dcc_suffix;
  t.equal(
    parseSendParams(input).file,
    no_spaces,
    'input without spaces/quotes: ' + input
  );

  var input = dcc_prefix + '"' + spaces + '"' + dcc_suffix;
  t.equal(
    parseSendParams(input).file,
    spaces,
    'input with spaces/quotes: ' + input
  );

  t.end();
})