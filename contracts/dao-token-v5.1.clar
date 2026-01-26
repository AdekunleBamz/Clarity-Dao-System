;; DAO Token Contract v5.1
;; SIP-010 compliant fungible token with vesting, locking, and snapshots
;; Clarity 4
;;
;; UPGRADES FROM V1:
;; - Vesting schedules for team/investor allocations
;; - Token locking for bonus voting power
;; - Snapshot mechanism for voting
;; - Transferable admin roles
;; - Max supply cap
;; - Delegated transfers (approve/transferFrom)

;; =====================
;; TRAIT IMPLEMENTATION
;; =====================

(impl-trait .sip-010-trait.sip-010-trait)

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-INSUFFICIENT-BALANCE (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-MINT-FAILED (err u104))
(define-constant ERR-BURN-FAILED (err u105))
(define-constant ERR-TRANSFER-FAILED (err u106))
(define-constant ERR-MAX-SUPPLY-REACHED (err u107))
(define-constant ERR-TOKENS-LOCKED (err u108))
(define-constant ERR-VESTING-NOT-STARTED (err u109))
(define-constant ERR-NO-VESTED-TOKENS (err u110))
(define-constant ERR-INSUFFICIENT-ALLOWANCE (err u111))
(define-constant ERR-LOCK-PERIOD-NOT-ENDED (err u112))
(define-constant ERR-ALREADY-LOCKED (err u113))
(define-constant ERR-INVALID-LOCK-PERIOD (err u114))
(define-constant ERR-SNAPSHOT-NOT-FOUND (err u115))

;; Token metadata
(define-constant TOKEN-NAME "DAO Governance Token")
(define-constant TOKEN-SYMBOL "DAOG")
(define-constant TOKEN-DECIMALS u6)
(define-constant TOKEN-URI (some u"https://clarity-dao-system.io/token-metadata-v5.json"))

;; Supply limits
(define-constant MAX-SUPPLY u10000000000000)  ;; 10 million tokens max
(define-constant INITIAL-SUPPLY u1000000000000) ;; 1 million initial

;; Lock period bonuses (in blocks)
(define-constant LOCK-1-MONTH u4320)    ;; ~30 days
(define-constant LOCK-3-MONTHS u12960)  ;; ~90 days
(define-constant LOCK-6-MONTHS u25920)  ;; ~180 days
(define-constant LOCK-1-YEAR u51840)    ;; ~360 days

;; Voting power multipliers (basis points, 10000 = 1x)
(define-constant MULTIPLIER-1-MONTH u11000)   ;; 1.1x
(define-constant MULTIPLIER-3-MONTHS u12500)  ;; 1.25x
(define-constant MULTIPLIER-6-MONTHS u15000)  ;; 1.5x
(define-constant MULTIPLIER-1-YEAR u20000)    ;; 2x

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var token-supply uint u0)
(define-data-var minting-enabled bool true)
(define-data-var admin principal tx-sender)
(define-data-var snapshot-counter uint u0)

;; =====================
;; DATA MAPS
;; =====================

;; Token balances
(define-map balances principal uint)

;; Allowances for delegated transfers
(define-map allowances { owner: principal, spender: principal } uint)

;; Authorized minters
(define-map authorized-minters principal bool)

;; Vesting schedules
(define-map vesting-schedules
  principal
  {
    total-amount: uint,
    released-amount: uint,
    start-block: uint,
    cliff-blocks: uint,
    duration-blocks: uint,
    revocable: bool,
    revoked: bool
  }
)

;; Token locks for voting power boost
(define-map token-locks
  principal
  {
    amount: uint,
    lock-until: uint,
    multiplier: uint
  }
)

;; Snapshots for voting (block-based)
(define-map balance-snapshots
  { snapshot-id: uint, account: principal }
  uint
)

;; Snapshot block heights
(define-map snapshot-blocks uint uint)

;; Total supply at snapshot
(define-map supply-snapshots uint uint)

;; =====================
;; SIP-010 FUNCTIONS
;; =====================

(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account)))
)

(define-read-only (get-total-supply)
  (ok (var-get token-supply))
)

