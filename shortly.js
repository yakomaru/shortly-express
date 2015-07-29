var express = require('express');
var session = require('express-session')
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true
}));

app.get('/', 
function(req, res) {
  if(util.isLoggedIn(req, res)) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/create', 
function(req, res) {
  if(util.isLoggedIn(req, res)) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links', 
function(req, res) {
  if(util.isLoggedIn(req, res)) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  } else {
    res.redirect('/login');
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
//routing done here
app.get('/signup',function(req, res){
  res.render('signup');
});

app.get('/login',function(req, res){
  res.render('login');
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/login');
  });
});

app.post('/signup',function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  db.knex('users').where('username', '=', username)
    .then(function(users) {
      if(users['0']) {
        res.send('<html>Account Already Exists</html>');
      } else {
        var user = new User({'username': username, 'password': password});
        user.hash(function(){
          user.save();
          res.send('<html>Account Created</html>');
        });
      }
    });
  // console.log(req.body); // {username: 'name', password: 'pass'}
});

app.post('/login',function(req, res){
  var username = req.body.username;
  var password = req.body.password;
  var login = new User({'username': username});
  login.fetch().then(function(user){
    if(user) {
      login.authentication(password, function(success){
        if(success) {
          util.createSession(req, res, username);
          // res.send('<html>Logged In As ' + username + '</html>');
        } else {
          res.send('<html>Incorrect Username Or Password</html>');
        }
      });
    } else {
      res.send('<html>Username Does Not Exist</html>');
    }
  });

 // db.knex('users').where('username', '=', username)
  //   .then(function(users) {
  //     if(users['0']) {
  //       console.log(users['0']);
  //     }
  //   });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
