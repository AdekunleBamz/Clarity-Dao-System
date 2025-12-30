;; Treasury V2 Contract
;; Enhanced fund management with multi-sig and budget categories
;; Clarity 3

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
(define-constant ERR-NOT-SIGNER (err u309))
(define-constant ERR-ALREADY-SIGNED (err u310))
(define-constant ERR-INSUFFICIENT-SIGNATURES (err u311))
(define-constant ERR-INVALID-CATEGORY (err u312))
(define-constant ERR-BUDGET-EXCEEDED (err u313))

;; Creator fee: 0.01 STX = 10000 micro-STX
(define-constant CREATOR-FEE u10000)

;; Withdrawal thresholds
(define-constant MIN-WITHDRAWAL u100000)
(define-constant MAX-WITHDRAWAL u100000000000)

;; Multi-sig threshold (10,000 STX requires multi-sig)
(define-constant MULTISIG-THRESHOLD u10000000000)

;; Required signatures for multi-sig
(define-constant REQUIRED-SIGNATURES u2)

;; Budget categories
(define-constant CATEGORY-OPERATIONS u1)
(define-constant CATEGORY-DEVELOPMENT u2)
(define-constant CATEGORY-MARKETING u3)
(define-constant CATEGORY-GRANTS u4)
(define-constant CATEGORY-EMERGENCY u5)

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var total-deposits uint u0)
(define-data-var total-withdrawals uint u0)
(define-data-var total-creator-fees uint u0)
(define-data-var creator-address principal tx-sender)
(define-data-var governance-contract principal tx-sender)
(define-data-var paused bool false)
(define-data-var contract-version uint u2)
(define-data-var initialized bool false)

;; =====================
;; DATA MAPS
;; =====================

(define-map member-deposits principal uint)
(define-map authorized-signers principal bool)

(define-map approved-withdrawals
  uint
  {
    recipient: principal,
    amount: uint,
    claimed: bool,
    category: uint,
    requires-multisig: bool,
    signatures: uint
  }
)

(define-map withdrawal-signatures
  { proposal-id: uint, signer: principal }
  bool
)

(define-map category-budgets uint uint)
(define-map category-spent uint uint)
(define-map whitelisted-recipients principal bool)

;; =====================
;; PUBLIC FUNCTIONS
;; =====================

;; Initialize contract (call once after deployment)
(define-public (initialize-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (not (var-get initialized)) ERR-NOT-AUTHORIZED)
    (map-set authorized-signers CONTRACT-OWNER true)
    (map-set category-budgets CATEGORY-OPERATIONS u100000000000)
    (map-set category-budgets CATEGORY-DEVELOPMENT u200000000000)
    (map-set category-budgets CATEGORY-MARKETING u50000000000)
    (map-set category-budgets CATEGORY-GRANTS u150000000000)
    (map-set category-budgets CATEGORY-EMERGENCY u50000000000)
    (var-set initialized true)
    (print { event: "contract-initialized" })
    (ok true)
  )
)

;; Deposit STX to treasury (with creator fee)
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
    
    (print { event: "deposit", version: u2, depositor: depositor, amount: net-amount, creator-fee: creator-cut })
    (ok net-amount)
  )
)

;; Deposit without fee
(define-public (deposit-no-fee (amount uint))
  (let ((depositor tx-sender))
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    
    (var-set total-deposits (+ (var-get total-deposits) amount))
    (map-set member-deposits depositor 
      (+ (default-to u0 (map-get? member-deposits depositor)) amount))
    
    (print { event: "deposit-no-fee", version: u2, depositor: depositor, amount: amount })
    (ok amount)
  )
)

