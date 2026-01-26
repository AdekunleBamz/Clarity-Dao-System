;; Staking Contract v5.1
;; Lock DAO tokens for rewards and enhanced voting power
;; Clarity 4
;;
;; FEATURES:
;; - Flexible staking periods (1 month to 2 years)
;; - Tiered reward rates based on lock duration
;; - Auto-compounding option
;; - Early unstake penalty
;; - Staking pools for different purposes
;; - Boost multipliers for governance participation

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u400))
(define-constant ERR-INSUFFICIENT-BALANCE (err u401))
(define-constant ERR-INVALID-AMOUNT (err u402))
(define-constant ERR-STAKE-NOT-FOUND (err u403))
(define-constant ERR-STAKE-LOCKED (err u404))
(define-constant ERR-INVALID-DURATION (err u405))
(define-constant ERR-NO-REWARDS (err u406))
(define-constant ERR-POOL-NOT-FOUND (err u407))
(define-constant ERR-POOL-FULL (err u408))
(define-constant ERR-ALREADY-STAKED (err u409))
(define-constant ERR-COOLDOWN-ACTIVE (err u410))
(define-constant ERR-PAUSED (err u411))

;; Staking durations (in blocks, ~10 min/block)
(define-constant DURATION-1-MONTH u4320)
(define-constant DURATION-3-MONTHS u12960)
(define-constant DURATION-6-MONTHS u25920)
(define-constant DURATION-1-YEAR u51840)
(define-constant DURATION-2-YEARS u103680)

;; Annual reward rates (basis points, 10000 = 100%)
(define-constant RATE-1-MONTH u500)      ;; 5% APY
(define-constant RATE-3-MONTHS u800)     ;; 8% APY
(define-constant RATE-6-MONTHS u1200)    ;; 12% APY
(define-constant RATE-1-YEAR u1800)      ;; 18% APY
(define-constant RATE-2-YEARS u2500)     ;; 25% APY

;; Early unstake penalty (basis points)
(define-constant EARLY-UNSTAKE-PENALTY u2000)  ;; 20%

;; Cooldown period for unstaking (blocks)
(define-constant UNSTAKE-COOLDOWN u144)  ;; ~24 hours

;; Governance participation bonus
(define-constant GOVERNANCE-BONUS u1500)  ;; 15% bonus for active voters

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var admin principal tx-sender)
(define-data-var token-contract principal .dao-token-v5-1)
(define-data-var governance-contract principal .governance-v5-1)
(define-data-var total-staked uint u0)
(define-data-var total-rewards-distributed uint u0)
(define-data-var rewards-pool uint u0)
(define-data-var stake-counter uint u0)
(define-data-var pool-counter uint u0)
(define-data-var paused bool false)

;; =====================
;; DATA MAPS
;; =====================

;; Individual stakes
(define-map stakes
  uint  ;; stake-id
  {
    staker: principal,
    amount: uint,
    pool-id: uint,
    start-block: uint,
    lock-until: uint,
    duration: uint,
    reward-rate: uint,
    rewards-claimed: uint,
    last-claim-block: uint,
    auto-compound: bool,
    unstake-requested: bool,
    unstake-available-block: uint
  }
)

;; User stake tracking
(define-map user-stakes principal (list 10 uint))

;; Total staked by user
(define-map user-total-staked principal uint)

;; Staking pools
(define-map staking-pools
  uint  ;; pool-id
  {
    name: (string-ascii 50),
    total-staked: uint,
    max-capacity: uint,
    bonus-rate: uint,
    active: bool,
    min-stake: uint,
    allowed-durations: (list 5 uint)
  }
)

;; Governance participation tracking (for bonus rewards)
(define-map governance-participation
  principal
  {
    proposals-voted: uint,
    last-vote-block: uint,
    eligible-for-bonus: bool
  }
)

