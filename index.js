const express = require("express");
const app = express();
const db = require("./db.js");
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session"); //delete cookieParser from rest of code
const csurf = require("csurf");
const { hash, compare } = require("./bc.js");

//==set view engine
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

//===middleware
app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false,
    })
);

//set cookie object
app.use(
    cookieSession({
        secret: `Like Fire and Ice`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(csurf());

app.use((req, res, next) => {
    //prevent website appearing in frames (modern browsers only)
    res.setHeader("X-Frame-Options", "deny");
    //automatically passes token to all res.render code
    res.locals.csrfToken = req.csrfToken();
    //NOTE (can use res.locals to pass anything to all templates)
    next();
});

//==routes
app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    }
    res.render("register", {
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    //capture inputs
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;
    let hashpass;

    //check all inputs and redo page if not
    if (!first_name || !last_name || !email || !password) {
        console.log("missing inputs");

        let wentWrong =
            "Please reverse the polarity of the neutron flow and try again";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }

    // hash the password
    hash(password)
        .then((hashpass) => {
            console.log("hashpass worked", hashpass);
        })
        .catch((err) => {
            console.log("error in hashpass: ", err);
        });

    //add inputs to user table
    db.addName(first_name, last_name, email, hashpass)
        .then((results) => {
            console.log("post worked");
            let user_id = results.rows[0].id;
            req.session.userId = user_id;
            res.redirect("/sign");
        })
        .catch((err) => {
            console.log("err in addName: ", err);
            let wentWrong =
                "Block transfer computation failure, please try again";
            res.render("register", {
                layout: "main",
                wentWrong: wentWrong,
            });
            return;
        });
});

app.get("/sign", (req, res) => {
    if (!req.session.userId) {
        let wentWrong =
            "You are not yet registered, please fill out the form below";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }
});

app.post("/sign", (req, res) => {
    const signature = req.body.signature;

    if (!signature) {
        let wentWrong = "Something went wrong. Let's poke it with a stick";
        res.render("sign", {
            layout: "main",
            wentWrong: wentWrong,
        });
    }

    db.addSig(signature)
        .then(() => {
            console.log("addsig worked");
            req.session.signatureId = signature;
        })
        .catch((err) => {
            console.log("error in index.js addSig: ", err);
            let wentWrong =
                "Block transfer computation failure, please try again";
            res.render("sign", {
                layout: "main",
                wentWrong: wentWrong,
            });
        });
});

app.get("/thankyou", (req, res) => {
    if (!req.session.userId) {
        res.redirect("/register");
        return;
    }
    let sigPic;
    let sigTotal;

    //make db query to get signature from database which matches id stored in cookie session

    db.sigTotal()
        .then((results) => {
            //console.log("results in sigTotal: ", results);
            sigTotal = results.rowCount;
            console.log("sig total: ", sigTotal);
            //return sigTotal;
        })
        .then(() => {
            db.sigPic(req.session.signatureId)
                .then((results) => {
                    //console.log("results in sigPic: ", results);
                    sigPic = results.rows[0].signature;
                    //console.log("sigPic:", sigPic);
                    res.render("thankyou", {
                        layout: "main",
                        sigTotal: sigTotal,
                        sigPic: sigPic,
                    });
                    //return sigPic;
                })
                .catch((err) => {
                    console.log("err in sigPic: ", err);
                });
        })
        .catch((err) => {
            console.log("err in sigTotal: ", err);
            let wentWrong =
                "Check the conceptual geometer and refresh the page";
            res.render("thankyou", {
                layout: "main",
                wentWrong: wentWrong,
            });
            return;
        });
});

app.get("/signatories", (req, res) => {
    db.getNames()
        .then((results) => {
            let list = [];

            for (let i = 0; i < results.length; i++) {
                let item = results[i];

                list.push(` ${item.first_name} ${item.last_name}`);
            }
            console.log("list: ", list);

            return list;
        })
        .then((list) => {
            if (req.session.signatureId == "") {
                res.redirect("/register");
            } else {
                res.render("signatories", {
                    layout: "main",
                    signatories: list,
                });
            }
        })
        .catch((err) => {
            console.log("err in getNames: ", err);
            let wentWrong =
                "There’s something that doesn’t make sense. Let’s go and poke it with a stick.";
            res.render("signatories", {
                layout: "main",
                signatories: list,
                wentWrong: wentWrong,
            });
            return;
        });
});

//============================//
app.listen(8080, () => console.log("petition server running"));
