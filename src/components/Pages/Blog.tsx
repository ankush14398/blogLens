import { gql, useQuery } from '@apollo/client'
import Collect from '@components/Post/Actions/Collect'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
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
import consoleLog from '@lib/consoleLog'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState } from 'react'
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
const Blog = () => {
  const [editorData, setEditorData] = useState<any>()
  const {
    query: { uri }
  } = useRouter()
  const [blogMetadata, setBlogMetadata] = useState<undefined | string>()
  const [blogTitle, setBlogTitle] = useState<undefined | string>()
  const [blogCover, setBlogCover] = useState<undefined | string>()

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
      setBlogCover(data?.publication?.metadata?.media[0]?.original?.url)
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
          className="object-contain max-h-[300px] mb-4 w-full bg-gray-100 rounded-lg border dark:bg-gray-800 dark:border-gray-700/80"
          loading="lazy"
          src={blogCover}
          alt={'cover'}
        />
      )}
      <Collect post={post} block />
      {editorData && (
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
      )}
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
