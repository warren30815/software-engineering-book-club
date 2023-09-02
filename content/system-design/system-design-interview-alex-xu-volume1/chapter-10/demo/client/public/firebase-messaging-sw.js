// install
self.addEventListener('install', event => {
  console.log('installing…');
});

// activate
self.addEventListener('activate', event => {
  console.log('now ready to handle fetches!');
});

// fetch
self.addEventListener('fetch', event => {
  console.log('now fetch!');
});



/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.2.0/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyDbiO1XslavW9WB2PByUzwl9LVZUmEThYY",
  authDomain: "imf-notification-388da.firebaseapp.com",
  projectId: "imf-notification-388da",
  storageBucket: "imf-notification-388da.appspot.com",
  messagingSenderId: "150750258199",
  appId: "1:150750258199:web:bef482a7219a00ec6ae852",
  measurementId: "G-XGRW9VCB70"
};


firebase.initializeApp(firebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
