import Loader from '@components/Shared/Loader'
import { Modal } from '@components/UI/Modal'
import { Tooltip } from '@components/UI/Tooltip'
import GetModuleIcon from '@components/utils/GetModuleIcon'
import { LensterPost } from '@generated/lenstertypes'
import { CollectionIcon } from '@heroicons/react/outline'
import { getModule } from '@lib/getModule'
import humanize from '@lib/humanize'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { FC, useEffect, useState } from 'react'

const CollectModule = dynamic(() => import('./CollectModule'), {
  loading: () => <Loader message="Loading collect" />
})

interface Props {
  post: LensterPost
  block?: boolean
}

const Collect: FC<Props> = ({ post, block = false }) => {
  const [count, setCount] = useState<number>(0)
  const [showCollectModal, setShowCollectModal] = useState<boolean>(false)
  const isFreeCollect =
    post?.collectModule?.__typename === 'FreeCollectModuleSettings'

  useEffect(() => {
    if (post?.stats?.totalAmountOfCollects) {
      setCount(post?.stats?.totalAmountOfCollects)
    }
  }, [post?.stats?.totalAmountOfCollects])

  return (
    <motion.button
      className={block ? 'w-full' : ''}
      whileTap={{ scale: 0.9 }}
      onClick={() => setShowCollectModal(true)}
      aria-label="Collect"
    >
      <div
        className={`flex items-center space-x-1 ${
          block ? 'text-white w-full' : ' text-brand-500'
        }  hover:brand-brand-400`}
      >
        <div
          className={`p-1.5 flex items-center justify-center hover:bg-brand-300 hover:bg-opacity-20 ${
            block ? 'w-full bg-brand-500 rounded-lg' : 'rounded-full'
          }`}
        >
          <Tooltip placement="top" content="Collect" withDelay>
            <CollectionIcon className="w-[18px]" />
          </Tooltip>
          {block && (
            <>
              &nbsp;
              <span className="text-sm">Collect</span>
            </>
          )}
        </div>
        {!block && count > 0 && (
          <div className="text-xs">{humanize(count)}</div>
        )}
      </div>
      <Modal
        title={
          isFreeCollect
            ? 'Free Collect'
            : getModule(post?.collectModule?.type).name
        }
        icon={
          <div className="text-brand">
            <GetModuleIcon
              module={
                isFreeCollect ? 'FreeCollectModule' : post?.collectModule?.type
              }
              size={5}
            />
          </div>
        }
        show={showCollectModal}
        onClose={() => setShowCollectModal(!showCollectModal)}
      >
        <CollectModule post={post} count={count} setCount={setCount} />
      </Modal>
    </motion.button>
  )
}

export default Collect
