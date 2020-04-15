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
    res.redirect("/welcome");
});

app.get("/welcome", (req, res) => {
    if (!req.session) {
        res.redirect("/");
        return;
    }
    res.render("welcome", {
        layout: "main",
    });
});

app.post("/welcome", (req, res) => {
    //capture inputs
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const signature = req.body.signature;

    //check all there
    if (!first_name || !last_name || !signature) {
        console.log("missing inputs");

        let wentWrong =
            "Please reverse the polarity of the neutron flow and try again";
        res.render("welcome", {
            layout: "main",
            wentWrong: wentWrong,
        });
        return;
    }

    db.addName(first_name, last_name, signature)
        .then((results) => {
            console.log("post worked");
            let id = results.rows[0].id;
            console.log("id line 79: ", id);
            req.session.signatureId = id;
            console.log("req.session.signatureId: ", req.session.signatureId);
            res.redirect("/thankyou");
        })
        .catch((err) => {
            console.log("err in addName: ", err);
            let wentWrong =
                "Block transfer computation failure, please try again";
            res.render("welcome", {
                layout: "main",
                wentWrong: wentWrong,
            });
            return;
        });
});

app.get("/thankyou", (req, res) => {
    if (req.session.signatureId == "") {
        res.redirect("/welcome");
        return;
    }
    console.log("req.session.signatureId line 101: ", req.session.signatureId);
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
                res.redirect("/welcome");
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
