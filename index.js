const express = require("express");
const app = express();
const db = require("./db.js");
const handlebars = require("express-handlebars");
const cookieSession = require("cookie-session"); //delete cookieParser from rest of code
const csurf = require("csurf");

//===middleware

app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false
    })
);

//set cookie object
app.use(
    cookieSession({
        secret: `Like Fire and Ice`,
        maxAge: 1000 * 60 * 60 * 24 * 14
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

//==set view engine
app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

//==routes
app.get("/", (req, res) => {
    req.session.joined = "new session";
    req.session.signed = "";
    //console.log("get request to / route succeeded");
    res.redirect("/welcome");
});

app.get("/welcome", (req, res) => {
    const { joined, signed } = req.session;

    if (joined !== "new session") {
        console.log("error in new session");
        res.redirect("/");
    } else if (signed === "signed") {
        res.redirect("/thankyou");
    } else {
        res.render("welcome", {
            layout: "main"
        });
    }
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
            wentWrong: wentWrong
        });
        return;
    }

    db.addName(first_name, last_name, signature)
        .then(results => {
            console.log("post worked");
            req.session.signed = "signed";
            console.log("addName results: ", results);
            let id = results.rows[0].id;
            req.session.signatureId = id;
        })
        .catch(err => {
            console.log("err in addName: ", err);
            let wentWrong =
                "Block transfer computation failure, please try again";
            res.render("welcome", {
                layout: "main",
                wentWrong: wentWrong
            });
            return;
        });

    res.redirect("/thankyou");
});

app.get("/thankyou", (req, res) => {
    //make db query to get signature from database which matches id stored in cookie session
    //set image tag with signature url in thankyou.hb template
    db.sigTotal()
        .then(results => {
            let sigTotal = results;
            console.log("sig total: ", sigTotal);
            return sigTotal;
        })
        .then(sigTotal => {
            if (
                req.cookies.signed !== "signed" ||
                req.cookies.joined !== "new session"
            ) {
                res.redirect("/");
            } else {
                res.render("thankyou", {
                    layout: "main",
                    sigTotal: sigTotal
                });
            }
        })
        .catch(err => {
            console.log("err in sigTotal: ", err);
            let wentWrong =
                "Check the conceptual geometer and refresh the page";
            res.render("thankyou", {
                layout: "main",
                wentWrong: wentWrong
            });
            return;
        });
});

app.get("/signatories", (req, res) => {
    db.getNames()
        .then(results => {
            let list = [];

            for (let i = 0; i < results.length; i++) {
                let item = results[i];

                list.push(` ${item.first_name} ${item.last_name}`);
            }
            console.log("list: ", list);

            return list;
        })
        .then(list => {
            if (
                req.cookies.signed !== "signed" ||
                req.cookies.joined !== "new session"
            ) {
                res.redirect("/");
            } else {
                res.render("signatories", {
                    layout: "main",
                    signatories: list
                });
            }
        })
        .catch(err => {
            console.log("err in getNames: ", err);
            let wentWrong =
                "There’s something that doesn’t make sense. Let’s go and poke it with a stick.";
            res.render("signatories", {
                layout: "main",
                signatories: list,
                wentWrong: wentWrong
            });
            return;
        });
});

//============================//
app.listen(8080, () => console.log("petition server running"));
