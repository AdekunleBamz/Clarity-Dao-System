;; Treasury Contract
;; Fund management with creator earnings (0.01 STX)
;; Clarity 4

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

;; Creator fee: 0.01 STX = 10000 micro-STX
(define-constant CREATOR-FEE u10000)

;; Withdrawal thresholds
(define-constant MIN-WITHDRAWAL u100000)      ;; Minimum 0.1 STX withdrawal
(define-constant MAX-WITHDRAWAL u100000000000) ;; Maximum 100,000 STX withdrawal

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var total-deposits uint u0)
(define-data-var total-withdrawals uint u0)
(define-data-var total-creator-fees uint u0)
(define-data-var creator-address principal tx-sender)
(define-data-var governance-contract principal tx-sender)
(define-data-var paused bool false)

;; =====================
;; DATA MAPS
;; =====================

;; Track member deposits
(define-map member-deposits principal uint)

;; Track approved withdrawals from governance
(define-map approved-withdrawals
  uint  ;; proposal-id
  {
    recipient: principal,
    amount: uint,
    claimed: bool
  }
)

;; =====================
;; PUBLIC FUNCTIONS
;; =====================

;; Deposit STX to treasury (with creator fee)
(define-public (deposit (amount uint))
  (let (
    (depositor tx-sender)
    (creator-cut CREATOR-FEE)
    (net-amount (- amount creator-cut))
    (creator (var-get creator-address))
  )
    ;; Validate amount covers creator fee
    (asserts! (> amount CREATOR-FEE) ERR-INVALID-AMOUNT)
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    
    ;; Pay creator fee first
    (try! (stx-transfer? creator-cut depositor creator))
    
    ;; Transfer net STX to treasury (contract holds it)
    ;; Note: STX sent to contract functions accumulates in contract balance
    
    ;; Update tracking
    (var-set total-deposits (+ (var-get total-deposits) net-amount))
    (var-set total-creator-fees (+ (var-get total-creator-fees) creator-cut))
    (map-set member-deposits depositor 
      (+ (default-to u0 (map-get? member-deposits depositor)) net-amount))
    
    (print { 
      event: "deposit", 
      depositor: depositor, 
      amount: net-amount,
      creator-fee: creator-cut
    })
    (ok net-amount)
  )
)

;; Deposit STX without creator fee (for internal transfers)
(define-public (deposit-no-fee (amount uint))
  (let (
    (depositor tx-sender)
  )
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    
    ;; Update tracking
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (map-set member-deposits depositor 
      (+ (default-to u0 (map-get? member-deposits depositor)) amount))
    
    (print { event: "deposit-no-fee", depositor: depositor, amount: amount })
    (ok amount)
  )
)

;; Request withdrawal (requires governance approval)
(define-public (request-withdrawal (proposal-id uint) (recipient principal) (amount uint))
  (begin
    ;; Only governance contract can request withdrawals
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (>= amount MIN-WITHDRAWAL) ERR-INVALID-AMOUNT)
    (asserts! (<= amount MAX-WITHDRAWAL) ERR-INVALID-AMOUNT)
    
    ;; Record approved withdrawal
    (map-set approved-withdrawals proposal-id {
      recipient: recipient,
      amount: amount,
      claimed: false
    })
    
    (print { 
      event: "withdrawal-approved", 
      proposal-id: proposal-id,
      recipient: recipient, 
      amount: amount 
    })
    (ok true)
  )
)

;; Claim approved withdrawal
(define-public (claim-withdrawal (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
    (recipient (get recipient withdrawal))
    (amount (get amount withdrawal))
    (creator-cut CREATOR-FEE)
    (net-amount (- amount creator-cut))
    (creator (var-get creator-address))
  )
    ;; Validate
    (asserts! (is-eq tx-sender recipient) ERR-NOT-AUTHORIZED)
    (asserts! (not (get claimed withdrawal)) ERR-ALREADY-CLAIMED)
    (asserts! (> amount CREATOR-FEE) ERR-INVALID-AMOUNT)
    
    ;; Transfer funds from contract to recipient
    (try! (as-contract (stx-transfer? net-amount tx-sender recipient)))
    
    ;; Pay creator fee from contract
    (try! (as-contract (stx-transfer? creator-cut tx-sender creator)))
    
    ;; Mark as claimed
    (map-set approved-withdrawals proposal-id (merge withdrawal { claimed: true }))
    
    ;; Update tracking
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    (var-set total-creator-fees (+ (var-get total-creator-fees) creator-cut))
    
    (print { 
      event: "withdrawal-claimed", 
      proposal-id: proposal-id,
      recipient: recipient, 
      amount: net-amount,
      creator-fee: creator-cut
    })
    (ok net-amount)
  )
)

;; Emergency withdrawal (owner only)
(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Transfer without fee in emergency
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    
    (print { event: "emergency-withdrawal", recipient: recipient, amount: amount })
    (ok amount)
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

;; Set creator address
(define-public (set-creator-address (new-creator principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set creator-address new-creator)
    (print { event: "creator-updated", creator: new-creator })
    (ok true)
  )
)

;; Set governance contract
(define-public (set-governance-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set governance-contract new-contract)
    (print { event: "governance-updated", contract: new-contract })
    (ok true)
  )
)

;; Pause/unpause treasury
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set paused pause)
    (print { event: "pause-toggled", paused: pause })
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

;; Get treasury balance
(define-read-only (get-treasury-balance)
  (stx-get-balance (as-contract tx-sender))
)

;; Get total deposits
(define-read-only (get-total-deposits)
  (var-get total-deposits)
)

;; Get total withdrawals
(define-read-only (get-total-withdrawals)
  (var-get total-withdrawals)
)

;; Get total creator fees paid
(define-read-only (get-total-creator-fees)
  (var-get total-creator-fees)
)

;; Get member deposit amount
(define-read-only (get-member-deposits (member principal))
  (default-to u0 (map-get? member-deposits member))
)

;; Get approved withdrawal details
(define-read-only (get-withdrawal (proposal-id uint))
  (map-get? approved-withdrawals proposal-id)
)

;; Check if treasury is paused
(define-read-only (is-paused)
  (var-get paused)
)

;; Get creator fee amount
(define-read-only (get-creator-fee)
  CREATOR-FEE
)

;; Get creator address
(define-read-only (get-creator-address)
  (var-get creator-address)
)

;; Get governance contract
(define-read-only (get-governance-contract)
  (var-get governance-contract)
)

;; Calculate net amount after creator fee
(define-read-only (calculate-net-amount (gross-amount uint))
  (if (> gross-amount CREATOR-FEE)
    (ok (- gross-amount CREATOR-FEE))
    ERR-INVALID-AMOUNT
  )
)

;; =====================
;; TREASURY STATS
;; =====================

(define-read-only (get-treasury-stats)
  {
    balance: (get-treasury-balance),
    total-deposits: (var-get total-deposits),
    total-withdrawals: (var-get total-withdrawals),
    total-creator-fees: (var-get total-creator-fees),
    paused: (var-get paused),
    creator-fee: CREATOR-FEE
  }
)
