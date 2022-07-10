import dynamic from 'next/dynamic'
const Blog = dynamic(() => import('@components/Pages/Blog'), {
  ssr: false,
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
})

export default Blog
