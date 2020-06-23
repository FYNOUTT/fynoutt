// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email           : String,
        password        : String
    },
    facebook         : {
        id           : String,
        token        : String,
        name         : String,
        email        : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    firstname       : {
        type:   String
    },
    lastname        : {
        type:   String
    },
    others          : {
        type:   String
    },
    open_ended_link   :   {
        type    :   String
    },
    close_ended_link   :   {
        type    :   String
    },
    skillset    :   [
        {
            type:   String
        }
    ],
    open_contribs   :   [
        {
            contributor:    String,
            contribution:   String,
            timeOfContrib:   Date
        }, {
            timestamps: true
        }
    ],
    selected_contribs :   [
        {
            choice: String,
            contributor:    String
        }, {
            timestamps: true
        }
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date

}, {
    timestamps: true
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
