const express = require("express");
const app = express();
const db = require("./db.js");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser"); //cookie session

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(cookieParser()); //cookie session

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

//routes
app.get("/", (req, res) => {
    console.log("get request to / route succeeded");
    res.redirect("/welcome");
});

app.get("/welcome", (req, res) => {
    if (req.cookies.signed) {
        //cookie session
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

    console.log("first, last,  sig: ", first_name, last_name, signature);

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
        .then(() => {
            console.log("post worked");
            //save returned id here?
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

    res.cookie("signed", "signed"); //cookie session

    res.redirect("/thankyou");
});

app.get("/thankyou", (req, res) => {
    db.sigTotal()
        .then(results => {
            let sigTotal = results;
            console.log("sig total: ", sigTotal);
            return sigTotal;
        })
        .then(sigTotal => {
            if (!req.cookies.signed) {
                //cookie session
                res.redirect("/welcome");
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
            if (!req.cookies.signed) {
                //cookie session
                res.redirect("/welcome");
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

app.use(express.static("./public"));

//============================//
app.listen(8080, () => console.log("petition server running"));
