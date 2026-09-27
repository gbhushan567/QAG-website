const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

const saltRounds = 10;
const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, saltRounds);

async function initializeDatabase() {
    const newUser = new User({
        username: 'admin',
        password: hashedPassword,
        role: 'admin'
    });
    await newUser.save(); // Save the new user to the database
}

// Call the function to initialize the database
initializeDatabase().catch(err => console.error('Error initializing database:', err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'your_secret_key', resave: false, saveUninitialized: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qag_info_solutions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User Schema and Model
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    role: String,
});

const User = mongoose.model('User', userSchema);

// Blog Schema and Model
const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    image: String,
    video: String,
    link: String,
});

const Blog = mongoose.model('Blog', blogSchema);

// Admin Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid username or password');
    }

    req.session.user = user; // Set user session
    res.status(200).send('Login successful');
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.status(200).send('Logout successful');
});

// Fetch all blogs
app.get('/api/blog', async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).send('Error fetching blogs');
    }
});

// Create a new blog post
app.post('/api/blog', async (req, res) => {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.status(201).send(newBlog);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
