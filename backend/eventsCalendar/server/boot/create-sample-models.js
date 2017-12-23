'use strict';

module.exports = function(app) {
    var server = require('../server');
    var ds = server.dataSources.EventsCalendar;
    var lbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role', 'Event'];
    ds.autoupdate(lbTables, function(er) {
        if (er) throw er;
        //ds.disconnect();
    });
};
