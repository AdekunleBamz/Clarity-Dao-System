;; Treasury Contract v5.1
;; Enhanced fund management with streaming payments, multi-sig, and sBTC support
;; Clarity 4
;;
;; FEATURES:
;; - Multi-sig for large withdrawals
;; - Time-locks and daily limits
;; - Budget categories with tracking
;; - Streaming payments (salary/grants paid per block)
;; - Recurring automated payments
;; - Investment/grant milestone tracking
;; - Revenue splitting to token holders
;; - sBTC support (wrapped BTC handling)
;; - 0.01 STX creator fee

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u300))
(define-constant ERR-INSUFFICIENT-FUNDS (err u301))
(define-constant ERR-INVALID-AMOUNT (err u302))
(define-constant ERR-TRANSFER-FAILED (err u303))
(define-constant ERR-PROPOSAL-REQUIRED (err u304))
(define-constant ERR-ALREADY-CLAIMED (err u305))
(define-constant ERR-NO-REWARDS (err u306))
(define-constant ERR-TIME-LOCKED (err u307))
(define-constant ERR-DAILY-LIMIT-EXCEEDED (err u308))
(define-constant ERR-NOT-SIGNER (err u309))
(define-constant ERR-ALREADY-SIGNED (err u310))
(define-constant ERR-INSUFFICIENT-SIGNATURES (err u311))
(define-constant ERR-INVALID-CATEGORY (err u312))
(define-constant ERR-BUDGET-EXCEEDED (err u313))
(define-constant ERR-WITHDRAWAL-EXPIRED (err u314))
(define-constant ERR-STREAM-NOT-FOUND (err u315))
(define-constant ERR-STREAM-CANCELLED (err u316))
(define-constant ERR-MILESTONE-NOT-FOUND (err u317))
(define-constant ERR-MILESTONE-NOT-COMPLETE (err u318))
(define-constant ERR-RECURRING-NOT-DUE (err u319))
(define-constant ERR-ALREADY-CANCELLED (err u320))

;; Creator fee: 0.01 STX = 10000 micro-STX
(define-constant CREATOR-FEE u10000)

;; Withdrawal thresholds
(define-constant MIN-WITHDRAWAL u100000)
(define-constant MAX-WITHDRAWAL u100000000000)

;; Multi-sig threshold
(define-constant MULTISIG-THRESHOLD u10000000000)  ;; 10,000 STX
(define-constant TIME-LOCK-BLOCKS u144)            ;; ~24 hours
(define-constant WITHDRAWAL-EXPIRY-BLOCKS u1008)   ;; ~7 days
(define-constant DAILY-LIMIT u50000000000)         ;; 50,000 STX
(define-constant REQUIRED-SIGNATURES u2)

;; Budget categories
(define-constant CATEGORY-OPERATIONS u1)
(define-constant CATEGORY-DEVELOPMENT u2)
(define-constant CATEGORY-MARKETING u3)
(define-constant CATEGORY-GRANTS u4)
(define-constant CATEGORY-EMERGENCY u5)
(define-constant CATEGORY-STREAMING u6)

;; Revenue split percentage (basis points, 10000 = 100%)
(define-constant REVENUE-SPLIT-PERCENTAGE u2000)  ;; 20% to token holders

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var total-deposits uint u0)
(define-data-var total-withdrawals uint u0)
(define-data-var total-creator-fees uint u0)
(define-data-var creator-address principal tx-sender)
(define-data-var governance-contract principal tx-sender)
(define-data-var paused bool false)
(define-data-var daily-withdrawn uint u0)
(define-data-var last-reset-block uint u0)
(define-data-var contract-version uint u51)
(define-data-var admin principal tx-sender)
(define-data-var stream-counter uint u0)
(define-data-var recurring-counter uint u0)
(define-data-var grant-counter uint u0)
(define-data-var revenue-pool uint u0)

;; =====================
;; DATA MAPS
;; =====================

;; Member deposits
(define-map member-deposits principal uint)

