;; Governance Contract V2
;; Upgraded proposal creation, voting, delegation, and execution for DAO
;; Clarity 4
;;
;; UPGRADES FROM V1:
;; - Token-integrated voting power (reads directly from dao-token)
;; - Delegation system for voting power
;; - Timelock mechanism for proposal execution
;; - Dynamic quorum based on token supply
;; - Proposal cancellation by proposer
;; - Vote change capability before voting ends

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u200))
(define-constant ERR-PROPOSAL-NOT-FOUND (err u201))
(define-constant ERR-PROPOSAL-EXPIRED (err u202))
(define-constant ERR-PROPOSAL-NOT-ACTIVE (err u203))
(define-constant ERR-ALREADY-VOTED (err u204))
(define-constant ERR-INSUFFICIENT-TOKENS (err u205))
(define-constant ERR-PROPOSAL-NOT-PASSED (err u206))
(define-constant ERR-PROPOSAL-ALREADY-EXECUTED (err u207))
(define-constant ERR-VOTING-NOT-ENDED (err u208))
(define-constant ERR-INVALID-PROPOSAL (err u209))
(define-constant ERR-QUORUM-NOT-MET (err u210))
(define-constant ERR-TIMELOCK-NOT-EXPIRED (err u211))
(define-constant ERR-PROPOSAL-CANCELLED (err u212))
(define-constant ERR-CANNOT-DELEGATE-TO-SELF (err u213))
(define-constant ERR-CIRCULAR-DELEGATION (err u214))
(define-constant ERR-NO-VOTE-TO-CHANGE (err u215))
(define-constant ERR-DELEGATION-EXISTS (err u216))

;; Voting parameters
(define-constant VOTING-PERIOD u144)              ;; ~1 day in blocks (assuming 10 min blocks)
(define-constant TIMELOCK-PERIOD u72)             ;; ~12 hours delay before execution
(define-constant MIN-PROPOSAL-TOKENS u1000000000) ;; Minimum 1000 tokens to create proposal
(define-constant QUORUM-PERCENTAGE u10)           ;; 10% of total supply required for quorum
(define-constant APPROVAL-THRESHOLD u51)          ;; 51% approval required

;; Proposal status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PASSED u2)
(define-constant STATUS-REJECTED u3)
(define-constant STATUS-EXECUTED u4)
(define-constant STATUS-EXPIRED u5)
(define-constant STATUS-CANCELLED u6)

;; Proposal types
(define-constant TYPE-GENERAL u1)
(define-constant TYPE-FUNDING u2)
(define-constant TYPE-PARAMETER u3)
(define-constant TYPE-EMERGENCY u4)

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var proposal-count uint u0)
(define-data-var token-contract principal .dao-token)

;; =====================
;; DATA MAPS
;; =====================

;; Proposal storage (enhanced)
(define-map proposals
  uint
  {
    proposer: principal,
    title: (string-ascii 100),
    description: (string-utf8 500),
    proposal-type: uint,
    start-block: uint,
    end-block: uint,
    execution-block: uint,
    votes-for: uint,
    votes-against: uint,
    status: uint,
    execution-data: (optional (buff 256)),
    total-supply-snapshot: uint
  }
)

;; Track who has voted on which proposal
(define-map votes
  { proposal-id: uint, voter: principal }
  { amount: uint, vote-for: bool }
)

;; Voting power snapshot at proposal creation
(define-map voting-power-snapshot
  { proposal-id: uint, voter: principal }
  uint
)

;; Delegation system
(define-map delegations
  principal  ;; delegator
  principal  ;; delegate (who receives the voting power)
)

;; Track delegated power received
(define-map delegated-power-received
  principal
  uint
)

;; Track if user has active delegation
(define-map has-delegated principal bool)

;; =====================
;; PRIVATE FUNCTIONS
;; =====================

;; Get token balance from dao-token contract
(define-private (get-token-balance (account principal))
  (unwrap-panic (contract-call? .dao-token get-balance account))
)

;; Get total token supply from dao-token contract
(define-private (get-total-token-supply)
  (unwrap-panic (contract-call? .dao-token get-total-supply))
)

;; Calculate effective voting power (own tokens + delegated power)
(define-private (calculate-voting-power (voter principal))
  (let (
    (own-balance (get-token-balance voter))
    (delegated-to-voter (default-to u0 (map-get? delegated-power-received voter)))
    (has-delegated-away (default-to false (map-get? has-delegated voter)))
  )
    ;; If user has delegated their power away, they can't vote with own tokens
    (if has-delegated-away
      delegated-to-voter  ;; Only use power delegated TO them
      (+ own-balance delegated-to-voter)  ;; Own tokens + delegated power
    )
  )
)

