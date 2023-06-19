# 第四章：DESIGN A RATE LIMITER

## # 主軸

- 主要在 Layer 7: Application layer

- 作用：

  - 防止 DoS: 避免資源餓死 (resouce starvation)
  - 節省流量成本: 流程內可能會調用到第三方服務 (依次計費), 或者 LB 依請求次數計費, 如果能在避免資源餓死的前提下作考量時, 那麼大部分的請求被拒絕時, 自然而然以上的成本會下降
  - 防止超載: 會打請求的未必只是人還有Bot, 為了避免大家把有限資源的服務器打暴為前提做設計 (更多能參考SLA)

- 目標：

  - server-side API rate limiter

    - REF: client: axios-rate-limit: other will be delayed automatically.

  - a large number of requests --> Low latency & little memory？
 
  - 聚合用的欄位, 希望足夠彈性

  - exception handling, inform users

  - service (API Gateway) vs server-side code

  - work in distributed environment, 在這裡指的是 Rate limiter 本身可能不只是 cluster, 甚至跨 VPC, 跨 AZ 的環境

  - high fault tolerance: Rate limiter 本身非業務流程上的必要功能, 它本身的好壞不該影響到整個系統, 因此考量時, 該怎設計隔離 rate limte service 某個節點異常的部份
 
  - low latency: rate limit本身非業務所需功能, 不應該在latency上佔比過高

  - technology stack

  - algorithm 可選性

  - 時間成本

## # Algorithm

