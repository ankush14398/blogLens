import { ApolloError } from '@apollo/client'
import SinglePost from '@components/Post/SinglePost'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
import { EmptyState } from '@components/UI/EmptyState'
import { ErrorMessage } from '@components/UI/ErrorMessage'
import { Spinner } from '@components/UI/Spinner'
import { LensterPost } from '@generated/lenstertypes'
import { PaginatedResultInfo, Profile } from '@generated/types'
import { CollectionIcon } from '@heroicons/react/outline'
import consoleLog from '@lib/consoleLog'
import React, { FC } from 'react'
import { useInView } from 'react-cool-inview'

interface Props {
  profile: Profile
  type: 'POST' | 'COMMENT' | 'MIRROR'
  data: any
  loading: boolean
  error: undefined | ApolloError
  fetchMore: Function
  publications: LensterPost[]
  setPublications: (arg: LensterPost[]) => void
  pageInfo: PaginatedResultInfo | undefined
  setPageInfo: (arg: PaginatedResultInfo | undefined) => void
}

const Feed: FC<Props> = ({
  profile,
  type,
  data,
  loading,
  error,
  fetchMore,
  publications,
  setPublications,
  pageInfo,
  setPageInfo
}) => {
  const { observe } = useInView({
    onEnter: () => {
      fetchMore({
        variables: {
          request: {
            publicationTypes: type,
            profileId: profile?.id,
            cursor: pageInfo?.next,
            limit: 10
          }
        }
      }).then(({ data }: any) => {
        setPageInfo(data?.publications?.pageInfo)
        setPublications([...publications, ...data?.publications?.items])
        consoleLog(
          'Query',
          '#8b5cf6',
          `Fetched next 10 profile publications Profile:${profile?.id} Next:${pageInfo?.next}`
        )
      })
    }
  })

  return (
    <>
      {loading && <PostsShimmer />}
      {data?.publications?.items?.length === 0 && (
        <EmptyState
          message={
            <div>
              <span className="mr-1 font-bold">@{profile?.handle}</span>
              <span>seems like not {type.toLowerCase()}ed yet!</span>
            </div>
          }
          icon={<CollectionIcon className="w-8 h-8 text-brand" />}
        />
      )}
      <ErrorMessage title="Failed to load profile feed" error={error} />
      {!error && !loading && data?.publications?.items?.length !== 0 && (
        <>
          <div className="gap-2 grid grid-cols-1 w-full">
            {publications?.map((post: LensterPost, index: number) => (
              <div
                key={`${post?.id}_${index}`}
                className="border-2 border-black rounded-lg  bg-white	"
              >
                <SinglePost post={post} />
              </div>
            ))}
          </div>
          {pageInfo?.next && publications.length !== pageInfo?.totalCount && (
            <span ref={observe} className="flex justify-center p-5">
              <Spinner size="sm" />
            </span>
          )}
        </>
      )}
    </>
  )
}

export default Feed
