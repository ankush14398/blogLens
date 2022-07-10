/* eslint-disable react-hooks/exhaustive-deps */
// @ts-nocheck
import { default as React, useEffect, useRef } from 'react'
const EditorJS = dynamic(() => import('@editorjs/editorjs'), {
  ssr: false
})
import Header from '@editorjs/header'

const DEFAULT_INITIAL_DATA = () => {
  return {
    time: new Date().getTime(),
    blocks: [
      {
        type: 'header',
        data: {
          text: 'This is my awesome editor!',
          level: 1
        }
      }
    ]
  }
}

const EDITTOR_HOLDER_ID = 'editorjs'

const Editor = ({ editorData }: { editorData: any }) => {
  const ejInstance = useRef()
  // const [editorData, setEditorData] = React.useState(DEFAULT_INITIAL_DATA);

  // This will run only once
  useEffect(() => {
    if (window && !ejInstance.current) {
      initEditor()
    }
    return () => {
      ejInstance.current.destroy()
      ejInstance.current = null
    }
  }, [])

  const initEditor = () => {
    const editor = new EditorJS({
      eadOnly: true,
      holder: EDITTOR_HOLDER_ID,
      logLevel: 'Error',
      data: editorData ?? DEFAULT_INITIAL_DATA,
      onReady: () => {
        ejInstance.current = editor
      },
      onChange: async (api, e) => {
        // let content = await this.editorjs.saver.save();
        console.log()
        // Put your logic here to save this data to your DB
        // setEditorData(content);
      },
      autofocus: true,
      tools: {
        header: Header
      }
    })
  }

  return (
    <React.Fragment>
      <div id={EDITTOR_HOLDER_ID}> </div>
    </React.Fragment>
  )
}

export default Editor
