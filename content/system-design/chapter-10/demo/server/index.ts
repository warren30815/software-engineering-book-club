import { doc } from 'firebase/firestore';
import { query, collection, getDoc } from 'firebase/firestore';
import { google } from "googleapis"
import key from './gcp_server_key.json'
import axios from 'axios'
import { db } from './db/firebase';
const PROJECT_ID = 'PROJECT_ID';
const PROJECT_NUMBER = 'PROJECT_NUMBER';
const HOST = 'fcm.googleapis.com';
const PATH = '/v1/projects/' + PROJECT_ID + '/messages:send';
const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
const SCOPES = [MESSAGING_SCOPE];
const notification = {
  title: "Test remote notification 2.0",
  body: "This is a demo notification from FCM. danny",
  image: "https://picsum.photos/200/300"
}
const getAccessToken = async () => {
  try {

    const JWTClient = new google.auth.JWT(
      key.client_email,
      './gcp_server_key.json',
      key.private_key,
      SCOPES
    )
    const result = await JWTClient.authorize()
    return result
  } catch (e) {
    console.log(e)
  }
}
const getUserToken = async (userName: string) => {
  try {
    const docRef = doc(db, 'fcmTokens', userName)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data() as { fcmToken: string }
      return data
    } else {
      console.log('doc not found')
    }
  } catch (e) {
    console.log(e)
    process.exit(1)
  }
}
type SendMessageProps = {
  accessToken: string,
  userDeciveToken: string,
  notification: {
    title: string,
    body?: string,
    image?: string
  },
  callBack: () => void
}
const sendMessage = ({
  accessToken,
  userDeciveToken,
  notification,
  callBack
}: SendMessageProps) => {
  //https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send?hl=zh-tw 

  let data = JSON.stringify({
    "message": {
      "notification": notification,
      "data": {
        "key1": "value1",
        "key2": "value2"
      },
      "token": userDeciveToken
    }
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `https://fcm.googleapis.com/v1/projects/${PROJECT_NUMBER}/messages:send`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    data: data
  };

  axios(config)
    .then((response) => {
      callBack()
    })
    .catch((error) => {
      console.log(error);
    });

}

const sendNotification = async (username: string) => {
  try {
    const userDeciveToken = await getUserToken(username)
    const credentials = await getAccessToken()

    if (!userDeciveToken?.fcmToken || !credentials?.access_token) return

    sendMessage({
      userDeciveToken: userDeciveToken?.fcmToken,
      accessToken: credentials.access_token,
      notification,
      callBack: () => console.log('success send notification to ' + username)
    })
  } catch (e) {
    console.log(e)
  }
}

sendNotification('Alfonso Zboncak')
