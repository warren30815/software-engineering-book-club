# Chapter-1 微前端現況分析

## Defined noun

* 以下均使用 微應用(Micro Application) 替代來稱呼 微前端(Micro Frontend)
* Module： 每一個 js 檔案都是一個獨立的 Module，多個依賴去進行 import 模組也算一個 Module
* Package: 宣告了一個 package.json 的多塊 Module 組成的大型模組

## 什麼是 Micro Frontend？

後端微服務來說，就是建立不同的 Service Application 由各自的團隊維護運行。每個團隊使用各自的語言、技術、框架，互不衝突，全部溝通仰賴 HTTP Request & Socket 相互溝通。
而微前端，則是在一個 SPA (Single Page Application) 之下乘載多個來源的 UI Application 的架構。仰賴使用 Web API 來相互溝通。

## 什麼應用場景需要使用 Micro Frontend？

當前端團隊龐大到一個程度時會產生一些問題：

### 1. 多重技術

要解決的問題：
不同產品使用不同的前端技術，無法整合

採用後的效用：
架構可以將兩個不同框架的應用整合成一個。

### 2. 部署

要解決的問題：
部署要以一個 Application 為單位去打包， bundle 的時間非常久

採用後的效用：
各個應用也可以單獨部署，無須一整套捆綁在一起，這樣不管是開發還是發布都能減輕負擔

### 3. HMR

要解決的問題：
架構如果是採用 Webpack 這種工具，當專案變大時，HMR(Hot Module Reload) 會非常久

採用後的效用：
當啟動應用的必要基礎模組減少變小，那啟動專案和 HMR 所需要的時間就能大幅下降。

### 4. 專案龐大

要解決的問題：
專案模組巨大，耦合嚴重，單專案應用的學習成本高昂

採用後的效用：
可以更容易切分工作，能夠把不同的應用和功能切分派給布團的團隊維護。如果剛開始就採用 Micro Application 更能有意識去進行模組的共用切分。

## 實作方法差異產生的優劣分析

目前常見的 Micro Application 解決方案，以及實作範例，但詳細做法不在此處說明。

### Iframe

該方法其實很早以前就被提出，也是最單純的微應用解決方案。

特點：

1. 對於環境隔離性很強，不需要擔心 JS 和 CSS 相互污染。
2. 學習成本低，容易使用。

缺點：

1. 幾乎無法共用 Module 或 Package，導致一但拆分會異常龐大。
2. 資料通訊與溝通非常麻煩，幾乎只能靠 postMessage 去通訊。

```jsx
const render = () => <iframe src="/apps/micro-app.html"/>
```

### Client Side JavaScript

透過動態載入 JavaScript Module 來掛載應用，也是目前微應用最主流的作法。

特點：

1. 主程式和為微應用的資料交互容易，也有許多模組共用的解決方案。
2. 可以共享網頁全域事件和變數。

缺點：

1. 每一個微應用的 js & css 容易相互污染，更甚至會搶用同一個 `window`&`document` 的變數使用
2. 掛載方式的實作需要關注生命週期與模組載入先後順序
3. 在 SSR(Server Side Render) 架構下時還要額外實作 SSI

```jsx
const mount = async (id) => {
  const module = await import('/apps/micro-app')
  const el = document.getElementById(id)
  const App = module.default
  createRoot(el).mount(<App />)
}

const render = () => {
  const id = 'micro-app'
  useEffect(() => mount(id), [])
  return <div id={id}></div>
}
```

### Web Component

特點：

1. 可以使用 shadow dom 去隔離 css
2. 能夠以開發 Component 為單位去拆分不同的模組，需要注入時只需要用 `customElements.define` 來註冊要追加的元件
3. 可以不需要關心處理流程，無論先掛載元素還是先讀取 JS 註冊均不影響處理結果，也不會有錯誤發生
4. 有 SSI 相關解決方案能一併處理 SSR 的問題

缺點：

1. 使用 shadow dom 會產生更多關於 JS 交互的問題，JS 也仍然會交互影響
2. 初始化時只能取得 attribute 作為參數，無法趕在掛載前將物件參數下傳，需要再重新取出 DOM 實體去傳遞資訊

```jsx
// remote module
import App from './App'

class MicroApp extends HTMLElement {
  connectedCallback() {
    const el = document.createElement('div')
    this.appendChild(el)
    createRoot(el).mount(<App />)
  }
}

customElements.define('micro-app', MicroApp)
```

```jsx
const render = () => {
  useEffect(() => import('/apps/micro-app'), [])
  return createElement('micro-app')
}
```

## 微前端的缺陷與問題

不管如何，採用這架構背後墊高相當大成本，如果不是超大的產品真的不建議輕易採用。但如果是超大的產品，也會產生要重構並且抽離困難等問題，這就不單純是技術問題。
