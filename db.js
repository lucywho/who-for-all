const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); //need to create new petition database - replace actors with new name

//db returns an object with one property - query to allow e.g. following query code:

//deal with user inputs
module.exports.addName = (first_name, last_name, email, hashpass) => {
    return db.query(
        `INSERT INTO users (first_name, last_name, email, password)
        VALUES($1, $2, $3, $4) RETURNING id`, //$ syntax protects against sql injection attack, ensures input is dealt with as a string not as a query
        [first_name, last_name, email, hashpass] //same variables as arguments
    );
};

//DON'T FORGET e.g. RETURNING first_name means .then block will only treat first name as results

module.exports.getNames = () => {
    return db
        .query(`SELECT first_name, last_name FROM users`)
        .then((results) => {
            return results.rows;
        })
        .catch((err) => {
            console.log("err getNames db", err);
        });
};

module.exports.getPassword = (logemail) => {
    return db.query(`SELECT * FROM users where email = ${logemail}`);
};

module.exports.addSig = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
    VALUES($1, $2) RETURNING *`,
        [signature, user_id]
    );
};

module.exports.checkSig = (user_id) => {
    return db.query(`SELECT * FROM signatures WHERE user_id = ${user_id}`);
};

module.exports.sigTotal = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.sigPic = (user_id) => {
    //problem here
    return db.query(`SELECT signature FROM signatures WHERE id = ${user_id}`);
};
