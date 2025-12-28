;; Governance Contract
;; Proposal creation, voting, and execution for DAO
;; Clarity 4

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

;; Voting parameters
(define-constant VOTING-PERIOD u144)          ;; ~1 day in blocks (assuming 10 min blocks)
(define-constant MIN-PROPOSAL-TOKENS u1000000000) ;; Minimum 1000 tokens to create proposal
(define-constant QUORUM-PERCENTAGE u10)       ;; 10% quorum required
(define-constant APPROVAL-THRESHOLD u51)      ;; 51% approval required

;; Proposal status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PASSED u2)
(define-constant STATUS-REJECTED u3)
(define-constant STATUS-EXECUTED u4)
(define-constant STATUS-EXPIRED u5)

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var proposal-count uint u0)

;; =====================
;; DATA MAPS
;; =====================

;; Proposal storage
(define-map proposals
  uint
  {
    proposer: principal,
    title: (string-ascii 100),
    description: (string-utf8 500),
    start-block: uint,
    end-block: uint,
    votes-for: uint,
    votes-against: uint,
    status: uint,
    execution-data: (optional (buff 256))
  }
)

;; Track who has voted on which proposal
(define-map votes
  { proposal-id: uint, voter: principal }
  { amount: uint, vote-for: bool }
)

;; Member voting power snapshot at proposal creation
(define-map voting-power-snapshot
  { proposal-id: uint, voter: principal }
  uint
)

;; Member token balances for voting (set externally or via deposit)
(define-map member-voting-power principal uint)

;; =====================
;; PUBLIC FUNCTIONS
;; =====================

;; Register voting power (called by token holders)
(define-public (register-voting-power (amount uint))
  (begin
    (map-set member-voting-power tx-sender amount)
    (ok true)
  )
)

;; Create a new proposal
(define-public (create-proposal 
  (title (string-ascii 100)) 
  (description (string-utf8 500))
  (execution-data (optional (buff 256))))
  (let (
    (proposer tx-sender)
    (proposal-id (+ (var-get proposal-count) u1))
    (current-block stacks-block-height)
    (proposer-balance (default-to u0 (map-get? member-voting-power proposer)))
  )
    ;; Check minimum token requirement
    (asserts! (>= proposer-balance MIN-PROPOSAL-TOKENS) ERR-INSUFFICIENT-TOKENS)
    
    ;; Create proposal
    (map-set proposals proposal-id {
      proposer: proposer,
      title: title,
      description: description,
      start-block: current-block,
      end-block: (+ current-block VOTING-PERIOD),
      votes-for: u0,
      votes-against: u0,
      status: STATUS-ACTIVE,
      execution-data: execution-data
    })
    
    ;; Update proposal count
    (var-set proposal-count proposal-id)
    
    (print { 
      event: "proposal-created", 
      proposal-id: proposal-id, 
      proposer: proposer, 
      title: title,
      end-block: (+ current-block VOTING-PERIOD)
    })
    (ok proposal-id)
  )
)

;; Cast a vote on a proposal
(define-public (vote (proposal-id uint) (vote-for bool))
  (let (
    (voter tx-sender)
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (voter-balance (default-to u0 (map-get? member-voting-power voter)))
  )
    ;; Check proposal is active
    (asserts! (is-eq (get status proposal) STATUS-ACTIVE) ERR-PROPOSAL-NOT-ACTIVE)
    ;; Check voting period
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    ;; Check hasn't voted
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: voter })) ERR-ALREADY-VOTED)
    ;; Check has tokens
    (asserts! (> voter-balance u0) ERR-INSUFFICIENT-TOKENS)
    
    ;; Record vote
    (map-set votes 
      { proposal-id: proposal-id, voter: voter }
      { amount: voter-balance, vote-for: vote-for }
    )
    
    ;; Snapshot voting power
    (map-set voting-power-snapshot
      { proposal-id: proposal-id, voter: voter }
      voter-balance
    )
    
    ;; Update vote counts
    (if vote-for
      (map-set proposals proposal-id (merge proposal { votes-for: (+ (get votes-for proposal) voter-balance) }))
      (map-set proposals proposal-id (merge proposal { votes-against: (+ (get votes-against proposal) voter-balance) }))
    )
    
    (print { 
      event: "vote-cast", 
      proposal-id: proposal-id, 
      voter: voter, 
      vote-for: vote-for, 
      amount: voter-balance 
    })
    (ok true)
  )
)

;; Finalize a proposal after voting ends
(define-public (finalize-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (total-votes (+ (get votes-for proposal) (get votes-against proposal)))
    (quorum-threshold u100000000000) ;; Fixed quorum for simplicity
  )
    ;; Check proposal is still active
    (asserts! (is-eq (get status proposal) STATUS-ACTIVE) ERR-PROPOSAL-NOT-ACTIVE)
    ;; Check voting period has ended
    (asserts! (> stacks-block-height (get end-block proposal)) ERR-VOTING-NOT-ENDED)
    
    ;; Determine outcome
    (if (< total-votes quorum-threshold)
      ;; Quorum not met - expired
      (begin
        (map-set proposals proposal-id (merge proposal { status: STATUS-EXPIRED }))
        (print { event: "proposal-expired", proposal-id: proposal-id, reason: "quorum-not-met" })
        (ok STATUS-EXPIRED)
      )
      ;; Check if passed
      (if (> (* (get votes-for proposal) u100) (* total-votes APPROVAL-THRESHOLD))
        (begin
          (map-set proposals proposal-id (merge proposal { status: STATUS-PASSED }))
          (print { event: "proposal-passed", proposal-id: proposal-id })
          (ok STATUS-PASSED)
        )
        (begin
          (map-set proposals proposal-id (merge proposal { status: STATUS-REJECTED }))
          (print { event: "proposal-rejected", proposal-id: proposal-id })
          (ok STATUS-REJECTED)
        )
      )
    )
  )
)

;; Execute a passed proposal
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    ;; Check proposal passed
    (asserts! (is-eq (get status proposal) STATUS-PASSED) ERR-PROPOSAL-NOT-PASSED)
    
    ;; Mark as executed
    (map-set proposals proposal-id (merge proposal { status: STATUS-EXECUTED }))
    
    (print { 
      event: "proposal-executed", 
      proposal-id: proposal-id,
      execution-data: (get execution-data proposal)
    })
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

;; Get proposal details
(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

;; Get vote details
(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

;; Get total proposal count
(define-read-only (get-proposal-count)
  (var-get proposal-count)
)

;; Check if proposal is active
(define-read-only (is-proposal-active (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (and 
      (is-eq (get status proposal) STATUS-ACTIVE)
      (<= stacks-block-height (get end-block proposal))
    )
    false
  )
)

;; Get voting power for a proposal
(define-read-only (get-voting-power (proposal-id uint) (voter principal))
  (default-to u0 (map-get? voting-power-snapshot { proposal-id: proposal-id, voter: voter }))
)

;; Get member voting power
(define-read-only (get-member-voting-power (member principal))
  (default-to u0 (map-get? member-voting-power member))
)

;; Calculate if proposal would pass with current votes
(define-read-only (would-proposal-pass (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal 
      (let (
        (total-votes (+ (get votes-for proposal) (get votes-against proposal)))
      )
        (if (is-eq total-votes u0)
          false
          (> (* (get votes-for proposal) u100) (* total-votes APPROVAL-THRESHOLD))
        )
      )
    false
  )
)
