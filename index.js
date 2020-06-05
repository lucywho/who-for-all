const express = require("express");
const app = express();

const db = require("./db.js");
const handlebars = require("express-handlebars");

const cookieSession = require("cookie-session");
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

//==set cookie object
app.use(
    cookieSession({
        secret: `Like Fire and Ice`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(csurf());

app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "deny");
    res.locals.csrfToken = req.csrfToken();
    next();
});

//===ROUTES===
app.get("/", (req, res) => {
    res.redirect("/register");
});
app.get("/register", (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    } else if (req.session.userId) {
        let wentWrong =
            "You are already logged in. To register in as another user, please first log out";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    } else {
        res.render("register", {
            layout: "main",
        });
    }
});

app.post("/register", (req, res) => {
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;
    let user_id;

    if (!first_name || !last_name || !email || !password) {
        let wentWrong =
            "Please reverse the polarity of the neutron flow and try again";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }

    hash(password).then((hashpass) => {
        db.addName(first_name, last_name, email, hashpass)
            .then((results) => {
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

app.get("/login", (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    } else if (req.session.userId) {
        let wentWrong =
            "You are already logged in. To log in as another user, please first log out";
        res.render("login", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    } else {
        res.render("login", {
            layout: "main",
        });
    }
});

app.post("/login", (req, res) => {
    const logemail = req.body.logemail;
    const logpassword = req.body.logpassword;
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

            compare(logpassword, hashpass)
                .then((matchValue) => {
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
                                if (results.rows[0] !== undefined) {
                                    sig_id = results.rows[0].id;
                                    req.session.signatureId = sig_id;
                                    res.redirect("/thankyou");
                                } else {
                                    res.render("sign", {
                                        layout: "main",
                                    });
                                    return;
                                }
                            })
                            .catch((err) => {
                                console.log("error in checkSig: ", err);
                            });
                    }
                })
                .catch((err) => {
                    console.log("error in getPassword: ", err);
                });
        })
        .catch((err) => {
            console.log("err in POST login : ", err);
        });
});
app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    const age = req.body.age;
    const city = req.body.city;
    const homepage = req.body.homepage;

    if (homepage !== "" && !homepage.startsWith("http")) {
        let wentWrong =
            "Please ensure that your homepage address is a valid url or leave blank";
        res.render("profile", {
            layout: "main",
            wentWrong: wentWrong,
        });
    } else {
        let user_id = req.session.userId;
        db.addProfile(age, city, homepage, user_id)
            .then(() => {
                res.redirect("/sign");
            })
            .catch((err) => {
                console.log(err);
                let wentWrong =
                    "Something is wrong. Let's poke it with a stick.";
                res.render("profile", {
                    layout: "main",
                    wentWrong: wentWrong,
                });
            });
    }
});

app.get("/profile/edit", (req, res) => {
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

app.post("/profile/edit", (req, res) => {
    const firstname = req.body.first_name;
    const lastname = req.body.last_name;
    const email = req.body.email;
    const password = req.body.password;
    const age = req.body.age;
    const city = req.body.city;
    const url = req.body.homepage;

    let user_id = req.session.userId;

    if (homepage !== "" && !homepage.startsWith("http")) {
        let wentWrong =
            "Please ensure that your homepage address is a valid url or leave blank";
        res.render("profile", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    } else if (password) {
        hash(password)
            .then((hashpass) => {
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
    } else {
        db.editUserInfo(firstname, lastname, email, user_id)
            .then(() => {
                db.editUserProfile(age, city, url, user_id);
            })
            .then((results) => {
                res.redirect("/signatories");
            })
            .catch((err) => {
                console.log("err in editUserInfo: ", err);
            });
    }
});

app.get("/sign", (req, res) => {
    if (!req.session.userId) {
        let wentWrong =
            "You are not signed in. Please fill out the form below to register or click the link to login";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    } else if (req.session.signatureId) {
        let sigPic;
        let wentWrong =
            "You have already signed the petition. Click below to change your signature. ";

        db.sigTotal()
            .then((results) => {
                sigTotal = results.rowCount;
            })
            .then(() => {
                db.sigPic(req.session.signatureId)
                    .then((results) => {
                        sigPic = results.rows[0].signature;
                        res.render("thankyou", {
                            layout: "main",
                            wentWrong: wentWrong,
                            sigTotal: sigTotal,
                            sigPic: sigPic,
                        });
                    })
                    .catch((err) => {
                        console.log("error in get sign: ", err);
                    });
                return;
            })
            .catch((err) => {
                console.log("error in get sign: ", err);
            });
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
            sig_id = results.rows[0].id;
            req.session.signatureId = sig_id;

            res.redirect("/thankyou");
        })
        .catch((err) => {
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
        let wentWrong =
            "You are not signed in. Please fill out the form below to register or click the link to login";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }
    let sigPic;
    let sigTotal;

    db.sigTotal()
        .then((results) => {
            sigTotal = results.rowCount;
        })
        .then(() => {
            db.sigPic(req.session.signatureId)
                .then((results) => {
                    sigPic = results.rows[0].signature;
                    res.render("thankyou", {
                        layout: "main",
                        sigTotal: sigTotal,
                        sigPic: sigPic,
                    });
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

app.post("/thankyou", (req, res) => {
    const user_id = req.session.userId;

    db.deleteSignature(user_id)
        .then(() => {
            res.render("sign", {
                layout: "main",
            });
        })
        .catch((err) => {
            console.log("error in deleteSig: ", err);
        });
});

app.get("/signatories", (req, res) => {
    if (!req.session.userId) {
        let wentWrong =
            "You are not signed in. Please fill out the form below to register or click the link to login";
        res.render("register", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    } else {
        db.getNames()
            .then((results) => {
                if (req.session.signatureId == "") {
                    res.redirect("/register");
                } else {
                    res.render("signatories", {
                        layout: "main",
                        signatories: results,
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
    }
});

app.get("/sigs-by-city/:selCity", (req, res) => {
    const selCity = req.params.selCity;

    if (!req.session.userId) {
        res.redirect("/register");
    } else {
        db.getCity(selCity)
            .then((results) => {
                const citylist = results.rows;

                res.render("sigs-by-city", {
                    layout: "main",
                    citysigs: citylist,
                    city: selCity,
                });
            })
            .catch((err) => {
                console.log("err in getCity: ", err);
            })
            .catch((err) => {
                console.log("err in GET sigs-by-city: ", err);
            });
    }
});

app.get("/logout", (req, res) => {
    res.render("logout", {});
    req.session = null;
});

//============================//

if (require.main === module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("petition server running")
    );
}

//note: if block prevents testing software from starting server
