// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');


// define the schema for our user model
var openSchema = mongoose.Schema({
    creator:    {
        type:   mongoose.Schema.Types.ObjectId,
        ref:    User
    },
    question:   {
        type:   String
    },
    answers: [
        {
            name:   { type: String, required: true},
            answeredBy: { type: mongoose.Schema.Types.ObjectId, required: true},
            answer:     { type: String, required: true},
            timeAnswered:   { type: Date, required: true, default: Date.now}
        }
    ]

}, {
    timestamps: true
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Open', openSchema);
