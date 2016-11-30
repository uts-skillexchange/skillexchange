var express = require('express');
var router = express.Router();

/* GET messages listing. */
router.get('/', function(req, res, next) {
  res.render('messages', { title: 'Messages | Skill Exchange', view: 'messages' });
});

module.exports = router;
