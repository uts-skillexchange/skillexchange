var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var rollbar = require('rollbar');
var exphbs = require('express-handlebars');
var less = require('less-middleware');
var mkdirp = require('mkdirp');

var search = require('./routes/search');
var faq = require('./routes/faq');
var messages = require('./routes/messages');
var signup = require('./routes/signup');
var verify = require('./routes/verify');
var profile = require('./routes/profile');
var forgot = require('./routes/forgot');

var ParseServer = require('parse-server').ParseServer;
var S3Adapter = require('parse-server').S3Adapter;
var ParseDashboard = require('parse-dashboard');
var SimpleSendGridAdapter = require('parse-server-sendgrid-adapter');

var auth = require('./auth');
var keys = require('./keys.json');

var app = express();

var hbs = exphbs.create({
  defaultLayout: 'main',
  extname: 'hbs',
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    },
    equals: function (v1, v2, options) {
      if (v1 === v2) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  }
});

var api = new ParseServer({
  databaseURI: keys.parse.database,
  appId: keys.parse.appid,
  masterKey: keys.parse.master,
  fileKey: keys.parse.file,
  serverURL: keys.parse.serverurl,
  sendUserEmails: true,
  verifyUserEmails: true,
  emailVerifyTokenValidityDuration: 7200,
  preventLoginWithUnverifiedEmail: true,
  publicServerURL: keys.parse.serverurl,
  appName: 'Skill Exchange',
  allowClientClassCreation: false,
  enableAnonymousUsers: false,
  filesAdapter: new S3Adapter(keys.s3.access, keys.s3.secret, keys.s3.bucket, { directAccess: true }),
  verifyUserEmails: true,
  emailAdapter: SimpleSendGridAdapter({
    apiKey: keys.sendgrid.api,
    fromAddress: keys.auth.email
  }),
  accountLockout: {
    duration: 5,
    threshold: 5
  }
});

var dashboard = new ParseDashboard({
  apps: [{
    serverURL: keys.parse.serverurl,
    appId: keys.parse.appid,
    masterKey: keys.parse.master,
    appName: 'Skill Exchange'
  }]
});

// Create temp folder
mkdirp(path.join(__dirname, 'temp'), function (error) {
  if (error) {
    console.log(error);
  }
});

// view engine setup
app.engine('.hbs', hbs.engine);
// app.set('views', path.join(__dirname, 'views'));
app.set('view engine', '.hbs');

app.locals.parse_appid = keys.parse.appid;
app.locals.parse_javascript = keys.parse.javascript;
app.locals.parse_serverurl = keys.parse.serverurl;
app.locals.analytics = keys.analytics;
app.locals.mixpanel = keys.mixpanel;
app.locals.rollbar = keys.rollbar.client;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(less(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', signup);
app.use('/parse', api);
app.use('/dashboard', auth.basicAuth(keys.auth.username, keys.auth.password), dashboard);
app.use('/', search);
app.use('/verify', verify);
app.use('/faq', faq);
app.use('/messages', messages);
app.use('/profile', profile);
app.use('/forgot', forgot);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      layout: 'external'
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    layout: 'external'
  });
});

app.use(rollbar.errorHandler(keys.rollbar.server));


module.exports = app;