;; Pending unstakes
(define-map pending-unstakes
  { staker: principal, stake-id: uint }
  { amount: uint, available-block: uint }
)

;; =====================
;; PRIVATE FUNCTIONS
;; =====================

;; Get reward rate for duration
(define-private (get-rate-for-duration (duration uint))
  (if (>= duration DURATION-2-YEARS)
    RATE-2-YEARS
    (if (>= duration DURATION-1-YEAR)
      RATE-1-YEAR
      (if (>= duration DURATION-6-MONTHS)
        RATE-6-MONTHS
        (if (>= duration DURATION-3-MONTHS)
          RATE-3-MONTHS
          RATE-1-MONTH
        )
      )
    )
  )
)

;; Calculate pending rewards
(define-private (calculate-pending-rewards (stake-id uint))
  (match (map-get? stakes stake-id)
    stake-data
    (let (
      (blocks-elapsed (- stacks-block-height (get last-claim-block stake-data)))
      (blocks-per-year u51840)
      (base-reward (/ (* (* (get amount stake-data) (get reward-rate stake-data)) blocks-elapsed) 
                      (* blocks-per-year u10000)))
      (pool (map-get? staking-pools (get pool-id stake-data)))
      (pool-bonus (match pool p (get bonus-rate p) u0))
      (gov-bonus (if (is-eligible-for-gov-bonus (get staker stake-data)) GOVERNANCE-BONUS u0))
      (total-bonus (+ pool-bonus gov-bonus))
      (bonus-amount (/ (* base-reward total-bonus) u10000))
    )
      (+ base-reward bonus-amount)
    )
    u0
  )
)

;; Check governance bonus eligibility
(define-private (is-eligible-for-gov-bonus (staker principal))
  (match (map-get? governance-participation staker)
    participation
    (and 
      (> (get proposals-voted participation) u2)
      (< (- stacks-block-height (get last-vote-block participation)) u10080)  ;; Active in last ~70 days
    )
    false
  )
)

;; =====================
;; PUBLIC FUNCTIONS
;; =====================

;; Create staking pool
(define-public (create-pool 
  (name (string-ascii 50))
  (max-capacity uint)
  (bonus-rate uint)
  (min-stake uint)
  (allowed-durations (list 5 uint)))
  (let (
    (pool-id (+ (var-get pool-counter) u1))
  )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    
    (map-set staking-pools pool-id {
      name: name,
      total-staked: u0,
      max-capacity: max-capacity,
      bonus-rate: bonus-rate,
      active: true,
      min-stake: min-stake,
      allowed-durations: allowed-durations
    })
    
    (var-set pool-counter pool-id)
    
    (print { event: "pool-created", version: "5.1", pool-id: pool-id, name: name })
    (ok pool-id)
  )
)

;; Stake tokens
(define-public (stake (amount uint) (duration uint) (pool-id uint) (auto-compound bool))
  (let (
    (staker tx-sender)
    (stake-id (+ (var-get stake-counter) u1))
    (pool (unwrap! (map-get? staking-pools pool-id) ERR-POOL-NOT-FOUND))
    (reward-rate (get-rate-for-duration duration))
    (lock-until (+ stacks-block-height duration))
  )
    (asserts! (not (var-get paused)) ERR-PAUSED)
    (asserts! (get active pool) ERR-POOL-NOT-FOUND)
    (asserts! (>= amount (get min-stake pool)) ERR-INVALID-AMOUNT)
    (asserts! (<= (+ (get total-staked pool) amount) (get max-capacity pool)) ERR-POOL-FULL)
    (asserts! (>= duration DURATION-1-MONTH) ERR-INVALID-DURATION)
    
    ;; Transfer tokens to staking contract
    (try! (contract-call? .dao-token-v5-1 transfer amount staker (as-contract tx-sender) none))
    
    ;; Create stake record
    (map-set stakes stake-id {
      staker: staker,
      amount: amount,
      pool-id: pool-id,
      start-block: stacks-block-height,
      lock-until: lock-until,
      duration: duration,
      reward-rate: reward-rate,
      rewards-claimed: u0,
      last-claim-block: stacks-block-height,
      auto-compound: auto-compound,
      unstake-requested: false,
      unstake-available-block: u0
    })
    
    ;; Update pool
    (map-set staking-pools pool-id 
      (merge pool { total-staked: (+ (get total-staked pool) amount) }))
    
    ;; Update user tracking
    (map-set user-total-staked staker 
      (+ (default-to u0 (map-get? user-total-staked staker)) amount))
    
    (var-set stake-counter stake-id)
    (var-set total-staked (+ (var-get total-staked) amount))
    
    (print { 
      event: "staked", 
      version: "5.1",
      stake-id: stake-id,
      staker: staker, 
      amount: amount, 
      duration: duration,
      lock-until: lock-until,
      reward-rate: reward-rate,
      pool-id: pool-id
    })
    (ok stake-id)
  )
)

