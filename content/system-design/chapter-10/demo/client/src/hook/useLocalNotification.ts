

import { useEffect, useState } from "react"
import { useApp } from "../context/AppProvider";
export const useLocalNotification = () => {
  const permissionInfo = useApp()

  const sendNotification = (title: string, option?: NotificationOptions) => {
    const { permission } = permissionInfo
    navigator.serviceWorker.ready.then(async (registration) => {
      if (permission !== 'granted') return
      await registration.showNotification(title, option)
    });
  }
  return { sendNotification }
}