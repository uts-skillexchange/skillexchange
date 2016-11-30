var express = require('express');
var multer  = require('multer');
var path = require('path');
var fs = require('fs');
var router = express.Router();
var upload = require('multer')({ dest: path.join(__dirname, '../temp/') });

router.post('/avatar', upload.single('file'), function (req, res) {
  var filepath = path.join(__dirname, '../', 'temp', req.file.filename);
  fs.readFile(filepath, function (error, data) {
    if (error) {
      console.log(error);
    }
    return res.status(200).json({
      error: error,
      name: req.file.filename,
      content: data.toString('base64')
    });
  });
});

module.exports = router;