;; Claim rewards
(define-public (claim-rewards (stake-id uint))
  (let (
    (stake-info (unwrap! (map-get? stakes stake-id) ERR-STAKE-NOT-FOUND))
    (pending-rewards (calculate-pending-rewards stake-id))
  )
    (asserts! (is-eq tx-sender (get staker stake-info)) ERR-NOT-AUTHORIZED)
    (asserts! (> pending-rewards u0) ERR-NO-REWARDS)
    (asserts! (<= pending-rewards (var-get rewards-pool)) ERR-INSUFFICIENT-BALANCE)
    
    ;; Handle auto-compound
    (if (get auto-compound stake-info)
      (begin
        ;; Add rewards to stake
        (map-set stakes stake-id 
          (merge stake-info { 
            amount: (+ (get amount stake-info) pending-rewards),
            last-claim-block: stacks-block-height,
            rewards-claimed: (+ (get rewards-claimed stake-info) pending-rewards)
          }))
        (var-set total-staked (+ (var-get total-staked) pending-rewards))
        (print { event: "rewards-compounded", version: "5.1", stake-id: stake-id, amount: pending-rewards })
      )
      (begin
        ;; Transfer rewards to staker
        (try! (as-contract (contract-call? .dao-token-v5-1 transfer pending-rewards tx-sender (get staker stake-info) none)))
        (map-set stakes stake-id 
          (merge stake-info { 
            last-claim-block: stacks-block-height,
            rewards-claimed: (+ (get rewards-claimed stake-info) pending-rewards)
          }))
        (print { event: "rewards-claimed", version: "5.1", stake-id: stake-id, amount: pending-rewards })
      )
    )
    
    (var-set rewards-pool (- (var-get rewards-pool) pending-rewards))
    (var-set total-rewards-distributed (+ (var-get total-rewards-distributed) pending-rewards))
    
    (ok pending-rewards)
  )
)

;; Request unstake (starts cooldown)
(define-public (request-unstake (stake-id uint))
  (let (
    (stake-info (unwrap! (map-get? stakes stake-id) ERR-STAKE-NOT-FOUND))
    (is-early (< stacks-block-height (get lock-until stake-info)))
  )
    (asserts! (is-eq tx-sender (get staker stake-info)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get unstake-requested stake-info)) ERR-ALREADY-STAKED)
    
    ;; Set unstake request
    (map-set stakes stake-id 
      (merge stake-info { 
        unstake-requested: true,
        unstake-available-block: (+ stacks-block-height UNSTAKE-COOLDOWN)
      }))
    
    (print { 
      event: "unstake-requested", 
      version: "5.1",
      stake-id: stake-id, 
      is-early: is-early,
      available-block: (+ stacks-block-height UNSTAKE-COOLDOWN)
    })
    (ok true)
  )
)

