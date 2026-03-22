require("dotenv").config();
const path = require("path"); 
const { checkForAuthenticationCookies } = require("./middlewares/authentication");
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const Blog = require('./models/blog')

const userRouts = require('./routes/user');
const blogRouts = require('./routes/blog');

const app = express();
const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI).then(e => console.log("MongoDB connected"));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(checkForAuthenticationCookies("token"));
app.use(express.static(path.resolve("./public")))

app.get("/", async (req, res) =>{
    const allBlogs = await Blog.find({});
    res.render("home",{
        user: req.user,
        blogs: allBlogs,
    });
    
});

app.use("/user", userRouts);
app.use("/blog", blogRouts);

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));