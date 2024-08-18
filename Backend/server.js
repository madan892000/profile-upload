const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const uploadRoutes = require('./routes/upload');
const fs = require('fs');
const cors = require("cors")

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors())

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Use the upload routes
app.use('/api', uploadRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
