import { IncomingForm } from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
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
    const newPath = path.join(form.uploadDir, file.originalFilename)

    try {
      await fs.promises.rename(file.filepath, newPath)
      const relativePath = path.relative(process.cwd(), newPath).replace(/\\/g, '/')
      res.status(200).send(`/${relativePath}`)
    } catch (error) {
      console.error('Error moving file:', error)
      res.status(500).json({ error: 'Error moving file' })
    }
  })
}