;; Calculate dynamic quorum based on total supply
(define-private (calculate-quorum (total-supply uint))
  (/ (* total-supply QUORUM-PERCENTAGE) u100)
)

;; =====================
;; DELEGATION FUNCTIONS
;; =====================

;; Delegate voting power to another address
(define-public (delegate (delegate-to principal))
  (let (
    (delegator tx-sender)
    (delegator-balance (get-token-balance delegator))
  )
    ;; Cannot delegate to self
    (asserts! (not (is-eq delegator delegate-to)) ERR-CANNOT-DELEGATE-TO-SELF)
    ;; Must have tokens to delegate
    (asserts! (> delegator-balance u0) ERR-INSUFFICIENT-TOKENS)
    ;; Check for circular delegation (delegate-to shouldn't have delegated to delegator)
    (asserts! (not (is-eq (default-to delegate-to (map-get? delegations delegate-to)) delegator)) 
              ERR-CIRCULAR-DELEGATION)
    ;; Cannot delegate if already delegated (must revoke first)
    (asserts! (not (default-to false (map-get? has-delegated delegator))) ERR-DELEGATION-EXISTS)
    
    ;; Set delegation
    (map-set delegations delegator delegate-to)
    (map-set has-delegated delegator true)
    
    ;; Update delegated power received by delegate
    (map-set delegated-power-received delegate-to
      (+ (default-to u0 (map-get? delegated-power-received delegate-to)) delegator-balance))
    
    (print { 
      event: "delegation-created", 
      delegator: delegator, 
      delegate: delegate-to, 
      amount: delegator-balance 
    })
    (ok true)
  )
)

;; Revoke delegation
(define-public (revoke-delegation)
  (let (
    (delegator tx-sender)
    (delegate-to (unwrap! (map-get? delegations delegator) ERR-NOT-AUTHORIZED))
    (delegator-balance (get-token-balance delegator))
  )
    ;; Remove delegation
    (map-delete delegations delegator)
    (map-set has-delegated delegator false)
    
    ;; Update delegated power (subtract)
    (let ((current-delegated (default-to u0 (map-get? delegated-power-received delegate-to))))
      (map-set delegated-power-received delegate-to
        (if (>= current-delegated delegator-balance)
          (- current-delegated delegator-balance)
          u0
        ))
    )
    
    (print { event: "delegation-revoked", delegator: delegator, delegate: delegate-to })
    (ok true)
  )
)

;; =====================
;; PROPOSAL FUNCTIONS
;; =====================

;; Create a new proposal
(define-public (create-proposal 
  (title (string-ascii 100)) 
  (description (string-utf8 500))
  (proposal-type uint)
  (execution-data (optional (buff 256))))
  (let (
    (proposer tx-sender)
    (proposal-id (+ (var-get proposal-count) u1))
    (current-block stacks-block-height)
    (proposer-power (calculate-voting-power proposer))
    (total-supply (get-total-token-supply))
  )
    ;; Check minimum token requirement
    (asserts! (>= proposer-power MIN-PROPOSAL-TOKENS) ERR-INSUFFICIENT-TOKENS)
    ;; Validate proposal type
    (asserts! (and (>= proposal-type TYPE-GENERAL) (<= proposal-type TYPE-EMERGENCY)) ERR-INVALID-PROPOSAL)
    
    ;; Create proposal with total supply snapshot for quorum calculation
    (map-set proposals proposal-id {
      proposer: proposer,
      title: title,
      description: description,
      proposal-type: proposal-type,
      start-block: current-block,
      end-block: (+ current-block VOTING-PERIOD),
      execution-block: (+ current-block VOTING-PERIOD TIMELOCK-PERIOD),
      votes-for: u0,
      votes-against: u0,
      status: STATUS-ACTIVE,
      execution-data: execution-data,
      total-supply-snapshot: total-supply
    })
    
    ;; Update proposal count
    (var-set proposal-count proposal-id)
    
    (print { 
      event: "proposal-created", 
      proposal-id: proposal-id, 
      proposer: proposer, 
      title: title,
      proposal-type: proposal-type,
      end-block: (+ current-block VOTING-PERIOD),
      execution-block: (+ current-block VOTING-PERIOD TIMELOCK-PERIOD),
      total-supply-snapshot: total-supply
    })
    (ok proposal-id)
  )
)

;; Cancel a proposal (only by proposer, only if still active)
(define-public (cancel-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    ;; Only proposer can cancel
    (asserts! (is-eq tx-sender (get proposer proposal)) ERR-NOT-AUTHORIZED)
    ;; Can only cancel active proposals
    (asserts! (is-eq (get status proposal) STATUS-ACTIVE) ERR-PROPOSAL-NOT-ACTIVE)
    
    ;; Mark as cancelled
    (map-set proposals proposal-id (merge proposal { status: STATUS-CANCELLED }))
    
    (print { event: "proposal-cancelled", proposal-id: proposal-id, proposer: tx-sender })
    (ok true)
  )
)

;; Cast a vote on a proposal
(define-public (vote (proposal-id uint) (vote-for bool))
  (let (
    (voter tx-sender)
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (voter-power (calculate-voting-power voter))
  )
    ;; Check proposal is active
    (asserts! (is-eq (get status proposal) STATUS-ACTIVE) ERR-PROPOSAL-NOT-ACTIVE)
    ;; Check voting period
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    ;; Check hasn't voted already
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: voter })) ERR-ALREADY-VOTED)
    ;; Check has voting power
    (asserts! (> voter-power u0) ERR-INSUFFICIENT-TOKENS)
    
    ;; Record vote
    (map-set votes 
      { proposal-id: proposal-id, voter: voter }
      { amount: voter-power, vote-for: vote-for }
    )
    
    ;; Snapshot voting power
    (map-set voting-power-snapshot
      { proposal-id: proposal-id, voter: voter }
      voter-power
    )
    
    ;; Update vote counts
    (if vote-for
      (map-set proposals proposal-id (merge proposal { votes-for: (+ (get votes-for proposal) voter-power) }))
      (map-set proposals proposal-id (merge proposal { votes-against: (+ (get votes-against proposal) voter-power) }))
    )
    
    (print { 
      event: "vote-cast", 
      proposal-id: proposal-id, 
      voter: voter, 
      vote-for: vote-for, 
      amount: voter-power 
    })
    (ok true)
  )
)

