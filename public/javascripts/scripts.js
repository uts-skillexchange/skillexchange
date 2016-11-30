(function () {

  'use strict';

  Dropzone.autoDiscover = false;

  mixpanel.track("Pageview", { url: window.location.pathname });

  var user = Parse.User.current();

  if (user) {
    user.fetch().then(function (me) {
      if (!me.get('emailVerified') && window.location.pathname !== '/verify') {
        window.redirect('verify');
      }
    }, function (error) {
      if (error.message === 'invalid session token') {
        Parse.User.logOut();
        window.redirect('');
      }
    });
  }

  if (!String.prototype.trim) {
    String.prototype.trim = function () {
      return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
  }

  if (!String.prototype.has) {
    String.prototype.has = function (term) {
      return this.toLowerCase().indexOf(term.toLowerCase()) !== -1;
    };
  }

  if (typeof String.prototype.capitalizeFirstLetter !== 'function') {
    String.prototype.capitalizeFirstLetter = function capitalizeFirstLetter () {
      return (this && this.length) ? (this.charAt(0).toUpperCase() + this.slice(1)) : this;
    };
  }

  if (window && !window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
  }

  // Redirect to another page
  window.redirect = function (path) {
    window.location.assign(window.location.origin + '/' + path);
  };

  window.createAlert = function (type, text, callback) {
    swal({
      type: type,
      title: type.capitalizeFirstLetter() + '!',
      text: text.capitalizeFirstLetter(),
      confirmButtonText: 'Okay',
      confirmButtonColor: '#499DFF'
    }, function (isConfirm) {
      return callback ? callback(isConfirm) : true;
    });
  };

  window.createPointer = function (className, objectId) {
    return { __type: 'Pointer', className: className, objectId: objectId };
  };

  $(function () {

    FastClick.attach(document.body);

  });

})();