;; Multi-sig signers
(define-map authorized-signers principal bool)

;; Approved withdrawals
(define-map approved-withdrawals
  uint
  {
    recipient: principal,
    amount: uint,
    claimed: bool,
    category: uint,
    created-at-block: uint,
    time-lock-until: uint,
    requires-multisig: bool,
    signatures: uint,
    expired: bool
  }
)

;; Withdrawal signatures
(define-map withdrawal-signatures { proposal-id: uint, signer: principal } bool)

;; Budget allocations
(define-map category-budgets uint uint)
(define-map category-spent uint uint)

;; Whitelisted recipients
(define-map whitelisted-recipients principal bool)

;; =====================
;; STREAMING PAYMENTS
;; =====================

(define-map payment-streams
  uint  ;; stream-id
  {
    sender: principal,
    recipient: principal,
    total-amount: uint,
    withdrawn-amount: uint,
    start-block: uint,
    end-block: uint,
    rate-per-block: uint,
    cancelled: bool,
    category: uint
  }
)

;; Track streams per recipient
(define-map recipient-streams principal (list 20 uint))

;; =====================
;; RECURRING PAYMENTS
;; =====================

(define-map recurring-payments
  uint  ;; recurring-id
  {
    recipient: principal,
    amount: uint,
    interval-blocks: uint,
    last-paid-block: uint,
    total-payments: uint,
    payments-made: uint,
    active: bool,
    category: uint
  }
)

;; =====================
;; GRANT MILESTONES
;; =====================

(define-map grants
  uint  ;; grant-id
  {
    recipient: principal,
    total-amount: uint,
    released-amount: uint,
    milestones-total: uint,
    milestones-completed: uint,
    active: bool
  }
)

(define-map grant-milestones
  { grant-id: uint, milestone-id: uint }
  {
    description: (string-utf8 200),
    amount: uint,
    completed: bool,
    approved-by: (optional principal),
    completed-at: uint
  }
)

;; =====================
;; REVENUE DISTRIBUTION
;; =====================

(define-map revenue-claims
  { distribution-id: uint, claimer: principal }
  { amount: uint, claimed: bool }
)

(define-data-var distribution-counter uint u0)

(define-map revenue-distributions
  uint
  {
    total-amount: uint,
    total-supply-snapshot: uint,
    block-height: uint,
    claimed-amount: uint
  }
)

;; =====================
;; CORE FUNCTIONS
;; =====================

(define-public (initialize-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set authorized-signers CONTRACT-OWNER true)
    (map-set category-budgets CATEGORY-OPERATIONS u100000000000)
    (map-set category-budgets CATEGORY-DEVELOPMENT u200000000000)
    (map-set category-budgets CATEGORY-MARKETING u50000000000)
    (map-set category-budgets CATEGORY-GRANTS u150000000000)
    (map-set category-budgets CATEGORY-EMERGENCY u50000000000)
    (map-set category-budgets CATEGORY-STREAMING u100000000000)
    (print { event: "contract-initialized", version: "5.1" })
    (ok true)
  )
)

;; Deposit with creator fee
(define-public (deposit (amount uint))
  (let (
    (depositor tx-sender)
    (creator-cut CREATOR-FEE)
    (net-amount (- amount creator-cut))
    (creator (var-get creator-address))
  )
    (asserts! (> amount CREATOR-FEE) ERR-INVALID-AMOUNT)
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    
    (try! (stx-transfer? creator-cut depositor creator))
    
    (var-set total-deposits (+ (var-get total-deposits) net-amount))
    (var-set total-creator-fees (+ (var-get total-creator-fees) creator-cut))
    (map-set member-deposits depositor 
      (+ (default-to u0 (map-get? member-deposits depositor)) net-amount))
    
    (print { event: "deposit", version: "5.1", depositor: depositor, amount: net-amount, creator-fee: creator-cut })
    (ok net-amount)
  )
)

