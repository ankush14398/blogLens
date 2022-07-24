import { Tooltip } from '@components/UI/Tooltip'
import { LensterPost } from '@generated/lenstertypes'
import { ChatAlt2Icon } from '@heroicons/react/outline'
import humanize from '@lib/humanize'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FC } from 'react'

interface Props {
  post: LensterPost
  block?: boolean
}

const Comment: FC<Props> = ({ post, block = false }) => {
  return (
    <motion.button
      className={block ? 'w-full' : ''}
      whileTap={{ scale: 0.9 }}
      aria-label="Comment"
    >
      <Link href={`/posts/${post?.id ?? post?.pubId}`} prefetch={false}>
        <a
          href={`/posts/${post?.id ?? post?.pubId}`}
          className={`flex items-center space-x-1 ${
            block ? 'text-white w-full' : ' text-blue-500'
          }  `}
        >
          <div
            className={`p-1.5 flex items-center justify-center hover:bg-blue-300  ${
              block ? 'w-full bg-blue-500 rounded-lg' : 'rounded-full'
            }`}
          >
            <Tooltip placement="top" content="Comment" withDelay>
              <ChatAlt2Icon className="w-[18px]" />
            </Tooltip>
            {block && (
              <>
                &nbsp;
                <span className="text-sm">Comment</span>
              </>
            )}
          </div>
          {post?.stats?.totalAmountOfComments > 0 && (
            <div className="text-xs">
              {humanize(post?.stats?.totalAmountOfComments)}
            </div>
          )}
        </a>
      </Link>
    </motion.button>
  )
}

export default Comment
