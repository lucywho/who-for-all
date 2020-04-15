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
module.exports.addName = (first_name, last_name, signature) => {
    return db.query(
        `
    INSERT INTO signatures (first_name, last_name, signature)
    VALUES($1, $2, $3) RETURNING first_name, signature, id`, //$ syntax protects against sql injection attack, ensures input is dealt with as a string not as a query
        [first_name, last_name, signature] //same variables as arguments
    );
};
//so .then block will only treat first name, signature and id as results

module.exports.sigTotal = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.sigPic = (id) => {
    //problem here
    return db.query(`SELECT signature FROM signatures WHERE id = ${id}`);
};
