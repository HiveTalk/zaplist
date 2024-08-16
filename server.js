const express = require('express');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const axios = require('axios');
const app = express();

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));

// Function to convert image to PNG format
const convertToPNG = async (buffer) => {
    return await sharp(buffer)
        .png()
        .toBuffer();
};

// Function to download image
const downloadImage = async (url) => {
    const response = await axios({
        url,
        responseType: 'arraybuffer'
    });
    return Buffer.from(response.data, 'binary');
};

app.post('/save-image', async (req, res) => {
    const { filePath, imageUrl, pubkey } = req.body;
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    try {
        const imageBuffer = await downloadImage(imageUrl);
        const pngBuffer = await convertToPNG(imageBuffer);
        const pngFilePath = filePath.replace(/\.[^/.]+$/, ".png");

        fs.writeFile(pngFilePath, pngBuffer, (err) => {
            if (err) {
                console.error(`Failed to save image for ${pubkey}:`, err);
                return res.status(500).send('Failed to save image');
            }

            res.send('Image saved successfully as PNG');
        });
    } catch (error) {
        console.error(`Failed to process image for ${pubkey}:`, error);
        res.status(500).send('Failed to process and save image');
    }
});

app.use('/imgstash', express.static(path.join(__dirname, 'imgstash')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});