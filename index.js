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
    res.render("welcome", {
        layout: "main",
    });
});
//
app.post("/welcome", (req, res) => {
    //capture inputs
    const first_name = req.body.first_name;
    const last_name = req.body.last_name;
    const signature = "sig placeholder";

    //check all there
    if (!req.body.first_name || !req.body.last_name || !signature) {
        console.log("missing inputs");
        // TO DO

        //req.body.error_msg.classList.remove("hidden");
        console.log("error_msg", req.body.error_msg);
        //res.redirect("/welcome");
    }

    db.addName(first_name, last_name, signature)
        .then(() => {})
        .catch((err) => {
            console.log("err in addName: ", err);
            //reroute to "/welcome" with error message
            console.log("post worked");
        });
    //TO DO: set cookie when post successful
    res.cookie("signed", "signed");
    res.redirect("/thankyou");
});

app.get("/thankyou", (req, res) => {
    //TO DO: check for cookie and redirect to welcome if missing
    if (req.body.cookie !== "signed") {
        res.redirect("/welcome");
    } else {
        res.render("thankyou", {
            layout: "main",
        });
    }
});

app.get("/signatories", (req, res) => {
    //TO DO: check for cookie and redirect to welcome if missing
    if (req.body.cookie !== "signed") {
        res.redirect("/welcome");
    } else {
        res.render("signatories", {
            layout: "main",
        });
    }

    db.getNames()
        .then((results) => {
            let list = "";

            for (let i = 0; i < results.length; i++) {
                let item = results[i];
                list += item.first_name + " " + item.last_name + "<br>";
            }
            console.log("list: ", list);
            //TO DO: work out how to return this to the signatories-list div
            //res.end("/signatories/#signatories-list" + list);
        })
        .catch((err) => {
            console.log("err in getNames: ", err);
        });
});

app.use(express.static("./public"));

//============================//
app.listen(8080, () => console.log("petition server running"));
