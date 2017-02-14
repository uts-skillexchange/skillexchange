$(function () {

  var user = Parse.User.current();

  if (user) {

    user.fetch({
      success: function success() {

        if (user.get('avatar')) {
          $('#my-avatar').css('background-image', 'url("' + user.get('avatar').url() + '")');
          $('#profileModal #avatar-dropzone').css('background-image', 'url("' + user.get('avatar').url() + '")');
        }

        $('#profileModal input.fullname').val(user.get('fullname'));
        $('#profileModal input.email').val(user.get('email').replace('@uts.edu.au', ''));
        $('#profileModal select.faculty1').val(user.get('faculty1'));
        $('#profileModal select.faculty2').val(user.get('faculty2'));
        $('#profileModal input.degree').val(user.get('degree'));
        $('#profileModal textarea.bio').val(user.get('bio'));
        $('#profileModal input.website').val(user.get('website'));
        $('#profileModal input.skills').val(user.get('skills'));
        $('#profileModal input.interests').val(user.get('interests'));

        if (!user.get('visible')) {
          $('#profileModal input.visible').prop('checked', false);
        }

        if (user.get('blocked') && user.get('blocked').length) {

          $('.blockedUsers .empty-state').remove();

          _.each(user.get('blocked'), function (blockedUser) {

            var User = Parse.Object.extend(Parse.User),
              query = new Parse.Query(User);

            query.get(blockedUser, {
              success: function(user) {

                var avatar = user.attributes.avatar ? user.attributes.avatar.url() : '/images/avatar.png';

                $('.blockedUsers').append([
                  '<div class="clearfix">',
                    '<div id="my-avatar" class="avatar pull-left" style="background-image: url(\'' + avatar + '\')"></div>',
                    '<div class="information pull-left">',
                      '<p class="fullname">' + user.attributes.fullname + '</p>',
                    '</div>',
                  '</div>'
                ].join(''));

              },
              error: function(user, error) {
                return window.createAlert('error', error);
              }
            });

          });
        }

        $('input.skills, input.interests', '#profileModal').selectize({
          delimiter: ',',
          persist: false,
          maxItems: 5,
          create: function (input) {
            return { value: input, text: input };
          }
        });

      },
      error: function error(user, error) {
        return window.createAlert('error', error);
      }

    });

  }

  var uploadForm = $('#avatar-dropzone');

  uploadForm.dropzone({
    maxFiles: 1,
    maxFilesize: 6,
    acceptedFiles: 'image/*',
    dictDefaultMessage: '',
    init: function initDropzone() {
      var dropzone = this;

      dropzone.on('addedfile', function () {
        // $(uploadForm).addClass('loading');
      });
      dropzone.on('success', function (file, response) {
        var photo = new Parse.File(response.name, { base64: response.content });

        photo.save().then(function (avatar) {

          Parse.User.current().save({ avatar: avatar }).then(function () {
            window.createAlert('success', 'Successfully updated your profile!', function () {
              mixpanel.track("Upload Profile Photo");
              return window.location.reload();
            });
          }, function (error) {
            window.createAlert('error', error);
          });

        }, function (error) {
          window.createAlert('error', error);
        });
      });
      dropzone.on('error', function (file, error) {
        window.createAlert('error', error);
        dropzone.removeAllFiles(true);
      });
      dropzone.on('complete', function () {
        $(uploadForm).removeClass('loading');
        dropzone.removeAllFiles(true);
      });
    }
  });

  $('#logout').click(function (e) {
    e.preventDefault();
    mixpanel.track("Logout");
    Parse.User.logOut();
    window.redirect('');
  });

  $('#profileModal #updateForm').submit(function (e) {
    e.preventDefault();

    var fullname = ( $('#updateForm input[name="fullname"]').val() || '').trim(),
      studentID = ( $('#updateForm input[name="email"]').val() || '').trim(),
      email = studentID + '@uts.edu.au',
      faculty1 = ( $('#updateForm select[name="faculty1"]').val() || '').trim(),
      faculty2 = ( $('#updateForm select[name="faculty2"]').val() || '').trim(),
      bio = ( $('#updateForm textarea[name="bio"]').val() || '').trim(),
      website = ( $('#updateForm input[name="website"]').val() || '').trim(),
      degree = ( $('#updateForm input[name="degree"]').val() || '').trim(),
      skills = ( $('#updateForm input[name="skills"]').val() || '').trim().toLowerCase(),
      interests = ( $('#updateForm input[name="interests"]').val() || '').trim().toLowerCase(),
      visible = $('#updateForm input[name="visible"]').prop('checked');

    if (!fullname.length) {
      return window.createAlert("error", "Please enter a valid full name.");
    } else if (!studentID.length) {
      return window.createAlert("error", "Please enter a valid university ID number.");
    } else if (!faculty1.length) {
      return window.createAlert("error", "Please enter at least one valid faculty.");
    } else if (!degree.length) {
      return window.createAlert("error", "Please enter a valid degree.");
    } else if (!skills.length) {
      return window.createAlert("error", "Please enter at least 1 skill.");
    } else if (!interests.length) {
      return window.createAlert("error", "Please enter at least 1 interest.");
    }
      
      //Prevents verification process if email is not updated
      if (email !== user.attributes.email) {
          var userData = {
              fullname: fullname,
              email: email,
              username: email,
              faculty1: faculty1,
              degree: degree,
              skills: skills,
              interests: interests,
              visible: visible
            };
      } else {
          var userData = {
              fullname: fullname,
              username: email,
              faculty1: faculty1,
              degree: degree,
              skills: skills,
              interests: interests,
              visible: visible
            };
      }

    if (faculty2.length) {
      userData.faculty2 = faculty2;
    }

    if (bio.length) {
      userData.bio = bio;
    }

    if (website.length) {
      userData.website = website;
    }

      
      
    user.save(userData).then(function () {
      window.createAlert('success', 'Successfully updated your profile!', function () {
        mixpanel.track("Update Profile");
        return window.location.reload();
      });
    }, function (error) {
      window.createAlert('error', error);
    });

    

  });

});
