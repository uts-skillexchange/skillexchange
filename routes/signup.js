var express = require('express');
var router = express.Router();

/* GET signup listing. */
router.get('/', function(req, res, next) {
  res.render('signup', { title: 'Skill Exchange: Beta Signup', view: 'signup', layout: 'simple' });
});

module.exports = router;
