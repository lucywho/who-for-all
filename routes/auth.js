const { requireUserLoggedOut } = "../middlware";
const { app } = require("../index");

const db = require("./db.js");
const { hash, compare } = require("./bc.js");

//get post register and login
app.get("/register", requireUserLoggedOut, (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    }
    res.render("register", {
        layout: "main",
    });
});

app.post("/register", requireUserLoggedOut, (req, res) => {
    console.log("post register running");
    //capture inputs
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;
    let user_id;

    //check all inputs and redo page if not
    if (!first_name || !last_name || !email || !password) {
        console.log("register: missing inputs");

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
                console.log("register post worked");
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

app.get("/login", requireUserLoggedOut, (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    }

    res.render("login", {
        layout: "main",
    });
});

app.post("/login", requireUserLoggedOut, (req, res) => {
    const logemail = req.body.logemail;
    const logpassword = req.body.logpassword;
    let hashpass;
    let user_id;

    if (!logemail || !logpassword) {
        let wentWrong = "Please complete both fields";
        res.render("login", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }

    db.getPassword(logemail)
        .then((results) => {
            let hashpass = results.rows[0].password;
            console.log("144 results", hashpass);

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
                        console.log("193 user_id", req.session.userId);

                        db.checkSig(req.session.userId)
                            .then((results) => {
                                if (results.rows[0] !== undefined) {
                                    sig_id = results.rows[0].id;
                                    req.session.signatureId = sig_id;
                                    console.log(
                                        "201 sig_id",
                                        req.session.signatureId
                                    );
                                    res.redirect("/thankyou");
                                } else {
                                    res.render("sign", {
                                        layout: "main",
                                    });
                                    return;
                                }
                            })
                            .catch((err) => {
                                console.log("213 error in checkSig: ", err);
                            });
                    }
                })
                .catch((err) => {
                    console.log("218 error in getPassword: ", err);
                });
        })
        .catch((err) => {
            console.log("222 err in POST login : ", err);
        });
});
