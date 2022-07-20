import { Modal } from '@components/UI/Modal'
import { Profile } from '@generated/types'
import { UsersIcon } from '@heroicons/react/outline'
import humanize from '@lib/humanize'
import React, { FC, useState } from 'react'

import Followers from './Followers'
import Following from './Following'

interface Props {
  followersCount: number
  profile: Profile
  blogNo: number | undefined
}

const Followerings: FC<Props> = ({ followersCount, profile, blogNo }) => {
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false)
  const [showFollowersModal, setShowFollowersModal] = useState<boolean>(false)

  return (
    <div className="flex gap-4 sm:gap-8">
      <button
        type="button"
        className="text-center"
        onClick={() => setShowFollowingModal(!showFollowingModal)}
      >
        <div className="text-xl sm:text-3xl">{humanize(blogNo ?? 0)}</div>
        <div className="text-gray-500 sm:text-base text-sm">Blogs</div>
      </button>
      <button
        type="button"
        className="text-center"
        onClick={() => setShowFollowingModal(!showFollowingModal)}
      >
        <div className="text-xl sm:text-3xl">
          {humanize(profile?.stats?.totalFollowing)}
        </div>
        <div className="text-gray-500 sm:text-base text-sm">Following</div>
      </button>
      <button
        type="button"
        className="text-center"
        onClick={() => setShowFollowersModal(!showFollowersModal)}
      >
        <div className="text-xl sm:text-3xl">{humanize(followersCount)}</div>
        <div className="text-gray-500 sm:text-base text-sm">Followers</div>
      </button>
      <Modal
        title="Following"
        icon={<UsersIcon className="w-5 h-5 text-brand" />}
        show={showFollowingModal}
        onClose={() => setShowFollowingModal(!showFollowingModal)}
      >
        <Following profile={profile} />
      </Modal>
      <Modal
        title="Followers"
        icon={<UsersIcon className="w-5 h-5 text-brand" />}
        show={showFollowersModal}
        onClose={() => setShowFollowersModal(!showFollowersModal)}
      >
        <Followers profile={profile} />
      </Modal>
    </div>
  )
}

export default Followerings
