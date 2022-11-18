
const express = require('express')
const app = express()
const mongoose = require('mongoose');
const { User } = require("./model/user");
const argon2 = require('argon2');
var jwt = require('jsonwebtoken');
const auth = require("./middleware/auth")


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

//Authentication 

//inscription d'un user

// move it to env variable
const JWT_SECRET = "mySecret"

app.post("/api/user/register", async (req, res) => {

    try {
        // Get user input
        const { firstname, lastname, email, password, phone } = req.body;

        // Validate user input
        if (!(email && password && firstname && lastname)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        // Validate if user exist in our database
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        encryptedPassword = await argon2.hash(password);

        // Create user in our database
        const user = await User.create({
            firstname,
            lastname,
            email: email.toLowerCase(), // sanitize: convert email to lowercase
            password: encryptedPassword,
            phone
        });

        // Create token
        const token = jwt.sign(
            { user_id: user._id, email },
            JWT_SECRET,
            {
                expiresIn: "2h",
            }
        );
        // save user token
        const result = {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            message: "Création du compte réussi !",
            token,
        }

        // return new user
        res.status(201).json(result);
    } catch (err) {
        console.log(err);
    }
});

app.post("/api/user/login", async (req, res) => {
    try {
        // Get user input
        const { email, password } = req.body;

        // Validate user input
        if (!(email && password)) {
            res.status(400).send("All input is required");
        }
        // Validate if user exist in our database
        const user = await User.findOne({ email });

        if (user && (await argon2.verify(user.password, password))) {
            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                JWT_SECRET,
                {
                    expiresIn: "2h",
                }
            );

            const result = {
                email: user.email,
                nom: user.lastname,
                prenom: user.firstname,
                phone: user.phone,
                token
            }

            // user
            res.status(200).json(result);
            return;
        }
        res.status(400).send("Invalid Credentials");
    } catch (err) {
        console.log(err);
    }
});


app.get("/api/user/profile", auth, async (req, res) => {
    if (req.user) {
        const email = req.user.email;
        const user = await User.findOne({ email });
        const result = {
            email: user.email,
            nom: user.lastname,
            prenom: user.firstname,
            phone: user.phone,
        }

        res.status(200).json(result);
        return;
    }
    res.status(401).send("Unauthorized");

});

app.put("/api/user/edit", auth, async (req, res) => {

    const { firstname, lastname, email } = req.body;

    const user = await User.findOneAndUpdate({ email }, { firstname, lastname });
    const result = {
        email: user.email,
        nom: user.lastname,
        prenom: user.firstname,
        phone: user.phone,
        message: "Modification du compte réussie !",
    }

    res.status(200).json(result);
    return;
});


