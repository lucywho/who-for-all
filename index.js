const express = require("express");
const app = express();
exports.app = app;

const db = require("./db.js");
const handlebars = require("express-handlebars");

const cookieSession = require("cookie-session");
const csurf = require("csurf");

const profileRouter = require("./routes/profile");

const { requireSignature, requireNoSignature } = require("./middleware");

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

//checks userId cookie for all pages (except register and login) CHECK LOGIC
app.use((req, res, next) => {
    console.log("checking for userID on every request");
    if (!req.session.userId && req.url != "/register" && req.url != "/login") {
        let wentWrong =
            "You need to be registered and logged in to access the full site";
        res.render("register", {
            wentWrong: wentWrong,
        });
        return;
    } else {
        next();
    }
});

//===ROUTES===
app.get("/", (req, res) => {
    res.redirect("/register");
});
//registration and login in auth.js
require("./routes/auth");

app.get("/sign", requireNoSignature, (req, res) => {
    if (!req.session.userId) {
        let wentWrong =
            "You are not signed in. Please fill out the form below to register or click the link to login";
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

//profile add and edit in profile.js
app.use("/profile", profileRouter);

app.post("/sign", requireNoSignature, (req, res) => {
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

app.get("/thankyou", requireSignature, (req, res) => {
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

app.post("/thankyou", requireSignature, (req, res) => {
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

app.get("/signatories", requireSignature, (req, res) => {
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

app.get("/sigs-by-city/:selCity", requireSignature, (req, res) => {
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

app.listen(process.env.PORT || 8080, () =>
    console.log("petition server running")
);
