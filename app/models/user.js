var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  hash: function(cb) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(this.attributes.password, salt, null, function(err, hash){
        if(err) console.log(err);
        this.attributes.password = hash;
        cb();
      }.bind(this));
    }.bind(this));
  },
  authentication: function(givenPassword, cb) {
    bcrypt.compare(givenPassword, this.attributes.password, function(error, res){
      cb(res);
    });
  }

  // initialize: function() {
  //   this.on('creating', function(model, attr, options){
  //     // hash(data, salt, progress, cb)
  //     bcrypt.genSalt(10, function(err, salt) {
  //       bcrypt.hash(model.get('password'), salt, null, function(err, hash){
  //         if(err) console.log(err);
  //         console.log(hash);
  //         model.set('password', hash);
  //         db.knex('users').where('username', '=', model.get('username'))
  //           .update({
  //             password: hash
  //           });
  //       });
  //     });
  //     // var hash = bcrypt.hashSync('salt');
  //     // hash.update(model.get('password'));
  //     // model.set('password', hash);
  //   });
  // }
});

module.exports = User;