
/*
 * GET home page.
 */

var remote = require('../remote');

exports.index = function(req, res) {
  var macros = remote.get_macros();
  res.render('index', {title: 'Remotelet', macros: macros});
};

exports.cache = function(req, res) {
  res.header("Content-Type", "text/cache-manifest");
  res.render('cache-manifest', {layout: false});
};

exports.device = function(req, res) {
  var result = remote.send_command(req.params.dev, req.params.cmd, req.params.repeat);
  res.send(result.message);
};

exports.options = function(req, res) {
  res.render('options', {title: 'Options', layout: 'layout-popup'});
};

exports.control = function(req) {

  var result = remote.send_command(req.data.dev, req.data.cmd, req.data.repeat);
  req.io.emit('result', { message: result.message });
}
