import { gql, useQuery } from '@apollo/client'
import SinglePost from '@components/Post/SinglePost'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
import { Button } from '@components/UI/Button'
import { EmptyState } from '@components/UI/EmptyState'
import { ErrorMessage } from '@components/UI/ErrorMessage'
import { Spinner } from '@components/UI/Spinner'
import AppContext from '@components/utils/AppContext'
import { LensterPost } from '@generated/lenstertypes'
import { PaginatedResultInfo } from '@generated/types'
import { CommentFields } from '@gql/CommentFields'
import { MirrorFields } from '@gql/MirrorFields'
import { PostFields } from '@gql/PostFields'
import { CollectionIcon } from '@heroicons/react/outline'
import consoleLog from '@lib/consoleLog'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { FC, useContext, useEffect, useState } from 'react'
import { useInView } from 'react-cool-inview'
import { BLOGLENS } from 'src/constants'
const NewBlog = dynamic(() => import('@components/Blog/NewBlog'), {
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />,
  ssr: false
})
const HOME_FEED_QUERY = gql`
  query HomeFeed($request: TimelineRequest!) {
    timeline(request: $request) {
      items {
        ... on Post {
          ...PostFields
        }
        ... on Comment {
          ...CommentFields
        }
        ... on Mirror {
          ...MirrorFields
        }
      }
      pageInfo {
        next
        totalCount
      }
    }
  }
  ${PostFields}
  ${MirrorFields}
  ${CommentFields}
`
const HOME_BLOG_FEED_QUERY = gql`
  query Publications($request: PublicationsQueryRequest!) {
    items {
      ... on Post {
        ...PostFields
      }
      ... on Comment {
        ...CommentFields
      }
      ... on Mirror {
        ...MirrorFields
      }
    }
    pageInfo {
      next
      totalCount
    }
  }
  ${PostFields}
  ${MirrorFields}
  ${CommentFields}
`

const Feed: FC = () => {
  const { currentUser } = useContext(AppContext)
  const [publications, setPublications] = useState<LensterPost[]>([])
  const [pageInfo, setPageInfo] = useState<PaginatedResultInfo>()
  const [postContent, setPostContent] = useState<string>('')
  const [postContentError, setPostContentError] = useState<string>('')
  const { data, loading, error, fetchMore } = useQuery(HOME_FEED_QUERY, {
    variables: {
      request: { profileId: currentUser?.id, limit: 10, sources: [BLOGLENS] }
    },
    fetchPolicy: 'no-cache',
    onCompleted(data) {
      setPageInfo(data?.timeline?.pageInfo)
      setPublications(data?.timeline?.items)
      consoleLog('Query', '#8b5cf6', `Fetched first 10 timeline publications`)
    }
  })
  const router = useRouter()

  const [blogs, setBlogs] = useState([])

  useEffect(() => {
    if (currentUser?.id)
      fetch(`http://localhost:4783/api/posts?profileId=${currentUser?.id}`, {
        method: 'GET'
      })
        .then((res) => res.json())
        .then((res) => {
          setBlogs(res)
          console.log(res)
        })
  }, [currentUser])

  const { observe } = useInView({
    onEnter: () => {
      fetchMore({
        variables: {
          request: {
            profileId: currentUser?.id,
            cursor: pageInfo?.next,
            limit: 10
          }
        }
      }).then(({ data }: any) => {
        setPageInfo(data?.timeline?.pageInfo)
        setPublications([...publications, ...data?.timeline?.items])
        consoleLog(
          'Query',
          '#8b5cf6',
          `Fetched next 10 timeline publications Next:${pageInfo?.next}`
        )
      })
    }
  })

  return (
    <>
      {/* {currentUser && <NewPost />} */}
      {currentUser && (
        <div className="p-3 border-2 flex items-center border-black rounded-lg">
          <div className="w-full flex-grow">
            <input
              value={postContent}
              className={'w-full font-bold text-3xl'}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's your story about!"
            />
          </div>
          <Button
            onClick={() => {
              router.push(`newBlog?title=${postContent}`)
            }}
            className="ml-2 min-w-[150px]"
          >
            Write
          </Button>
        </div>
      )}

      {loading && <PostsShimmer />}
      {data?.timeline?.items?.length === 0 && (
        <EmptyState
          message={<div>No posts yet!</div>}
          icon={<CollectionIcon className="w-8 h-8 text-brand" />}
        />
      )}
      <ErrorMessage title="Failed to load home feed" error={error} />
      {!error && !loading && data?.timeline?.items?.length !== 0 && (
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
