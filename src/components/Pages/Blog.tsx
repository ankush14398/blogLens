import { gql, useQuery } from '@apollo/client'
import Collect from '@components/Post/Actions/Collect'
import Mirror from '@components/Post/Actions/Mirror'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
import UserProfile from '@components/Shared/UserProfile'
import { Tooltip } from '@components/UI/Tooltip'
// @ts-ignore
import Checklist from '@editorjs/checklist'
// @ts-ignore
import Code from '@editorjs/code'
import Header from '@editorjs/header'
// @ts-ignore
import EditorjsImage from '@editorjs/image'
// @ts-ignore
import Link from '@editorjs/link'
// @ts-ignore
import List from '@editorjs/list'
// @ts-ignore
import Quote from '@editorjs/quote'
// @ts-ignore
import Table from '@editorjs/table'
import { LensterPost } from '@generated/lenstertypes'
import { PostFields } from '@gql/PostFields'
import { ChatAlt2Icon } from '@heroicons/react/outline'
import consoleLog from '@lib/consoleLog'
import getIPFSLink from '@lib/getIPFSLink'
import imagekitURL from '@lib/imagekitURL'
import dayjs from 'dayjs'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
const Feed = dynamic(() => import('@components/Comment/Feed'), {
  loading: () => <PostsShimmer />
})
const Editor = dynamic(() => import('@stfy/react-editor.js'), {
  ssr: false,
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
})
export const POST_QUERY = gql`
  query Post($request: PublicationQueryRequest!) {
    publication(request: $request) {
      ... on Post {
        ...PostFields
        onChainContentURI
        referenceModule {
          __typename
        }
      }
    }
  }
  ${PostFields}
`
export const shimmer = (w: any, h: any) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#333" offset="20%" />
        <stop stop-color="#222" offset="50%" />
        <stop stop-color="#333" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#333" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
  </svg>`

export const toBase64 = (str: any) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)
const Blog = () => {
  const [editorData, setEditorData] = useState<any>()
  const {
    query: { uri }
  } = useRouter()
  const [blogMetadata, setBlogMetadata] = useState<undefined | string>()
  const [blogTitle, setBlogTitle] = useState<undefined | string>()
  const [blogCover, setBlogCover] = useState<undefined | string>()
  const bottom = useRef<any>(null)

  const { data, loading, error } = useQuery(POST_QUERY, {
    variables: {
      request: { publicationId: uri }
    },
    skip: !uri,
    onCompleted() {
      consoleLog(
        'Query',
        '#8b5cf6',
        `Fetched publication details Publication:${uri}`
      )
    }
  })
  useEffect(() => {
    const item = data?.publication?.metadata?.attributes?.filter(
      (item: any) => item.traitType === 'postPath'
    )[0]?.value
    const title = data?.publication?.metadata?.attributes?.filter(
      (item: any) => item.traitType === 'title'
    )[0]?.value
    if (item) {
      console.log(item)
      setBlogMetadata(item)
      setBlogTitle(title)
      setBlogCover(
        imagekitURL(
          getIPFSLink(data?.publication?.metadata?.media[0]?.original?.url),
          'attachment'
        )
      )
    }
  }, [data])

  const fetchPost = useCallback(async () => {
    if (typeof blogMetadata === 'string') {
      fetch(`https://ipfs.io/ipfs/${blogMetadata}`)
        .then((res) => res.json())
        .then((res) => setEditorData(res))
    }
  }, [blogMetadata])
  useEffect(() => {
    fetchPost()
  }, [fetchPost])
  const post: LensterPost = data?.publication

  return (
    <div className={'w-full mx-auto max-w-[640px] p-5'}>
      <h1 className="text-4xl font-bold mb-4">
        {data?.publication?.metadata?.attributes[1]?.value}
      </h1>
      {blogCover && (
        <img
          className="object-contain max-h-[300px] mb-4 w-full bg-gray-300 rounded-lg border dark:bg-gray-800 dark:border-gray-700/80"
          loading="lazy"
          height={'300px'}
          width={'640px'}
          src={blogCover}
          alt={'cover'}
        />
      )}
      <div className="w-full flex justify-between">
        <div>
          <UserProfile profile={post?.profile} />
        </div>
        <div className="flex flex-col items-end">
          <div className="text-sm text-gray-500">
            {dayjs(new Date(post?.createdAt)).fromNow()}
          </div>

          <div className="flex w-fit">
            <button
              onClick={() => bottom?.current && bottom.current.scrollIntoView()}
              className={`p-1.5 flex w-fit text-blue-500 items-center justify-center hover:bg-blue-300  ${'rounded-full'}`}
            >
              <Tooltip placement="top" content="Comment" withDelay>
                <ChatAlt2Icon className="w-[18px]" />
              </Tooltip>
            </button>
            <Mirror post={post} />

            <Collect post={post} />
          </div>
        </div>
      </div>
      {editorData ? (
        <div className="content-style">
          <Editor
            holder="editorjs-container"
            data={editorData}
            readOnly={true}
            tools={{
              //  "header":Header,
              //  "quote":Quote,
              header: Header,
              quote: Quote,
              image: EditorjsImage,
              list: List,
              code: Code,
              link: Link,
              checklist: Checklist,
              table: Table
            }}
          />
          <div id="editorjs-container"></div>
        </div>
      ) : (
        <div className="content-style my-5">
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-4 w-full h-5 rounded-lg shimmer" />
          <div className="mb-0.5 w-full h-48 rounded-lg shimmer" />
          <div className="mb-4 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-1 w-full h-5 rounded-lg shimmer" />
          <div className="mb-4 w-full h-5 rounded-lg shimmer" />
        </div>
      )}
      <div ref={bottom} />
      <Feed
        post={post}
        onlyFollowers={
          post?.referenceModule?.__typename ===
          'FollowOnlyReferenceModuleSettings'
        }
        // isFollowing={data?.doesFollow&&data?.doesFollow[0]?.follows}
      />
    </div>
  )
}

export default Blog
