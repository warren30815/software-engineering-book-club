# 微前端

## Defined noun

- 以下均使用 微應用(Micro Application) 替代來稱呼 微前端(Micro Frontend)
- Module： 每一個 js 檔案都是一個獨立的 Module，多個依賴去進行 import 模組也算一個 Module
- Package: 宣告了一個 package.json 的多塊 Module 組成的大型模組

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
const render = () => <iframe src="/apps/micro-app.html" />;
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
  const module = await import("/apps/micro-app");
  const el = document.getElementById(id);
  const App = module.default;
  createRoot(el).mount(<App />);
};

const render = () => {
  const id = "micro-app";
  useEffect(() => mount(id), []);
  return <div id={id}></div>;
};
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
import App from "./App";

class MicroApp extends HTMLElement {
  connectedCallback() {
    const el = document.createElement("div");
    this.appendChild(el);
    createRoot(el).mount(<App />);
  }
}

customElements.define("micro-app", MicroApp);
```

```jsx
const render = () => {
  useEffect(() => import("/apps/micro-app"), []);
  return createElement("micro-app");
};
```

## 微前端的缺陷與問題

不管如何，採用這架構背後墊高相當大成本，如果不是超大的產品真的不建議輕易採用。但如果是超大的產品，也會產生要重構並且抽離困難等問題，這就不單純是技術問題。

| -                                    | Front-end monolith                   | Micro frontends                                |
| ------------------------------------ | ------------------------------------ | ---------------------------------------------- |
| Codebase (程式碼量)                  | 又大又笨重                           | 分成可管理的模組                               |
| Deployment (部署)                    | 整個應用同時打包部署                 | 每個模組的獨立部署                             |
| Feature development speed (開發速度) | 隨著時間的推移減慢                   | 初期架構開發緩慢，但小需求完成快速             |
| Maintenance (維護)                   | 隨著時間增加更難以維護               | 每個模組維護難度低                             |
| Stability (穩定)                     | 不足（一個小故障可能會破壞整個系統） | 高（一個組件中的故障對系統影響很小或沒有影響） |
| Updates (更新)                       | 冗長（可能需要大量程式碼重寫）       | 可以快速推                                     |
| Tech stack (技術線)                  | 整個系統的技術統一                   | 各個模組可能會有所不同                         |
| Testing (測試)                       | 隨著時間的推移越難以測試             | 對於單個應用快速，但對於整個完整應用困難       |
| Team (團隊)                          | 一個團隊維護該專案                   | 多個團隊維護該專案                             |
| Budget (預算)                        | 取決於項目規模和復雜程度             | 需要大量前期投資                           |

## 微應用實作問題解決方案

在實作微應用時會遇上很多問題，每一種解決方案也都存在對應的優缺點與困難點，甚至有些就是一個大坑，直接是此路不通。因應這些問題，這裡列出各種問題與對應的解決方案。
以下均是實際在工作上我們採用的架構做為情境來提出解決方案，以這個前提去敘述實作細節。

情境描寫：

- 採用 Web Component
- 框架： Vue、React
- 打包工具： Webpack

### Package 共享

問題：

在微應用之中，多個不同的應用會有重複使用的 Package ，這時候就會有共享 Package 的需求。因為每個應用都有自己的打包工具，而且打包工具的版本也不一定相同，這時候就會有版本衝突的問題，而且打包工具的設定也不一定相同，這時候就會有設定衝突的問題。

解決方案：

基於要解決這樣的問題，目前最主流的解決方案就是 `Module Federation`，用來共用模組，還可以做到版本控管的效果。同時也要管理 tree shaking 的問題，避免打包出來的檔案過大。

### CSS 處理

問題：

在微應用之中，CSS 的課題就是全域污染的問題。最重要的就是依據 CSS 採用的方案不同，解決方案也會有所不同。但通常最麻煩的問題是全域使用的 reset CSS & CSS variable ，這時候就會有衝突的問題。而且在微應用之中，CSS 的樣式也會有重複使用的情況，這時候就也會有共享 CSS 的需求。

解決方案：

- 採用 CSS in JS 的方式，這樣就不會有全域污染的問題，但是這樣的方式會有 CSS 語法的限制，而且也會有 CSS 轉換成 JS 的效能問題。
- 採用 CSS Module 的方式，這樣就不會有全域污染的問題，但對於檔案管理上會多 CSS 相關檔案，打包相關問題比較多。
- 採用 Atomic CSS 的方式，主軸在每一個微應用都必須遵守一樣的 CSS 規範，這樣就不會有全域污染的問題，但不適合用在技術線不一致的重構整合。
- 採用 Shadow Dom 強制隔離，但 Shadow Dom 會有 JS 操作限制，對於 querySelector, closest, event bubbling 無法跨越 Shadow Dom。

### 資料交互

問題：

無論整個應用怎麼拆，就是會遇上需要資料交互的需求，這時候就會有資料交互的問題。而且在微應用之中，資料交互的問題就會變得更加複雜，因為每個應用都有自己的狀態管理，這時候就會有狀態管理的問題。

解決方案：

- 使用 CustomEvent，透過 dispatchEvent 來進行資料交互。
- 使用可以在 global 運作並且廣播狀態變更的狀態管理器，比如 mobx、redux 之類的函式庫。
- 資料流的管理上會是向上層通知再向下層廣播觸發傳遞，這樣的方式會比較好管理。

### 路由交互

問題：

網頁路由其實只有一個，但在微應用之中，每個應用都有自己的路由，這時候就會有路由交互的問題。

解決方案：

- 每一個框架都有自己的路由管理器，可以透過這些路由管理器來觸發全域事件廣播通知其他的路由進行路由的狀態同步。
- 也可以乾脆採用單路由管理。

### 多語言處理

問題：

通常每個微應用不但有自己的語系，還會有共享的語系，還可能有外部注入語系，這時候就會有多語言處理的問題。

解決方案：

- 採用 i18n 的方式，每一個微應用建立一個 i18n 實體，各自去管理自己的語言包，避免採用共用。如果有共用需求可以配置權重高底，以外部注入的語系為主，再來是共用語系，最後是自己的語系。

### 部署架構

微應用部署沒有一套標準的解決方案，因為本質就是以 JavaScript 檔案為核心。
通常會採用的方式有以下幾種：

- 將打包後的靜態黨放在後端的靜態檔案位置，這樣的方式可以避免 CDN 的成本，但是會增加後端管理的負擔。
- 以 CDN 為主，透過 CDN 來提供檔案，或是放在 MinIO 或 S3 提供靜態檔案。
- Docker 化，透過 Docker 來提供檔案，這樣的方式可以避免 CDN 的成本，使用 Nginx 來指向到資料位置。

### SSR

問題：

微應用核心概念是使用 JavaScript 動態產生出檔案，但是這樣的方式對於 SEO 來說是非常不友善的，這時候就需要在 Server 完成渲染，但就有不相容問題。也不能直接採用字串渲染，依照現代 SSR 架構其實是 CSR & SSR 混合渲染，如何讓應用知道何時該用 SSR，也知道何時該 CSR。

解決方案：

這個會是微應用上最為麻煩的，基本上建議還是採用 CSR 的方式，但是如果有 SEO 的需求，這時候就需要透過 SSI 的方式來進行渲染。然而 SSI 相關技術目前還不是很成熟，包含 Server Component 的相關函式庫也都不夠穩定，如果還有跨框架的需求，就更加麻煩了。
透過框架生態系提供的函式庫來進行渲染，或是可以直接用非同步方式取的字串進行截取組合，等到了 CSR 再去取渲染資源來進行渲染。

### 多個 Repo 管理

問題：

因為微應用需要多專案多應用拆分，當要拆分成多個 Repo 管理時，要去相互取用變數、安裝、打包、部署都會比較麻煩，當 Repo 之間的控制與腳本整合就比較不容易。

解決方案：

可以採用 Monorepo 架構，每一個專案各自運行，但部署和共享資訊可以透過 Monorepo 來進行管理。可以使用 Lerna, Nx 等管理工具來進行管理。

### 多種 Framework 管理

問題：

微應用的核心概念就是可以使用不同的框架，但是這樣的方式會有不同框架的相容性問題，而且也會有不同框架的打包問題。

解決方案：

面對不同框架的相容性問題，可以透過 Web Component 來進行管理，但是 Web Component 也會有不同框架的打包問題，這時候就需要透過打包工具來進行管理，但是打包工具也會有不同框架的相容性問題，這時候就需要透過打包工具的插件來整合。微應用與微應用盡量要避免直接傳遞組件物件，盡量使用字串來傳遞，這樣就可以避免不同框架的相容性問題。

## 常見問題

### 直接以 React Component 來進行拆分

或許看過這樣使用 :

```jsx
const AppFC = lazy(() => import('app/ReactComponent'))
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppFC />
    </Suspense>
  )
}
```

雖然直接以 Component 來進行拆分方方便，但是這樣的方式會當跨框架使用時將無法溝通，這種方式不如採用 Package Library，還可以得到完整的 TS 型別支援，也可以減少網路損耗。而微應用要去解決的應該是業務層的拆分，而不是技術層的拆分。

### 跨應用取得 JS 檔案怎麼取？

應該要把共享元件的進入點封裝成 JS 檔案，而且不要在打算取得的檔案命名的地方加上哈希字串，這樣遠端才能夠預期得到的檔案名稱。或是可以建立檔案索取的路徑表，透過建立資料集查詢索取檔案的目標位置。但這些問題根本解決是需要建立一個 Proxy Server，可以用 Nginx, k8s ingress 等等方案來達到轉址取得靜態資源。不建議直接在前端進行處理，這樣會有安全性的問題。

### 可以使用 Vite Module Federation？

雖然網路上可以找到使用 Vite Module Federation 的範例，但是目前 Vite Module Federation 還不夠穩定，而且也沒有完整的文件，這樣的方式會讓整個專案變得非常不穩定，建議還是使用 Webpack Module Federation，實質上來講，官方也沒有給出很好的解決方案。
萬一就是要跟 Vite 的專案進行整合，要特別注意有些套件可能發生衝突，甚至沒辦法在 development mode 進行 Module Federation 的跨應用共享。建議的做法是採用 Webpack 執行編譯輸出，隔離開發採用 Vite 運行。但一次兩套維護成本非常高，目前只期待官方能夠提供更好的解決方案，尚無較優的解決方案。
舉例像是靜態資源路徑並未優化，要手動再去處理路徑。也沒有提供像是 webpack 有多種載入機制，目前只提供 script module 一種。

### 前端變數該怎麼傳遞？

大部分前端想渲染變數，直覺做法其實是在專案 env 設定，但這其實是有很大的限制。如果需要在 Docker Image 環境渲染就會無法修改，每一次修改變數就要經歷漫長的 docker build 過程。最理想是要有一個變數的靜態檔案存放在資源處，透過修改這份靜態檔案，讓重新拉取應用的對象或是直接在部署階段都可以帶入參數。這樣的方式可以避免每一次修改變數都要重新打包，也可以避免在 Docker Image 環境無法修改變數的問題。
如果提供資源的主應用能夠採用 Client Service，更能夠動態透過伺服器去渲染變數。當然，SSR 架構的微應用更加複雜。

### 要如何共享型別和函式？

答案是「不要共享」，所有要共享的東西應該都包裝成 Package Library，要傳遞的狀態則是透過傳遞用的接口去接收，型別則是透過 Package Library 去得知，或是以規範文件去規定應該使用的規格。

### 要如何共享靜態資源？

在使用 vite 打包會遇上靜態路徑資源會吃遠端對象的問題，最好的解決方案就是使用將相關靜態資源包上 CDN。或是將所有靜態資源以 JS 的形式封裝用 JS 的方式進行載入，可以避開既有機制上的限制。

## Reference

- [Micro Frontends](https://leanylabs.com/blog/micro-frontends-overview/)
- [All You Need to Know About Micro Frontends](https://micro-frontends.org/)