;; Complete unstake
(define-public (unstake (stake-id uint))
  (let (
    (stake-info (unwrap! (map-get? stakes stake-id) ERR-STAKE-NOT-FOUND))
    (staker (get staker stake-info))
    (amount (get amount stake-info))
    (is-early (< stacks-block-height (get lock-until stake-info)))
    (penalty (if is-early (/ (* amount EARLY-UNSTAKE-PENALTY) u10000) u0))
    (return-amount (- amount penalty))
    (pool (unwrap! (map-get? staking-pools (get pool-id stake-info)) ERR-POOL-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender staker) ERR-NOT-AUTHORIZED)
    (asserts! (get unstake-requested stake-info) ERR-STAKE-NOT-FOUND)
    (asserts! (>= stacks-block-height (get unstake-available-block stake-info)) ERR-COOLDOWN-ACTIVE)
    
    ;; Claim any pending rewards first
    (let ((pending-rewards (calculate-pending-rewards stake-id)))
      (if (> pending-rewards u0)
        (try! (as-contract (contract-call? .dao-token-v5-1 transfer pending-rewards tx-sender staker none)))
        true
      )
    )
    
    ;; Return staked tokens (minus penalty if early)
    (try! (as-contract (contract-call? .dao-token-v5-1 transfer return-amount tx-sender staker none)))
    
    ;; Penalty goes to rewards pool
    (if (> penalty u0)
      (var-set rewards-pool (+ (var-get rewards-pool) penalty))
      true
    )
    
    ;; Update pool
    (map-set staking-pools (get pool-id stake-info) 
      (merge pool { total-staked: (- (get total-staked pool) amount) }))
    
    ;; Update user tracking
    (map-set user-total-staked staker 
      (- (default-to u0 (map-get? user-total-staked staker)) amount))
    
    ;; Remove stake
    (map-delete stakes stake-id)
    
    (var-set total-staked (- (var-get total-staked) amount))
    
    (print { 
      event: "unstaked", 
      version: "5.1",
      stake-id: stake-id, 
      staker: staker, 
      amount: return-amount,
      penalty: penalty,
      was-early: is-early
    })
    (ok return-amount)
  )
)

;; Extend stake duration
(define-public (extend-stake (stake-id uint) (additional-duration uint))
  (let (
    (stake-info (unwrap! (map-get? stakes stake-id) ERR-STAKE-NOT-FOUND))
    (new-duration (+ (get duration stake-info) additional-duration))
    (new-rate (get-rate-for-duration new-duration))
    (new-lock-until (+ (get lock-until stake-info) additional-duration))
  )
    (asserts! (is-eq tx-sender (get staker stake-info)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get unstake-requested stake-info)) ERR-STAKE-LOCKED)
    
    (map-set stakes stake-id 
      (merge stake-info { 
        duration: new-duration,
        reward-rate: new-rate,
        lock-until: new-lock-until
      }))
    
    (print { 
      event: "stake-extended", 
      version: "5.1",
      stake-id: stake-id, 
      new-duration: new-duration,
      new-rate: new-rate
    })
    (ok new-rate)
  )
)

