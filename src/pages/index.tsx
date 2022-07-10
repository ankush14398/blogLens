import { GridItemEight, GridItemFour, GridLayout } from '@components/GridLayout'
import Hero from '@components/Home/Hero'
import Footer from '@components/Shared/Footer'
import PostsShimmer from '@components/Shared/Shimmer/PostsShimmer'
import AppContext from '@components/utils/AppContext'
import SEO from '@components/utils/SEO'
import { NextPage } from 'next'
import dynamic from 'next/dynamic'
import React, { useContext } from 'react'

const HomeFeed = dynamic(() => import('@components/Home/Feed'), {
  loading: () => <PostsShimmer />
})
const ExploreFeed = dynamic(() => import('@components/Explore/Feed'), {
  loading: () => <PostsShimmer />
})

const Home: NextPage = () => {
  const { currentUser } = useContext(AppContext)

  return (
    <>
      <SEO />
      {!currentUser && <Hero />}
      <GridLayout>
        <GridItemEight className="space-y-5">
          {currentUser ? <HomeFeed /> : <ExploreFeed />}
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
