import FormData from 'form-data'
import formidable, { File } from 'formidable'
import fs from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'

export const config = {
  api: {
    bodyParser: false
  }
}

type ProcessedFiles = Array<[string, File]>

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  let status = 200,
    resultBody: {
      file?: { url?: string; name?: string; size?: number }
      status?: string
      success?: string
      message?: string
    } = {
      status: 'ok',
      success: '1',
      message: 'Files were uploaded successfully'
    }

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
    /* Add files to FormData */
    const formData = new FormData()
    // for (const file of files) {
    const file = files[0]
    formData.append(file[0], fs.createReadStream(file[1].filepath))
    // }

    /* Send request to another server */
    const upload = await fetch('https://ipfs.infura.io:5001/api/v0/add', {
      method: 'POST',
      body: formData
    })
    const { Hash }: { Hash: string } = await upload.json()

    resultBody = {
      // ...resultBody,
      success: '1',
      file: {
        url: `https://ipfs.io/ipfs/${Hash}`,
        name: file[1].originalFilename ?? undefined,
        size: file[1].size
      }
    }
    //   attachments.push({
    //     item: `https://ipfs.infura.io/ipfs/${Hash}`,
    //     type: file.type
    //   })
    // Do anything you need with response
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(resultBody))
}

export default handler
