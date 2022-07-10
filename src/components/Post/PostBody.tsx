import Attachments from '@components/Shared/Attachments'
import IFramely from '@components/Shared/IFramely'
import Markup from '@components/Shared/Markup'
import CrowdfundShimmer from '@components/Shared/Shimmer/CrowdfundShimmer'
import { LensterPost } from '@generated/lenstertypes'
import getURLs from '@lib/getURLs'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { FC } from 'react'

const Crowdfund = dynamic(() => import('./Crowdfund'), {
  loading: () => <CrowdfundShimmer />
})

interface Props {
  post: LensterPost
}

const PostBody: FC<Props> = ({ post }) => {
  const { pathname } = useRouter()
  const postType = post?.metadata?.attributes[0]?.value

  console.log(post)
  return (
    <Link
      href={
        post?.__typename === 'Post'
          ? `/blog/${post?.id ?? post?.pubId}`
          : post?.__typename === 'Mirror'
          ? `/blog/${post?.mirrorOf?.id}`
          : `/blog/${post?.id ?? post?.pubId}`
      }
      prefetch={false}
    >
      <a href={`/blog/${post?.id ?? post?.pubId}`} className="">
        <div className="break-words">
          {post?.metadata?.media?.length > 0 ? (
            <Attachments attachments={post?.metadata?.media} />
          ) : (
            post?.metadata?.content &&
            postType !== 'crowdfund' &&
            postType !== 'community' &&
            getURLs(post?.metadata?.content)?.length > 0 && (
              <IFramely url={getURLs(post?.metadata?.content)[0]} />
            )
          )}
          {
            <>
              <div
                className={clsx({
                  'line-clamp-5 bg-clip-text bg-gradient-to-b from-black dark:from-white to-gray-400 dark:to-gray-900':
                    pathname !== '/posts/[id]'
                })}
              >
                <div className="leading-md font-bold text-3xl py-2 whitespace-pre-wrap break-words linkify ">
                  <Markup>
                    {post?.metadata?.attributes[1]?.value
                      ? post?.metadata?.attributes[1]?.value
                      : post?.metadata?.content}
                  </Markup>
                </div>
              </div>
            </>
          }
        </div>
      </a>
    </Link>
  )
}

export default PostBody
