$(function () {

  'use strict';

  // Disable non-numeric characters in phone numbers (type=number strips leading zeros)
  $(document).on('keypress', 'input[name="signup-studentID"]', function (e) {
    var START_NUMBER = 48,
      END_NUMBER = 57,
      SPACE = 32;

    // If not space and below Start or above End...
    if (e.which !== SPACE && (e.which < START_NUMBER || e.which > END_NUMBER)) {
      e.preventDefault();
    }
  });

  $('#forgot').submit(function (e) {
    var email = $('#forgot input[name="signup-studentID"]').val(),
      newEmail = email + '@uts.edu.au';

    e.preventDefault();

    mixpanel.track("Forgot Password");

    if (!email.length) {
      return window.createAlert('error', 'Please enter a valid university ID number');
    }

    Parse.User.requestPasswordReset(newEmail).then(function () {
      window.createAlert('success', 'Password reset request was sent successfully.');
    }, function (error) {
      window.createAlert('error', error.message);
    });

  });

});
