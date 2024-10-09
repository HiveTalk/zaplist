const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve files from the 'src' directory and its subdirectories under the '/scripts' path
app.use('/scripts', express.static(path.join(__dirname, 'src')));

// Middleware to parse JSON bodies with an appropriate limit
app.use(express.json({ limit: '50mb' }));

// Serve the index.html file in response to the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Convert image to PNG format
const convertToPNG = async (buffer) => {
  try {
    return await sharp(buffer).png().toBuffer();
  } catch (error) {
    console.error('Error converting image to PNG:', error);
    throw error;
  }
};

// Endpoint to save an image
app.post('/save-image', async (req, res) => {
  const { filePath, buffer, pubkey } = req.body;

  // Prevent path traversal by normalizing and ensuring path is within intended directory
  const safeFilePath = path.join(__dirname, 'imgstash', path.basename(filePath)) 

  const dir = path.dirname(safeFilePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    const pngBuffer = await convertToPNG(Buffer.from(buffer, 'base64'));
    const pngFilePath = safeFilePath.replace(/\.[^/.]+$/, ".png");

    fs.writeFile(pngFilePath, pngBuffer, (err) => {
      if (err) {
        console.error(`Failed to save image for ${pubkey}:`, err);
        return res.status(500).send('Failed to save image');
      }
      res.send('Image saved successfully as PNG');
    });
  } catch (error) {
    console.error(`Failed to convert and save image for ${pubkey}:`, error);
    res.status(500).send('Failed to convert and save image');
  }
});

// Serve images from the 'imgstash' directory
app.use('/imgstash', express.static(path.join(__dirname, 'imgstash')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});