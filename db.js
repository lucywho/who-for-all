const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

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
        .query(
            `SELECT users.first_name AS user_firstName, users.last_name AS user_lastName, user_profiles.age AS user_age, user_profiles.city AS user_city, user_profiles.url AS user_url
             FROM users
              JOIN user_profiles ON users.id = user_profiles.user_id
              JOIN signatures ON user_profiles.user_id = signatures.user_id`
        )
        .then((results) => {
            return results.rows;
        })
        .catch((err) => {
            console.log("err getNames db", err);
        });
};

module.exports.getPassword = (logemail) => {
    return db.query(`SELECT * FROM users where email = $1`, [logemail]);
};

module.exports.addSig = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id)
    VALUES($1, $2) RETURNING *`,
        [signature, user_id]
    );
};

module.exports.checkSig = (user_id) => {
    return db.query(`SELECT * FROM signatures WHERE user_id = $1`, [user_id]);
};

module.exports.sigTotal = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.sigPic = (user_id) => {
    //problem here
    return db.query(`SELECT signature FROM signatures WHERE id = ${user_id}`);
};

module.exports.addProfile = (age, city, homepage, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES($1, $2, $3, $4)`,
        [age, city, homepage, user_id]
    );
};
