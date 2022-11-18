
const express = require('express')
const app = express()
const mongoose = require('mongoose');
const { User } = require("./model/user");
const argon2 = require('argon2');
var jwt = require('jsonwebtoken');


app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());



const start = async () => {
    try {
        mongoose.connect(
            "mongodb://localhost:27017/mongodb-tp"
        ).catch(err => console.log(err.reason))
        app.listen(3000, () => console.log("Server started on port 3000"));
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

start();