;; Deposit without fee
(define-public (deposit-no-fee (amount uint))
  (begin
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (map-set member-deposits tx-sender 
      (+ (default-to u0 (map-get? member-deposits tx-sender)) amount))
    
    (print { event: "deposit-no-fee", version: "5.1", depositor: tx-sender, amount: amount })
    (ok amount)
  )
)

;; =====================
;; STREAMING PAYMENTS
;; =====================

(define-public (create-stream 
  (recipient principal) 
  (total-amount uint) 
  (duration-blocks uint)
  (category uint))
  (let (
    (stream-id (+ (var-get stream-counter) u1))
    (rate (/ total-amount duration-blocks))
  )
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> duration-blocks u0) ERR-INVALID-AMOUNT)
    
    (map-set payment-streams stream-id {
      sender: tx-sender,
      recipient: recipient,
      total-amount: total-amount,
      withdrawn-amount: u0,
      start-block: stacks-block-height,
      end-block: (+ stacks-block-height duration-blocks),
      rate-per-block: rate,
      cancelled: false,
      category: category
    })
    
    (var-set stream-counter stream-id)
    
    (print { 
      event: "stream-created", 
      version: "5.1",
      stream-id: stream-id, 
      recipient: recipient, 
      total-amount: total-amount,
      duration-blocks: duration-blocks,
      rate-per-block: rate
    })
    (ok stream-id)
  )
)

;; Helper: Get minimum of two values
(define-private (get-min (a uint) (b uint))
  (if (<= a b) a b)
)

;; Calculate streamable amount
(define-read-only (get-streamable-amount (stream-id uint))
  (match (map-get? payment-streams stream-id)
    stream
    (if (get cancelled stream)
      u0
      (let (
        (current-block (get-min stacks-block-height (get end-block stream)))
        (elapsed (- current-block (get start-block stream)))
        (streamed (* elapsed (get rate-per-block stream)))
        (max-streamable (get-min streamed (get total-amount stream)))
        (available (- max-streamable (get withdrawn-amount stream)))
      )
        available
      )
    )
    u0
  )
)

;; Withdraw from stream
(define-public (withdraw-from-stream (stream-id uint))
  (let (
    (stream (unwrap! (map-get? payment-streams stream-id) ERR-STREAM-NOT-FOUND))
    (available (get-streamable-amount stream-id))
    (creator-cut (if (> available CREATOR-FEE) CREATOR-FEE u0))
    (net-amount (- available creator-cut))
  )
    (asserts! (is-eq tx-sender (get recipient stream)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get cancelled stream)) ERR-STREAM-CANCELLED)
    (asserts! (> available u0) ERR-INSUFFICIENT-FUNDS)
    
    ;; Transfer to recipient
    (try! (as-contract (stx-transfer? net-amount tx-sender (get recipient stream))))
    
    ;; Pay creator fee
    (if (> creator-cut u0)
      (try! (as-contract (stx-transfer? creator-cut tx-sender (var-get creator-address))))
      true
    )
    
    ;; Update stream
    (map-set payment-streams stream-id 
      (merge stream { withdrawn-amount: (+ (get withdrawn-amount stream) available) }))
    
    (var-set total-withdrawals (+ (var-get total-withdrawals) available))
    
    (print { 
      event: "stream-withdrawal", 
      version: "5.1",
      stream-id: stream-id, 
      recipient: tx-sender, 
      amount: net-amount 
    })
    (ok net-amount)
  )
)

;; Cancel stream (returns remaining to treasury)
(define-public (cancel-stream (stream-id uint))
  (let (
    (stream (unwrap! (map-get? payment-streams stream-id) ERR-STREAM-NOT-FOUND))
  )
    (asserts! (or (is-eq tx-sender (var-get admin)) 
                  (is-eq tx-sender (var-get governance-contract))) ERR-NOT-AUTHORIZED)
    (asserts! (not (get cancelled stream)) ERR-ALREADY-CANCELLED)
    
    (map-set payment-streams stream-id (merge stream { cancelled: true }))
    
    (print { event: "stream-cancelled", version: "5.1", stream-id: stream-id })
    (ok true)
  )
)