(define-read-only (get-name)
  (ok TOKEN-NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

(define-read-only (get-token-uri)
  (ok TOKEN-URI)
)

;; Transfer tokens
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    (let (
      (sender-balance (default-to u0 (map-get? balances sender)))
      (available-balance (get-available-balance sender))
    )
      (asserts! (>= available-balance amount) ERR-INSUFFICIENT-BALANCE)
      
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
      
      (match memo
        memo-value (begin (print memo-value) true)
        true
      )
      (print { event: "transfer", version: "5.1", sender: sender, recipient: recipient, amount: amount })
      (ok true)
    )
  )
)

;; =====================
;; ALLOWANCE FUNCTIONS
;; =====================

(define-public (approve (spender principal) (amount uint))
  (begin
    (map-set allowances { owner: tx-sender, spender: spender } amount)
    (print { event: "approval", owner: tx-sender, spender: spender, amount: amount })
    (ok true)
  )
)

(define-public (transfer-from (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (let (
    (current-allowance (default-to u0 (map-get? allowances { owner: sender, spender: tx-sender })))
    (sender-balance (default-to u0 (map-get? balances sender)))
    (available-balance (get-available-balance sender))
  )
    (asserts! (>= current-allowance amount) ERR-INSUFFICIENT-ALLOWANCE)
    (asserts! (>= available-balance amount) ERR-INSUFFICIENT-BALANCE)
    
    (map-set allowances { owner: sender, spender: tx-sender } (- current-allowance amount))
    (map-set balances sender (- sender-balance amount))
    (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
    
    (match memo
      memo-value (begin (print memo-value) true)
      true
    )
    (print { event: "transfer-from", version: "5.1", sender: sender, recipient: recipient, spender: tx-sender, amount: amount })
    (ok true)
  )
)

(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances { owner: owner, spender: spender })))
)

;; =====================
;; MINTING FUNCTIONS
;; =====================

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (or (is-eq tx-sender (var-get admin)) (is-authorized-minter tx-sender)) ERR-NOT-AUTHORIZED)
    (asserts! (var-get minting-enabled) ERR-MINT-FAILED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (<= (+ (var-get token-supply) amount) MAX-SUPPLY) ERR-MAX-SUPPLY-REACHED)
    
    (var-set token-supply (+ (var-get token-supply) amount))
    (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
    
    (print { event: "mint", version: "5.1", recipient: recipient, amount: amount })
    (ok true)
  )
)

