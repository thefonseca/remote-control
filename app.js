
/**
 * Module dependencies.
 */

var express = require('express.io')
  , routes = require('./routes');

var app = express();
app.http().io();

// Configuration
//app.engine('jade', require('jade').__express);

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'pug');
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/options', routes.options);
app.get('/cache.manifest', routes.cache);
app.get('/device/:dev/:cmd/:repeat', routes.device);
app.get('/device/:dev/:cmd', routes.device);

app.io.route('control', routes.control);

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});