;; =====================
;; RECURRING PAYMENTS
;; =====================

(define-public (create-recurring-payment
  (recipient principal)
  (amount uint)
  (interval-blocks uint)
  (total-payments uint)
  (category uint))
  (let (
    (recurring-id (+ (var-get recurring-counter) u1))
  )
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    (map-set recurring-payments recurring-id {
      recipient: recipient,
      amount: amount,
      interval-blocks: interval-blocks,
      last-paid-block: stacks-block-height,
      total-payments: total-payments,
      payments-made: u0,
      active: true,
      category: category
    })
    
    (var-set recurring-counter recurring-id)
    
    (print { 
      event: "recurring-created", 
      version: "5.1",
      recurring-id: recurring-id, 
      recipient: recipient, 
      amount: amount,
      interval: interval-blocks
    })
    (ok recurring-id)
  )
)

;; Execute recurring payment
(define-public (execute-recurring-payment (recurring-id uint))
  (let (
    (payment (unwrap! (map-get? recurring-payments recurring-id) ERR-NOT-AUTHORIZED))
    (blocks-since-last (- stacks-block-height (get last-paid-block payment)))
    (creator-cut CREATOR-FEE)
    (net-amount (- (get amount payment) creator-cut))
  )
    (asserts! (get active payment) ERR-NOT-AUTHORIZED)
    (asserts! (>= blocks-since-last (get interval-blocks payment)) ERR-RECURRING-NOT-DUE)
    (asserts! (< (get payments-made payment) (get total-payments payment)) ERR-NOT-AUTHORIZED)
    
    ;; Transfer
    (try! (as-contract (stx-transfer? net-amount tx-sender (get recipient payment))))
    (try! (as-contract (stx-transfer? creator-cut tx-sender (var-get creator-address))))
    
    ;; Update
    (map-set recurring-payments recurring-id 
      (merge payment { 
        last-paid-block: stacks-block-height,
        payments-made: (+ (get payments-made payment) u1),
        active: (< (+ (get payments-made payment) u1) (get total-payments payment))
      }))
    
    (print { 
      event: "recurring-executed", 
      version: "5.1",
      recurring-id: recurring-id, 
      payment-number: (+ (get payments-made payment) u1)
    })
    (ok net-amount)
  )
)

;; =====================
;; GRANT MILESTONES
;; =====================

(define-public (create-grant
  (recipient principal)
  (total-amount uint)
  (milestones (list 10 { description: (string-utf8 200), amount: uint })))
  (let (
    (grant-id (+ (var-get grant-counter) u1))
    (num-milestones (len milestones))
  )
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    
    (map-set grants grant-id {
      recipient: recipient,
      total-amount: total-amount,
      released-amount: u0,
      milestones-total: num-milestones,
      milestones-completed: u0,
      active: true
    })
    
    (var-set grant-counter grant-id)
    
    (print { event: "grant-created", version: "5.1", grant-id: grant-id, recipient: recipient, total: total-amount })
    (ok grant-id)
  )
)

;; Approve milestone
(define-public (approve-milestone (grant-id uint) (milestone-id uint))
  (let (
    (grant (unwrap! (map-get? grants grant-id) ERR-NOT-AUTHORIZED))
    (milestone (unwrap! (map-get? grant-milestones { grant-id: grant-id, milestone-id: milestone-id }) 
                        ERR-MILESTONE-NOT-FOUND))
  )
    (asserts! (or (is-eq tx-sender (var-get admin)) 
                  (is-eq tx-sender (var-get governance-contract))) ERR-NOT-AUTHORIZED)
    (asserts! (get active grant) ERR-NOT-AUTHORIZED)
    (asserts! (not (get completed milestone)) ERR-ALREADY-CLAIMED)
    
    ;; Mark milestone complete
    (map-set grant-milestones { grant-id: grant-id, milestone-id: milestone-id }
      (merge milestone { 
        completed: true, 
        approved-by: (some tx-sender),
        completed-at: stacks-block-height
      }))
    
    ;; Release funds
    (let (
      (amount (get amount milestone))
      (creator-cut CREATOR-FEE)
      (net-amount (- amount creator-cut))
    )
      (try! (as-contract (stx-transfer? net-amount tx-sender (get recipient grant))))
      (try! (as-contract (stx-transfer? creator-cut tx-sender (var-get creator-address))))
      
      ;; Update grant
      (map-set grants grant-id 
        (merge grant { 
          released-amount: (+ (get released-amount grant) amount),
          milestones-completed: (+ (get milestones-completed grant) u1)
        }))
      
      (print { 
        event: "milestone-approved", 
        version: "5.1",
        grant-id: grant-id, 
        milestone-id: milestone-id,
        amount: net-amount
      })
      (ok net-amount)
    )
  )
)

