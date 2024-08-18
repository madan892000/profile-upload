const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for storing files locally
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Unsupported file format'));
  }
});

// New route to get the list of uploaded files
router.get('/files', (req, res) => {
  const directoryPath = path.join(__dirname, '../uploads');

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to scan files' });
    }

    // Only return image files
    const imageFiles = files.filter(file => /\.(jpeg|jpg|png)$/i.test(file));
    res.status(200).json({ files: imageFiles });
  });
});

// Route to handle file upload
router.post('/upload', upload.array('images', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded or invalid file format' });
  }

  const imageData = req.files.map(file => ({
    original_name: file.originalname,
    file_path: file.path,
    upload_date: new Date().toISOString(),
    user_id: req.body.user_id || null // Assuming user_id is passed in the request body
  }));

  // Read existing metadata from file
  fs.readFile('metadata.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error reading metadata file' });
    }

    let metadata = [];
    try {
      metadata = JSON.parse(data);
    } catch (parseError) {
      return res.status(500).json({ error: 'Error parsing metadata file' });
    }

    // Add new metadata
    metadata.push(...imageData);

    // Write updated metadata to file
    fs.writeFile('metadata.json', JSON.stringify(metadata, null, 2), (writeError) => {
      if (writeError) {
        return res.status(500).json({ error: 'Error writing to metadata file' });
      }
      res.status(200).json({ message: 'Files uploaded successfully', data: imageData });
    });
  });
});

// New route to handle file removal
router.delete('/remove/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, '../uploads', fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting file' });
    }

    // Update metadata file
    fs.readFile('metadata.json', 'utf8', (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Error reading metadata file' });
      }

      let metadata = [];
      try {
        metadata = JSON.parse(data);
      } catch (parseError) {
        return res.status(500).json({ error: 'Error parsing metadata file' });
      }

      // Remove deleted file's metadata
      metadata = metadata.filter(file => file.original_name !== fileName);

      // Write updated metadata to file
      fs.writeFile('metadata.json', JSON.stringify(metadata, null, 2), (writeError) => {
        if (writeError) {
          return res.status(500).json({ error: 'Error writing to metadata file' });
        }
        res.status(200).json({ message: 'File deleted successfully' });
      });
    });
  });
});

module.exports = router;