- 演算法介紹

  - Token bucket

  - Leaking bucket

  - Fixed window counter

  - Sliding window log

    - 可在每次收到請求時，才清除舊資料。安排固定時間或長度清除
    
    Q: 為什麼連被拒絕的請求也要加入 log 做計數？
    
    A: 這個的設計其實不是為了直接給 rate limiter 來計算用的，而是其他需求，畢竟叫做 log，像 nginx access log 一樣，有請求來的本來就都會被紀錄，有以下四個常見需求：
    
       1. 故障排查用: 被拒絕的請求可能表示系統中存在問題。例如，如果出現許多請求被拒絕，可能意味著系統超負荷、有 bug、或者資源分配不足。透過記錄被拒絕的請求，工程師能夠回溯問題並進行修復。
       2. 監控系統負載: 大量的被拒絕的請求可能表示系統負載過高或者資源短缺。這些日誌可以作為我們監控系統狀態和評估資源需求的依據。
       3. 離線用戶行為分析: 對於被拒絕的請求進行記錄和分析，可以幫助我們更好地了解用戶的行為模式，以及那些功能或服務可能存在問題。然後我們就可以對這些問題進行調整和優化。
       4. 法規和合規需求: 在某些情況下，法規可能要求我們記錄所有的請求，包括被拒絕的請求。
    
    ref: [Rate limiting - why log rejected requests' timestamps in Sliding window log algorithm?](https://www.reddit.com/r/AskComputerScience/comments/xktn2j/rate_limiting_why_log_rejected_requests/)

  - Sliding window counter

- 演算法比較

  - Bucket vs Window

    - 可看作 Bucket 可以把可接受的峰值跟均速分開設定，Window 把峰值跟均速綁在一起
    - 因此 Bucket 需要調整兩個參數達到平衡，也相對較困難

  - Bucket

    - A. Token bucket

      - 適合處理瞬間流量，如搶購
      - 比 B 更有效的利用資源

    - B. Leaking bucket

      - 穩定輸出模型
      - 不適合瞬間流量，如搶購。因為即使流量在可接受範圍，依然會按照一個速率進行

  - Window

    - C. Fixed window counter

      - 可能會有時間差聚集現象，實質上超過流量

    - D. Sliding window log

      - 解決 C 的問題，一定不會超過流量限制
      - 大量耗費記憶體，因為須記錄所有 timestamp
      - 清除舊資料很耗時

    - E. Sliding window counter

      - 解決 D 的記憶體使用問題，但保有大概率解決 C 的問題，不會超過流量
      - 實驗統計只有 0.003% 出錯

## # High-level architecture

## # Design deep dive

- Rate limiting rules 怎被建立、儲存、存取和更新: 依照結構化格式(YAML, JSON, XML...)，將規則的欄位給格式化

- Exceeding the rate limit

  - HTTP 429 (Too many requests)

    - 放到待處理
    - 直接捨棄

  - Rate limiter headers

    - 沒超過限制

      - X-Ratelimit-Remaining: 在時間區間內還剩下多少配額
      - X-Ratelimit-Limit: 在時間區間內，客戶端請求的限額
      - X-Rate-Limit-Reset: 一個代表時間的數值，時間到將重設配額

    - 超過限制回傳 429

      - X-Ratelimit-Retry-After: 指定客戶端在傳送下一個要求之前所應等待 (或睡眠) 的秒數。如果重試值沒過就傳送要求，則不會處理要求，並且會回傳新的重試值。
     
      **Client需要知道這些資訊，才好控制下一次發出請求 (甚至也能說是一種Retry policy的控制)**

- Detailed design

  Q: 這些資訊適合存放在哪？
  
  A: RDBMS太慢且本身的資料結構也不適合存放大量數據，且有熱點存取問題，因此選擇 in memory store 是適合的，夠快且過期的資料通常 in-memory db 有配合的機制能汰除掉，因為我們這裡大部分都只要計次 (sliding window log 例外)，Redis有提供INCR與EXPIRE (甚至TTL機制)，便於使用

- Rate limiter in a distributed environments

  - Race condition (類似超賣問題)

    - Locks

      - 會降低效能，吞吐量會受影響

    - Lua script

      - 因為是「原子性的」
      - 因為 lock 是對資源層級的鎖定，靈活性較低，以原子性的腳本來做，能夠只在需要的步驟上使用

    - sorted sets data structure

      - [Skip List](https://mecha-mind.medium.com/redis-sorted-sets-and-skip-lists-4f849d188a33)

  - Synchronization issue
 
    在跨 VPC / AZ 的情況下，很可能 rate limiter 內的資訊與狀態不一致，對同一個user，不同請求會隨機跳轉到不同 rate limiter 上被處理，那就等於白搭了，所以在這裡會建議用同一個 redis cluster，以及啟用 sticky session機制，讓同一個 user 的不同請求都能在同一個 rate limiter 上被處理

    - sticky sessions

      - 讓 client 去固定 rate limiter，不彈性不好擴展

    - centralized data stores

      - 需要跨機器，依然使用 Redis 的用意？
      - REF: [A Comprehensive Guide to Distributed Caching](https://blog.devgenius.io/a-comprehensive-guide-to-distributed-caching-827f1fa5a184)

- Performance optimization

  - multi-data center
  - eventual consistency model
    - 相較於完全一致性更有效率，但又保有一致性
    - chaper 6

- Monitoring

  - 需監控以下兩個面向是否能有效地達到目的

    - rate limiting rules
    - rate limiting algorithm
      - EX. flash sales --> Token bucket

## # 延伸討論

- 不同 layer 的防範

  - 在 layer 3 進行較快？
  - 全公司同一個 ip
  - 沒登入時 (也可在 layer 7 用 session)
  - 針對不同類型使用者，不同策略
  - 不同 layer 的防範，不是選擇，而是一起用，各自防不同面向。但用太多會不會影響到單次請求的效能？

- 加強 client，避免問題

  - client cache
  - 合理的發送請求？
  - catch exceptions or errors
  - back off time：可用指數型成長策略

- Hard vs Soft

  - Hard rate limiting

    - 超過限制的請求將被直接拒絕或返回錯誤
    - 確保系統在特定時間內不會超過預定的請求速率
    - 可能導致客戶端體驗不佳

  - Soft rate limiting

    - 允許短期內超過限制的請求，但在長期內維持平均速率不超過預定的限制
    - 通常使用 Bucket 演算法

- 當服務器「總負載」快要超出限額，會怎麼做？

  - 平均調低 rate limit threshold
  - 把流量留給重要的請求或用戶
  - 大家都暫停別用
  - 機器開下去
  - 其他

- Circuit breaking（熔斷）和 degradation（降級）