;; Request withdrawal with category
(define-public (request-withdrawal (proposal-id uint) (recipient principal) (amount uint) (category uint))
  (let (
    (requires-multisig (>= amount MULTISIG-THRESHOLD))
    (category-budget (default-to u0 (map-get? category-budgets category)))
    (category-spending (default-to u0 (map-get? category-spent category)))
  )
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (>= amount MIN-WITHDRAWAL) ERR-INVALID-AMOUNT)
    (asserts! (<= amount MAX-WITHDRAWAL) ERR-INVALID-AMOUNT)
    (asserts! (and (>= category u1) (<= category u5)) ERR-INVALID-CATEGORY)
    (asserts! (<= (+ category-spending amount) category-budget) ERR-BUDGET-EXCEEDED)
    
    (map-set approved-withdrawals proposal-id {
      recipient: recipient,
      amount: amount,
      claimed: false,
      category: category,
      requires-multisig: requires-multisig,
      signatures: u0
    })
    
    (print { event: "withdrawal-requested", version: u2, proposal-id: proposal-id, recipient: recipient, amount: amount, category: category, requires-multisig: requires-multisig })
    (ok true)
  )
)

;; Sign a multi-sig withdrawal
(define-public (sign-withdrawal (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
    (signer tx-sender)
    (current-sigs (get signatures withdrawal))
  )
    (asserts! (default-to false (map-get? authorized-signers signer)) ERR-NOT-SIGNER)
    (asserts! (not (default-to false (map-get? withdrawal-signatures { proposal-id: proposal-id, signer: signer }))) ERR-ALREADY-SIGNED)
    
    (map-set withdrawal-signatures { proposal-id: proposal-id, signer: signer } true)
    (map-set approved-withdrawals proposal-id (merge withdrawal { signatures: (+ current-sigs u1) }))
    
    (print { event: "withdrawal-signed", proposal-id: proposal-id, signer: signer, total-signatures: (+ current-sigs u1) })
    (ok (+ current-sigs u1))
  )
)

;; Claim approved withdrawal
(define-public (claim-withdrawal (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
    (recipient (get recipient withdrawal))
    (amount (get amount withdrawal))
    (category (get category withdrawal))
    (creator-cut CREATOR-FEE)
    (net-amount (- amount creator-cut))
    (creator (var-get creator-address))
  )
    (asserts! (is-eq tx-sender recipient) ERR-NOT-AUTHORIZED)
    (asserts! (not (get claimed withdrawal)) ERR-ALREADY-CLAIMED)
    (asserts! (> amount CREATOR-FEE) ERR-INVALID-AMOUNT)
    (asserts! (or (not (get requires-multisig withdrawal)) (>= (get signatures withdrawal) REQUIRED-SIGNATURES)) ERR-INSUFFICIENT-SIGNATURES)
    
    (try! (as-contract (stx-transfer? net-amount tx-sender recipient)))
    (try! (as-contract (stx-transfer? creator-cut tx-sender creator)))
    
    (map-set approved-withdrawals proposal-id (merge withdrawal { claimed: true }))
    (map-set category-spent category (+ (default-to u0 (map-get? category-spent category)) amount))
    
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    (var-set total-creator-fees (+ (var-get total-creator-fees) creator-cut))
    
    (print { event: "withdrawal-claimed", version: u2, proposal-id: proposal-id, recipient: recipient, amount: net-amount, category: category, creator-fee: creator-cut })
    (ok net-amount)
  )
)

;; Emergency withdrawal (owner only)
(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    (print { event: "emergency-withdrawal", version: u2, recipient: recipient, amount: amount })
    (ok amount)
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (set-creator-address (new-creator principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set creator-address new-creator)
    (print { event: "creator-updated", creator: new-creator })
    (ok true)
  )
)

(define-public (set-governance-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set governance-contract new-contract)
    (print { event: "governance-updated", contract: new-contract })
    (ok true)
  )
)

(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set paused pause)
    (print { event: "pause-toggled", paused: pause })
    (ok true)
  )
)

(define-public (add-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set authorized-signers signer true)
    (print { event: "signer-added", signer: signer })
    (ok true)
  )
)

(define-public (remove-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq signer CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
    (map-delete authorized-signers signer)
    (print { event: "signer-removed", signer: signer })
    (ok true)
  )
)

(define-public (add-whitelisted-recipient (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set whitelisted-recipients recipient true)
    (print { event: "recipient-whitelisted", recipient: recipient })
    (ok true)
  )
)

