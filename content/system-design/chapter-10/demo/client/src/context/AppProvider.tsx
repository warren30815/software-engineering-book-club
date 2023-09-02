import React, { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react'
import { faker } from '@faker-js/faker';
import { onMessage } from 'firebase/messaging';
import { messaging } from '../db/firebase';
import { useLocalNotification } from '../hook/useLocalNotification';

interface IsAppContext {
  permission: NotificationPermission
}
const AppContext = createContext<IsAppContext | null>(null);
export const AppProvider = ({ children }: PropsWithChildren) => {
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission || 'default')

  const { sendNotification } = useLocalNotification()
  // register FCM server-worker 
  useEffect(() => {
    onMessage(messaging, (message) => {
      console.log('Message received. ', message);
      sendNotification(message.notification?.title as string, { body: message.notification?.body })
      // ...
    });

    let sw_file = process.env.NODE_ENV == 'production' ? 'https://YOUR_SERVER_FILES' : '/firebase-messaging-sw.js'

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(sw_file)
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });

    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        permission
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext) as IsAppContext;
