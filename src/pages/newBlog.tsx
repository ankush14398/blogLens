import dynamic from 'next/dynamic'

const NewBlog = dynamic(() => import('@components/Pages/NewBlog'), {
  ssr: false
})

export default NewBlog
