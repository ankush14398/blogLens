import { LensHubProxy } from '@abis/LensHubProxy'
import { gql, useMutation } from '@apollo/client'
import Markup from '@components/Shared/Markup'
import PubIndexStatus from '@components/Shared/PubIndexStatus'
import SwitchNetwork from '@components/Shared/SwitchNetwork'
import { Button } from '@components/UI/Button'
import { ErrorMessage } from '@components/UI/ErrorMessage'
import { MentionTextArea } from '@components/UI/MentionTextArea'
import { Spinner } from '@components/UI/Spinner'
import AppContext from '@components/utils/AppContext'
// @ts-ignore
import Checklist from '@editorjs/checklist'
// @ts-ignore
import Code from '@editorjs/code'
import Header from '@editorjs/header'
// @ts-ignore
import Link from '@editorjs/link'
// @ts-ignore
import List from '@editorjs/list'
// @ts-ignore
import Quote from '@editorjs/quote'
// @ts-ignore
import Table from '@editorjs/table'
import { LensterAttachment } from '@generated/lenstertypes'
import { CreatePostBroadcastItemResult, EnabledModule } from '@generated/types'
import { IGif } from '@giphy/js-types'
import { BROADCAST_MUTATION } from '@gql/BroadcastMutation'
import { PencilAltIcon, PhotographIcon } from '@heroicons/react/outline'
import consoleLog from '@lib/consoleLog'
// import EditorJS from '@editorjs/editorjs';
import {
  defaultFeeData,
  defaultModuleData,
  FEE_DATA_TYPE,
  getModule
} from '@lib/getModule'
import omit from '@lib/omit'
import splitSignature from '@lib/splitSignature'
import trackEvent from '@lib/trackEvent'
import trimify from '@lib/trimify'
import uploadAssetsToIPFS from '@lib/uploadAssetsToIPFS'
import uploadToIPFS from '@lib/uploadToIPFS'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { Dispatch, FC, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BLOGLENS,
  CHAIN_ID,
  CONNECT_WALLET,
  ERROR_MESSAGE,
  LENSHUB_PROXY,
  RELAY_ON,
  WRONG_NETWORK
} from 'src/constants'
import { v4 as uuidv4 } from 'uuid'
import {
  useAccount,
  useContractWrite,
  useNetwork,
  useSignTypedData
} from 'wagmi'

const Editor = dynamic(() => import('@stfy/react-editor.js'), {
  ssr: false,
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
})
const Attachment = dynamic(() => import('@components/Shared/Attachment'), {
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
})
const Giphy = dynamic(() => import('@components/Shared/Giphy'), {
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
})
const SelectCollectModule = dynamic(
  () => import('@components/Shared/SelectCollectModule'),
  {
    loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
  }
)
const SelectReferenceModule = dynamic(
  () => import('@components/Shared/SelectReferenceModule'),
  {
    loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
  }
)
const Preview = dynamic(() => import('@components/Shared/Preview'), {
  loading: () => <div className="mb-1 w-5 h-5 rounded-lg shimmer" />
})

export const CREATE_POST_TYPED_DATA_MUTATION = gql`
  mutation CreatePostTypedData($request: CreatePublicPostRequest!) {
    createPostTypedData(request: $request) {
      id
      expiresAt
      typedData {
        types {
          PostWithSig {
            name
            type
          }
        }
        domain {
          name
          chainId
          version
          verifyingContract
        }
        value {
          nonce
          deadline
          profileId
          contentURI
          collectModule
          collectModuleInitData
          referenceModule
          referenceModuleInitData
        }
      }
    }
  }
`

interface Props {
  setShowModal?: Dispatch<boolean>
  hideCard?: boolean
  lastestPublications?: string
}

