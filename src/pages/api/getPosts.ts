import { PrismaClient } from '@prisma/client'
import { NextApiRequest, NextApiResponse } from 'next'

const prisma = new PrismaClient()

async function main(req: NextApiRequest, res: NextApiResponse) {
  // Connect the client
  await prisma.$connect()
  // ... you will write your Prisma Client queries here
  const { profileId } = req.query
  console.log(profileId)
  let posts
  if (typeof profileId === 'string') {
    posts = await prisma.posts.findMany({
      where: {
        profileId
      }
    })
  } else {
    posts = await prisma.posts.findMany()
    console.log(posts)
  }
  res.json(posts)
}

export default main
