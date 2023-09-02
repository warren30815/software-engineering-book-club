import { getToken } from "firebase/messaging"
import { db, messaging } from "./firebase"
import { doc, setDoc } from "firebase/firestore"
import { Dispatch } from "react"
const vapidKey = "vapidKey_from_firebase_settings"
const fcm_token_collection = "fcmTokens"
export const requestNotificationPermissions = async (uid: string) => {
  console.log('Requesting notification permissions ... ')
  const permission = await Notification.requestPermission()
  if (permission === 'granted') {
    await saveMessageDeciveToken(uid)
  } else {
    console.log('Unable permission to notify')
  }
}


export const saveMessageDeciveToken = async (uid: string) => {
  try {
    const fcmToken = await getToken(messaging, { vapidKey })

    if (fcmToken) {
      const tokenRef = doc(db, fcm_token_collection, uid)
      await setDoc(tokenRef, { fcmToken }) // overwrites document if already exists
    } else {
      // need to request token to firebase
      requestNotificationPermissions(uid)
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
  }

}