(define-public (burn (amount uint) (owner principal))
  (begin
    (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    
    (let (
      (owner-balance (default-to u0 (map-get? balances owner)))
      (available-balance (get-available-balance owner))
    )
      (asserts! (>= available-balance amount) ERR-INSUFFICIENT-BALANCE)
      
      (var-set token-supply (- (var-get token-supply) amount))
      (map-set balances owner (- owner-balance amount))
      
      (print { event: "burn", version: "5.1", owner: owner, amount: amount })
      (ok true)
    )
  )
)

;; =====================
;; VESTING FUNCTIONS
;; =====================

;; Create vesting schedule (admin only)
(define-public (create-vesting-schedule 
  (beneficiary principal)
  (total-amount uint)
  (cliff-blocks uint)
  (duration-blocks uint)
  (revocable bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (> total-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (<= (+ (var-get token-supply) total-amount) MAX-SUPPLY) ERR-MAX-SUPPLY-REACHED)
    
    ;; Mint tokens to contract (held until vested)
    (var-set token-supply (+ (var-get token-supply) total-amount))
    (map-set balances beneficiary (+ (default-to u0 (map-get? balances beneficiary)) total-amount))
    
    ;; Create vesting schedule
    (map-set vesting-schedules beneficiary {
      total-amount: total-amount,
      released-amount: u0,
      start-block: stacks-block-height,
      cliff-blocks: cliff-blocks,
      duration-blocks: duration-blocks,
      revocable: revocable,
      revoked: false
    })
    
    (print { 
      event: "vesting-created", 
      version: "5.1",
      beneficiary: beneficiary, 
      total-amount: total-amount,
      cliff-blocks: cliff-blocks,
      duration-blocks: duration-blocks
    })
    (ok true)
  )
)

;; Calculate vested amount
(define-read-only (get-vested-amount (beneficiary principal))
  (match (map-get? vesting-schedules beneficiary)
    schedule
    (let (
      (elapsed (- stacks-block-height (get start-block schedule)))
      (cliff (get cliff-blocks schedule))
      (duration (get duration-blocks schedule))
      (total (get total-amount schedule))
    )
      (if (get revoked schedule)
        (get released-amount schedule)
        (if (< elapsed cliff)
          u0
          (if (>= elapsed duration)
            total
            (/ (* total elapsed) duration)
          )
        )
      )
    )
    u0
  )
)

;; Claim vested tokens (releases them for transfer)
(define-public (claim-vested-tokens)
  (let (
    (schedule (unwrap! (map-get? vesting-schedules tx-sender) ERR-VESTING-NOT-STARTED))
    (vested (get-vested-amount tx-sender))
    (released (get released-amount schedule))
    (claimable (- vested released))
  )
    (asserts! (> claimable u0) ERR-NO-VESTED-TOKENS)
    
    ;; Update released amount
    (map-set vesting-schedules tx-sender (merge schedule { released-amount: vested }))
    
    (print { event: "vesting-claimed", version: "5.1", beneficiary: tx-sender, amount: claimable })
    (ok claimable)
  )
)

;; Revoke vesting (admin only, if revocable)
(define-public (revoke-vesting (beneficiary principal))
  (let (
    (schedule (unwrap! (map-get? vesting-schedules beneficiary) ERR-VESTING-NOT-STARTED))
    (vested (get-vested-amount beneficiary))
    (total (get total-amount schedule))
    (unvested (- total vested))
  )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (get revocable schedule) ERR-NOT-AUTHORIZED)
    
    ;; Burn unvested tokens
    (var-set token-supply (- (var-get token-supply) unvested))
    (map-set balances beneficiary (- (default-to u0 (map-get? balances beneficiary)) unvested))
    
    ;; Mark as revoked
    (map-set vesting-schedules beneficiary (merge schedule { revoked: true, released-amount: vested }))
    
    (print { event: "vesting-revoked", version: "5.1", beneficiary: beneficiary, unvested-burned: unvested })
    (ok unvested)
  )
)

;; =====================
;; TOKEN LOCKING
;; =====================

;; Lock tokens for voting power boost
(define-public (lock-tokens (amount uint) (lock-period uint))
  (let (
    (current-lock (map-get? token-locks tx-sender))
    (balance (default-to u0 (map-get? balances tx-sender)))
    (multiplier (get-lock-multiplier lock-period))
    (lock-until (+ stacks-block-height lock-period))
  )
    (asserts! (is-none current-lock) ERR-ALREADY-LOCKED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (asserts! (>= balance amount) ERR-INSUFFICIENT-BALANCE)
    (asserts! (> multiplier u0) ERR-INVALID-LOCK-PERIOD)
    
    (map-set token-locks tx-sender {
      amount: amount,
      lock-until: lock-until,
      multiplier: multiplier
    })
    
    (print { 
      event: "tokens-locked", 
      version: "5.1",
      account: tx-sender, 
      amount: amount, 
      lock-until: lock-until,
      multiplier: multiplier
    })
    (ok true)
  )
)

;; Unlock tokens after lock period
(define-public (unlock-tokens)
  (let (
    (lock (unwrap! (map-get? token-locks tx-sender) ERR-NOT-AUTHORIZED))
  )
    (asserts! (>= stacks-block-height (get lock-until lock)) ERR-LOCK-PERIOD-NOT-ENDED)
    
    (map-delete token-locks tx-sender)
    
    (print { event: "tokens-unlocked", version: "5.1", account: tx-sender, amount: (get amount lock) })
    (ok (get amount lock))
  )
)

;; Get lock multiplier for a period
(define-read-only (get-lock-multiplier (lock-period uint))
  (if (>= lock-period LOCK-1-YEAR)
    MULTIPLIER-1-YEAR
    (if (>= lock-period LOCK-6-MONTHS)
      MULTIPLIER-6-MONTHS
      (if (>= lock-period LOCK-3-MONTHS)
        MULTIPLIER-3-MONTHS
        (if (>= lock-period LOCK-1-MONTH)
          MULTIPLIER-1-MONTH
          u0
        )
      )
    )
  )
)

;; Get available (unlocked) balance
(define-read-only (get-available-balance (account principal))
  (let (
    (balance (default-to u0 (map-get? balances account)))
    (locked (match (map-get? token-locks account)
              lock (get amount lock)
              u0))
    (vesting-schedule (map-get? vesting-schedules account))
    (unvested (match vesting-schedule
                schedule (- (get total-amount schedule) (get-vested-amount account))
                u0))
  )
    (- balance (+ locked unvested))
  )
)

;; Get voting power (includes lock multiplier)
(define-read-only (get-voting-power (account principal))
  (let (
    (balance (default-to u0 (map-get? balances account)))
    (lock (map-get? token-locks account))
  )
    (match lock
      l (+ 
          (- balance (get amount l))  ;; Unlocked tokens at 1x
          (/ (* (get amount l) (get multiplier l)) u10000)  ;; Locked tokens with multiplier
        )
      balance  ;; No lock, just balance
    )
  )
)

;; =====================
;; SNAPSHOT FUNCTIONS
;; =====================

;; Create a new snapshot (for voting)
(define-public (create-snapshot)
  (let (
    (snapshot-id (+ (var-get snapshot-counter) u1))
  )
    (asserts! (or (is-eq tx-sender (var-get admin)) (is-authorized-minter tx-sender)) ERR-NOT-AUTHORIZED)
    
    (var-set snapshot-counter snapshot-id)
    (map-set snapshot-blocks snapshot-id stacks-block-height)
    (map-set supply-snapshots snapshot-id (var-get token-supply))
    
    (print { event: "snapshot-created", version: "5.1", snapshot-id: snapshot-id, block: stacks-block-height })
    (ok snapshot-id)
  )
)

;; Record balance in snapshot
(define-public (record-snapshot-balance (snapshot-id uint) (account principal))
  (let (
    (balance (default-to u0 (map-get? balances account)))
  )
    (asserts! (<= snapshot-id (var-get snapshot-counter)) ERR-SNAPSHOT-NOT-FOUND)
    
    (map-set balance-snapshots { snapshot-id: snapshot-id, account: account } balance)
    (ok balance)
  )
)

;; Get balance at snapshot
(define-read-only (get-balance-at-snapshot (snapshot-id uint) (account principal))
  (default-to u0 (map-get? balance-snapshots { snapshot-id: snapshot-id, account: account }))
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (add-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set authorized-minters minter true)
    (print { event: "minter-added", version: "5.1", minter: minter })
    (ok true)
  )
)

(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-delete authorized-minters minter)
    (print { event: "minter-removed", version: "5.1", minter: minter })
    (ok true)
  )
)

(define-public (set-minting-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set minting-enabled enabled)
    (print { event: "minting-toggled", version: "5.1", enabled: enabled })
    (ok true)
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

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (is-authorized-minter (who principal))
  (default-to false (map-get? authorized-minters who))
)

(define-read-only (is-minting-enabled)
  (var-get minting-enabled)
)

(define-read-only (get-admin)
  (var-get admin)
)

(define-read-only (get-max-supply)
  MAX-SUPPLY
)

(define-read-only (get-lock-info (account principal))
  (map-get? token-locks account)
)

(define-read-only (get-vesting-schedule (beneficiary principal))
  (map-get? vesting-schedules beneficiary)
)

(define-read-only (get-current-snapshot-id)
  (var-get snapshot-counter)
)

;; =====================
;; INITIALIZATION
;; =====================

(begin
  (var-set token-supply INITIAL-SUPPLY)
  (map-set balances CONTRACT-OWNER INITIAL-SUPPLY)
  (print { event: "contract-deployed", version: "5.1", initial-supply: INITIAL-SUPPLY, max-supply: MAX-SUPPLY })
)
