const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()

// Serve the index.html file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
  })

app.use(express.static(path.join(__dirname, 'public')))

app.use(express.json({ limit: '50mb' })) // Increase the limit if necessary

app.post('/save-image', (req, res) => {
  const { filePath, buffer, pubkey } = req.body
  const dir = path.dirname(filePath)

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFile(filePath, Buffer.from(buffer), (err) => {
    if (err) {
      console.error(`Failed to save image for ${pubkey}:`, err)
      return res.status(500).send('Failed to save image')
    }

    res.send('Image saved successfully')
  })
})

app.use('/imgstash', express.static(path.join(__dirname, 'imgstash')))


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

