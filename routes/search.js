var express = require('express');
var fs = require('fs');
var router = express.Router();
var SendGrid = require("sendgrid");
var sendgrid = new SendGrid(keys.sendgrid.key);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('search', { title: 'Search | Skill Exchange', view: 'search' });
});

router.post('/report', function(req, res, next) {
  var email = new sendgrid.Email();

  email.addTo("support@skillexchange.me");
  email.setFrom(req.body.email);
  email.setSubject('Reported User');
  email.setHtml(req.body.email + ' has reported user: ' + req.body.id);

  sendgrid.send(email, function (error) {
    console.log(error, 'error');
    return res.status(error ? 500 : 200).json({ error: error, success: true });
  });
});

router.post('/notify', function(req, res, next) {
  var email = new sendgrid.Email();

  email.addTo(req.body.to);
  email.setFrom('support@skillexchange.me');
  email.setSubject('New conversation on Skill Exchange!');
  email.setHtml('Hi ' + req.body.toname + ', ' + req.body.user + ' has started a new conversation with you! Log in to your <a href="http://skillexchange.me/">Skill Exchange</a> account to reply.');

  sendgrid.send(email, function (error) {
    return res.status(error ? 500 : 200).json({ error: error, success: true });
  });
});

router.post('/message', function(req, res, next) {
  var email = new sendgrid.Email();

  email.addTo(req.body.to);
  email.setFrom('support@skillexchange.me');
  email.setSubject('New message on Skill Exchange!');
  email.setHtml('Hi ' + req.body.toname + ', ' + req.body.user + ' has sent you a message on SkillExchange! Log in to your <a href="http://skillexchange.me/">Skill Exchange</a> account to reply.');

  sendgrid.send(email, function (error) {
    return res.status(error ? 500 : 200).json({ error: error, success: true });
  });
});

module.exports = router;
