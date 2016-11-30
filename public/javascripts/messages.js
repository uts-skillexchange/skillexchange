$(function () {

  if (!Parse.User.current()) {
    window.redirect('');
  }

  var Message = Parse.Object.extend("Message"),
    Conversation = Parse.Object.extend('Conversation');

  function fetchMessages () {

    var query = new Parse.Query(Conversation);
    query.containsAll('participants', [ Parse.User.current().id ]);
    query.limit(1000);
    query.descending('createdAt');
    query.notEqualTo('objectId', Parse.User.current().id);
    query.find({
      success: function(conversations) {
        $('#empty-state').remove();
        if (conversations.length) {
          _.each(conversations, function (convo) {
            createConversation(convo);
          });
        } else {
          var empty = $('#empty-state');

          if (!empty.length) {
            $('body #content .container').append('<p id="empty-state">You haven\'t sent any messages yet! Head back to <a href="/">Search</a> to find other students.</p>');
          }
          $('body').addClass('loaded');
        }
      },
      error: function(error) {
        window.createAlert("error", error.message);
      }
    });
  }

  setInterval(fetchMessages, 5000);

  $(document).on('click', '.inbox .card', function () {
    $(this).siblings().removeClass('active');
    $(this).addClass('active');
    mixpanel.track("Change Conversation");
  });

  function createConversation (convo) {

    var other = _.filter(convo.attributes.participants, function (participant) {
      return participant !== Parse.User.current().id;
    });

    if (!other.length) {
      return;
    }

    async.parallel([
      function (callback) {
        var query = new Parse.Query(Parse.User);
        query.get(other[0], {
          success: function(other) {
            return callback(null, other);
          },
          error: function(obj, error) {
            return callback(error);
          }
        });
      },
      function (callback) {
        var query = new Parse.Query("Message");
        query.equalTo('conversation', window.createPointer('Conversation', convo.id));
        query.find({
          success: function(messages) {
            return callback(null, messages);
          },
          error: function(object, error) {
            return callback(error);
          }
        });
      }
    ], function (error, results) {

      var other = results[0],
        messages = results[1];

      if (!error) {

        var avatar = other.attributes.avatar ? other.attributes.avatar.url() : '/images/avatar.png',
          existingConversation = $('.inbox .card[href="#' + convo.id + 'Tab"]');

        if (!existingConversation.length) {
          $('.inbox').append([
            '<a class="clearfix card" role="presentation" href="#' + convo.id + 'Tab" aria-controls="' + convo.id + 'Tab" role="tab" data-toggle="tab">',
              '<div class="avatar pull-left" style="background-image: url(\'' + avatar + '\')"></div>',
              '<div class="excerpt pull-left">',
                '<p class="name">' + other.attributes.fullname + '</p>',
                '<p class="sample">' + other.attributes.degree + '</p>',
              '</div>',
            '</a>',
          ].join(''));

          $('.message-view').append([
            '<div class="card tab-pane" role="tabpanel" id="' + convo.id + 'Tab" data-conversation="' + convo.id + '">',
              '<div class="messages-container"></div>',
              '<form class="new-message" data-other-id="' + other.id + '">',
                '<textarea type="text" placeholder="Start typing a message..." />',
                '<button>Send</button>',
              '</form>',
            '</div>',
          ].join(''));
        }

        _.each(messages, function (message) {
          var isMyMessage = message.attributes.from.id === Parse.User.current().id,
            avatarUrl = '/images/avatar.png',
            existingMessage = $('#message-' + message.id);

          if (isMyMessage) {
            if (Parse.User.current().get('avatar')) {
              avatarUrl = Parse.User.current().get('avatar').url();
            }
          } else if (other.attributes.avatar) {
            avatarUrl = other.attributes.avatar.url();
          }

          if (!existingMessage.length) {
            $('.message-view #' + convo.id + 'Tab .messages-container').append([
              '<div id="message-' + message.id + '" class="message ' + (isMyMessage ? 'me' : 'other') + ' clearfix">',
                '<div class="avatar" style="background-image: url(\'' + avatarUrl + '\')"></div>',
                '<p class="content">' + message.attributes.content + '</p>',
              '</div>',
            ].join(''));
          }

        });

        if (!$('.message-view .tab-pane.active').length) {
          var paramMessage = window.location.hash,
            inbox = paramMessage ? $('.inbox [href="' + paramMessage + 'Tab"]') : $('.inbox [data-toggle="tab"]').first(),
            messageView = paramMessage ? $('.message-view ' + paramMessage + 'Tab') : $('.message-view .tab-pane').first();

          inbox.addClass('active');
          messageView.addClass('active');
        }

        $('body').addClass('loaded');
      }
    });

  }

  $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
    var target = $(e.target).attr('href'),
      tab = $('.message-view ' + target + ' .messages-container');

    tab.scrollTop(tab[0].scrollHeight);
  });

  $(document).on('submit', '.new-message', function (e) {
    e.preventDefault();

    var me = window.createPointer('_User', Parse.User.current().id),
      input = $('textarea', this),
      content = input.val(),
      convoId = $(this).closest('.tab-pane').attr('data-conversation'),
      conversation = window.createPointer('Conversation', convoId),
      other = $(this).attr('data-other-id'),
      avatar = Parse.User.current().get('avatar') ? Parse.User.current().get('avatar').url() : '/images/avatar.png';

    async.waterfall([
      function (callback) {
        var query = new Parse.Query(Parse.User);
        query.get(other).then(function (person) {
          return callback(null, person);
        }, callback);
      },
      function (person, callback) {
        new Message().save({ from: me, content: content, conversation: conversation }, {
          success: function(message) {
            return callback(null, person, message);
          },
          error: function(convo, error) {
            window.createAlert("error", error.message);
          }
        });
      },
      function (person, message, callback) {
        $.post('/message', {
          user: Parse.User.current().get('fullname'),
          to: person.attributes.email,
          toname: person.attributes.fullname
        }, function (data) {
          return callback(null, message);
        }, 'json').fail(callback);
      }
    ], function (error, message) {
      $('.message-view #' + convoId + 'Tab .messages-container').append([
        '<div id="message-' + message.id + '" class="message me clearfix">',
          '<div class="avatar" style="background-image: url(\'' + avatar + '\')"></div>',
          '<p class="content">' + content + '</p>',
        '</div>',
      ].join(''));
      input.val('');
      mixpanel.track("Send Message");
    });

    return false;
  });
});