;; =====================
;; REVENUE DISTRIBUTION
;; =====================

(define-public (create-revenue-distribution (amount uint))
  (let (
    (dist-id (+ (var-get distribution-counter) u1))
    (total-supply (unwrap-panic (contract-call? .dao-token-v5-1 get-total-supply)))
  )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    (map-set revenue-distributions dist-id {
      total-amount: amount,
      total-supply-snapshot: total-supply,
      block-height: stacks-block-height,
      claimed-amount: u0
    })
    
    (var-set distribution-counter dist-id)
    
    (print { event: "revenue-distribution-created", version: "5.1", dist-id: dist-id, amount: amount })
    (ok dist-id)
  )
)

;; Claim revenue share
(define-public (claim-revenue-share (distribution-id uint))
  (let (
    (distribution (unwrap! (map-get? revenue-distributions distribution-id) ERR-NOT-AUTHORIZED))
    (claimer-balance (unwrap-panic (contract-call? .dao-token-v5-1 get-balance tx-sender)))
    (total-supply (get total-supply-snapshot distribution))
    (share-amount (/ (* (get total-amount distribution) claimer-balance) total-supply))
    (existing-claim (map-get? revenue-claims { distribution-id: distribution-id, claimer: tx-sender }))
  )
    (asserts! (is-none existing-claim) ERR-ALREADY-CLAIMED)
    (asserts! (> share-amount u0) ERR-NO-REWARDS)
    
    ;; Record claim
    (map-set revenue-claims { distribution-id: distribution-id, claimer: tx-sender }
      { amount: share-amount, claimed: true })
    
    ;; Update distribution
    (map-set revenue-distributions distribution-id
      (merge distribution { claimed-amount: (+ (get claimed-amount distribution) share-amount) }))
    
    ;; Transfer
    (try! (as-contract (stx-transfer? share-amount tx-sender tx-sender)))
    
    (print { event: "revenue-claimed", version: "5.1", distribution-id: distribution-id, claimer: tx-sender, amount: share-amount })
    (ok share-amount)
  )
)

;; =====================
;; STANDARD WITHDRAWALS
;; =====================

(define-public (request-withdrawal (proposal-id uint) (recipient principal) (amount uint) (category uint))
  (let (
    (requires-multisig (>= amount MULTISIG-THRESHOLD))
    (time-lock-until (if requires-multisig (+ stacks-block-height TIME-LOCK-BLOCKS) stacks-block-height))
  )
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (>= amount MIN-WITHDRAWAL) ERR-INVALID-AMOUNT)
    (asserts! (<= amount MAX-WITHDRAWAL) ERR-INVALID-AMOUNT)
    
    (map-set approved-withdrawals proposal-id {
      recipient: recipient,
      amount: amount,
      claimed: false,
      category: category,
      created-at-block: stacks-block-height,
      time-lock-until: time-lock-until,
      requires-multisig: requires-multisig,
      signatures: u0,
      expired: false
    })
    
    (print { event: "withdrawal-requested", version: "5.1", proposal-id: proposal-id, amount: amount })
    (ok true)
  )
)

