const mongoose = require("mongoose")
const Schema = mongoose.Schema 


const userSchema = new Schema({
    name: String, 
    refresh_token:String,
    access_token: String, 
    scope: String, 
    token_type: String,
    expiry_date: String
})

mongoose.model('users', userSchema)