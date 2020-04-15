//put with other routes, replace current welcome page (signature on another page)
app.post("/register", (req, res) => {
    //grab user input, hash the password, and store information in database
    hash("passwordgiven")
        .then((hashedPassword) => {
            console.log("hashed password in /register: ", hashedPassword);
            //store info in database
            //return error message if incomplete
        })
        .catch((err) => {
            console.log("error in register post hash: ", err);
            res.redirect("/welcome");
        });
});

app.post("/login", (req, res) => {
    //new page, ask for user email and password
    //use compare to compare give password with password saved in db
    let hashedPassword = "test"; // id user by email, grab users stored hash from db, put stored hash in place of "test"
    //if false, redirect to login with error message
    //if true, store user id in cookies req.session.userId redirect to thankyou
    compare("passwordgiven", hashedPassword)
        .then((matchValue) => {
            console.log("matchValue in login: ", matchValue);
        })
        .catch((err) => {
            console.log("error in login POST: ", err);
        });
});

//examples from class
// genSalt()
//     .then(salt => {
//         console.log(salt);
//         return hash("password", salt);
//     })
//     .then(hashedPassword => {
//         console.log("hashed password with salt", hashedPassword);
//         return compare("password123", hashedPassword);
//     })
//     .then(matchValueOfCompare => {
//         console.log("matchValueOfCompare", matchValueOfCompare);
//     });