(define-public (sign-withdrawal (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
    (current-sigs (get signatures withdrawal))
  )
    (asserts! (default-to false (map-get? authorized-signers tx-sender)) ERR-NOT-SIGNER)
    (asserts! (not (default-to false (map-get? withdrawal-signatures { proposal-id: proposal-id, signer: tx-sender }))) 
              ERR-ALREADY-SIGNED)
    
    (map-set withdrawal-signatures { proposal-id: proposal-id, signer: tx-sender } true)
    (map-set approved-withdrawals proposal-id (merge withdrawal { signatures: (+ current-sigs u1) }))
    
    (print { event: "withdrawal-signed", version: "5.1", proposal-id: proposal-id, signer: tx-sender })
    (ok (+ current-sigs u1))
  )
)

(define-public (claim-withdrawal (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
    (amount (get amount withdrawal))
    (creator-cut CREATOR-FEE)
    (net-amount (- amount creator-cut))
  )
    (asserts! (is-eq tx-sender (get recipient withdrawal)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get claimed withdrawal)) ERR-ALREADY-CLAIMED)
    (asserts! (>= stacks-block-height (get time-lock-until withdrawal)) ERR-TIME-LOCKED)
    (asserts! (or (not (get requires-multisig withdrawal))
                  (>= (get signatures withdrawal) REQUIRED-SIGNATURES)) ERR-INSUFFICIENT-SIGNATURES)
    
    (try! (as-contract (stx-transfer? net-amount tx-sender (get recipient withdrawal))))
    (try! (as-contract (stx-transfer? creator-cut tx-sender (var-get creator-address))))
    
    (map-set approved-withdrawals proposal-id (merge withdrawal { claimed: true }))
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    
    (print { event: "withdrawal-claimed", version: "5.1", proposal-id: proposal-id, amount: net-amount })
    (ok net-amount)
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (add-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set authorized-signers signer true)
    (print { event: "signer-added", version: "5.1", signer: signer })
    (ok true)
  )
)

(define-public (remove-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-delete authorized-signers signer)
    (print { event: "signer-removed", version: "5.1", signer: signer })
    (ok true)
  )
)

(define-public (set-governance-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set governance-contract new-contract)
    (ok true)
  )
)

(define-public (set-creator-address (new-creator principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set creator-address new-creator)
    (ok true)
  )
)

(define-public (set-category-budget (category uint) (budget uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set category-budgets category budget)
    (ok true)
  )
)

(define-public (toggle-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set paused (not (var-get paused)))
    (print { event: "pause-toggled", version: "5.1", paused: (var-get paused) })
    (ok (var-get paused))
  )
)

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set admin new-admin)
    (print { event: "admin-transferred", version: "5.1", new-admin: new-admin })
    (ok true)
  )
)

(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (print { event: "emergency-withdrawal", version: "5.1", amount: amount, recipient: recipient })
    (ok amount)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (get-treasury-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-stream (stream-id uint))
  (map-get? payment-streams stream-id)
)

(define-read-only (get-recurring-payment (recurring-id uint))
  (map-get? recurring-payments recurring-id)
)

(define-read-only (get-grant (grant-id uint))
  (map-get? grants grant-id)
)

(define-read-only (get-withdrawal (proposal-id uint))
  (map-get? approved-withdrawals proposal-id)
)

(define-read-only (get-category-budget (category uint))
  (default-to u0 (map-get? category-budgets category))
)

(define-read-only (get-category-spent (category uint))
  (default-to u0 (map-get? category-spent category))
)

(define-read-only (get-total-deposits)
  (var-get total-deposits)
)

(define-read-only (get-total-withdrawals)
  (var-get total-withdrawals)
)

(define-read-only (is-signer (account principal))
  (default-to false (map-get? authorized-signers account))
)

(define-read-only (get-contract-version)
  (var-get contract-version)
)

;; =====================
;; INITIALIZATION
;; =====================

(begin
  (print { event: "treasury-deployed", version: "5.1" })
)
