;; Treasury V2 Tests
;; Comprehensive test suite for treasury-v2.clar with multi-sig, time-locks, budgets

(define-constant DEPLOYER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant WALLET-1 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant WALLET-2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
(define-constant WALLET-3 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC)
(define-constant CREATOR-FEE u10000) ;; 0.01 STX

;; Budget Categories
(define-constant CATEGORY-OPERATIONS u1)
(define-constant CATEGORY-DEVELOPMENT u2)
(define-constant CATEGORY-MARKETING u3)
(define-constant CATEGORY-GRANTS u4)
(define-constant CATEGORY-EMERGENCY u5)

;; =====================
;; BASIC FUNCTIONALITY TESTS
;; =====================

;; Test: Get contract version
(define-public (test-version)
  (let (
    (version (contract-call? .treasury-v2 get-version))
  )
    (asserts! (is-eq version u2) (err u1))
    (ok true)
  )
)

;; Test: Get creator fee
(define-public (test-creator-fee)
  (let (
    (fee (contract-call? .treasury-v2 get-creator-fee))
  )
    (asserts! (is-eq fee CREATOR-FEE) (err u2))
    (ok true)
  )
)

;; Test: Treasury not paused initially
(define-public (test-not-paused)
  (asserts! (not (contract-call? .treasury-v2 is-paused)) (err u3))
  (ok true)
)

;; Test: Deposit STX
(define-public (test-deposit)
  (let (
    ;; Deposit 1 STX (1000000 micro-STX)
    (deposit-amount u1000000)
    (net-amount (- deposit-amount CREATOR-FEE))
  )
    (try! (contract-call? .treasury-v2 deposit deposit-amount))
    (let (
      (member-deposits (contract-call? .treasury-v2 get-member-deposits DEPLOYER))
    )
      (asserts! (is-eq member-deposits net-amount) (err u4))
      (ok true)
    )
  )
)

;; Test: Deposit without fee
(define-public (test-deposit-no-fee)
  (let (
    (deposit-amount u500000)
  )
    (try! (contract-call? .treasury-v2 deposit-no-fee deposit-amount))
    (ok true)
  )
)

;; Test: Get treasury stats (enhanced)
(define-public (test-treasury-stats)
  (let (
    (stats (contract-call? .treasury-v2 get-treasury-stats))
  )
    (asserts! (is-eq (get creator-fee stats) CREATOR-FEE) (err u5))
    (asserts! (is-eq (get version stats) u2) (err u6))
    (asserts! (> (get multisig-threshold stats) u0) (err u7))
    (asserts! (> (get daily-limit stats) u0) (err u8))
    (ok true)
  )
)

;; Test: Calculate net amount
(define-public (test-calculate-net)
  (let (
    (gross u1000000)
    (net (unwrap-panic (contract-call? .treasury-v2 calculate-net-amount gross)))
  )
    (asserts! (is-eq net (- gross CREATOR-FEE)) (err u9))
    (ok true)
  )
)

;; Test: Get total creator fees
(define-public (test-total-creator-fees)
  (let (
    (fees (contract-call? .treasury-v2 get-total-creator-fees))
  )
    ;; Just verify it returns a uint
    (asserts! (>= fees u0) (err u10))
    (ok true)
  )
)

;; =====================
;; PAUSE TESTS
;; =====================

;; Test: Pause treasury (owner only)
(define-public (test-pause)
  (begin
    (try! (contract-call? .treasury-v2 set-paused true))
    (asserts! (contract-call? .treasury-v2 is-paused) (err u11))
    ;; Unpause for other tests
    (try! (contract-call? .treasury-v2 set-paused false))
    (ok true)
  )
)

;; =====================
;; MULTI-SIG TESTS
;; =====================

;; Test: Owner is authorized signer by default
(define-public (test-owner-is-signer)
  (asserts! (contract-call? .treasury-v2 is-authorized-signer DEPLOYER) (err u20))
  (ok true)
)

;; Test: Add new signer
(define-public (test-add-signer)
  (begin
    (try! (contract-call? .treasury-v2 add-signer WALLET-1))
    (asserts! (contract-call? .treasury-v2 is-authorized-signer WALLET-1) (err u21))
    (ok true)
  )
)

;; Test: Remove signer
(define-public (test-remove-signer)
  (begin
    ;; First add a signer
    (try! (contract-call? .treasury-v2 add-signer WALLET-2))
    (asserts! (contract-call? .treasury-v2 is-authorized-signer WALLET-2) (err u22))
    ;; Then remove
    (try! (contract-call? .treasury-v2 remove-signer WALLET-2))
    (asserts! (not (contract-call? .treasury-v2 is-authorized-signer WALLET-2)) (err u23))
    (ok true)
  )
)

;; =====================
;; WHITELIST TESTS
;; =====================

;; Test: Add whitelisted recipient
(define-public (test-add-whitelist)
  (begin
    (try! (contract-call? .treasury-v2 add-whitelisted-recipient WALLET-1))
    (asserts! (contract-call? .treasury-v2 is-whitelisted-recipient WALLET-1) (err u30))
    (ok true)
  )
)

;; Test: Remove whitelisted recipient
(define-public (test-remove-whitelist)
  (begin
    (try! (contract-call? .treasury-v2 add-whitelisted-recipient WALLET-2))
    (try! (contract-call? .treasury-v2 remove-whitelisted-recipient WALLET-2))
    (asserts! (not (contract-call? .treasury-v2 is-whitelisted-recipient WALLET-2)) (err u31))
    (ok true)
  )
)

;; =====================
;; BUDGET CATEGORY TESTS
;; =====================

;; Test: Get default budgets
(define-public (test-default-budgets)
  (let (
    (ops-budget (contract-call? .treasury-v2 get-category-budget CATEGORY-OPERATIONS))
    (dev-budget (contract-call? .treasury-v2 get-category-budget CATEGORY-DEVELOPMENT))
    (mkt-budget (contract-call? .treasury-v2 get-category-budget CATEGORY-MARKETING))
    (grants-budget (contract-call? .treasury-v2 get-category-budget CATEGORY-GRANTS))
    (emergency-budget (contract-call? .treasury-v2 get-category-budget CATEGORY-EMERGENCY))
  )
    (asserts! (is-eq ops-budget u100000000000) (err u40))      ;; 100,000 STX
    (asserts! (is-eq dev-budget u200000000000) (err u41))      ;; 200,000 STX
    (asserts! (is-eq mkt-budget u50000000000) (err u42))       ;; 50,000 STX
    (asserts! (is-eq grants-budget u150000000000) (err u43))   ;; 150,000 STX
    (asserts! (is-eq emergency-budget u50000000000) (err u44)) ;; 50,000 STX
    (ok true)
  )
)

;; Test: Set category budget
(define-public (test-set-budget)
  (begin
    (try! (contract-call? .treasury-v2 set-category-budget CATEGORY-MARKETING u75000000000))
    (asserts! (is-eq (contract-call? .treasury-v2 get-category-budget CATEGORY-MARKETING) u75000000000) (err u45))
    ;; Reset to original
    (try! (contract-call? .treasury-v2 set-category-budget CATEGORY-MARKETING u50000000000))
    (ok true)
  )
)

;; Test: Get category remaining
(define-public (test-category-remaining)
  (let (
    (budget (contract-call? .treasury-v2 get-category-budget CATEGORY-OPERATIONS))
    (spent (contract-call? .treasury-v2 get-category-spent CATEGORY-OPERATIONS))
    (remaining (contract-call? .treasury-v2 get-category-remaining CATEGORY-OPERATIONS))
  )
    (asserts! (is-eq remaining (- budget spent)) (err u46))
    (ok true)
  )
)

;; Test: Reset category spending
(define-public (test-reset-spending)
  (begin
    (try! (contract-call? .treasury-v2 reset-category-spending CATEGORY-OPERATIONS))
    (asserts! (is-eq (contract-call? .treasury-v2 get-category-spent CATEGORY-OPERATIONS) u0) (err u47))
    (ok true)
  )
)

;; Test: Get all budgets
(define-public (test-all-budgets)
  (let (
    (all-budgets (contract-call? .treasury-v2 get-all-budgets))
  )
    ;; Verify operations budget exists
    (asserts! (> (get budget (get operations all-budgets)) u0) (err u48))
    ;; Verify development budget exists
    (asserts! (> (get budget (get development all-budgets)) u0) (err u49))
    (ok true)
  )
)

;; =====================
;; DAILY LIMIT TESTS
;; =====================

;; Test: Get daily withdrawal info
(define-public (test-daily-limit-info)
  (let (
    (daily-info (contract-call? .treasury-v2 get-daily-withdrawal-info))
  )
    (asserts! (is-eq (get daily-limit daily-info) u50000000000) (err u50)) ;; 50,000 STX
    (asserts! (>= (get remaining daily-info) u0) (err u51))
    (ok true)
  )
)

;; =====================
;; WITHDRAWAL READINESS TESTS
;; =====================

;; Test: Non-existent withdrawal is not ready
(define-public (test-nonexistent-withdrawal-not-ready)
  (asserts! (not (contract-call? .treasury-v2 is-withdrawal-ready u999999)) (err u60))
  (ok true)
)

;; Test: Non-existent withdrawal has no sufficient signatures
(define-public (test-nonexistent-no-signatures)
  (asserts! (not (contract-call? .treasury-v2 has-sufficient-signatures u999999)) (err u61))
  (ok true)
)

;; =====================
;; ADMIN FUNCTION TESTS
;; =====================

;; Test: Set creator address
(define-public (test-set-creator)
  (let (
    (original-creator (contract-call? .treasury-v2 get-creator-address))
  )
    (try! (contract-call? .treasury-v2 set-creator-address WALLET-1))
    (asserts! (is-eq (contract-call? .treasury-v2 get-creator-address) WALLET-1) (err u70))
    ;; Reset to original
    (try! (contract-call? .treasury-v2 set-creator-address original-creator))
    (ok true)
  )
)

;; Test: Set governance contract
(define-public (test-set-governance)
  (let (
    (original-gov (contract-call? .treasury-v2 get-governance-contract))
  )
    (try! (contract-call? .treasury-v2 set-governance-contract WALLET-1))
    (asserts! (is-eq (contract-call? .treasury-v2 get-governance-contract) WALLET-1) (err u71))
    ;; Reset to original
    (try! (contract-call? .treasury-v2 set-governance-contract original-gov))
    (ok true)
  )
)

;; =====================
;; EMERGENCY WITHDRAWAL TEST
;; =====================

;; Test: Emergency withdrawal works for owner
(define-public (test-emergency-withdraw)
  (begin
    ;; First deposit some funds
    (try! (contract-call? .treasury-v2 deposit u2000000))
    (let (
      (balance-before (contract-call? .treasury-v2 get-treasury-balance))
    )
      ;; Emergency withdraw a small amount
      (if (> balance-before u100000)
        (begin
          (try! (contract-call? .treasury-v2 emergency-withdraw u100000 DEPLOYER))
          (ok true))
        (ok true))
    )
  )
)

;; =====================
;; INTEGRATION TEST
;; =====================

;; Test: Full deposit flow with tracking
(define-public (test-full-deposit-flow)
  (let (
    (initial-deposits (contract-call? .treasury-v2 get-total-deposits))
    (deposit-amount u5000000)  ;; 5 STX
  )
    ;; Make deposit
    (try! (contract-call? .treasury-v2 deposit deposit-amount))
    
    ;; Verify tracking updated
    (let (
      (new-deposits (contract-call? .treasury-v2 get-total-deposits))
      (expected-net (- deposit-amount CREATOR-FEE))
    )
      (asserts! (is-eq new-deposits (+ initial-deposits expected-net)) (err u80))
      (ok true)
    )
  )
)

;; Test: Invalid category rejected
(define-public (test-invalid-category)
  (let (
    (invalid-budget (contract-call? .treasury-v2 get-category-budget u99))
  )
    ;; Invalid categories should return 0
    (asserts! (is-eq invalid-budget u0) (err u90))
    (ok true)
  )
)