const NewBlog: FC<Props> = ({
  setShowModal,
  lastestPublications,
  hideCard = false
}) => {
  // const Editor = new EditorJS({
  //     // Other configuration properties

  //     /**
  //      * onReady callback
  //      */
  //     onReady: () => {console.log('Editor.js is ready to work!')},

  //     /**
  //      * onChange callback
  //      */
  //     onChange: (api, event) => {
  //       console.log('Now I know that Editor\'s content changed!', event)
  //     }
  //  });

  const [editorData, setEditorData] = useState<any>()
  const drop = useRef<any>(null)
  const fileInput = useRef<any>(null)

  useEffect(() => {
    if (!drop?.current) return
    drop.current.addEventListener('dragover', handleDragOver)
    drop.current.addEventListener('drop', handleDrop)

    return () => {
      if (!drop?.current) return
      drop.current.removeEventListener('dragover', handleDragOver)
      drop.current.removeEventListener('drop', handleDrop)
    }
  }, [drop])

  const handleDragOver = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    const { files } = e.dataTransfer
    uploadfile(files)
  }

  const uploadfile = async (files: any) => {
    setCoverState('loading')
    if (files && files.length) {
      setAttachments([])
      const attachment = await uploadAssetsToIPFS(files)
      console.log(attachment)
      if (attachment) {
        setAttachments(attachment)
        setCoverState('set')
      } else {
        setCoverState('Error!')
      }
    }
  }

  const [preview, setPreview] = useState<boolean>(false)
  const [postContent, setPostContent] = useState<string>('')
  const [postContentError, setPostContentError] = useState<string>('')
  const [selectedModule, setSelectedModule] =
    useState<EnabledModule>(defaultModuleData)
  const [onlyFollowers, setOnlyFollowers] = useState<boolean>(false)
  const [feeData, setFeeData] = useState<FEE_DATA_TYPE>(defaultFeeData)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [attachments, setAttachments] = useState<LensterAttachment[]>([])
  const [coverState, setCoverState] = useState<string>()
  const { currentUser } = useContext(AppContext)
  const { activeChain } = useNetwork()
  const { data: account } = useAccount()
  const router = useRouter()
  const { isLoading: signLoading, signTypedDataAsync } = useSignTypedData({
    onError(error) {
      toast.error(error?.message)
    }
  })
  useEffect(() => {
    const { title } = router?.query
    if (typeof title === 'string') {
      console.log(title)
      setPostContent(title)
    }
  }, [router])

  const onCompleted = () => {
    setPreview(false)
    setPostContent('')
    setAttachments([])
    setSelectedModule(defaultModuleData)
    setFeeData(defaultFeeData)
    trackEvent('new post', 'create')
  }
  const {
    data,
    error,
    isLoading: writeLoading,
    write
  } = useContractWrite(
    {
      addressOrName: LENSHUB_PROXY,
      contractInterface: LensHubProxy
    },
    'postWithSig',
    {
      onSuccess() {
        onCompleted()
      },
      onError(error: any) {
        toast.error(error?.data?.message ?? error?.message)
      }
    }
  )

  const [broadcast, { data: broadcastData, loading: broadcastLoading }] =
    useMutation(BROADCAST_MUTATION, {
      onCompleted({ broadcast }) {
        if (broadcast?.reason !== 'NOT_ALLOWED') {
          onCompleted()
        }
      },
      onError(error) {
        consoleLog('Relay Error', '#ef4444', error.message)
      }
    })
  const [createPostTypedData, { loading: typedDataLoading }] = useMutation(
    CREATE_POST_TYPED_DATA_MUTATION,
    {
      onCompleted({
        createPostTypedData
      }: {
        createPostTypedData: CreatePostBroadcastItemResult
      }) {
        consoleLog('Mutation', '#4ade80', 'Generated createPostTypedData')
        const { id, typedData } = createPostTypedData
        const {
          profileId,
          contentURI,
          collectModule,
          collectModuleInitData,
          referenceModule,
          referenceModuleInitData
        } = typedData?.value

        signTypedDataAsync({
          domain: omit(typedData?.domain, '__typename'),
          types: omit(typedData?.types, '__typename'),
          value: omit(typedData?.value, '__typename')
        }).then((signature) => {
          const { v, r, s } = splitSignature(signature)
          const sig = { v, r, s, deadline: typedData.value.deadline }
          const inputStruct = {
            profileId,
            contentURI,
            collectModule,
            collectModuleInitData,
            referenceModule,
            referenceModuleInitData,
            sig
          }
          if (RELAY_ON) {
            broadcast({ variables: { request: { id, signature } } }).then(
              ({ data: { broadcast }, errors }) => {
                if (errors || broadcast?.reason === 'NOT_ALLOWED') {
                  write({ args: inputStruct })
                }
              }
            )
          } else {
            write({ args: inputStruct })
          }
        })
      },
      onError(error) {
        toast.error(error.message ?? ERROR_MESSAGE)
      }
    }
  )

  const createPost = async () => {
    if (!account?.address) {
      toast.error(CONNECT_WALLET)
    } else if (activeChain?.id !== CHAIN_ID) {
      toast.error(WRONG_NETWORK)
    } else if (postContent.length === 0 && attachments.length === 0) {
      setPostContentError('Post should not be empty!')
    } else {
      setPostContentError('')
      setIsUploading(true)
      // TODO: Add animated_url support
      const { path: postPath } = await uploadToIPFS(editorData)
      const { path } = await uploadToIPFS({
        version: '1.0.0',
        metadata_id: uuidv4(),
        description: trimify(`${postContent} -
        https://bloglens.vercel.app/blog/${postPath}`),
        content: trimify(`${postContent} -
        https://bloglens.vercel.app/blog/${postPath}`),
        external_url: null,
        image: attachments.length > 0 ? attachments[0]?.item : null,
        imageMimeType: attachments.length > 0 ? attachments[0]?.type : null,
        name: `Post by @${currentUser?.handle}`,
        attributes: [
          {
            traitType: 'string',
            key: 'type',
            value: 'post'
          },
          {
            traitType: 'string',
            key: 'title',
            value: postContent
          },
          {
            traitType: 'postPath',
            key: 'title',
            value: postPath
          }
        ],
        media: attachments,
        appId: BLOGLENS
      }).finally(() => setIsUploading(false))

      createPostTypedData({
        variables: {
          request: {
            profileId: currentUser?.id,
            contentURI: `https://ipfs.infura.io/ipfs/${path}`,
            collectModule: feeData.recipient
              ? {
                  [getModule(selectedModule.moduleName).config]: feeData
                }
              : getModule(selectedModule.moduleName).config,
            referenceModule: {
              followerOnlyReferenceModule: onlyFollowers ? true : false
            }
          }
        }
      })
    }
  }

  const setGifAttachment = (gif: IGif) => {
    const attachment = {
      item: gif.images.original.url,
      type: 'image/gif'
    }
    setAttachments([...attachments, attachment])
  }

  return (
    <div className={'w-full mx-auto max-w-[640px]'}>
      <div className="px-5 pt-5 pb-3">
        <div className="space-y-1">
          {error && (
            <ErrorMessage
              className="mb-3"
              title="Transaction failed!"
              error={error}
            />
          )}
          {preview ? (
            <div className="pb-3 mb-2 border-b linkify dark:border-b-gray-700/80">
              <Markup>{postContent}</Markup>
            </div>
          ) : (
            <MentionTextArea
              value={postContent}
              setValue={setPostContent}
              error={postContentError}
              setError={setPostContentError}
              placeholder="What's your story about!"
            />
          )}
          <div>
            {attachments[0]?.item && (
              <img
                className="object-contain max-h-[300px] w-full bg-gray-100 rounded-lg border dark:bg-gray-800 dark:border-gray-700/80"
                loading="lazy"
                src={attachments[0]?.item}
                alt={'cover'}
              />
            )}

            <div
              ref={drop}
              className={`w-full border-2 py-2 px-3 flex items-center rounded-lg ${
                coverState ? 'text-gray-500' : 'border-black'
              } my-2`}
            >
              {!coverState && (
                <>
                  <PhotographIcon className="w-6 h-6" />
                  <div>
                    Drop or{' '}
                    <button
                      onClick={() => {
                        if (fileInput) fileInput.current.click()
                      }}
                      className="underline underline-offset-1"
                    >
                      choose
                    </button>{' '}
                    your cover image.
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(evt) => {
                        evt.preventDefault()
                        uploadfile(evt.target.files)
                      }}
                      disabled={attachments.length >= 1}
                    />
                  </div>
                </>
              )}
              {coverState === 'set' && (
                <>
                  <PhotographIcon className="w-6 h-6" />
                  <div>
                    Drop to replace or{' '}
                    <button
                      onClick={() => {
                        setAttachments([])
                        setCoverState(undefined)
                      }}
                      className="underline underline-offset-1"
                    >
                      click here to remove
                    </button>{' '}
                    your cover image.
                  </div>
                </>
              )}
              {coverState === 'loading' && (
                <>
                  <Spinner size="sm" />
                  <div>Loading.</div>
                </>
              )}
            </div>
            <div className="">
              <Editor
                holder="editorjs-container"
                placeholder="Your story here"
                onChange={() => console.log('Something is changing!!')}
                onData={(data) => {
                  console.log(data)
                  setEditorData(data)
                }}
                tools={{
                  //  "header":Header,
                  //  "quote":Quote,
                  header: Header,
                  quote: Quote,
                  // "image":SimpleImage,
                  list: List,
                  code: Code,
                  link: Link,
                  checklist: Checklist,
                  table: Table
                }}
                // readOnly={true}
              />
              <div id="editorjs-container"></div>
            </div>
          </div>

          <div className="flex content-center w-full items-center pt-2 space-x-2 sm:pt-0">
            {data?.hash ?? broadcastData?.broadcast?.txHash ? (
              <PubIndexStatus
                setShowModal={setShowModal}
                type="Post"
                txHash={
                  data?.hash ? data?.hash : broadcastData?.broadcast?.txHash
                }
              />
            ) : null}
            {activeChain?.id !== CHAIN_ID ? (
              <SwitchNetwork className="ml-auto" />
            ) : (
              <Button
                size="lg"
                disabled={
                  isUploading ||
                  typedDataLoading ||
                  signLoading ||
                  writeLoading ||
                  broadcastLoading
                }
                icon={
                  isUploading ||
                  typedDataLoading ||
                  signLoading ||
                  writeLoading ||
                  broadcastLoading ? (
                    <Spinner size="xs" />
                  ) : (
                    <PencilAltIcon className="w-4 h-4" />
                  )
                }
                onClick={createPost}
              >
                {isUploading
                  ? 'Uploading to IPFS'
                  : typedDataLoading
                  ? 'Generating Blog'
                  : signLoading
                  ? 'Sign'
                  : writeLoading || broadcastLoading
                  ? 'Send'
                  : 'Publish'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewBlog
