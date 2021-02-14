var User = require('../models/user');
var Token = require('../models/token');

const axios = require('axios');
var async=require('async');
var crypto = require('crypto');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

var mongoose = require('mongoose');

require('dotenv').config();


exports.dashboard = async(req, res) => {
  var contributors = [];
  // Find all users who have made an open contribution to the requested user.
  for(i=0; i<req.user.open_contribs.length; i++){
    await User.findOne({_id  :   req.user.open_contribs[i].contributor}, function(err, user){
      contributors.push(user.firstname + " " + user.lastname + " " + user.others);
    });
  }

  // Create two arrays
  var selectArr = new Array();
  var selectors = new Array();
  for(i=0; i<req.user.skillset.length; i++){
    // Make each of the two arrays multi-dimensional.
    selectArr[i] = new Array();
    selectors[i] = new Array();
    // await User.find({_id : req.user.id}, function(err, user){an

      for(j=0; j<req.user.selected_contribs.length; j++){
        if(req.user.selected_contribs[j].choice === req.user.skillset[i]){
          await User.findOne({_id : req.user.selected_contribs[j].contributor}, function(err, selector){
            selectors[i].push(selector.firstname + " " + selector.lastname + " " + selector.others);
          });
          await selectArr[i].push(req.user.selected_contribs[j]);
        }
      }
    // })
  }
  // res.setHeader("Content-Type", "text/html");
  res.render('pages/dashboard.ejs', {
    user: req.user,
    contributors: contributors,
    selectArr:  selectArr,
    selectors:  selectors
  });
};

exports.openended = (req, res) => {
  User.findOne({_id : req.params.id}, function(err, user){
    if(err)
      console.log(err);
    
    res.render('pages/openreply.ejs', {
      user: user,
      me:   req.user
    });
  });
};

exports.closedended = (req, res) => {
  User.findOne({_id : req.params.id}, function(err, user){
    if(err)
      console.log(err);
    
    res.render('pages/selectedreply.ejs', {
      user: user,
      me:   req.user
    });
  });
};

exports.openSubmit = (req, res) => {
  User.findOne({_id  :   req.params.id}, function(err, user){
    if(err)
      console.log(err);

    var contrib =  {
      contributor:  req.user.id,
      contribution: req.body.opinion.trim(),
      timeOfContrib:Date.now()
    };
    user.open_contribs.push(contrib);
    user.save(function(err){
      if(err)
        console.log(err);
      
      res.json({
        success: true
      });
    });
  }); 
};

exports.selectedSubmit = (req, res) => {
  User.findOne({_id  :   req.params.id}, function(err, user){
    if(err)
      console.log(err);

    var contrib =  {
      choice:  req.body.choice.trim(),
      contributor: req.user.id
    };
    user.selected_contribs.push(contrib);
    user.save(function(err){
      if(err)
        console.log(err);
      
      res.json({
        success: true
      });
    });
  }); 
};

exports.setskills = (req, res) => {
  res.render('pages/setskills.ejs');
};

exports.uploadSkill = (req, res) => {
  User.findOne({_id  :   req.user.id}, function(err, user){
    if(err)
      console.log(err);

    user.skillset = req.body.skills;
    user.save(function(err){
      if(err)
        console.log(err);
      res.json({
        success :   true
      });
      // res.redirect('/dashboard');
      
    });

  });
};


exports.sendToken = function (req, res, next) {
  // req.assert('email', 'Email is not valid').isEmail();
  // req.assert('email', 'Email cannot be blank').notEmpty();
  // req.sanitize('email').normalizeEmail({ remove_dots: false });

  // Check for validation errors    
  // var errors = req.validationErrors();
  // if (errors) return res.status(400).send(errors);

  User.findOne({ 'local.email': req.body.email }, function (err, user) {
      if (user) {
        req.flash('sendTokenMessage', 'The email "' + req.body.email + '" has been used for an account already. Kindly try another.');
        return res.redirect('/signup');
      }else{
        // Create a verification token for this user
        Token.find({email : req.body.email}).remove().exec();

        var token = new Token({ email: req.body.email, token: crypto.randomBytes(16).toString('hex') });
                  
        // Save the verification token
        token.save(function (err) {
            if (err) { 
                req.flash('sendTokenError', err.message); 
                return res.redirect('/signup');
            }
  
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                      user: process.env.EMAIL,
                      pass: process.env.EMAIL_PASS
              }
            });
            // Send the email
            var mailOptions = { 
              from: process.env.EMAIL, 
              to: token.email,
              subject:  'FynOutt Email Verification', 
              text: 'Your are receiving this because you (or someone else) have requested to create a fynoutt account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the registration process:\n\n' +
              'http://' + req.headers.host + '/signup/' + token.token + '\n\n' +
              'If you did not request this, please ignore this email.\n' 
            };
            transporter.sendMail(mailOptions, function (err) {
                if (err) { 
                    req.flash('sendTokenError', err.message);
                    return res.redirect('/signup');
                }
                req.flash('sendTokenMessage', 'A verification email has been sent to ' + req.body.email + '. Go to your email to complete the process.');
                return res.redirect('/signup');
            });
        });
      }

  });
}; 



exports.forgot = (req, res, next) => {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({'local.email' : req.body.email}, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      const smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
             user: process.env.EMAIL,
             pass: process.env.EMAIL_PASS
        }
      });
      var mailOptions = {
        to: user.local.email,
        from: process.env.EMAIL,
        subject: 'Fynout Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('info', 'An e-mail has been sent to ' + user.local.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
};

exports.resetGet = (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('errorMessage', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('pages/reset.ejs', {
      user: req.user,
      success:  req.flash('success'),
      req:      req
    });
  });
};

exports.reset = (req, res) => {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.local.password = user.generateHash(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      const smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
             user: process.env.EMAIL,
             pass: process.env.EMAIL_PASS
        }
      });
      var mailOptions = {
        to: user.local.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
}