;; Add to existing stake
(define-public (add-to-stake (stake-id uint) (additional-amount uint))
  (let (
    (stake-info (unwrap! (map-get? stakes stake-id) ERR-STAKE-NOT-FOUND))
    (staker (get staker stake-info))
    (pool (unwrap! (map-get? staking-pools (get pool-id stake-info)) ERR-POOL-NOT-FOUND))
    (new-amount (+ (get amount stake-info) additional-amount))
  )
    (asserts! (is-eq tx-sender staker) ERR-NOT-AUTHORIZED)
    (asserts! (not (get unstake-requested stake-info)) ERR-STAKE-LOCKED)
    (asserts! (<= (+ (get total-staked pool) additional-amount) (get max-capacity pool)) ERR-POOL-FULL)
    
    ;; Transfer additional tokens
    (try! (contract-call? .dao-token-v5-1 transfer additional-amount staker (as-contract tx-sender) none))
    
    ;; Claim pending rewards first
    (let ((pending-rewards (calculate-pending-rewards stake-id)))
      (if (> pending-rewards u0)
        (begin
          (try! (as-contract (contract-call? .dao-token-v5-1 transfer pending-rewards tx-sender staker none)))
          (var-set rewards-pool (- (var-get rewards-pool) pending-rewards))
        )
        true
      )
    )
    
    ;; Update stake
    (map-set stakes stake-id 
      (merge stake-info { 
        amount: new-amount,
        last-claim-block: stacks-block-height
      }))
    
    ;; Update pool
    (map-set staking-pools (get pool-id stake-info) 
      (merge pool { total-staked: (+ (get total-staked pool) additional-amount) }))
    
    ;; Update user tracking
    (map-set user-total-staked staker 
      (+ (default-to u0 (map-get? user-total-staked staker)) additional-amount))
    
    (var-set total-staked (+ (var-get total-staked) additional-amount))
    
    (print { event: "stake-increased", version: "5.1", stake-id: stake-id, additional: additional-amount, new-total: new-amount })
    (ok new-amount)
  )
)

;; Record governance participation (called by governance contract)
(define-public (record-governance-vote (voter principal))
  (let (
    (current (default-to { proposals-voted: u0, last-vote-block: u0, eligible-for-bonus: false } 
                        (map-get? governance-participation voter)))
  )
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    
    (map-set governance-participation voter {
      proposals-voted: (+ (get proposals-voted current) u1),
      last-vote-block: stacks-block-height,
      eligible-for-bonus: (> (+ (get proposals-voted current) u1) u2)
    })
    
    (ok true)
  )
)

;; Fund rewards pool
(define-public (fund-rewards (amount uint))
  (begin
    (try! (contract-call? .dao-token-v5-1 transfer amount tx-sender (as-contract tx-sender) none))
    (var-set rewards-pool (+ (var-get rewards-pool) amount))
    (print { event: "rewards-funded", version: "5.1", amount: amount })
    (ok true)
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (set-pool-active (pool-id uint) (active bool))
  (let (
    (pool (unwrap! (map-get? staking-pools pool-id) ERR-POOL-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set staking-pools pool-id (merge pool { active: active }))
    (ok true)
  )
)

(define-public (toggle-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set paused (not (var-get paused)))
    (ok (var-get paused))
  )
)

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set admin new-admin)
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (get-stake (stake-id uint))
  (map-get? stakes stake-id)
)

(define-read-only (get-pool (pool-id uint))
  (map-get? staking-pools pool-id)
)

(define-read-only (get-pending-rewards (stake-id uint))
  (calculate-pending-rewards stake-id)
)

(define-read-only (get-user-total-staked (user principal))
  (default-to u0 (map-get? user-total-staked user))
)

(define-read-only (get-total-staked)
  (var-get total-staked)
)

(define-read-only (get-rewards-pool)
  (var-get rewards-pool)
)

(define-read-only (get-governance-participation (user principal))
  (map-get? governance-participation user)
)

(define-read-only (get-apr-for-duration (duration uint))
  (get-rate-for-duration duration)
)

(define-read-only (is-paused)
  (var-get paused)
)

;; =====================
;; INITIALIZATION
;; =====================

(begin
  ;; Create default pool
  (map-set staking-pools u1 {
    name: "General Staking",
    total-staked: u0,
    max-capacity: u1000000000000000,  ;; 1 billion tokens
    bonus-rate: u0,
    active: true,
    min-stake: u1000000,  ;; 1 token minimum
    allowed-durations: (list DURATION-1-MONTH DURATION-3-MONTHS DURATION-6-MONTHS DURATION-1-YEAR DURATION-2-YEARS)
  })
  (var-set pool-counter u1)
  (print { event: "staking-deployed", version: "5.1" })
)
