$(function () {

  'use strict';

  $('#verify').on('submit', function (e) {
    e.preventDefault();

    Parse.User.current().fetch({
      success: function (user) {
        if (user.get('emailVerified')) {
          mixpanel.track("Verified Email");
          window.redirect('');
        } else {
          window.createAlert('error', 'Your email has not been verified yet.');
        }
      },
      error: function (user, submitError) {
        return window.createAlert('error', submitError);
      }
    });
  });

  $('#resend').click(function (e) {
    var user = Parse.User.current(),
      email = user.get('email'),
      fakeEmail = user.id + '-resend@skillexchange.com';

    e.preventDefault();

    mixpanel.track("Resend Verification Email");

    async.waterfall([
      function (callback) {
        user.save({ email: fakeEmail }).then(function () {
          return callback(null);
        }, callback);
      },
      function (callback) {
        user.save({ email: email }).then(function () {
          return callback(null);
        }, callback);
      }
    ], function (resendError) {
      if (resendError) {
        window.createAlert('error', resendError);
      } else {
        window.createAlert('success', 'We\'ve sent you another verification email!');
      }
    });

  });

});
