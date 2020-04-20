function requireSignature(req, res, next) {
    if (!req.session.signatureId) {
        let wentWrong = "You must sign the petition to see other signatories";
        res.render("sign", {
            layout: "main",
            wentWrong: wentWrong,
        });
    } else {
        next();
    }
}

function requireNoSignature(req, res, next) {
    if (req.session.signatureId) {
        let wentWrong = "You have already signed the petition";
        res.render("thankyou", {
            layout: "main",
            wentWrong: wentWrong,
        });
    } else {
        next();
    }
}

function requireUserLoggedOut(req, res, next) {
    if (req.session.userId) {
        let wentWrong = "You are already logged in";
        return wentWrong;
        //stop logging in user accessing log in page
    } else {
        next();
    }
}

exports.requireSignature = requireSignature;
exports.requireNoSignature = requireNoSignature;
exports.requireUserLoggedOut = requireUserLoggedOut;
