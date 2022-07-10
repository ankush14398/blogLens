import formidable, { File } from 'formidable'
import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

/* Don't miss that! */
export const config = {
  api: {
    bodyParser: false
  }
}

type ProcessedFiles = Array<[string, File]>

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let status = 200,
    resultBody: {
      url?: string
      name?: string
      size?: number
      status?: string
      message?: string
    } = { status: 'ok', message: 'Files were uploaded successfully' }

  /* Get files using formidable */
  const files = await new Promise<ProcessedFiles | undefined>(
    (resolve, reject) => {
      const form = new formidable.IncomingForm()
      const files: ProcessedFiles = []
      form.on('file', function (field, file) {
        files.push([field, file])
      })
      form.on('end', () => resolve(files))
      form.on('error', (err) => reject(err))
      form.parse(req, () => {
        //
      })
    }
  ).catch((e) => {
    console.log(e)
    status = 500
    resultBody = {
      status: 'fail',
      message: 'Upload error'
    }
  })

  if (files?.length) {
    /* Create directory for uploads */
    const targetPath = path.join(process.cwd(), `/uploads/`)
    try {
      await fs.access(targetPath)
    } catch (e) {
      await fs.mkdir(targetPath)
    }

    /* Move uploaded files to directory */
    // for (const file of files) {
    const file = files[0]
    const tempPath = file[1].filepath
    await fs.rename(tempPath, targetPath + file[1].originalFilename)
    // }
    resultBody = {
      // ...resultBody,
      url: 'https://pbs.twimg.com/profile_images/1536724649253318661/cXSZaEym_400x400.jpg',
      name: file[1].originalFilename ?? undefined,
      size: file[1].size
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(resultBody))
}

export default handler
