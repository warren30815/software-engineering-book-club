# 第四章：DESIGN A RATE LIMITER

## # 主軸

- 主要在 Layer 7: Application layer

- 作用：

  - 防止 DoS
  - 節省流量成本
  - 防止超載

- 目標：

  - server-side API rate limiter

    - REF: client: axios-rate-limit: other will be delayed automatically.

  - a large number of requests --> Low latency & little memory？

  - Exception handling, inform users

  - service (API Gateway) VS server-side code

  - Distributed

  - High fault tolerance

- service (API Gateway) VS server-side code

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

- 疑問

  - Sliding window log

    - 為什麼連被拒絕的請求也要加入 log 做計數？
    - REF: [網路上有人提出相同疑惑](https://www.reddit.com/r/AskComputerScience/comments/xktn2j/rate_limiting_why_log_rejected_requests/)

## # High-level architecture

## # Design deep dive

- Rate limiting rules

- Exceeding the rate limit

  - HTTP 429

    - 放到待處理
    - 直接捨棄

  - Rate limiter headers

    - 沒超過限制

      - X-Ratelimit-Remaining
      - X-Ratelimit-Limit
      - X-Rate-Limit-Reset

    - 超過限制回 429

      - X-Ratelimit-Retry-After

- Detailed design

- Rate limiter in a distributed environment

  - Race condition

    - Locks

      - 會降低效能

    - Lua script

      - 因為是「原子性的」
      - 因為 lock 是對資源層級的鎖定，靈活性較低，以原子性的腳本來做，能夠只在需要的步驟上使用

    - sorted sets data structure

      - [Skip List](https://mecha-mind.medium.com/redis-sorted-sets-and-skip-lists-4f849d188a33)

  - Synchronization issue

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

- 其他
