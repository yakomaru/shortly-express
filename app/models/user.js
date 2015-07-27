var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function() {
    this.on('creating', function(model, attr, options){
      // hash(data, salt, progress, cb)
      bcrypt.hash(model.get('password'), 'salt', null, function(err, hash){
        if(err) console.log(err);
        model.set('password', hash);
      });
      // var hash = bcrypt.hashSync('salt');
      // hash.update(model.get('password'));
      // model.set('password', hash);
    });
  }
});

module.exports = User;