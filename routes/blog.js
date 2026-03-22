const {Router}  = require("express");

const multer = require("multer");
const path = require("path");

const Blog = require('../models/blog');
const Comment = require('../models/comment');
const router = Router();


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('./public/uploads/'));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
})
const upload = multer({ storage: storage })

router.get('/add-new', (req, res) =>{
    res.render('addBlog',{
        user : req.user,
    });
});
router.post('/add-new', upload.single("coverImage"), async(req, res) =>{
    const {title, body} = req.body;
    const blog= await Blog.create({
        body, 
        title,
        createdBy: req.user._id,
        coverImageURL: `/uploads/${req.file.filename}`,
    });
    return res.redirect(`/blog/${blog._id}`);
});

router.get('/:id', async (req, res) => {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");
    return res.render("blog", {
        user: req.user,
        blog,
        comments,
    });
});

router.post('/comment/:blogId', async (req, res) => {
    await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
});

router.get('/edit/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog || blog.createdBy.toString() !== req.user._id.toString()) {
            return res.redirect("/");
        }
        return res.render("editBlog", { user: req.user, blog });
    } catch (error) {
        return res.redirect("/");
    }
});

router.post('/edit/:id', upload.single("coverImage"), async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog || blog.createdBy.toString() !== req.user._id.toString()) {
            return res.redirect("/");
        }

        const updateData = {
            title: req.body.title,
            body: req.body.body,
        };

        if (req.file) {
            updateData.coverImageURL = `/uploads/${req.file.filename}`;
        }

        await Blog.findByIdAndUpdate(req.params.id, updateData);
        return res.redirect(`/blog/${blog._id}`);
    } catch (error) {
        return res.redirect("/");
    }
});

router.post('/delete/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (blog && blog.createdBy.toString() === req.user._id.toString()) {
            await Blog.findByIdAndDelete(req.params.id);
            await Comment.deleteMany({ blogId: req.params.id }); 
        }
    } catch (error) {
        console.error("Deletion error:", error);
    }
    return res.redirect("/");
});

module.exports = router;