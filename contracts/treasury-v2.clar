;; Treasury V2 Contract
;; Enhanced fund management with multi-sig, time-locks, and budget categories
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
(define-constant ERR-TIME-LOCKED (err u307))
(define-constant ERR-DAILY-LIMIT-EXCEEDED (err u308))
(define-constant ERR-NOT-SIGNER (err u309))
(define-constant ERR-ALREADY-SIGNED (err u310))
(define-constant ERR-INSUFFICIENT-SIGNATURES (err u311))
(define-constant ERR-INVALID-CATEGORY (err u312))
(define-constant ERR-BUDGET-EXCEEDED (err u313))
(define-constant ERR-WITHDRAWAL-EXPIRED (err u314))

;; Creator fee: 0.01 STX = 10000 micro-STX
(define-constant CREATOR-FEE u10000)

;; Withdrawal thresholds
(define-constant MIN-WITHDRAWAL u100000)        ;; Minimum 0.1 STX withdrawal
(define-constant MAX-WITHDRAWAL u100000000000)  ;; Maximum 100,000 STX withdrawal

;; Multi-sig threshold (amount requiring multiple signatures)
(define-constant MULTISIG-THRESHOLD u10000000000)  ;; 10,000 STX requires multi-sig

;; Time-lock duration for large withdrawals (in blocks, ~24 hours)
(define-constant TIME-LOCK-BLOCKS u144)

;; Withdrawal expiry (in blocks, ~7 days)
(define-constant WITHDRAWAL-EXPIRY-BLOCKS u1008)

;; Daily withdrawal limit
(define-constant DAILY-LIMIT u50000000000)  ;; 50,000 STX per day

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

;; Daily limit tracking
(define-data-var daily-withdrawn uint u0)
(define-data-var last-reset-block uint u0)

;; Version tracking for upgrades
(define-data-var contract-version uint u2)

;; =====================
;; DATA MAPS
;; =====================

;; Track member deposits
(define-map member-deposits principal uint)

;; Multi-sig signers
(define-map authorized-signers principal bool)

