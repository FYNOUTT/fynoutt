const express = require('express');
const app = express();
var multer  =   require('multer');
var partials = require('express-partials');
var createError = require('http-errors');
var logger = require('morgan');
var session = require("express-session");
const mongoose = require('mongoose');
var port     = process.env.PORT || 3000;
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');

var configDB = require('./config/database.js');
require('dotenv').config();


// configuration ===============================================================
mongoose.connect(process.env.MONGO_URL); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');


app.use(express.static(__dirname + '/public'));
app.use(partials());
app.use(session({ secret: process.env.SESSION_SECRET })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
app.use((error, req, res, next) => {
    res.status(404).send({
        status: 404,
        error: "Not found"
    })
});
app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
        error: {
            status: error.status || 500,
            message: error.message || "Internal Server Error",
        },
    });
});

require('./app/routes.js')(app, passport);

app.listen(port);
console.log('Running at Port 3000');