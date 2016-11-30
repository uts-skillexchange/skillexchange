$(function () {

  'use strict';

  // Disable non-numeric characters in phone numbers (type=number strips leading zeros)
  $(document).on('keypress', 'input[name="signup-studentID"]', function (e) {
      var START_NUMBER = 48,
        END_NUMBER = 57,
        SPACE = 32,
        ENTER = 13;

      // If not space, not enter and below Start or above End...
      if (e.which !== SPACE && e.which !== ENTER && (e.which < START_NUMBER || e.which > END_NUMBER)) {
        e.preventDefault();
      }
  });

  var user = Parse.User.current(),
    Search = Parse.Object.extend("Search"),
    Conversation = Parse.Object.extend("Conversation");

  if (user) {
    $('.hero').remove();
  } else {
    $('.navbar').remove();
  }

  function websiteURL(url) {

    if (!url) {
      return '';
    }

    var prefix = 'http://',
      site = url.toLowerCase();

    if (site.substr(0, prefix.length) !== prefix) {
      return prefix + site;
    } else {
      return site;
    }
  }

  function resolveFaculty (faculty) {

    switch(faculty) {
      case "feit":
        return "FEIT";
      case "business":
        return "Business";
      case "health":
        return "Health";
      case "dab":
        return "DAB";
      case "law":
        return "Law";
      case "science":
        return "Science";
      case "fass":
        return "FASS";
      case "bcii":
        return "BCII";
      default:
        return "Faculty doesn't exist...";
    }

  }

  var User = Parse.Object.extend(Parse.User),
    query = new Parse.Query(User);
  query.limit(1000);
  query.ascending('createdAt');
  query.equalTo('visible', true);

  // Has blocked me
  if (user) {
    query.notEqualTo('objectId', user.id);
    query.notEqualTo('blocked', user.id);
  }

  query.find({
    success: function(people) {
      _.each(people, function (person) {
        createPerson(person);
      });

      $('input.skills, input.interests', '#students, .userModal').selectize({
        delimiter: ',',
        persist: false,
        maxItems: 5,
        create: function (input) {
          return { value: input, text: input };
        }
      });

      /* if (user && !user.get('onboarded')) {
        $('#main-search').attr('data-step', '1').attr('data-intro', 'Welcome to Skill Exchange! This is where you can search for anyone by skill, interest, name or otherwise.');
        $('#main-filter + .select2').attr('data-step', '2').attr('data-intro', 'You can also filter students by faculty.');
        $('#students .grid-item').first().attr('data-step', '3').attr('data-intro', 'Oh look! Here\'s someone you can connect with. Just click on their card to open up their profile');
        $('#students .grid-item').first().find('.skills + .selectize-control').attr('data-step', '4').attr('data-intro', 'Here\'s what we\'re after - Skills!');
        introJs().start();
      } */

      var skillsAutoComplete = _.chain(people)
        .map(function (person) {
          return person.attributes.skills;
        })
        .flatten()
        .value()
        .join(',')
        .split(',');

      $("#main-search").easyAutocomplete({
        data: _.uniq(skillsAutoComplete),
        list: {
          onClickEvent: function() {
            $("#main-form form").submit();
          }
        }
      });


      var suggestions = _.uniq(skillsAutoComplete).slice(0, 6);

      _.each(suggestions, function (sugg) {
        $('#empty-message #suggestions').append([
          '<div class="badge" data-suggestion="' + sugg + '">' + sugg + '</div>'
        ].join(''));
      });

      $('body').addClass('loaded');

      setTimeout(function () {
        $('#students').isotope({
          itemSelector: '.grid-item',
          percentPosition: true,
          masonry: {
            columnWidth: '.grid-sizer'
          },
          getSortData: {
            priority: '[data-priority] parseInt'
          }
        });
      }, 500);

    },
    error: function(error) {
      alert("Error: " + error.code + " " + error.message);
    }
  });

  $(document).on('click', '#suggestions .badge', function () {
    var suggestion = $(this).attr('data-suggestion');
    $('#main-search').val(suggestion);
    $('#main-form form').submit();
    mixpanel.track("Click Search Suggestion");
  });

  $(document).on('click', '.login-cta', function () {
    swal({
      type: 'info',
      title: 'Want to send a message?',
      text: 'You\'ll need a SkillExchange account to message this person!',
      confirmButtonText: 'Create an account',
      confirmButtonColor: '#499DFF'
    }, function (isConfirm) {
      mixpanel.track("Click Login CTA on User Card");
      return isConfirm ? $('#signupModal').modal('show') : true;
    });
  });

  function createPerson (person) {
    var attrs = person.attributes,
      avatar = attrs.avatar ? attrs.avatar.url() : '/images/avatar.png';

    if (user && user.get('blocked') && user.get('blocked').indexOf(person.id) !== -1) {
      return;
    }

    var actions = [
      '<div class="modal-actions">',
        '<button type="button" class="btn btn-primary createConversation col-sm-6" data-id="' + person.id + '">Send a message</button>',
        '<p class="reportUser btn btn-link col-sm-2 col-sm-offset-2" data-id="' + person.id + '">Report</p>',
        '<p class="blockUser btn btn-link col-sm-2" data-id="' + person.id + '">Block</p>',
      '</div>'
    ].join('');

    var loginActions = [
      '<div class="modal-actions">',
        '<button type="button" class="btn btn-primary login-cta">Send a message</button>',
      '</div>'
    ].join('');

    $('#students').append([
      '<div class="grid-item search-result ' + attrs.faculty1 + ' ' + attrs.faculty2 + '" data-id="' + person.id + '" data-priority="1">',
        '<a href="#" data-toggle="modal" data-target="#' + person.id + 'Modal" class="card">',
          '<div class="clearfix">',
            '<div class="avatar pull-left ' + attrs.faculty1 + ' ' + attrs.faculty2 + ' faculty1-' + attrs.faculty1 + ' faculty2-' + attrs.faculty2 + '" style="background-image: url(\'' + avatar + '\')"></div>',
            '<div class="information pull-left">',
              '<p class="fullname">' + attrs.fullname + '</p>',
              '<p class="degree">' + attrs.degree + '</p>',
            '</div>',
          '</div>',
          (attrs.bio ? '<p class="bio">' + attrs.bio + '</p>' : ''),
          '<b>Skills</b>',
          '<input disabled class="skills selectize" value="' + attrs.skills + '" />',
          '<b>Interests</b>',
          '<input disabled class="interests selectize" value="' + attrs.interests + '" />',
        '</a>',
        '<div class="modal fade userModal" id="' + person.id + 'Modal" tabindex="-1" role="dialog" aria-labelledby="' + person.id + 'ModalLabel">',
          '<div class="modal-dialog" role="document">',
            '<div class="modal-content">',
              '<div class="modal-header">',
                '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>',
                '<h4 class="modal-title" id="' + person.id + 'ModalLabel">' + attrs.fullname + '</h4>',
              '</div>',
              '<div class="modal-body">',
                '<div class="clearfix">',
                  '<div id="my-avatar" class="avatar pull-left" style="background-image: url(\'' + avatar + '\')"></div>',
                  '<div class="information pull-left">',
                    '<p class="fullname">' + attrs.fullname + '</p>',
                    '<p class="faculty">' + resolveFaculty(attrs.faculty1) + (attrs.faculty2 ? ' &amp; ' + resolveFaculty(attrs.faculty2) : '') + '</p>',
                    '<p class="degree">' + attrs.degree + '</p>',
                    (attrs.bio ? '<p class="bio">' + attrs.bio + '</p>' : ''),
                    (attrs.website ? '<p class="website"><a href="' + websiteURL(attrs.website) + '" target="_blank">' + attrs.website + '</a></p>' : ''),
                    '<div class="row skills-row">',
                      '<b class="col-sm-3">Skills</b>',
                      '<input disabled class="skills selectize col-sm-9" value="' + attrs.skills + '" />',
                    '</div>',
                    '<div class="row interests-row">',
                      '<b class="col-sm-3">Interests</b>',
                      '<input disabled class="interests selectize col-sm-9" value="' + attrs.interests + '" />',
                    '</div>',
                    Parse.User.current () ? actions : loginActions,
                  '</div>',
                '</div>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',
      '</div>'
    ].join(''));
  }

  $('#main-filter').select2();

  $('#main-filter').on('change', function (e) {
    var filter = this.value;
    var newFilter = filter === '*' ? '*' : '.' + filter;
    newFilter += '.search-result';
    mixpanel.track("Change filter on Search");
    $('#students').isotope({ filter: newFilter, sortBy: 'priority', sortAscending: false });
  });

  $('#remove').click(function () {
    $('.grid-item').addClass('search-result').removeAttr('data-priority');
    $("#students").isotope({ filter: '*', sortBy: 'original-order' });
    $('#main-filter').val('*').trigger('change');
    $('#main-search').val('');
    mixpanel.track("Click Clear Search Button");
    return;
  });

  $(document).on('click', '.grid-item .card .selectize .item', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var suggestion = $(this).attr('data-value');
    $('#main-search').val(suggestion);
    $('#main-form form').submit();
    mixpanel.track("Click Label on Card");
  });

  $('#search-form').on('submit', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    var term = $('#main-search').val().trim();
    var faculty = $('#main-filter').val();
    var filter = (faculty === '*' ? '*' : '.' + faculty) + '.search-result';

    if (term === '') {
      $('.grid-item').addClass('search-result').removeAttr('data-priority');
      $("#students").isotope({ filter: filter, sortBy: 'original-order' });
      return;
    }

    new Search().save({ term: term, user: user ? user.objectId : null });

    var regex = new RegExp(term, "ig");

    var in_name = new Parse.Query(Parse.User);
    in_name.matches("fullname", regex);

    var in_bio = new Parse.Query(Parse.User);
    in_bio.matches("bio", regex);

    var in_degree = new Parse.Query(Parse.User);
    in_degree.matches("degree", regex);

    var in_skills = new Parse.Query(Parse.User);
    in_skills.matches("skills", regex);

    var in_interests = new Parse.Query(Parse.User);
    in_interests.matches("interests", regex);

    var mainQuery = Parse.Query.or(in_name, in_bio, in_degree, in_skills, in_interests);

    if (user) {
      mainQuery.notEqualTo('objectId', user.id);
    }

    mainQuery.limit(1000);

    mainQuery.ascending('createdAt');

    query.equalTo('visible', true);

    mainQuery.find({
      success: function(users) {

        $('#empty-message').addClass('hidden');
        $('#students .grid-item').removeClass('search-result');

        var newUsers = _.map(users, function (user) {

          var attrs = user.attributes,
            priority = 0;

          if ((attrs.fullname && attrs.fullname.has(term)) || (attrs.skills && attrs.skills.has(term))) {
            priority += 3;
          }

          if ((attrs.interests && attrs.interests.has(term)) || (attrs.bio && attrs.bio.has(term))) {
            priority += 2;
          }

          if ((attrs.degree && attrs.degree.has(term)) || (attrs.website && attrs.website.has(term))) {
            priority += 1;
          }

          $('#students .grid-item[data-id="' + user.id + '"]').addClass('search-result').attr('data-priority', 6 - priority);

        });

        $("#students").isotope({ filter: filter, sortBy: 'priority', sortAscending: false });

        if (!users.length) {
          $('#empty-message').removeClass('hidden');
        }

        mixpanel.track("Search");

      },
      error: function(error) {
        window.createAlert("error", error.message);
      }
    });

  });

  function conversationExists(me, user, callback) {
    var query = new Parse.Query('Conversation');
    query.containsAll('participants', [me, user]);
    query.find({
      success: function(conversation) {
        if (conversation.length) {
          return callback(conversation[0].id);
        } else {
          return callback(false);
        }
      },
      error: function(person, error) {
        window.createAlert("error", error.message);
        return callback(false);
      }
    });
  }

  $(document).on('click', '.createConversation', function () {
    var me = Parse.User.current().id,
      otherId = $(this).attr('data-id'),
      user = otherId;

    conversationExists(me, user, function (convoId) {
      if (convoId) {
        window.redirect('messages#' + convoId);
      } else {

        async.waterfall([
          function (callback) {
            var query = new Parse.Query(Parse.User);
            query.get(user).then(function (person) {
              return callback(null, person);
            }, callback);
          },
          function (person, callback) {
            $.post('/notify', {
              user: Parse.User.current().get('fullname'),
              to: person.attributes.email,
              toname: person.attributes.fullname
            }, function (data) {
              return callback(null);
            }, 'json').fail(callback);
          },
          function (callback) {
            new Conversation().save({ participants: [me, user] }).then(function (convo) {
              mixpanel.track("Create Conversation");
              return callback(null, convo.id);
            }, callback);
          },
        ], function (error, newId) {
          if (error) {
            window.createAlert("error", error.message);
          } else {
            window.redirect('messages#' + newId);
          }
        });

      }
    });

  });

  $(document).on('click', '.blockUser', function () {
    var me = Parse.User.current(),
      user = $(this).attr('data-id');

    swal({
      title: "Are you sure?",
      text: "This will block this user and prevent them from contacting you (and vice versa)!",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, I'm sure!",
      closeOnConfirm: false
    }, function(isConfirm) {

      if (isConfirm) {
        me.addUnique("blocked", user);
        me.save();

        me.save(null, {
          success: function(user) {
            window.createAlert('success', 'Successfully blocked this user.', function () {
              mixpanel.track("Block User");
              window.location.reload();
            });
          },
          error: function (user, error) {
            window.createAlert("error", error.message);
          }
        });
      }
    });
  });

  $(document).on('click', '.reportUser', function () {
    var me = Parse.User.current(),
      id = $(this).attr('data-id'),
      email = user.get('email');

    swal({
      title: "Report a user",
      text: "Do you believe this user is violating our Terms of Service or being abusive? Let us know.",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: "Send report",
      closeOnConfirm: false,
    }, function(isConfirm) {

      if (isConfirm) {
        $.post('/report', { email: email, id: id }, function (data) {
          window.createAlert('success', 'Thanks for reporting this user.', function () {
            mixpanel.track("Report User");
            window.location.reload();
          });
        }, 'json').fail(function (error) {
          window.createAlert('error', error.message, function () {
            window.location.reload();
          });
        });
      }

    });
  });

  function userExists(email, callback) {
    var query = new Parse.Query(Parse.User);
    query.equalTo("email", email);
    query.find({
      success: function(person) {
        return callback(person && person.length);
      },
      error: function(person, error) {
        window.createAlert("error", error.message);
        return callback(false);
      }
    });
  }

  $("#typed").typed({
    loop: true,
    backDelay: 2000,
    strings: [
      'interested in Startups',
      'studying Business',
      'working with Drones',
      'developing websites',
      'studying Law'
    ]
  });

  $('#skills, #interests').selectize({
    delimiter: ',',
    persist: false,
    maxItems: 5,
    create: function (input) {
      return { value: input, text: input };
    }
  });

  $("#email input").keypress(function (evt) {
    var keycode = evt.charCode || evt.keyCode;
    if (evt.shiftKey === true && keycode == 64) {
      return false;
    }
  });

  function validateEmail(email) {
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(email);
  }

  $('#email').submit(function (e) {
    e.preventDefault();
    var email = $('#email input[name="signup-studentID"]').val(),
      newEmail = email + '@uts.edu.au';
    if (email.trim() === '' || !validateEmail(newEmail)) {
      return window.createAlert("error", "Please enter a valid university ID number.");
    } else {
      userExists(newEmail, function (exists) {
        if (exists) {
          $('#loginModal').modal('show');
          $('#loginModal input[name="username"]').val(email);
        } else {
          $('#signupModal').modal('show');
          $('#signupModal input[name="email"]').val(email);
        }
      });
    }

    return false;

  });

  $('#signupForm').submit(function (e) {
    e.preventDefault();

    var fullname = ( $('#signupModal input[name="fullname"]').val() || '').trim(),
      password = ( $('#signupModal input[name="password"]').val() || '').trim(),
      studentID = ( $('#signupModal input[name="email"]').val() || '').trim(),
      email = studentID + '@uts.edu.au',
      faculty1 = ( $('#signupModal select[name="faculty1"]').val() || '').trim(),
      faculty2 = ( $('#signupModal select[name="faculty2"]').val() || '').trim(),
      degree = ( $('#signupModal input[name="degree"]').val() || '').trim(),
      skills = ( $('#signupModal input[name="skills"]').val() || '').trim().toLowerCase(),
      interests = ( $('#signupModal input[name="interests"]').val() || '').trim().toLowerCase();

    if (!fullname.length) {
      return window.createAlert("error", "Please enter a valid full name.");
    } else if (!password.length) {
      return window.createAlert("error", "Please enter a valid password.");
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

    var userData = {
      fullname: fullname,
      password: password,
      email: email,
      username: email,
      faculty1: faculty1,
      degree: degree,
      skills: skills,
      interests: interests,
      onboarded: false,
      visible: true
    };

    if (faculty2.length) {
      userData.faculty2 = faculty2;
    }

    new Parse.User().signUp(userData).then(function () {
      mixpanel.track("Signup");
      return window.redirect('verify');
    }, function (error) {
      window.createAlert('error', error);
    });

  });

  $('#loginForm').submit(function (e) {

    e.preventDefault();

    var studentID = $('#loginForm input[name="username"]').val(),
      username = studentID + '@uts.edu.au',
      password = $('#loginForm input[name="password"]').val(),
      button = $('#submit');

    Parse.User.logIn(username, password).then(function () {
      mixpanel.track("Login");
      window.location.reload();
    }, function (error) {
      if (error && error.message && error.message.toLowerCase() === 'invalid login parameters') {
        error.message = 'Username and password combination is incorrect.';
      }

      window.createAlert('error', error.message);
    });
  });

});
