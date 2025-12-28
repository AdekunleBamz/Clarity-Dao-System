;; DAO Token Contract
;; SIP-010 compliant fungible token for DAO membership and voting
;; Clarity 4

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

;; Token metadata
(define-constant TOKEN-NAME "DAO Governance Token")
(define-constant TOKEN-SYMBOL "DAOG")
(define-constant TOKEN-DECIMALS u6)
(define-constant TOKEN-URI (some u"https://clarity-dao-system.io/token-metadata.json"))

;; Initial supply: 1 million tokens (with 6 decimals)
(define-constant INITIAL-SUPPLY u1000000000000)

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var token-supply uint u0)
(define-data-var minting-enabled bool true)

;; =====================
;; DATA MAPS
;; =====================

(define-map balances principal uint)
(define-map allowances { owner: principal, spender: principal } uint)

;; Authorized minters (governance contract can mint)
(define-map authorized-minters principal bool)

;; =====================
;; SIP-010 FUNCTIONS
;; =====================

;; Get the token balance of a principal
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account)))
)

;; Get the total supply of tokens
(define-read-only (get-total-supply)
  (ok (var-get token-supply))
)

;; Get the token name
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

;; Get the token symbol
(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

;; Get the number of decimals
(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

;; Get the token URI for metadata
(define-read-only (get-token-uri)
  (ok TOKEN-URI)
)

;; Transfer tokens from sender to recipient
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    ;; Validate sender is tx-sender
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    ;; Validate amount is positive
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    ;; Check sufficient balance
    (let ((sender-balance (default-to u0 (map-get? balances sender))))
      (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
      ;; Update balances
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
      ;; Print memo if provided
      (match memo
        memo-value (begin (print memo-value) true)
        true
      )
      (print { event: "transfer", sender: sender, recipient: recipient, amount: amount })
      (ok true)
    )
  )
)

;; =====================
;; MINTING FUNCTIONS
;; =====================

;; Mint new tokens (only authorized minters)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (or (is-eq tx-sender CONTRACT-OWNER) (is-authorized-minter tx-sender)) ERR-NOT-AUTHORIZED)
    (asserts! (var-get minting-enabled) ERR-MINT-FAILED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    ;; Update supply and balance
    (var-set token-supply (+ (var-get token-supply) amount))
    (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
    (print { event: "mint", recipient: recipient, amount: amount })
    (ok true)
  )
)

;; Burn tokens
(define-public (burn (amount uint) (owner principal))
  (begin
    (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (let ((owner-balance (default-to u0 (map-get? balances owner))))
      (asserts! (>= owner-balance amount) ERR-INSUFFICIENT-BALANCE)
      ;; Update supply and balance
      (var-set token-supply (- (var-get token-supply) amount))
      (map-set balances owner (- owner-balance amount))
      (print { event: "burn", owner: owner, amount: amount })
      (ok true)
    )
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

;; Add authorized minter (only contract owner)
(define-public (add-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-set authorized-minters minter true)
    (print { event: "minter-added", minter: minter })
    (ok true)
  )
)

;; Remove authorized minter
(define-public (remove-minter (minter principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-delete authorized-minters minter)
    (print { event: "minter-removed", minter: minter })
    (ok true)
  )
)

;; Toggle minting
(define-public (set-minting-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set minting-enabled enabled)
    (print { event: "minting-toggled", enabled: enabled })
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

;; Check if principal is authorized minter
(define-read-only (is-authorized-minter (who principal))
  (default-to false (map-get? authorized-minters who))
)

;; Check if minting is enabled
(define-read-only (is-minting-enabled)
  (var-get minting-enabled)
)

;; Get allowance
(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances { owner: owner, spender: spender })))
)

;; =====================
;; INITIALIZATION
;; =====================

;; Mint initial supply to contract owner on deployment
(begin
  (var-set token-supply INITIAL-SUPPLY)
  (map-set balances CONTRACT-OWNER INITIAL-SUPPLY)
  (print { event: "initialized", initial-supply: INITIAL-SUPPLY, owner: CONTRACT-OWNER })
)
