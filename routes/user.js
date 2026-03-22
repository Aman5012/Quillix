const {Router}  = require("express");
const { randomBytes } = require("crypto");
const User = require('../models/user')
const router = Router();

router.get("/signin", (req, res) =>{
    return res.render("signin");
});
router.get("/signup", (req, res) =>{
    return res.render("signup");
});

router.post("/signin", async(req, res) =>{
    const {email, password} = req.body;
    try {  
        const token = await User.matchPasswordAndGenerateToken(email, password);
        return res.cookie("token", token).redirect("/");
    } catch (error) {
        return res.render("signin", {
            error: "Incorrect Email or Password", 
        })
    }
    // console.log("Token", token);
});

router.get("/logout", (req, res) =>{
    res.clearCookie("token").redirect("/");
});


router.post("/signup", async(req, res) =>{
    const {fullName, email, password} = req.body;
    await User.create({
        fullName, email, password
    });
    return res.redirect("/");
});

router.get("/forgot-password", (req, res) => {
    return res.render("forgotPassword");
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
        return res.render("forgotPassword", { error: "No user found with that email address" });
    }

    // Generate token and set expiration (15 mins)
    const resetToken = randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // In a real prod environment, you would use Nodemailer here.
    // We actively log and pass the generated link for local development tracking.
    const resetUrl = `http://localhost:${process.env.PORT || 8000}/user/reset-password/${resetToken}`;
    console.log(`\n\n[LOCAL DEV] Password Reset Link Created:\n-> ${resetUrl}\n\n`);

    return res.render("forgotPassword", { message: "Recovery link successfully generated. Check your console tracking/database." });
});

router.get("/reset-password/:token", async (req, res) => {
    const token = req.params.token;
    const user = await User.findOne({ 
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
        return res.render("forgotPassword", { error: "Reset token is invalid or has expired." });
    }
    
    return res.render("resetPassword", { token });
});

router.post("/reset-password/:token", async (req, res) => {
    const { password } = req.body;
    const token = req.params.token;

    const user = await User.findOne({ 
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() } 
    });

    if (!user) {
        return res.render("forgotPassword", { error: "Reset token is invalid or has expired." });
    }

    // Assigning the new password triggers the "pre('save')" hook natively
    user.password = password; 
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return res.redirect("/user/signin");
});


module.exports  = router;