;; Track approved withdrawals from governance (enhanced)
(define-map approved-withdrawals
  uint  ;; proposal-id
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

;; Track who signed each withdrawal
(define-map withdrawal-signatures
  { proposal-id: uint, signer: principal }
  bool
)

;; Budget allocations per category (quarterly)
(define-map category-budgets uint uint)

;; Category spending tracking (current quarter)
(define-map category-spent uint uint)

;; Whitelisted recipients (for fast-track withdrawals)
(define-map whitelisted-recipients principal bool)

;; =====================
;; INITIALIZATION
;; =====================
;; Note: Maps are initialized via admin functions after deployment
;; Owner should call initialize-contract after deployment

;; =====================
;; PUBLIC FUNCTIONS
;; =====================

;; Initialize contract (call once after deployment)
(define-public (initialize-contract)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    ;; Set owner as first signer
    (map-set authorized-signers CONTRACT-OWNER true)
    ;; Set default budgets
    (map-set category-budgets CATEGORY-OPERATIONS u100000000000)
    (map-set category-budgets CATEGORY-DEVELOPMENT u200000000000)
    (map-set category-budgets CATEGORY-MARKETING u50000000000)
    (map-set category-budgets CATEGORY-GRANTS u150000000000)
    (map-set category-budgets CATEGORY-EMERGENCY u50000000000)
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
    ;; Validate amount covers creator fee
    (asserts! (> amount CREATOR-FEE) ERR-INVALID-AMOUNT)
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    
    ;; Pay creator fee first
    (try! (stx-transfer? creator-cut depositor creator))
    
    ;; Update tracking
    (var-set total-deposits (+ (var-get total-deposits) net-amount))
    (var-set total-creator-fees (+ (var-get total-creator-fees) creator-cut))
    (map-set member-deposits depositor 
      (+ (default-to u0 (map-get? member-deposits depositor)) net-amount))
    
    (print { 
      event: "deposit", 
      version: u2,
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
    
    (print { event: "deposit-no-fee", version: u2, depositor: depositor, amount: amount })
    (ok amount)
  )
)

;; Request withdrawal with category (requires governance approval)
(define-public (request-withdrawal (proposal-id uint) (recipient principal) (amount uint) (category uint))
  (let (
    (requires-multisig (>= amount MULTISIG-THRESHOLD))
    (time-lock-until (if requires-multisig 
                        (+ stacks-block-height TIME-LOCK-BLOCKS) 
                        stacks-block-height))
    (category-budget (default-to u0 (map-get? category-budgets category)))
    (category-spending (default-to u0 (map-get? category-spent category)))
  )
    ;; Only governance contract can request withdrawals
    (asserts! (is-eq tx-sender (var-get governance-contract)) ERR-NOT-AUTHORIZED)
    (asserts! (>= amount MIN-WITHDRAWAL) ERR-INVALID-AMOUNT)
    (asserts! (<= amount MAX-WITHDRAWAL) ERR-INVALID-AMOUNT)
    (asserts! (and (>= category u1) (<= category u5)) ERR-INVALID-CATEGORY)
    
    ;; Check category budget
    (asserts! (<= (+ category-spending amount) category-budget) ERR-BUDGET-EXCEEDED)
    
    ;; Record approved withdrawal
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
    
    (print { 
      event: "withdrawal-requested", 
      version: u2,
      proposal-id: proposal-id,
      recipient: recipient, 
      amount: amount,
      category: category,
      requires-multisig: requires-multisig,
      time-lock-until: time-lock-until
    })
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
    ;; Validate signer is authorized
    (asserts! (default-to false (map-get? authorized-signers signer)) ERR-NOT-SIGNER)
    
    ;; Check not already signed
    (asserts! (not (default-to false (map-get? withdrawal-signatures { proposal-id: proposal-id, signer: signer }))) 
              ERR-ALREADY-SIGNED)
    
    ;; Check withdrawal not expired
    (asserts! (< stacks-block-height (+ (get created-at-block withdrawal) WITHDRAWAL-EXPIRY-BLOCKS)) 
              ERR-WITHDRAWAL-EXPIRED)
    
    ;; Record signature
    (map-set withdrawal-signatures { proposal-id: proposal-id, signer: signer } true)
    
    ;; Update signature count
    (map-set approved-withdrawals proposal-id 
      (merge withdrawal { signatures: (+ current-sigs u1) }))
    
    (print { 
      event: "withdrawal-signed", 
      proposal-id: proposal-id, 
      signer: signer,
      total-signatures: (+ current-sigs u1)
    })
    (ok (+ current-sigs u1))
  )
)

;; Claim approved withdrawal (enhanced with time-lock and multi-sig checks)
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
    ;; Validate caller is recipient
    (asserts! (is-eq tx-sender recipient) ERR-NOT-AUTHORIZED)
    (asserts! (not (get claimed withdrawal)) ERR-ALREADY-CLAIMED)
    (asserts! (not (get expired withdrawal)) ERR-WITHDRAWAL-EXPIRED)
    (asserts! (> amount CREATOR-FEE) ERR-INVALID-AMOUNT)
    
    ;; Check time-lock has passed
    (asserts! (>= stacks-block-height (get time-lock-until withdrawal)) ERR-TIME-LOCKED)
    
    ;; Check multi-sig requirements if applicable
    (asserts! (or 
                (not (get requires-multisig withdrawal))
                (>= (get signatures withdrawal) REQUIRED-SIGNATURES))
              ERR-INSUFFICIENT-SIGNATURES)
    
    ;; Check withdrawal not expired
    (asserts! (< stacks-block-height (+ (get created-at-block withdrawal) WITHDRAWAL-EXPIRY-BLOCKS)) 
              ERR-WITHDRAWAL-EXPIRED)
    
    ;; Check daily limit (reset if new day)
    (if (> (- stacks-block-height (var-get last-reset-block)) u144)
      (begin
        (var-set daily-withdrawn u0)
        (var-set last-reset-block stacks-block-height))
      true)
    
    (asserts! (<= (+ (var-get daily-withdrawn) amount) DAILY-LIMIT) ERR-DAILY-LIMIT-EXCEEDED)
    
    ;; Transfer funds from contract to recipient
    (try! (as-contract (stx-transfer? net-amount tx-sender recipient)))
    
    ;; Pay creator fee from contract
    (try! (as-contract (stx-transfer? creator-cut tx-sender creator)))
    
    ;; Mark as claimed and update tracking
    (map-set approved-withdrawals proposal-id (merge withdrawal { claimed: true }))
    
    ;; Update category spending
    (map-set category-spent category 
      (+ (default-to u0 (map-get? category-spent category)) amount))
    
    ;; Update totals
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    (var-set total-creator-fees (+ (var-get total-creator-fees) creator-cut))
    (var-set daily-withdrawn (+ (var-get daily-withdrawn) amount))
    
    (print { 
      event: "withdrawal-claimed", 
      version: u2,
      proposal-id: proposal-id,
      recipient: recipient, 
      amount: net-amount,
      category: category,
      creator-fee: creator-cut
    })
    (ok net-amount)
  )
)

