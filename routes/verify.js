var express = require('express');
var router = express.Router();

/* GET home listing. */
router.get('/', function(req, res, next) {
  res.render('verify', { title: 'Verify | Skill Exchange', layout: 'external', view: 'verify' });
});

module.exports = router;
