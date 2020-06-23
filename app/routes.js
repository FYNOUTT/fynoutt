
var User = require('./models/user');
var Token = require('./models/token');

var UserController = require('./controllers/UserController');

require('dotenv').config()

module.exports = function(app, passport) {
    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('pages/index.ejs', {
            user: req.user, isLoggedIn:req.isAuthenticated(), page: req.url
        }); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('pages/login.ejs', { message: req.flash('loginMessage'), redirectTo: req.flash('redirectTo') }); 
    });

    // process the login form
    app.post('/login', function(req, res, next){
        passport.authenticate('local-login', {
            successRedirect : req.body.redirectTo || '/dashboard', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        })(req,res, next);
    });
    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup/:token', function(req, res) {
        Token.findOne({ token: req.params.token}, function(err, token) {
            if (!token) {
                req.flash('sendTokenError', 'We were unable to find a valid token. Your token my have expired. Enter you email to resend');
                return res.redirect('/signup');
            }
            // render the page and pass in any flash data if it exists
            res.render('pages/signup.ejs', {
                message: req.flash('signupMessage'),
                email:   token.email
            });
        });
    });

    app.post('/signup', function(req, res, next){
        passport.authenticate('local-signup', {
            successRedirect : '/dashboard', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        })(req, res, next);
    });
    // app.post('/verify', UserController.verify);
        
    app.get('/forgot', function(req, res){
        res.render('pages/forgot.ejs',{
            user:   req.user,
            errorMessage: req.flash('error'),
            infoMessage: req.flash('info')
        });
    });
    app.post('/forgot', UserController.forgot);



    app.post('/sendToken', UserController.sendToken);
    app.get('/signup', function(req, res){
        res.render('pages/sendToken',{
            sendTokenMessage:   req.flash('sendTokenMessage'),
            sendTokenError:     req.flash('sendTokenError')
        });
    });

    app.get('/reset/:token', UserController.resetGet);
    app.post('/reset/:token', UserController.reset);

    app.get('/dashboard', isLoggedIn, UserController.dashboard);
    app.get('/open/:id', isLoggedIn, UserController.openended);
    app.get('/selected/:id', isLoggedIn, UserController.closedended);
    app.get('/dashboard/setskills', isLoggedIn, UserController.setskills);
    app.post('/openSubmit/:id', UserController.openSubmit);
    app.post('/selectedSubmit/:id', UserController.selectedSubmit);
    app.post('/uploadSkill', UserController.uploadSkill);

    // app.post('/forgotpasswordResponse', UserController.forgotpasswordResponse);  
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    req.flash('redirectTo', req.path)
    res.redirect('/login');
}