;; Change vote on a proposal (before voting ends)
(define-public (change-vote (proposal-id uint) (new-vote-for bool))
  (let (
    (voter tx-sender)
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (existing-vote (unwrap! (map-get? votes { proposal-id: proposal-id, voter: voter }) ERR-NO-VOTE-TO-CHANGE))
    (vote-amount (get amount existing-vote))
    (old-vote-for (get vote-for existing-vote))
  )
    ;; Check proposal is active
    (asserts! (is-eq (get status proposal) STATUS-ACTIVE) ERR-PROPOSAL-NOT-ACTIVE)
    ;; Check voting period
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    
    ;; Only process if vote is actually changing
    (if (is-eq old-vote-for new-vote-for)
      (ok true)  ;; No change needed
      (begin
        ;; Update vote record
        (map-set votes 
          { proposal-id: proposal-id, voter: voter }
          { amount: vote-amount, vote-for: new-vote-for }
        )
        
        ;; Update vote counts (remove from old, add to new)
        (if old-vote-for
          ;; Was FOR, now AGAINST
          (map-set proposals proposal-id (merge proposal { 
            votes-for: (- (get votes-for proposal) vote-amount),
            votes-against: (+ (get votes-against proposal) vote-amount)
          }))
          ;; Was AGAINST, now FOR
          (map-set proposals proposal-id (merge proposal { 
            votes-for: (+ (get votes-for proposal) vote-amount),
            votes-against: (- (get votes-against proposal) vote-amount)
          }))
        )
        
        (print { 
          event: "vote-changed", 
          proposal-id: proposal-id, 
          voter: voter, 
          new-vote-for: new-vote-for,
          amount: vote-amount 
        })
        (ok true)
      )
    )
  )
)

;; Finalize a proposal after voting ends
(define-public (finalize-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (total-votes (+ (get votes-for proposal) (get votes-against proposal)))
    (quorum-threshold (calculate-quorum (get total-supply-snapshot proposal)))
  )
    ;; Check proposal is still active
    (asserts! (is-eq (get status proposal) STATUS-ACTIVE) ERR-PROPOSAL-NOT-ACTIVE)
    ;; Check voting period has ended
    (asserts! (> stacks-block-height (get end-block proposal)) ERR-VOTING-NOT-ENDED)
    
    ;; Determine outcome based on dynamic quorum
    (if (< total-votes quorum-threshold)
      ;; Quorum not met - expired
      (begin
        (map-set proposals proposal-id (merge proposal { status: STATUS-EXPIRED }))
        (print { 
          event: "proposal-expired", 
          proposal-id: proposal-id, 
          reason: "quorum-not-met",
