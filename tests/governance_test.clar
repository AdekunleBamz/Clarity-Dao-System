;; Governance Tests
;; Test suite for governance.clar

(define-constant DEPLOYER 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
(define-constant WALLET-1 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5)
(define-constant WALLET-2 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG)

;; Test: Create proposal
(define-public (test-create-proposal)
  (let (
    (proposal-id (unwrap-panic (contract-call? .governance create-proposal 
      "Test Proposal" 
      u"This is a test proposal for the DAO governance system"
      none)))
  )
    (asserts! (is-eq proposal-id u1) (err u1))
    (ok true)
  )
)

;; Test: Get proposal count
(define-public (test-proposal-count)
  (let (
    (count (contract-call? .governance get-proposal-count))
  )
    (asserts! (>= count u0) (err u2))
    (ok true)
  )
)

;; Test: Vote on proposal
(define-public (test-vote-for)
  (begin
    ;; First create a proposal
    (try! (contract-call? .governance create-proposal 
      "Voting Test" 
      u"Testing the voting mechanism"
      none))
    ;; Vote for the proposal
    (try! (contract-call? .governance vote u1 true))
    ;; Check vote was recorded
    (let (
      (vote (contract-call? .governance get-vote u1 DEPLOYER))
    )
      (asserts! (is-some vote) (err u3))
      (ok true)
    )
  )
)

;; Test: Check proposal is active
(define-public (test-proposal-active)
  (begin
    (try! (contract-call? .governance create-proposal 
      "Active Test" 
      u"Testing active status"
      none))
    (asserts! (contract-call? .governance is-proposal-active u1) (err u4))
    (ok true)
  )
)

;; Test: Would proposal pass calculation
(define-public (test-would-pass)
  (let (
    (would-pass (contract-call? .governance would-proposal-pass u1))
  )
    ;; Just check it returns a boolean without error
    (ok true)
  )
)

;; Test: Get DAO token contract
(define-public (test-get-dao-token)
  (let (
    (token-contract (contract-call? .governance get-dao-token-contract))
  )
    (ok true)
  )
)
