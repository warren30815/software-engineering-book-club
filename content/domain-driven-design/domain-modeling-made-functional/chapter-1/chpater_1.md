
# Domain Driven Design Made Functional

## Chapter 1 Introducing Domain-Driven Design

> 斜體標註部分為重要概念或之後章節會重複提到的詞彙與概念。

### The Importance of a Shared Model

- Functional 主張以 pipeline 的方式組建起整個服務，而為了避免 garbage in garbage out, 第一步最重要的就是釐清需求。
- 傳統瀑布式開發中，需求從 *Domain Experts* 傳遞到 Architect, 再到 Development team, 最後交付。訊息傳遞可能在其中扭曲或喪失。
- Agile 講求快速迭代，小量開發成果交付給使用者後得到回饋並改進，但這依然仰賴開發者來轉譯 domain experts 的想法而成為開發成果。
- 比較好的作法則是，不論是 domain experts, development team, 或是其他 stakeholders, 大家都有一個共通的語言，在這本書中稱為 *Shared Model*.
- DDD 最重要的幾個流程：
  - 專注在 *Business Events* 而不是資料結構。
  - 把一個問題 *Domain* 拆解成更多小的 *Subdomains*.
  - 替每一個 subdomain 創造一個 *Model*.
  - 打造一個不論是開發者或非技術人員都能了解的 common language, 或者被稱為 *Ubiquitous Language*.

### Understanding the Domain Through Business Events

- 為什麼要關注事件？企業通常是由一系列 *流程* 組成。所謂的企業流程通常就是將紙本資料做一系列的轉換 (*transformation*)。而每個轉換通常是由某個事件所觸發。這些事件就被稱為 *Domain Events*.
- *Event Storming*: 召集開發者，領域專家，跟其他關係人，一起做 business event 的 brainstorming.
- 本書從頭到尾都以一個 *Order-Taking System* 舉例，來說明如何具體了解一個領域。作者虛擬一個叫 Widgets Inc 的工具製造商，並且他的定位如下：
  - 我們是一個替其他公司生產零件的小公司，生產的東西包含 widgets, gizmos (譯：都是小工具的代稱，不指稱具體事物)。原本都是紙本作業流程，但公司成長的很快，現在想要電子化作業流程。希望有一個網站系統可以讓客人自己下單、確認訂單狀態等。
- 本書舉例，在 event storming 的過程中，以下是跟一個 Widgets 部門員工的對話：
  - Ollie：我在訂單處理部門 (order-taking)。主要處理訂單 (orders) 跟詢價單 (quotes)。
  - 你：什麼事件會觸發你的工作？
  - Ollie：客人透過 email 寄表單給我們的時候。
  - 你：所以這個事件應該是 「收到訂單表單」(Order form received) 對嗎？
  - Ollie：是的。
  - Sam：我是出貨部門 (shipping department)。我們在訂單被核准後安排訂單出貨。
  - 你：那你什麼時候開始做這件事？
  - Sam：當我們從訂單部門接收到一個訂單表單時。
  - 你：你會怎麼稱呼這個事件？
  - Sam：「有待處理訂單」(Order available) 如何？
  - Olie：當有一個訂單已經準備好出貨時，我們會叫他「已下訂訂單」(Placed order)。
  - Sam: 所以事件名稱應該叫 「訂單已下訂」(*Order placed*) 對吧？
- 透過以上對話，你得到以下事件
  - *Order form received*
  - *Order placed*
  - *Order shipped*
  - Order change requested
  - Order cancellation requested
  - Return requested
  - Quote form received
  - Quote provided
  - New customer request received
  - New customer registered
