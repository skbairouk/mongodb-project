
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

    var updateUser = {
        lastname: req.body.lastname,
        firstname: req.body.firstname
    }


    const email = req.user.email;


    const modifdUser = await User.findOneAndUpdate({ email }, updateUser, {
        returnOriginal: false
    });

    const result = {
        email: modifdUser.email,
        nom: modifdUser.lastname,
        prenom: modifdUser.firstname,
        phone: modifdUser.phone,
        message: "Modification du compte réussie !",
    }

    res.status(200).json(result);
    return;
});


app.put("/api/user/edit-phone", auth, async (req, res) => {

    var updateUser = {
        phone: req.body.phone,
    }

    const email = req.user.email;

    const modifdUser = await User.findOneAndUpdate({ email }, updateUser, {
        returnOriginal: false
    });
    const result = {
        phone: modifdUser.phone,
    }

    res.status(200).json(result);
    return;
});

app.put("/api/user/edit-email", auth, async (req, res) => {
    var updateUser = {

        email: req.body.email
    }
    const email = req.user.email;

    const modifdUser = await User.findOneAndUpdate({ email }, updateUser, {
        returnOriginal: false
    });
    const result = {
        email: modifdUser.email,
    }

    res.status(200).json(result);
    return;
});


app.put("/api/user/edit-password", auth, async (req, res) => {
    // Get user input
    const { password, confirmPassword } = req.body;

    // Validate user input
    if (!(password)) {
        res.status(400).send("All input is required");
        return;
    }
    if (password == confirmPassword) {
        res.status(400).send("not match");
        return;
    }
    console.log(password, confirmPassword)

    var updateUser = {
        password: await argon2.hash(password),
    }
    const email = req.user.email;

    await User.findOneAndUpdate({ email }, updateUser);
    const result = {
        message: "Mot de passe modifié !",
    }

    res.status(200).json(result);
    return;
});

app.delete("/api/user/delete", auth, async (req, res) => {
    const email = req.user.email;

    await User.deleteMany({ email });
    const result = {
        message: "Votre profil a été supprimé ! Un email de confirmation de suppression vous a été envoyé"
    }

    res.status(200).json(result);
    return;
});
