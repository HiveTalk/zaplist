import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function convertToPng(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .png()
      .toFile(outputPath)
    return true
  } catch (error) {
    console.error('Error converting image to PNG:', error)
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const form = new IncomingForm()
  form.uploadDir = path.join(process.cwd(), 'public', 'avatars')
  form.keepExtensions = true

  if (!fs.existsSync(form.uploadDir)) {
    fs.mkdirSync(form.uploadDir, { recursive: true })
  }

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err)
      return res.status(500).json({ error: 'Error parsing form' })
    }

    const file = files.file[0]
    const newPath = path.join(form.uploadDir, `${path.parse(file.originalFilename).name}.png`)

    try {
      const conversionSuccess = await convertToPng(file.filepath, newPath)
      if (!conversionSuccess) {
        throw new Error('Failed to convert image to PNG')
      }
      await fs.promises.unlink(file.filepath) // Remove the original file
      const relativePath = path.relative(process.cwd(), newPath).replace(/\\/g, '/')
      res.status(200).json({ url: `/${relativePath}` })
    } catch (error) {
      console.error('Error processing file:', error)
      res.status(500).json({ error: 'Error processing file' })
    }
  })
}