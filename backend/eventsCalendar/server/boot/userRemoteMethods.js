module.exports = function(app) {
  const User = app.models.User;

  User.register = function(email, password, cb) {
    User.create({email: email, password: password}, function(err, response) {
        cb(null, response);
      });
  };

  User.remoteMethod("register", {
    accepts: [
      { arg: "email", type: "string", required: true },
      { arg: "password", type: "string", required: true }
    ],
    http: { path: "/register", verb: "post" },
    returns: {
      arg: "user",
      type: "User"
    },
    description: "AI: Events Calendar >> Register user"
  });
};
