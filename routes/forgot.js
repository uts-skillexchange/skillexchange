var express = require('express');
var router = express.Router();

/* GET home listing. */
router.get('/', function(req, res, next) {
  res.render('forgot', { title: 'Forgot Password | Skill Exchange', layout: 'external', view: 'forgot' });
});

module.exports = router;
