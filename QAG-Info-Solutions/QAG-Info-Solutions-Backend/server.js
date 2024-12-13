const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Optional: for sending emails
const twilio = require('twilio'); // Import Twilio
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/qag_info_solutions', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Function to fetch and display blog posts
async function fetchBlogs() {
    const response = await fetch('http://localhost:5000/api/blog');
    const blogs = await response.json();
    const blogPostsContainer = document.getElementById('blogPosts');
    blogPostsContainer.innerHTML = ''; // Clear existing posts

    blogs.forEach(blog => {
        const blogPost = document.createElement('div');
        blogPost.innerHTML = `
            <a href="/blog/${blog._id}" style="text-decoration: none; color: inherit;">
                <h3>${blog.title}</h3>
                <p>${blog.content}</p>
                ${blog.image ? `<img src="${blog.image}" alt="Blog Image" />` : ''}
                ${blog.video ? `<iframe src="${blog.video.replace('watch?v=', 'embed/')}" frameborder="0" allowfullscreen></iframe>` : ''}
                ${blog.link ? `<a href="${blog.link}" target="_blank">Read more</a>` : ''}
            </a>
            <div class="edit-delete-buttons">
                ${isAdmin ? `
                    <button onclick="editBlog('${blog._id}', '${blog.title}', '${blog.content}', '${blog.image}', '${blog.video}', '${blog.link}')">Edit</button>
                    <button onclick="deleteBlog('${blog._id}')">Delete</button>
                ` : ''}
            </div>
            <hr>
        `;
        blogPostsContainer.appendChild(blogPost);
    });
}

// Define a Schema and Model
const blogSchema = new mongoose.Schema({
    title: String,
    content: String,
    image: String,
    video: String,
    link: String,
});

const Blog = mongoose.model('Blog', blogSchema);

// Define a Schema and Model for Queries
const querySchema = new mongoose.Schema({
    name: String,
    contact: String,
    email: String,
    query: String,
});

const Query = mongoose.model('Query', querySchema);

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Twilio Account SID
const authToken = process.env.TWILIO_AUTH_TOKEN; // Your Twilio Auth Token
const client = twilio(accountSid, authToken); // Create a Twilio client

// API Endpoints
app.post('/api/blog', async (req, res) => {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.status(201).send(newBlog);
});

app.get('/api/blog', async (req, res) => {
    const blogs = await Blog.find();
    res.status(200).send(blogs);
});

// Update a blog post
app.put('/api/blog/:id', async (req, res) => {
    const { id } = req.params;
    const updatedBlog = await Blog.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).send(updatedBlog);
});

// Delete a blog post
app.delete('/api/blog/:id', async (req, res) => {
    const { id } = req.params;
    await Blog.findByIdAndDelete(id);
    res.status(204).send(); // No content
});

// Endpoint to handle query submissions
app.post('/api/submit-query', async (req, res) => {
    const { name, contact, email, query } = req.body;

    // Create a new Query document
    const newQuery = new Query({
        name,
        contact,
        email,
        query,
    });

    try {
        // Save the query to the database
        await newQuery.save();
        console.log('Query saved:', newQuery);
        res.status(201).send('Query submitted successfully!');
    } catch (error) {
        console.error('Error saving query:', error);
        res.status(500).send('Error saving query');
    }
});

// Endpoint to get a single blog post by ID
app.get('/api/blog/:id', async (req, res) => {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
        return res.status(404).send('Blog post not found');
    }
    res.status(200).send(blog);
});

// Serve the blog post HTML file
app.get('/blog/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog-post.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
