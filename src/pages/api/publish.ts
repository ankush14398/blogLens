import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

async function main(req: NextApiRequest, res: NextApiResponse) {
  // Connect the client
  await prisma.$connect()
  // ... you will write your Prisma Client queries here
  const { postId, profileId } = req.body
  const posts = await prisma.posts.findMany({
    where: {
      postId
    }
  })
  if (posts.length === 0) {
    const result = await prisma.posts.create({
      data: {
        postId,
        profileId,
        timestamp: new Date(Date.now())
      }
    })
    res.json(result)
  }
  res.writeHead(500)
  res.end(
    JSON.stringify({
      status: 'fail',
      message: 'Upload error'
    })
  )
}

export default main
