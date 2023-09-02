# design pattern (notification)

## notification 種類
通知向用戶發出重要訊息提醒，例如新聞、產品更新、活動等等。引經在日常生活中是不可或缺的一部分，通知系統並不只有 mobile 的通知提醒而已，而是有三種格式。
* push notification
* SMS
* Email

![](https://hackmd.io/_uploads/Hyek7XC6h.png)

## notification design pattern 問題定義

構建一個每天發送數百萬條通知的可擴展系統並不是一件容易的事。它需要對通知生態系統有深入的了解。這邊簡單給大家看一下面試過程。

`主考官：`系統支持哪些類型的通知？
`面試者：`推送通知、短信、電子郵件。

`主考官：`是實時系統嗎？
`面試者：`就說它是一個軟實時系統吧。我們希望用戶盡快收到通知。但是，如果系統工作負載較高，輕微的延遲是可以接受的。

`主考官：`支持哪些設備？
`面試者：`iOS 設備、Android 設備、PC/mobile。

`主考官：`什麼會觸發通知？
`面試者：`通知可以由客戶端應用程序觸發。它們也可以在服務器端進行安排。

`主考官：`用戶可以選擇退出嗎？
`面試者：`是的，選擇退出的用戶將不再收到通知。

`主考官：`每天發出多少條通知？
`面試者：`1000萬條移動推送通知、100萬條短信、500萬封電子郵件。

`補充一下` : 這邊指的退出是可以是關閉通知，或是取消訂閱某一個頻道跟 email

## muti notifaction design pattern
這邊主要介紹，iOS 推送通知、Android 推送通知、短信和電子郵件。它的內容如下：

• 不同類型的通知
• 聯繫信息收集流程
• 通知發送/接收流程

### iOS push notification
![](https://hackmd.io/_uploads/SkF1c7CT3.png)
主要有三個部分完成 iOS push notification

* Provider ： 用來發送 push noticiaction request 到 APNS，可以是你的本地終端機，或是其他 microservices 服務，其中 request 包含。

  **Device token** : 每個 user 的裝置 id。
  **Payload** ： notification 的 Payload
  ![](https://hackmd.io/_uploads/HJjvsmCa3.png)

* APNS (Apple Push Notification Service) : 這是 APPLE 用來處理 propagate 的 remote service ，用來 push notification 到 IOS decives。
* iOS Device: client device 用來獲取 push noticiaction

### android push notification

在 android 上主要是透過 FCM 去完成這件事 ( firebase cloud message)，而這邊可以搭配的 provider 目前筆者習慣是透過 `cloud functions` 搭配 `fire store`去做 `realtime database` 去觸發 `cloud message` 。

這邊補充下狐狸提問的可不可以用 `cloud run` 去執行這件事，本人覺得 `cloud run` 本身的定位不太適合放在這邊，雖然 `cloud run` 跟`cloud functions` 都是 Serverless，但 `cloud run` 主要是為了更好搭配 `GCP` 上面的服務例如 `Cloud Monitoring`、`Cloud Logging、Cloud Trace `和 `Error Reporting`等等同時 `cloud run` 是屬於 `container base` 應用，所以在 `cloud run` 會用到的環境都需要透過 `image`  去打包，但其實我們只是需要簡簡單單的 `serverless function`，用 `cloud run` 來做 web api 過程相對比較複查，同時延遲性或是穩定不一定有保證，有點大材小用，而且也不好搭配 firebase 做 real time database。


對於快速建置小批量的工作流程或單一 Function-based 的服務，這邊比較推薦用 `cloud functions`

![](https://hackmd.io/_uploads/r1s3fZkR3.png)

![](https://hackmd.io/_uploads/SyXL6e102.png)

### SMS
常見的 server 例如 ： Twilio 、Nexmo


![](https://hackmd.io/_uploads/SyqQbZyC3.png)
### email
通常會搭配第三方工具例如 ： `nodemailer`

但本人目前適用 `nextjs` 推薦的 
sender server (Resend) : https://resend.com/docs/send-with-nodejs
template (react email): https://react.email/docs/introduction

![](https://hackmd.io/_uploads/ry3GbW10h.png)

整體架構如下
![](https://hackmd.io/_uploads/SJPM4-JRh.png)

## store user token
要發送通知，我們需要收集 decive token、電話號碼或電子郵件地址。當用戶安裝我們的應用程序或第一次註冊時，API服務器會收集用戶聯繫信息並將其存儲在數據庫中。
![](https://hackmd.io/_uploads/S10qNZkRn.png)
![](https://hackmd.io/_uploads/ryMh4-kAh.png)


## 通知發送/接收流程

### High-level design

![](https://hackmd.io/_uploads/SkOAH-k03.png)


* Service 1 to N: 服務可以是微服務、cron 作業或觸發通知發送事件的分佈式系統。例如，計費服務會發送電子郵件提醒客戶到期付款，或者購物網站會通過短信告訴客戶他們的包裹將於明天送達。
* Notification system: 通知系統是發送/接收通知的核心。從簡單的事情開始，只使用一個通知服務器。它為服務 1 到 N 提供 API，並為第三方服務構建通知負載。
* Third-party services: 如上一節介紹的 notification services ，這邊要注意的是對於新市場或未來不可用，例如 fmc 不能在中國使用，所以改成 Jpush、PushY 等等。
* iOS, Android, SMS, Email: User 獲取裝置的地方.

這樣的設計模式就衍生出以下問題：
*  Single point of failure (SPOF) ： 只要是單體是架構就會出現的問題。
*  Hard to scale ： notification systems 只在一台 services 中負責所有通知的訊息，對於要獨立 database 的擴展或是 cache 都是不太容易做到。
*  Performance bottleneck ：處理和發送通知會非常佔用系統資源，例如 email 一邊要處理 html 內容，還要等第三方服務 api 結果，在一個系統處理所有事情會造成系統過載狀況，尤其實在高峰時段，而衍生 SPOF 等問題。

## improved
• 將 database 和 cache 移出 notification services。
• 添加更多 notification servers  並設置自動水平縮放。
• 添加 message queue 並設置自動水平縮放，透過 retry error 減少 api 來回，同時解耦系統組件。
![](https://hackmd.io/_uploads/Hy1moW1R3.png)

**Service 1 to N:** 它們代表通過通知服務器提供的API發送通知的不同服務。

**Notification servers:**
*  為服務提供API 以發送通知。這些 API 只能在內部訪問 或由經過驗證的客戶來防止垃圾郵件。
*  執行基本驗證以驗證電子郵件、電話號碼等。
*  查詢數據庫或緩存以獲取呈現通知所需的數據。  將通知數據放入消息隊列以進行並行處理。

例如：
POST https://api.example.com/v/sms/send
Request body

![](https://hackmd.io/_uploads/B1mqJfk0h.png)

**消息對列** ：他們刪除組件之間的依賴關係。當要發送大量通知時，消息隊列充當緩衝區。每種通知類型都分配有不同的消息隊列，因此第三方服務的中斷不會影響其他通知類型。

**Workers**：用於監聽 handle notification service event。


小結：
1. 服務調用通知服務器提供的 API 來發送通知。
2. 通知服務器從緩存或數據庫中獲取元數據，例如用戶信息、設備令牌和通知設置。
3. 將通知事件發送到相應的隊列進行處理。例如，iOS 推送通知事件被發送到 iOS PN 隊列。
4. Workers 從消息隊列中拉取通知事件。
5. 第三方服務向用戶設備發送通知。

## Design deep dive

*  可靠性。
*  其他組件和注意事項：通知模板、通知設置、速率限制、重試機制、推送通知的安全性、監控排隊通知和事件跟踪。
*  更新設計。

### Reliability 可靠性

在分布式系統設計中一定會考量的問題點。

#### 我們要怎麼防止資料遺失？
我們可以透過 workders 中觸發 notification log 去記錄每次推波的時間點與使用者相關數據，此用意可以來對照持久話 db 中的資料是否有匹配。
![](https://hackmd.io/_uploads/SyDE8GkC2.png)

#### 收件人只會收到一次通知嗎？

理想情況是不會，但分布式特性可能會導致重複通知，也許是延遲或是資料不齊全的情形，為了繳少重複狀況發生，需要新增預防重複新增數據的機制，例如當第一次事件發送時隨機生成指定 event_id，當下次要再重新發送推波時會去比對 db 中是否已經存在的 event_id，以此來避免推波多次狀況。

### Additional components and considerations
通知還有其他考量的點例如：

* 模板重用
* 通知設置
* 事件跟踪
* 系統監控
* 速率限制

#### 模板重用 ( Notification template )
通知系統每天都會發出數百條的通知內容，總不可能每次都重新生成模板，這時你可以考慮先 prebuild 格式化模板的通知，之後只需要自定義參數或是相關 link 內容就好，減少模板建制時間。

例如你可以寫一個 `serverless function` 去 build email template。
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailTemplate } from '../../components/EmailTemplate';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['delivered@resend.dev'],
      subject: 'Hello world',
      react: EmailTemplate({ firstName: 'John' }),
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json(error);
  }
};
```

#### 通知設置 ( Notification setting )
堆用戶來說每天都要接受非常多的通知內容，所以勢必需要針對推波進行分類，實際情況中我們在推波信息的前置作業是，需要先判斷用戶是否有訂閱某一個 channel 或是用戶是否取消訂閱，這些都是需要考慮的因素，如果 user 要訂閱每一個 channel (topic) 的話會去綁定 devicedtoken ，也就是下方的 
`YOUR_REGISTRATION_TOKEN` 內容。

```typescript
// These registration tokens come from the client FCM SDKs.
const registrationTokens = [
  'YOUR_REGISTRATION_TOKEN_1',
  // ...
  'YOUR_REGISTRATION_TOKEN_n'
];

// Subscribe the devices corresponding to the registration tokens to the
// topic.
getMessaging().subscribeToTopic(registrationTokens, topic)
  .then((response) => {
    console.log('Successfully subscribed to topic:', response);
  })
  .catch((error) => {
    console.log('Error subscribing to topic:', error);
  });
  

getMessaging().unsubscribeFromTopic(registrationTokens, topic)
  .then((response) => {
    console.log('Successfully unsubscribed from topic:', response);
  })
  .catch((error) => {
    console.log('Error unsubscribing from topic:', error);
  });
```

####  Rate limiting
之前讀書會有提到。

#### Retry mechanism
當地三中服務發送通知失敗，會將該通知重新放到訊息隊列中，也就是上面的 retry ，如果超過 retry 次數時就通知開發人員並發送警報。

#### Security in push notifications
對於 IOS 或是 android 用戶有提供 appKey 跟 appSecret 來保護推波 api 的安全因為會需要身份驗正。

#### Events tracking
透過 Monitor queued notifications 我們可以分析用戶行為，了解用戶參與度，甚至分析服務實現，與事件追蹤情況例如 `sentry`。
![](https://hackmd.io/_uploads/SJ_jZX1R3.png)
![](https://hackmd.io/_uploads/Sy5oZ7kA2.png)

#### finally design

![](https://hackmd.io/_uploads/SyMdMmyC3.png)

#### 最後總結一下優化哪些功能：
• 通知服務器配備了兩個更關鍵的功能：身份驗證和速率限制。
• 透過重試機制來處理通知失敗。如果系統無法發送通知，它們將被放回消息隊列中，開發者定義重識次數，都失敗發送警報。
• 通知模板提供一致且高效的通知創建過程。
• 添加了監控和跟踪系統，用於系統健康檢查和未來改進。

### demo 時間
![](https://hackmd.io/_uploads/BkAM-m1Rh.png)
![](https://hackmd.io/_uploads/rJim-XJCn.png)
