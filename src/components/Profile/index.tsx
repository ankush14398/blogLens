import { gql, useQuery } from '@apollo/client'
import { GridItemEight, GridItemFour } from '@components/GridLayout'
import NFTShimmer from '@components/Shared/Shimmer/NFTShimmer'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
import SEO from '@components/utils/SEO'
import { LensterPost } from '@generated/lenstertypes'
import { PaginatedResultInfo } from '@generated/types'
import { CommentFields } from '@gql/CommentFields'
import { MirrorFields } from '@gql/MirrorFields'
import { PostFields } from '@gql/PostFields'
import consoleLog from '@lib/consoleLog'
import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { BLOGLENS } from 'src/constants'
import Custom404 from 'src/pages/404'
import Custom500 from 'src/pages/500'

import Details from './Details'
import FeedType from './FeedType'
import ProfilePageShimmer from './Shimmer'

const Feed = dynamic(() => import('./Feed'), {
  loading: () => <PostsShimmer />
})
const NFTFeed = dynamic(() => import('./NFTFeed'), {
  loading: () => <NFTShimmer />
})

export const PROFILE_QUERY = gql`
  query Profile($request: SingleProfileQueryRequest!) {
    profile(request: $request) {
      id
      handle
      ownedBy
      name
      attributes {
        key
        value
      }
      bio
      stats {
        totalFollowers
        totalFollowing
        totalPosts
        totalComments
        totalMirrors
      }
      picture {
        ... on MediaSet {
          original {
            url
          }
        }
        ... on NftImage {
          uri
        }
      }
      coverPicture {
        ... on MediaSet {
          original {
            url
          }
        }
      }
      followModule {
        __typename
      }
    }
  }
`
const PROFILE_FEED_QUERY = gql`
  query ProfileFeed($request: PublicationsQueryRequest!) {
    publications(request: $request) {
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
        totalCount
        next
      }
    }
  }
  ${PostFields}
  ${CommentFields}
  ${MirrorFields}
`

const ViewProfile: NextPage = () => {
  const {
    query: { username, type }
  } = useRouter()
  const [feedType, setFeedType] = useState<string>(
    type && ['post', 'comment', 'mirror', 'nft'].includes(type as string)
      ? type?.toString().toUpperCase()
      : 'POST'
  )
  const { data, loading, error } = useQuery(PROFILE_QUERY, {
    variables: { request: { handle: username } },
    skip: !username,
    onCompleted(data) {
      consoleLog(
        'Query',
        '#8b5cf6',
        `Fetched profile details Profile:${data?.profile?.id}`
      )
    }
  })

  const profile = data?.profile

  const [publications, setPublications] = useState<LensterPost[]>([])
  const [pageInfo, setPageInfo] = useState<PaginatedResultInfo>()
  const [blogNo, setBlogNo] = useState<number>()

  const {
    data: feedData,
    loading: feedLoading,
    error: feedError,
    fetchMore
  } = useQuery(PROFILE_FEED_QUERY, {
    variables: {
      request: {
        publicationTypes: feedType,
        profileId: profile?.id,
        limit: 10,
        sources: [BLOGLENS]
      }
    },
    skip: !profile?.id,
    fetchPolicy: 'no-cache',
    onCompleted(data) {
      setPageInfo(data?.publications?.pageInfo)
      setPublications(data?.publications?.items)
      consoleLog(
        'Query',
        '#8b5cf6',
        `Fetched first 10 profile publications Profile:${profile?.id}`
      )
    }
  })

  if (error) return <Custom500 />
  if (loading || !data) return <ProfilePageShimmer />
  if (!data?.profile) return <Custom404 />

  return (
    <>
      {profile?.name ? (
        <SEO title={`${profile?.name} (@${profile?.handle}) • Lenster`} />
      ) : (
        <SEO title={`@${profile?.handle} • Lenster`} />
      )}
      {/* <Cover cover={profile?.coverPicture?.original?.url} /> */}
      <div className="w-full max-w-[600px] mx-auto pt-6">
        <GridItemFour>
          <Details blogNo={blogNo} profile={profile} />
        </GridItemFour>
        <GridItemEight className="space-y-5">
          <FeedType
            stats={profile?.stats}
            setFeedType={setFeedType}
            feedType={feedType}
          />
          {(feedType === 'POST' ||
            feedType === 'COMMENT' ||
            feedType === 'MIRROR') && (
            <Feed
              pageInfo={pageInfo}
              publications={publications}
              setPageInfo={setPageInfo}
              setPublications={setPublications}
              data={feedData}
              error={feedError}
              fetchMore={fetchMore}
              loading={feedLoading}
              profile={profile}
              type={feedType}
            />
          )}
          {feedType === 'NFT' && <NFTFeed profile={profile} />}
        </GridItemEight>
      </div>
    </>
  )
}

export default ViewProfile