;; Fast-track withdrawal for whitelisted recipients (smaller time-lock)
(define-public (fast-track-claim (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
    (recipient (get recipient withdrawal))
  )
    ;; Must be whitelisted
    (asserts! (default-to false (map-get? whitelisted-recipients recipient)) ERR-NOT-AUTHORIZED)
    
    ;; Reduce time-lock for whitelisted recipients
    (map-set approved-withdrawals proposal-id 
      (merge withdrawal { time-lock-until: stacks-block-height }))
    
    ;; Call regular claim
    (claim-withdrawal proposal-id)
  )
)

;; Emergency withdrawal (owner only, bypasses all checks)
(define-public (emergency-withdraw (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    ;; Transfer without fee in emergency
    (try! (as-contract (stx-transfer? amount tx-sender recipient)))
    
    (var-set total-withdrawals (+ (var-get total-withdrawals) amount))
    
    (print { event: "emergency-withdrawal", version: u2, recipient: recipient, amount: amount })
    (ok amount)
  )
)

;; Expire old unclaimed withdrawals
(define-public (expire-withdrawal (proposal-id uint))
  (let (
    (withdrawal (unwrap! (map-get? approved-withdrawals proposal-id) ERR-NOT-AUTHORIZED))
  )
    ;; Check if expired
    (asserts! (>= stacks-block-height (+ (get created-at-block withdrawal) WITHDRAWAL-EXPIRY-BLOCKS)) 
              ERR-NOT-AUTHORIZED)
    (asserts! (not (get claimed withdrawal)) ERR-ALREADY-CLAIMED)
    
    ;; Mark as expired
    (map-set approved-withdrawals proposal-id (merge withdrawal { expired: true }))
    
    (print { event: "withdrawal-expired", proposal-id: proposal-id })
    (ok true)
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

;; Add authorized signer for multi-sig
(define-public (add-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set authorized-signers signer true)
    (print { event: "signer-added", signer: signer })
    (ok true)
  )
)

;; Remove authorized signer
(define-public (remove-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (not (is-eq signer CONTRACT-OWNER)) ERR-NOT-AUTHORIZED) ;; Can't remove owner
    (map-delete authorized-signers signer)
    (print { event: "signer-removed", signer: signer })
    (ok true)
  )
)

;; Add whitelisted recipient
(define-public (add-whitelisted-recipient (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set whitelisted-recipients recipient true)
    (print { event: "recipient-whitelisted", recipient: recipient })
    (ok true)
  )
)

;; Remove whitelisted recipient
(define-public (remove-whitelisted-recipient (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-delete whitelisted-recipients recipient)
    (print { event: "recipient-removed", recipient: recipient })
    (ok true)
  )
)

;; Set category budget
(define-public (set-category-budget (category uint) (budget uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= category u1) (<= category u5)) ERR-INVALID-CATEGORY)
    (map-set category-budgets category budget)
    (print { event: "budget-updated", category: category, budget: budget })
    (ok true)
  )
)

