const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition"); //need to create new petition database - replace actors with new name

//db returns an object with one property - query to allow e.g. following query code:

module.exports.getNames = () => {
    return db
        .query(`SELECT first_name, last_name FROM signatures`)
        .then((results) => {
            return results.rows;
        })
        .catch((err) => {
            console.log("err getNames db", err);
        });
};

//deal with user inputs
module.exports.addName = (first_name, last_name, email, hashpass) => {
    return db.query(
        `INSERT INTO users (first_name, last_name, email, password)
    VALUES($1, $2, $3, $4)`, //$ syntax protects against sql injection attack, ensures input is dealt with as a string not as a query
        [first_name, last_name, email, hashpass] //same variables as arguments
    );
};

//DON'T FORGET e.g. RETURNING first_name means .then block will only treat first name as results

module.exports.addSig = () => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
    VALUES($1, $2)`,
        [signature, user_id]
    );
};

module.exports.sigTotal = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.sigPic = (id) => {
    //problem here
    return db.query(`SELECT signature FROM signatures WHERE id = ${id}`);
};
