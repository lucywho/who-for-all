const db = require("./db.js");
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const { hash } = require("./bc.js");

const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

router.post("/", (req, res) => {
    console.log("post profile running");
    //catch data from form,
    const age = req.body.age;
    const city = req.body.city;
    const homepage = req.body.homepage;
    console.log("profile inputs: ", age, city, homepage);

    //check that website url starts with http or https
    if (homepage !== "" && !homepage.startsWith("http")) {
        let wentWrong =
            "Please ensure that your homepage address is a valid url or leave blank";
        res.render("profile", {
            layout: "main",
            wentWrong: wentWrong,
        });
    } else {
        //insert into new database table, redirect to sign
        let user_id = req.session.userId;
        db.addProfile(age, city, homepage, user_id)
            .then(() => {
                console.log("profile post works");
                // user_id = results.rows[0].id;
                // req.session.userId = user_id;
                res.redirect("/sign");
            })
            .catch((err) => {
                console.log("134 error in addProfile:", err);
                let wentWrong =
                    "Something is wrong. Let's poke it with a stick.";
                res.render("profile", {
                    layout: "main",
                    wentWrong: wentWrong,
                });
            });
    }
});

router.get("/edit", (req, res) => {
    console.log("req.session at edit profile: ", req.session.userId);
    if (!req.session.userId) {
        let wentWrong =
            "You are not signed in. Please register or log in to see the rest of the site";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    } else {
        let currentUser = req.session.userId;
        console.log("232 edit req.session.userId: ", req.session.userId); //returns userId

        db.getProfile(currentUser)
            .then((results) => {
                let profile = results.rows[0];
                res.render("edit", {
                    firstname: profile.user_firstname,
                    lastname: profile.user_lastname,
                    email: profile.user_email,
                    age: profile.user_age,
                    city: profile.user_city,
                    url: profile.user_url,
                    results,
                });
            })
            .catch((err) => {
                console.log("error in getProfile: ", err);
                let wentWrong =
                    "Something is wrong. Let's poke it with a stick.";
                res.render("edit", {
                    layout: "main",
                    wentWrong: wentWrong,
                });
            });
    }
});

router.post("/edit", (req, res) => {
    const firstname = req.body.first_name;
    const lastname = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;
    const age = req.body.age;
    const city = req.body.city;
    const url = req.body.homepage;

    let user_id = req.session.userId;

    if (password) {
        hash(password)
            .then((hashpass) => {
                console.log("hashpass worked", hashpass);

                db.editUserInfoPass(
                    firstname,
                    lastname,
                    email,
                    hashpass,
                    user_id
                )
                    .then(() => {
                        db.editUserProfile(age, city, url, user_id);
                    })
                    .then((results) => {
                        console.log("edit post worked");
                        res.redirect("/signatories");
                    })
                    .catch((err) => {
                        console.log("err in editUserInfoPass: ", err);
                        let wentWrong =
                            "Block transfer computation failure, please try again";
                        res.render("edit", {
                            layout: "main",
                            wentWrong: wentWrong,
                        });
                        return;
                    });
            })
            .catch((err) => {
                console.log("err in editUserInfoPass: ", err);
            }); // end of then.hashpass.catch
    } //end of if(password)
    else {
        db.editUserInfo(firstname, lastname, email, user_id)
            .then(() => {
                db.editUserProfile(age, city, url, user_id);
            })
            .then((results) => {
                console.log("edit post worked");
                // user_id = results.rows[0].id;
                // req.session.userId = user_id;
                res.redirect("/signatories");
            })
            .catch((err) => {
                console.log("err in editUserInfo: ", err);
                // let wentWrong =
                //     "Block transfer computation failure, please try again";
                // res.render("edit", {
                //     layout: "main",
                //     wentWrong: wentWrong,
                // });
                //return;
            });
    } //end of else
}); //end of app.post

module.exports = router;