;; Reset category spending (for new quarter)
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

;; Check if principal is authorized signer
(define-read-only (is-authorized-signer (signer principal))
  (default-to false (map-get? authorized-signers signer))
)

;; Check if principal is whitelisted recipient
(define-read-only (is-whitelisted-recipient (recipient principal))
  (default-to false (map-get? whitelisted-recipients recipient))
)

;; Get category budget
(define-read-only (get-category-budget (category uint))
  (default-to u0 (map-get? category-budgets category))
)

;; Get category spending
(define-read-only (get-category-spent (category uint))
  (default-to u0 (map-get? category-spent category))
)

;; Get category remaining budget
(define-read-only (get-category-remaining (category uint))
  (let (
    (budget (default-to u0 (map-get? category-budgets category)))
    (spent (default-to u0 (map-get? category-spent category)))
  )
    (if (> budget spent)
      (- budget spent)
      u0)
  )
)

;; Get daily withdrawal info
(define-read-only (get-daily-withdrawal-info)
  {
    withdrawn-today: (var-get daily-withdrawn),
    daily-limit: DAILY-LIMIT,
    remaining: (if (> DAILY-LIMIT (var-get daily-withdrawn))
                 (- DAILY-LIMIT (var-get daily-withdrawn))
                 u0),
    last-reset-block: (var-get last-reset-block)
  }
)

;; Check if withdrawal has sufficient signatures
(define-read-only (has-sufficient-signatures (proposal-id uint))
  (let (
    (withdrawal (map-get? approved-withdrawals proposal-id))
  )
    (match withdrawal
      w (if (get requires-multisig w)
          (>= (get signatures w) REQUIRED-SIGNATURES)
          true)
      false)
  )
)

;; Check if withdrawal is ready to claim
(define-read-only (is-withdrawal-ready (proposal-id uint))
  (let (
    (withdrawal (map-get? approved-withdrawals proposal-id))
  )
    (match withdrawal
      w (and
          (not (get claimed w))
          (not (get expired w))
          (>= stacks-block-height (get time-lock-until w))
          (or (not (get requires-multisig w))
              (>= (get signatures w) REQUIRED-SIGNATURES))
          (< stacks-block-height (+ (get created-at-block w) WITHDRAWAL-EXPIRY-BLOCKS)))
      false)
  )
)

;; Get contract version
(define-read-only (get-version)
  (var-get contract-version)
)

;; =====================
;; TREASURY STATS (ENHANCED)
;; =====================

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
    daily-limit: DAILY-LIMIT,
    time-lock-blocks: TIME-LOCK-BLOCKS
  }
)

;; Get all budget info
(define-read-only (get-all-budgets)
  {
    operations: {
      budget: (get-category-budget CATEGORY-OPERATIONS),
      spent: (get-category-spent CATEGORY-OPERATIONS),
      remaining: (get-category-remaining CATEGORY-OPERATIONS)
    },
    development: {
      budget: (get-category-budget CATEGORY-DEVELOPMENT),
      spent: (get-category-spent CATEGORY-DEVELOPMENT),
      remaining: (get-category-remaining CATEGORY-DEVELOPMENT)
    },
    marketing: {
      budget: (get-category-budget CATEGORY-MARKETING),
      spent: (get-category-spent CATEGORY-MARKETING),
      remaining: (get-category-remaining CATEGORY-MARKETING)
    },
    grants: {
      budget: (get-category-budget CATEGORY-GRANTS),
      spent: (get-category-spent CATEGORY-GRANTS),
      remaining: (get-category-remaining CATEGORY-GRANTS)
    },
    emergency: {
      budget: (get-category-budget CATEGORY-EMERGENCY),
      spent: (get-category-spent CATEGORY-EMERGENCY),
      remaining: (get-category-remaining CATEGORY-EMERGENCY)
    }
  }
)
