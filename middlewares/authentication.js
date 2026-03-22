const { validateToken } = require("../services/authentication");
function checkForAuthenticationCookies(cookiename){
    return (req, res, next)=> {
        const tokenCookieVlaue = req.cookies[cookiename];
        if(!tokenCookieVlaue){
            return next();
        }
        try{
            const userPayload = validateToken(tokenCookieVlaue);
            req.user = userPayload;
        }catch(error){}
        return next();

    };
}
module.exports = {
    checkForAuthenticationCookies,

};