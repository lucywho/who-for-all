const express = require("express");
const app = express();
const db = require("./db.js");
const handlebars = require("express-handlebars");

app.engine("handlebars", handlebars());
app.set("view engine", "handlebars");

app.use(express.static("./public"));

app.get("/", (req, res) => {
    console.log("get request to / route succeeded");
    //reroute to /welcome
    res.render("welcome", {
        layout: "main",
    });
});

app.get("/welcome", (req, res) => {
    res.render("welcome", {
        layout: "main",
    });
    //**route in browser
    // db.getNames()
    //     .then((results) => {
    //         console.log("results :", results);
    //     })
    //     .catch((err) => {
    //         console.log("err in getNames: ", err);
    //     });
});

app.post("/welcome", (req, res) => {
    db.addName(x, y, z) //change x, y, z to inputs
        .then(() => {
            console.log("post worked");
        })
        .catch((err) => {
            console.log("err in addName: ", err);
            //reroute to "/petition" with error message
        });
});

app.get("/thankyou", (req, res) => {
    res.render("thankyou", {
        layout: "main",
    });
});

app.get("/signatories", (req, res) => {
    res.render("signatories", {
        layout: "main",
    });
});

//============================//
app.listen(8080, () => console.log("petition server running"));
