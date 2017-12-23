"use strict";
var loopback = require("loopback");

module.exports = function(Event) {

  /**
   * Cron for event notifier. Fires every hour.
   */
  var CronJob = require("cron").CronJob;
  new CronJob(
    "* 0 * * * *",
    function() {
      Event.eventNotifier();
    },
    null,
    true
  );

  /**
   * Before remote for creating events.
   * Handles modified and created timestamps and assigns current user to event.
   */
  Event.beforeRemote("create", function(context, user, next) {
    context.args.data.created_timestamp = Date.now();
    context.args.data.modified_timestamp = Date.now();
    context.args.data.userId = context.req.accessToken.userId;
    next();
  });

  /**
   * Remote method: all.
   * 
   * Get a list of all events 
   * 
   * Returns:
   * (Array) events - all events
   */
  Event.all = function(cb) {
    Event.find(
      {
        fields: {
          title: true,
          description: true,
          start_date: true,
          end_date: true
        }
      },
      function(err, response) {
        console.log(cb);
        cb(null, response);
      }
    );
  };

  Event.remoteMethod("all", {
    http: { path: "/all", verb: "get" },
    returns: { arg: "events", type: "Array" },
    description: "Events Calendar >> Get all events"
  });

  /**
   * Remote method: public.
   * 
   * Get a list of all public events 
   * 
   * Returns:
   * (Array) events - all public events
   */
  Event.public = function(cb) {
    Event.find(
      {
        where: { private: false },
        fields: {
          title: true,
          description: true,
          start_date: true,
          end_date: true
        }
      },
      function(err, response) {
        cb(null, response);
      }
    );
  };

  Event.remoteMethod("public", {
    http: { path: "/public", verb: "get" },
    returns: { arg: "events", type: "Array" },
    description: "Events Calendar >> Get all public events"
  });

  /**
   * Remote method: private.
   * 
   * Get a list of all private events. All events for current user. 
   * 
   * Parametars:
   * (Object) options - options from request
   * 
   * Returns:
   * (Array) events - all private events
   */
  Event.private = function(options, cb) {
    var userId = options.accessToken.userId;
    Event.find(
      {
        where: { userId: userId },
        fields: {
          title: true,
          description: true,
          start_date: true,
          end_date: true
        }
      },
      function(err, response) {
        cb(null, response);
      }
    );
  };

  Event.remoteMethod("private", {
    accepts: [{ arg: "options", type: "Object", http: "optionsFromRequest" }],
    http: { path: "/private", verb: "get" },
    returns: { arg: "events", type: "Array" },
    description: "Events Calendar >> Get all private events"
  });

  /**
   * Remote method: search.
   * 
   * Search events by title. 
   * 
   * Parametars:
   * (String) title - event title
   * 
   * Returns:
   * (Array) events - all events that contain title in event title 
   */
  Event.search = function(title, cb) {
    Event.find(
      {
        where: { title: { like: "%" + title + "%" } },
        fields: {
          title: true,
          description: true,
          start_date: true,
          end_date: true
        }
      },
      function(err, response) {
        cb(null, response);
      }
    );
  };

  Event.remoteMethod("search", {
    accepts: { arg: "title", type: "string" },
    http: { path: "/search", verb: "get" },
    returns: { arg: "events", type: "Array" },
    description: "Events Calendar >> Search by title"
  });

  /**
   * Remote method: voteFor.
   * 
   * Increments vote for on event. 
   * 
   * Parametars:
   * (Number) id - event id
   * 
   * Returns:
   * (Object) event - event on which user has voted,
   * or message if you are not able to vote for selected event
   */
  Event.voteFor = function(id, cb) {
    Event.findById(id, [], function(err, response) {
      if (response !== null && !response.private) {
        response.vote_for++;
        response.modified_timestamp = Date.now();
        response.save();
        cb(null, response);
      } else {
        var message = { message: "You can not vote for this event" };
        cb(null, message);
      }
    });
  };

  Event.remoteMethod("voteFor", {
    accepts: { arg: "id", type: "number", required: true },
    http: { path: "/:id/voteFor", verb: "get" },
    returns: { arg: "event", type: "Event" },
    description: "Events Calendar >> Vote against event"
  });

  /**
   * Remote method: voteAgains.
   * 
   * Increments vote against on event. 
   * 
   * Parametars:
   * (Number) id - event id
   * 
   * Returns:
   * (Object) event - event on which user has voted,
   * or message if you are not able to vote for selected event
   */
  Event.voteAgainst = function(id, cb) {
    Event.findById(id, [], function(err, response) {
      if (response !== null && !response.private) {
        response.vote_against++;
        response.modified_timestamp = Date.now();
        response.save();
        cb(null, response);
      } else {
        var message = { message: "You can not vote for this event" };
        cb(null, message);
      }
    });
  };

  Event.remoteMethod("voteAgainst", {
    accepts: { arg: "id", type: "number", required: true },
    http: { path: "/:id/voteAgainst", verb: "get" },
    returns: { arg: "event", type: "Event" },
    description: "Events Calendar >> Vote for event"
  });

  /**
   * Remote method: delete.
   * 
   * Deletes selected event. 
   * 
   * Parametars:
   * (Number) id - event id
   * (Object) options - options from request
   * 
   * Returns:
   * (Object) message - message with status of operation
   */
  Event.delete = function(id, options, cb) {
    var userId = options.accessToken.userId;
    Event.findById(id, [{ where: { userId: userId } }], function(
      err,
      response
    ) {
      var message = { status: "Failed", message: "Unable to find event" };
      if (response !== null) {
        Event.deleteById(id, function(deleteResponse) {
          var message = { status: "Success", message: "Event deleted" };
          cb(null, message);
        });
      } else {
        cb(null, message);
      }
    });
  };

  Event.remoteMethod("delete", {
    accepts: [
      { arg: "id", type: "number", required: true },
      { arg: "options", type: "Object", http: "optionsFromRequest" }
    ],
    http: { path: "/:id/delete", verb: "delete" },
    returns: { arg: "message", type: "object" },
    description: "Events Calendar >> Remove private events"
  });

  /**
   * Remote method: updateEvent.
   * 
   * Updates selected event. 
   * 
   * Parametars:
   * (Number) id - event id
   * (Object) data - object containing attributes that user wants to update title, description,
   * start and end date
   * (Object) options - options from request
   * 
   * Returns:
   * (Object) event - event which is updated,
   * or message if you are not able to update event
   * 
   */
  Event.updateEvent = function(id, data, options, cb) {
    var userId = options.accessToken.userId;
    var currentData = {};
    Event.findById(id, [{ where: { userId: userId } }], function(
      err,
      response
    ) {
      var message = { status: "Failed", message: "Unable to find event" };
      if (response !== null) {
        currentData = response;
        if (data && data.title) {
          currentData.title = data.title;
        }

        if (data && data.description) {
          currentData.description = data.description;
        }

        if (data && data.start_date) {
          currentData.start_date = data.start_date;
        }

        if (data && data.end_date) {
          currentData.end_date = data.end_date;
        }
        currentData.modified_timestamp = Date.now();
        response.updateAttributes(currentData, function() {
          cb(null, response);
        });
      } else {
        cb(null, message);
      }
    });
  };

  Event.remoteMethod("updateEvent", {
    accepts: [
      { arg: "id", type: "number", required: true },
      { arg: "data", type: "Object" },
      { arg: "options", type: "Object", http: "optionsFromRequest" }
    ],
    http: { path: "/:id/updateEvent", verb: "post" },
    returns: { arg: "event", type: "Events" },
    description: "Events Calendar >> Update private events"
  });

  /**
   * Remote method: eventNotifier.
   * 
   * Get all events that are starting in 1 hour and sends email to event creator. 
   * 
   */
  Event.eventNotifier = function(cb) {
    var now = Date.now();

    Event.find(
      {
        include: {
          relation: "user",
          scope: {
            fields: ["username", "email"]
          }
        }
      },
      function(err, response) {
        for (var i = 0; i < response.length; i++) {
          if (
            response[i].start_date > now &&
            new Date(response[i].start_date - now).getMinutes() < 60
          ) {
            console.log(
              "Sending email to: " +
                JSON.parse(JSON.stringify(response[i])).user.email +
                ". Your event: " +
                response[i].title +
                " begins in less the 1 hour"
            );
          }
        }
      }
    );
  };

  Event.remoteMethod("eventNotifier", {
    http: { path: "/eventNotifier", verb: "get" },
    returns: { arg: "events", type: "Array" },
    description: "Events Calendar >> Event notifier"
  });
};