(define-public (set-category-budget (category uint) (budget uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= category u1) (<= category u5)) ERR-INVALID-CATEGORY)
    (map-set category-budgets category budget)
    (print { event: "budget-updated", category: category, budget: budget })
    (ok true)
  )
)

(define-public (reset-category-spending (category uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= category u1) (<= category u5)) ERR-INVALID-CATEGORY)
    (map-set category-spent category u0)
    (print { event: "spending-reset", category: category })
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (get-treasury-balance)
  (stx-get-balance (as-contract tx-sender))
)

(define-read-only (get-total-deposits)
  (var-get total-deposits)
)

(define-read-only (get-total-withdrawals)
  (var-get total-withdrawals)
)

(define-read-only (get-total-creator-fees)
  (var-get total-creator-fees)
)

(define-read-only (get-member-deposits (member principal))
  (default-to u0 (map-get? member-deposits member))
)

(define-read-only (get-withdrawal (proposal-id uint))
  (map-get? approved-withdrawals proposal-id)
)

(define-read-only (is-paused)
  (var-get paused)
)

(define-read-only (get-creator-fee)
  CREATOR-FEE
)

(define-read-only (get-creator-address)
  (var-get creator-address)
)

(define-read-only (get-governance-contract)
  (var-get governance-contract)
)

(define-read-only (calculate-net-amount (gross-amount uint))
  (if (> gross-amount CREATOR-FEE)
    (ok (- gross-amount CREATOR-FEE))
    ERR-INVALID-AMOUNT
  )
)

(define-read-only (is-authorized-signer (signer principal))
  (default-to false (map-get? authorized-signers signer))
)

(define-read-only (is-whitelisted-recipient (recipient principal))
  (default-to false (map-get? whitelisted-recipients recipient))
)

(define-read-only (get-category-budget (category uint))
  (default-to u0 (map-get? category-budgets category))
)

(define-read-only (get-category-spent (category uint))
  (default-to u0 (map-get? category-spent category))
)

(define-read-only (get-category-remaining (category uint))
  (let (
    (budget (default-to u0 (map-get? category-budgets category)))
    (spent (default-to u0 (map-get? category-spent category)))
  )
    (if (> budget spent) (- budget spent) u0)
  )
)

(define-read-only (has-sufficient-signatures (proposal-id uint))
  (match (map-get? approved-withdrawals proposal-id)
    w (if (get requires-multisig w) (>= (get signatures w) REQUIRED-SIGNATURES) true)
    false
  )
)

(define-read-only (get-version)
  (var-get contract-version)
)

(define-read-only (is-initialized)
  (var-get initialized)
)

(define-read-only (get-treasury-stats)
  {
    balance: (get-treasury-balance),
    total-deposits: (var-get total-deposits),
    total-withdrawals: (var-get total-withdrawals),
    total-creator-fees: (var-get total-creator-fees),
    paused: (var-get paused),
    creator-fee: CREATOR-FEE,
    version: (var-get contract-version),
    multisig-threshold: MULTISIG-THRESHOLD,
    initialized: (var-get initialized)
  }
)

(define-read-only (get-all-budgets)
  {
    operations: { budget: (get-category-budget CATEGORY-OPERATIONS), spent: (get-category-spent CATEGORY-OPERATIONS), remaining: (get-category-remaining CATEGORY-OPERATIONS) },
    development: { budget: (get-category-budget CATEGORY-DEVELOPMENT), spent: (get-category-spent CATEGORY-DEVELOPMENT), remaining: (get-category-remaining CATEGORY-DEVELOPMENT) },
    marketing: { budget: (get-category-budget CATEGORY-MARKETING), spent: (get-category-spent CATEGORY-MARKETING), remaining: (get-category-remaining CATEGORY-MARKETING) },
    grants: { budget: (get-category-budget CATEGORY-GRANTS), spent: (get-category-spent CATEGORY-GRANTS), remaining: (get-category-remaining CATEGORY-GRANTS) },
    emergency: { budget: (get-category-budget CATEGORY-EMERGENCY), spent: (get-category-spent CATEGORY-EMERGENCY), remaining: (get-category-remaining CATEGORY-EMERGENCY) }
  }
)
