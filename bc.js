const bcrypt = require("bcryptjs");
const { promisify } = require("util");

let { genSalt, hash, compare } = bcrypt;

genSalt = promisify(genSalt);
hash = promisify(hash); //takes two arguments, plain text password and salt
compare = promisify(compare); //takes two args: plain text and hash compare value, returns a Boolean

module.exports.compare = compare;
module.exports.hash = (plainTxtPw) =>
    genSalt().then((salt) => hash(plainTxtPw, salt)); //salts and hashes in one line
