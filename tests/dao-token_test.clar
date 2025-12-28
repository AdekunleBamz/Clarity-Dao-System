;; DAO Token Tests
;; Test suite for dao-token.clar

(define-constant DEPLOYER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant WALLET-1 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant WALLET-2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)

;; Test: Check initial supply
(define-public (test-initial-supply)
  (let (
    (supply (unwrap-panic (contract-call? .dao-token get-total-supply)))
  )
    (asserts! (is-eq supply u1000000000000) (err u1))
    (ok true)
  )
)

;; Test: Check token name
(define-public (test-token-name)
  (let (
    (name (unwrap-panic (contract-call? .dao-token get-name)))
  )
    (asserts! (is-eq name "DAO Governance Token") (err u2))
    (ok true)
  )
)

;; Test: Check token symbol
(define-public (test-token-symbol)
  (let (
    (symbol (unwrap-panic (contract-call? .dao-token get-symbol)))
  )
    (asserts! (is-eq symbol "DAOG") (err u3))
    (ok true)
  )
)

;; Test: Check decimals
(define-public (test-token-decimals)
  (let (
    (decimals (unwrap-panic (contract-call? .dao-token get-decimals)))
  )
    (asserts! (is-eq decimals u6) (err u4))
    (ok true)
  )
)

;; Test: Deployer has initial supply
(define-public (test-deployer-balance)
  (let (
    (balance (unwrap-panic (contract-call? .dao-token get-balance DEPLOYER)))
  )
    (asserts! (is-eq balance u1000000000000) (err u5))
    (ok true)
  )
)

;; Test: Transfer tokens
(define-public (test-transfer)
  (begin
    ;; Transfer 1000 tokens from deployer to wallet-1
    (try! (contract-call? .dao-token transfer u1000000000 DEPLOYER WALLET-1 none))
    (let (
      (balance (unwrap-panic (contract-call? .dao-token get-balance WALLET-1)))
    )
      (asserts! (is-eq balance u1000000000) (err u6))
      (ok true)
    )
  )
)

;; Test: Mint tokens (as owner)
(define-public (test-mint)
  (begin
    (try! (contract-call? .dao-token mint u500000000 WALLET-2))
    (let (
      (balance (unwrap-panic (contract-call? .dao-token get-balance WALLET-2)))
    )
      (asserts! (is-eq balance u500000000) (err u7))
      (ok true)
    )
  )
)

;; Test: Add and check minter
(define-public (test-add-minter)
  (begin
    (try! (contract-call? .dao-token add-minter WALLET-1))
    (asserts! (contract-call? .dao-token is-authorized-minter WALLET-1) (err u8))
    (ok true)
  )
)
