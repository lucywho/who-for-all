const express = require("express");
const app = express();
const db = require("./db.js");
const handlebars = require("express-handlebars");
const cookieParser = require("cookie-parser");

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(cookieParser());

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
    console.log("get request to / route succeeded");
    res.redirect("/welcome");
});

app.get("/welcome", (req, res) => {
    if (req.cookies.signed) {
        res.redirect("/thankyou");
    } else {
        res.render("welcome", {
            layout: "main",
        });
    }
});

app.post("/welcome", (req, res) => {
    //capture inputs
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const signature = "sig placeholder";

    //check all there
    if (!req.body.first_name || !req.body.last_name || !signature) {
        console.log("missing inputs");
        res.redirect("/welcome");
        //TO DO: work out how to render an error message on welcome
    }

    db.addName(first_name, last_name, signature)
        .then(() => {
            console.log("post worked");
        })
        .catch((err) => {
            console.log("err in addName: ", err);
            //TO DO: reroute to "/welcome" with error message
        });

    res.cookie("signed", "signed");

    res.redirect("/thankyou");
});

app.get("/thankyou", (req, res) => {
    db.sigTotal()
        .then((results) => {
            let sigTotal = results;
            console.log("sig total: ", sigTotal);
            return sigTotal;
        })
        .then((sigTotal) => {
            if (!req.cookies.signed) {
                res.redirect("/welcome");
            } else {
                res.render("thankyou", {
                    layout: "main",
                    sigTotal: sigTotal,
                });
            }
        })
        .catch((err) => {
            console.log("err in addName: ", err);
            //TO DO: reroute to "/welcome" with error message
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
            if (!req.cookies.signed) {
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
        });
});

app.use(express.static("./public"));

//============================//
app.listen(8080, () => console.log("petition server running"));
