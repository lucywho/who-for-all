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
    let user_id;

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

    // hash the password and add inputs to user table
    hash(password).then((hashpass) => {
        console.log("hashpass worked", hashpass);
        db.addName(first_name, last_name, email, hashpass)
            .then((results) => {
                console.log("post worked");
                user_id = results.rows[0].id;
                req.session.userId = user_id;
                res.redirect("/profile");
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
});

//register redirects to new page - profile
//not required, so no need to check if complete
//write data to new table, user_profiles
//redirect to sign

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});
//app.post("/profile", (req, res) => { catch data from form, check that website url starts with http or https
//insert into new database table, redirect to sign })

app.get("/login", (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    }

    res.render("login", {
        layout: "main",
    });
});

app.post("/login", (req, res) => {
    //capture inputs
    const logemail = req.body.logemail;
    const logpassword = req.body.logpassword;
    //console.log("line 129 constants: ", logemail, logpassword);

    //check inputs complete
    if (!logemail || !logpassword) {
        let wentWrong = "Please complete both fields";
        res.render("login", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }

    db.getPassword()
        .then((results) => {
            console.log("results line 88", results);
            let hashpass = results.rows[0].password;

            compare(logpassword, hashpass)
                .then((matchValue) => {
                    console.log("matchValue in login: ", matchValue);
                    if (!matchValue) {
                        let wentWrong =
                            "Please check your email address and password and try again.";
                        res.render("login", {
                            layout: "main",
                            wentWrong: wentWrong,
                        });
                        return;
                    } else {
                        user_id = results.rows[0].id;
                        req.session.userId = user_id;

                        db.checkSig(req.session.userId)
                            .then((results) => {
                                if (results !== null) {
                                    req.session.signatureId = signature;
                                    res.redirect("/thanks");
                                } else {
                                    res.render("sign", {
                                        layout: "main",
                                    });
                                    return;
                                }
                            })
                            .catch((err) => {
                                console.log("171 error in checkSig: ", err);
                            });
                    }
                })
                .catch((err) => {
                    console.log("176 error in getPassword: ", err);
                });
        })
        .catch((err) => {
            console.log("180 err in POST login : ", err);
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
    } else {
        res.render("sign", {
            layout: "main",
        });
    }
});

app.post("/sign", (req, res) => {
    const signature = req.body.signature;

    if (!signature) {
        let wentWrong = "Something went wrong. Let's poke it with a stick.";
        res.render("sign", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }

    db.addSig(signature, req.session.userId)
        .then((results) => {
            console.log("addSig worked");
            sig_id = results.rows[0].id;
            req.session.signatureId = sig_id;
            console.log(
                "line 211 sig id with results.id",
                req.session.signatureId
            );
            res.redirect("/thankyou");
        })
        .catch((err) => {
            console.log("error in index.js addSig: ", err);
            let wentWrong =
                "Block transfer computation failure, please try again";
            res.render("sign", {
                layout: "main",
                wentWrong: wentWrong,
            });
            return;
        });
});

app.get("/thankyou", (req, res) => {
    if (!req.session.signatureId || !req.session.userId) {
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

//signatories will now display profile info, name age city, url as a link
//(1) check in sig table to see who (user_id) has signed
//(2) get additional information from users tables and users_profiles
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
