import { gql, useQuery } from '@apollo/client'
import { GridItemEight, GridItemFour, GridLayout } from '@components/GridLayout'
import Hero from '@components/Home/Hero'
import Footer from '@components/Shared/Footer'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
import AppContext from '@components/utils/AppContext'
import SEO from '@components/utils/SEO'
import { CommentFields } from '@gql/CommentFields'
import { MirrorFields } from '@gql/MirrorFields'
import { PostFields } from '@gql/PostFields'
import Cookies from 'js-cookie'
import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import React, { useContext, useEffect } from 'react'
import { BLOGLENS } from 'src/constants'

const HomeFeed = dynamic(() => import('@components/Home/Feed'), {
  loading: () => <PostsShimmer />
})
const ExploreFeed = dynamic(() => import('@components/Explore/Feed'), {
  loading: () => <PostsShimmer />
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
const Home: NextPage = () => {
  const { currentUser } = useContext(AppContext)
  const { data, loading, error, fetchMore } = useQuery(HOME_FEED_QUERY, {
    variables: {
      request: { profileId: currentUser?.id, limit: 10, sources: [BLOGLENS] }
    },
    fetchPolicy: 'no-cache',
    onCompleted(data) {
      // setPageInfo(data?.timeline?.pageInfo)
      // setPublications(data?.timeline?.items)
      // consoleLog('Query', '#8b5cf6', `Fetched first 10 timeline publications`)
    }
  })
  useEffect(() => {
    if (error?.message === 'User not authenticated') {
      console.log(error?.message)
      localStorage.removeItem('selectedProfile')
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
    }
  }, [error])

  return (
    <>
      <SEO />
      {!currentUser && <Hero />}
      <GridLayout>
        <GridItemEight className="space-y-5">
          {data ? <HomeFeed /> : <ExploreFeed />}
        </GridItemEight>
        <GridItemFour>
          {/* <Announcement /> */}
          <Footer />
        </GridItemFour>
      </GridLayout>
    </>
  )
}

export default Home
