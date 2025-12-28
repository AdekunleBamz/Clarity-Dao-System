;; Treasury Tests
;; Test suite for treasury.clar

(define-constant DEPLOYER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant WALLET-1 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant WALLET-2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)
(define-constant CREATOR-FEE u10000) ;; 0.01 STX

;; Test: Get creator fee
(define-public (test-creator-fee)
  (let (
    (fee (contract-call? .treasury get-creator-fee))
  )
    (asserts! (is-eq fee CREATOR-FEE) (err u1))
    (ok true)
  )
)

;; Test: Treasury not paused initially
(define-public (test-not-paused)
  (asserts! (not (contract-call? .treasury is-paused)) (err u2))
  (ok true)
)

;; Test: Deposit STX
(define-public (test-deposit)
  (let (
    ;; Deposit 1 STX (1000000 micro-STX)
    (deposit-amount u1000000)
    (net-amount (- deposit-amount CREATOR-FEE))
  )
    (try! (contract-call? .treasury deposit deposit-amount))
    (let (
      (member-deposits (contract-call? .treasury get-member-deposits DEPLOYER))
    )
      (asserts! (is-eq member-deposits net-amount) (err u3))
      (ok true)
    )
  )
)

;; Test: Deposit without fee
(define-public (test-deposit-no-fee)
  (let (
    (deposit-amount u500000)
  )
    (try! (contract-call? .treasury deposit-no-fee deposit-amount))
    (ok true)
  )
)

;; Test: Get treasury stats
(define-public (test-treasury-stats)
  (let (
    (stats (contract-call? .treasury get-treasury-stats))
  )
    (asserts! (is-eq (get creator-fee stats) CREATOR-FEE) (err u4))
    (ok true)
  )
)

;; Test: Calculate net amount
(define-public (test-calculate-net)
  (let (
    (gross u1000000)
    (net (unwrap-panic (contract-call? .treasury calculate-net-amount gross)))
  )
    (asserts! (is-eq net (- gross CREATOR-FEE)) (err u5))
    (ok true)
  )
)

;; Test: Get total creator fees
(define-public (test-total-creator-fees)
  (let (
    (fees (contract-call? .treasury get-total-creator-fees))
  )
    ;; Just verify it returns a uint
    (asserts! (>= fees u0) (err u6))
    (ok true)
  )
)

;; Test: Pause treasury (owner only)
(define-public (test-pause)
  (begin
    (try! (contract-call? .treasury set-paused true))
    (asserts! (contract-call? .treasury is-paused) (err u7))
    ;; Unpause for other tests
    (try! (contract-call? .treasury set-paused false))
    (ok true)
  )
)
