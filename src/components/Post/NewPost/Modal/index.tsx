import { useRouter } from 'next/router'
import { FC } from 'react'

const NewPostModal: FC = () => {
  const router = useRouter()
  return (
    <>
      <button
        type="button"
        className="flex items-start"
        onClick={() => {
          router.push(`/newBlog`)
        }}
      >
        ✍️ &nbsp;<span className="hidden sm:block">Write</span>
      </button>
    </>
  )
}

export default NewPostModal
