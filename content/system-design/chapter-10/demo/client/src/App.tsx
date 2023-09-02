import { ChangeEvent, useEffect, useState } from 'react'
import './App.css'
import { useApp } from './context/AppProvider'
import { useLocalNotification } from './hook/useLocalNotification'
import { sendSubscriptionToBackEnd } from './api'
import { addDoc, collection, getDoc, getDocs, query } from 'firebase/firestore'
import { db, storage } from './db/firebase'
import { UploadTask, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { faker } from '@faker-js/faker'
import { saveMessageDeciveToken } from './db/message'


function App() {
  const [notificationText, setNotificationText] = useState<string>('')
  // const { permission } = useApp()

  const [avator, setAvator] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const { sendNotification } = useLocalNotification()
  const handleLocalNotification = () => {
    if (!notificationText) return
    sendNotification(notificationText)
    // setSendNotification(true)
  }

  const uploadImage = async (file: File) => {
    try {
      const fileref = ref(storage, `images/` + file.name)
      const uploadTask = uploadBytesResumable(fileref, file)
      uploadTask.on(
        'state_changed',
        async (snapshot) => {
          setLoading(true)
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log('upload is ' + progress + '% done')
          setProgress(progress)
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused')
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          switch (error.code) {
            case 'storage/unauthorized':
              // User doesn't have permission to access the object
              break;
            case 'storage/canceled':
              // User canceled the upload
              break;

            // ...
            case 'storage/unknown':
              // Unknown error occurred, inspect error.serverResponse
              break;
          }
        },
        async () => {
          setLoading(false)
          const url = await getDownloadURL(fileref)
          const fakeUser = faker.person.fullName()
          saveMessageDeciveToken(fakeUser)
          setAvator(url)
        },
      )
    } catch (e) {
      setLoading(false)
    }
  }
  const handleUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadImage(file)
    }
  }
  return (
    <>
      <div>
        <label htmlFor="text" >notificationText</label>
        <input
          type="text"
          id="text"
          value={notificationText}
          onChange={e => setNotificationText(e.target.value)} />
        <button onClick={handleLocalNotification}>send local notification</button>

      </div>

      <div>

        <input type="file" accept='image/*' onChange={handleUploadImage} />
        {progress}
        <img src={avator} alt="" />
      </div>
    </>
  )
}

export default App
