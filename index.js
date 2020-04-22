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

//set cookie object
app.use(
    cookieSession({
        secret: `Like Fire and Ice`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
        //creates req.session
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
app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
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

app.get("/profile/edit", (req, res) => {
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
            //console.log("results in sigTotal: ", results);
            sigTotal = results.rowCount;
            console.log("sig total: ", sigTotal);
            //return sigTotal;
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
                //console.log("329 getNames results: ", results);

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
    console.log("sel_city: ", selCity);

    if (!req.session.userId) {
        res.redirect("/register");
    } else {
        db.getCity(selCity)
            .then((results) => {
                console.log("361 getCity results.rows", results.rows[0]);
                const citylist = results.rows;

                res.render("sigs-by-city", {
                    layout: "main",
                    citysigs: citylist,
                    city: selCity,
                });
            })
            .catch((err) => {
                console.log("365 err getCity db", err);
            })
            .catch((err) => {
                console.log("379 err in GET sigs-by-city : ", err);
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

//if block prevents testing software from starting server