- 在做 event storming 時有幾個重點：
  - 一個企業所有人都懂的共同認知模型 (A shared model of the business)：著重在溝通以及了解不同部門的需求，去了解自己不熟悉的地方，釐清自己的錯誤認知。
  - 讓團隊互相了解 (Awareness of all the teams)：了解其他團隊可能使用到以及如何使用你的部門的產出。舉例，出納部門 (billing department) 也會需要知道 order placed 事件，才能通知客人付款。
  - 尋找需求之間的代溝 (Finding gaps in the requirements)：當需求都被貼在牆上，很容易找出是否有其他缺漏的事件。
    - Max：Ollie, 當你準備完一個訂單後，你需要通知客人嗎？我沒看到牆上有這個。
    - Ollie：噢對，我們會寄信通知客人。應該要有一個事件叫「訂單接收通知已寄出」(*Order acknowledgement sent to customer*)。
  - 連接各個部門：當事件被放在時間線上，很容易看出部門之間作業的相依性。舉例來說，訂單處理部門 (order taking department ) 處理完訂單後，他們需要告知其他部門，於是 *Order placed* 事件就成了出貨部門 (shipping department) 跟出納部門 (billing department) 的輸入 (input)。
  - 察覺報表相關的需求：管理階層需要知道企業的營運狀況。
  - 往兩側延伸可能的事件：從事件的左側與右側繼續問，往往能發現其他事件
    - 你：Ollie, 什麼會觸發「訂單表單已接收」(Order form received) 事件？
    - Ollie：我們每天早上查看信箱，另外客人會寄紙本表單給我們，我們打開後歸類為訂單 (orders) 或詢價單 (quotes)。
    - 你：所以看起來我們還會有個「已收信」(Mail received) 的事件？
    - ---
    - 你：Sam, 在你出貨之後，還有什麼事件嗎？
    - Sam：噢，如果訂單的狀態是「訂單已簽收」(Singed for delivery)，我們會從貨運公司收到通知。讓我增加一個「客人已收貨」(Shipment received by customer) 事件。
  - 紀錄指令 (*Commands*)：
    - 是什麼驅使 Domain Events 發生？可能是客人做了什麼，或者老闆叫你做了什麼。在 DDD 中我們稱這些為「指令」(Commands)。
    - 指令成功的話通常就會啟動一個 *流程* (*Workflow*)。
    - 有一些命名規則：
      - *Command: Make X Happen -> Event: X happened*
      - Command: Send an order form to Widgets Inc -> Event: Order form sent
      - *Command: Place an order -> Event: Order placed*
      - Command: Send a shipment to customer ABC -> Event: Shipment sent
      - 通常是*事件觸發指令，指令觸發企業流程*

### Partitioning the Domain into Subdomains

- 有了 Business Events 後，下一步就是照 Domain 切分他們。
- 部門 (departments) 通常就是切分 domain 的一個天然依據。
- 領域 domain 很難有明確的定義。一個有用的方式是，一個領域就是某個領域專家擅長的事情。很繞口嗎？他是ＸＤ但如果你問一個出納部門的人他平常做的事情是什麼，那些事情大概就可以歸賴在「出納」這個領域。

### Creating a Solution Using Bounded Contexts

- 限界上下文 (*Bounded Context*) 的意思就是，把一個 domain 成若干較小且互相不重疊的區塊。
- 這個名字讓我們把焦點放在，如何劃定他們之間的界線。
- 每一個限界上下文在實作上會成為一個獨立的元件，有可能有各自的 DLL，一個獨立的服務，或者單純是一個命名空間 (namespace)。
- 如何把 context 切分乾淨是一門藝術，但可以遵循以下幾個大原則：
  - 傾聽領域專家：如果一群人用著同樣的詞彙指稱幾件事，並且關注同樣的議題，那他們大概同屬於一個 boudned context.
  - 觀察既有的團隊與部門界線：這通常就是一個企業如何區分領域的線索。
  - 注意上下文是「有界的」：小心不要產生範疇潛變 (scope creeping)。需求可能變動，但要踩死界線的劃分。
  - 為「自主權」而設計：兩個領域或部門結合太死會很難做事，讓每個領域有自主權，能夠有充分資訊並獨立運作，不需要仰賴其他領域，減少相互依賴。
  - 為企業的無縫運作而設計：假設一個企業流程常常受到其他領域阻擋，考慮將他們合併在一起。即使這樣會讓設計醜一些，但是追求企業價值應該高於追求一個乾淨的設計。
- 設計上下文對應 (*Context Maps*)：用一個圖表示事件與領域之間的關係，以及他們的上下游關係。
  - 舉例來說，出貨領域 (shipping context) 是訂單處理領域 (order-taking context) 的下游。
- 專注在最重要的界限上下文：把重點放在帶來最多企業價值或優勢的領域。

### Creating a Ubiquitous Language

- 讓實作中的命名盡量貼近領域專家的理解。
- 例如，當領域專家用「訂單」指涉他們平常作業的物件，在你的實作中就應該用 Order 來命名，不要自創一些領域專家看不懂的東西，例如 OrderFactory, OrderManager, OrderHelper 之類的。領域專家看不懂這些東西。至少不要讓他們成為公開 API 或當你需要與其他人溝通時的設計詞彙。
- 通用語言 (*Ubiquitous Language*)，也稱為「無所不在的語言」，指的是一系列的概念與詞彙，被團隊的所有成員所理解與共用。不只在設計中，也應該在你的實作與 codebase 中。
- 注意每個領域對同一個詞彙的理解跟用途可能不同。在我們的例子中，order 這個詞在不同的部門中都會用到，但其實出貨部門的「訂單」跟出納部門的「訂單」其實意義不太一樣。所以命名時也會需要用一些前綴或後綴來區分上下文。
