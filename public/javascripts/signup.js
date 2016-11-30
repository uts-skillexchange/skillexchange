$(function () {

    'use strict';

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }

    var email = $("#fieldEmail");
    var submit = $('button');

    submit.attr('disabled', 'disabled').addClass('disabled');

    email.on("change", function (e) {
        var emailAddress = email.val();
        var invalid = emailAddress.indexOf('uts.edu.au') === -1;
        if (invalid || !validateEmail(emailAddress)) {
            email.removeClass('good').addClass('bad');
            submit.attr('disabled', 'disabled').addClass('disabled');
        } else {
            email.removeClass('bad').addClass('good');
            submit.removeAttr('disabled').removeClass('disabled');

        }
    });

});
