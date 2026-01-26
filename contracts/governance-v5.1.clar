;; Governance Contract v5.1
;; Advanced proposal, voting, delegation with optimistic governance and rewards
;; Clarity 4
;;
;; FEATURES:
;; - Token-integrated voting power (reads from dao-token-v5.1)
;; - Delegation system with chain support
;; - Timelock mechanism for execution
;; - Dynamic quorum based on token supply
;; - Proposal cancellation and vote changing
;; - Optimistic governance (auto-pass if no objections)
;; - Quadratic voting option
;; - Conviction voting (weight increases over time)
;; - Governance participation rewards

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
(define-constant ERR-OPTIMISTIC-OBJECTED (err u217))
(define-constant ERR-NO-REWARDS (err u218))
(define-constant ERR-ALREADY-CLAIMED (err u219))

;; Voting parameters
(define-constant VOTING-PERIOD u144)              ;; ~1 day in blocks
(define-constant OPTIMISTIC-PERIOD u72)           ;; ~12 hours for optimistic proposals
(define-constant TIMELOCK-PERIOD u72)             ;; ~12 hours delay before execution
(define-constant MIN-PROPOSAL-TOKENS u1000000000) ;; Minimum 1000 tokens to create proposal
(define-constant QUORUM-PERCENTAGE u10)           ;; 10% of total supply for quorum
(define-constant APPROVAL-THRESHOLD u51)          ;; 51% approval required
(define-constant OBJECTION-THRESHOLD u5)          ;; 5% objection kills optimistic proposal

;; Conviction voting parameters
(define-constant CONVICTION-GROWTH-RATE u10)      ;; 10% growth per 144 blocks
(define-constant MAX-CONVICTION-MULTIPLIER u30000) ;; 3x max multiplier

;; Governance rewards
(define-constant PROPOSAL-REWARD u100000000)      ;; 100 tokens for creating proposal
(define-constant VOTE-REWARD u10000000)           ;; 10 tokens for voting

;; Proposal status
(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PASSED u2)
(define-constant STATUS-REJECTED u3)
(define-constant STATUS-EXECUTED u4)
(define-constant STATUS-EXPIRED u5)
(define-constant STATUS-CANCELLED u6)
(define-constant STATUS-OPTIMISTIC u7)

;; Proposal types
(define-constant TYPE-GENERAL u1)
(define-constant TYPE-FUNDING u2)
(define-constant TYPE-PARAMETER u3)
(define-constant TYPE-EMERGENCY u4)
(define-constant TYPE-OPTIMISTIC u5)

;; Voting modes
(define-constant MODE-STANDARD u1)
(define-constant MODE-QUADRATIC u2)
(define-constant MODE-CONVICTION u3)

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var proposal-count uint u0)
(define-data-var token-contract principal .dao-token-v5-1)
(define-data-var treasury-contract principal .treasury-v5-1)
(define-data-var rewards-pool uint u0)
(define-data-var admin principal tx-sender)

;; =====================
;; DATA MAPS
;; =====================

;; Enhanced proposal storage
(define-map proposals
  uint
  {
    proposer: principal,
    title: (string-ascii 100),
    description: (string-utf8 500),
    proposal-type: uint,
    voting-mode: uint,
    start-block: uint,
    end-block: uint,
    execution-block: uint,
    votes-for: uint,
    votes-against: uint,
    objections: uint,
    status: uint,
    execution-data: (optional (buff 256)),
    total-supply-snapshot: uint,
    executed-at: uint
  }
)

;; Vote tracking with conviction
(define-map votes
  { proposal-id: uint, voter: principal }
  { 
    amount: uint, 
    vote-for: bool,
    voted-at-block: uint,
    conviction-start: uint
  }
)

;; Voting power snapshot
(define-map voting-power-snapshot
  { proposal-id: uint, voter: principal }
  uint
)

;; Delegation system
(define-map delegations principal principal)
(define-map delegated-power-received principal uint)
(define-map has-delegated principal bool)

;; Governance participation rewards
(define-map participation-rewards
  { proposal-id: uint, participant: principal }
  { amount: uint, claimed: bool, reward-type: (string-ascii 20) }
)

;; Track total participation per user
(define-map user-participation
  principal
  { proposals-created: uint, votes-cast: uint, total-rewards: uint }
)

;; =====================
;; PRIVATE FUNCTIONS
;; =====================

(define-private (get-token-balance (account principal))
  (unwrap-panic (contract-call? .dao-token-v5-1 get-balance account))
)

(define-private (get-voting-power-from-token (account principal))
  (contract-call? .dao-token-v5-1 get-voting-power account)
)

(define-private (get-total-token-supply)
  (unwrap-panic (contract-call? .dao-token-v5-1 get-total-supply))
)

;; Calculate effective voting power
(define-private (calculate-voting-power (voter principal))
  (let (
    (own-power (get-voting-power-from-token voter))
    (delegated-to-voter (default-to u0 (map-get? delegated-power-received voter)))
    (has-delegated-away (default-to false (map-get? has-delegated voter)))
  )
    (if has-delegated-away
      delegated-to-voter
      (+ own-power delegated-to-voter)
    )
  )
)

;; Calculate quadratic voting power (square root approximation)
(define-private (sqrt-approx (n uint))
  (if (<= n u1)
    n
    (let (
      (x (/ n u2))
      (x1 (/ (+ x (/ n x)) u2))
      (x2 (/ (+ x1 (/ n x1)) u2))
      (x3 (/ (+ x2 (/ n x2)) u2))
    )
      x3
    )
  )
)

;; Calculate conviction multiplier based on time holding vote
(define-private (calculate-conviction (vote-block uint) (current-block uint))
  (let (
    (blocks-held (- current-block vote-block))
    (periods (/ blocks-held u144))  ;; Number of ~1 day periods
    (growth (+ u10000 (* periods CONVICTION-GROWTH-RATE u100)))
  )
    (if (> growth MAX-CONVICTION-MULTIPLIER)
      MAX-CONVICTION-MULTIPLIER
      growth
    )
  )
)

;; Calculate dynamic quorum
(define-private (calculate-quorum (total-supply uint))
  (/ (* total-supply QUORUM-PERCENTAGE) u100)
)

;; =====================
;; DELEGATION FUNCTIONS
;; =====================

(define-public (delegate (delegate-to principal))
  (let (
    (delegator tx-sender)
    (delegator-power (calculate-voting-power delegator))
  )
    (asserts! (not (is-eq delegator delegate-to)) ERR-CANNOT-DELEGATE-TO-SELF)
    (asserts! (> delegator-power u0) ERR-INSUFFICIENT-TOKENS)
    (asserts! (not (is-eq (default-to delegate-to (map-get? delegations delegate-to)) delegator)) 
              ERR-CIRCULAR-DELEGATION)
    (asserts! (not (default-to false (map-get? has-delegated delegator))) ERR-DELEGATION-EXISTS)
    
    (map-set delegations delegator delegate-to)
    (map-set has-delegated delegator true)
    (map-set delegated-power-received delegate-to
      (+ (default-to u0 (map-get? delegated-power-received delegate-to)) delegator-power))
    
    (print { event: "delegation-created", version: "5.1", delegator: delegator, delegate: delegate-to, amount: delegator-power })
    (ok true)
  )
)

(define-public (revoke-delegation)
  (let (
    (delegator tx-sender)
    (delegate-to (unwrap! (map-get? delegations delegator) ERR-NOT-AUTHORIZED))
    (delegator-power (get-voting-power-from-token delegator))
  )
    (map-delete delegations delegator)
    (map-set has-delegated delegator false)
    
    (let ((current-delegated (default-to u0 (map-get? delegated-power-received delegate-to))))
      (map-set delegated-power-received delegate-to
        (if (>= current-delegated delegator-power) (- current-delegated delegator-power) u0))
    )
    
    (print { event: "delegation-revoked", version: "5.1", delegator: delegator, delegate: delegate-to })
    (ok true)
  )
)

;; =====================
;; PROPOSAL FUNCTIONS
;; =====================

(define-public (create-proposal 
  (title (string-ascii 100)) 
  (description (string-utf8 500))
  (proposal-type uint)
  (voting-mode uint)
  (execution-data (optional (buff 256))))
  (let (
    (proposer tx-sender)
    (proposal-id (+ (var-get proposal-count) u1))
    (current-block stacks-block-height)
    (proposer-power (calculate-voting-power proposer))
    (total-supply (get-total-token-supply))
    (voting-period (if (is-eq proposal-type TYPE-OPTIMISTIC) OPTIMISTIC-PERIOD VOTING-PERIOD))
    (initial-status (if (is-eq proposal-type TYPE-OPTIMISTIC) STATUS-OPTIMISTIC STATUS-ACTIVE))
  )
    (asserts! (>= proposer-power MIN-PROPOSAL-TOKENS) ERR-INSUFFICIENT-TOKENS)
    (asserts! (and (>= proposal-type TYPE-GENERAL) (<= proposal-type TYPE-OPTIMISTIC)) ERR-INVALID-PROPOSAL)
    (asserts! (and (>= voting-mode MODE-STANDARD) (<= voting-mode MODE-CONVICTION)) ERR-INVALID-PROPOSAL)
    
    (map-set proposals proposal-id {
      proposer: proposer,
      title: title,
      description: description,
      proposal-type: proposal-type,
      voting-mode: voting-mode,
      start-block: current-block,
      end-block: (+ current-block voting-period),
      execution-block: (+ current-block voting-period TIMELOCK-PERIOD),
      votes-for: u0,
      votes-against: u0,
      objections: u0,
      status: initial-status,
      execution-data: execution-data,
      total-supply-snapshot: total-supply,
      executed-at: u0
    })
    
    (var-set proposal-count proposal-id)
    
    ;; Record reward for proposal creation
    (map-set participation-rewards 
      { proposal-id: proposal-id, participant: proposer }
      { amount: PROPOSAL-REWARD, claimed: false, reward-type: "proposal" })
    
    ;; Update user stats
    (let ((stats (default-to { proposals-created: u0, votes-cast: u0, total-rewards: u0 } 
                            (map-get? user-participation proposer))))
      (map-set user-participation proposer 
        (merge stats { proposals-created: (+ (get proposals-created stats) u1) })))
    
    (print { 
      event: "proposal-created", 
      version: "5.1",
      proposal-id: proposal-id, 
      proposer: proposer, 
      title: title,
      proposal-type: proposal-type,
      voting-mode: voting-mode,
      is-optimistic: (is-eq proposal-type TYPE-OPTIMISTIC)
    })
    (ok proposal-id)
  )
)

;; Cancel proposal
(define-public (cancel-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get proposer proposal)) ERR-NOT-AUTHORIZED)
    (asserts! (or (is-eq (get status proposal) STATUS-ACTIVE) 
                  (is-eq (get status proposal) STATUS-OPTIMISTIC)) ERR-PROPOSAL-NOT-ACTIVE)
    
    (map-set proposals proposal-id (merge proposal { status: STATUS-CANCELLED }))
    
    (print { event: "proposal-cancelled", version: "5.1", proposal-id: proposal-id })
    (ok true)
  )
)

;; =====================
;; VOTING FUNCTIONS
;; =====================

(define-public (vote (proposal-id uint) (vote-for bool))
  (let (
    (voter tx-sender)
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (voter-power (calculate-voting-power voter))
    (voting-mode (get voting-mode proposal))
    (effective-power (if (is-eq voting-mode MODE-QUADRATIC) 
                        (sqrt-approx voter-power) 
                        voter-power))
  )
    (asserts! (or (is-eq (get status proposal) STATUS-ACTIVE)
                  (is-eq (get status proposal) STATUS-OPTIMISTIC)) ERR-PROPOSAL-NOT-ACTIVE)
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    (asserts! (is-none (map-get? votes { proposal-id: proposal-id, voter: voter })) ERR-ALREADY-VOTED)
    (asserts! (> voter-power u0) ERR-INSUFFICIENT-TOKENS)
    
    ;; Record vote
    (map-set votes 
      { proposal-id: proposal-id, voter: voter }
      { amount: effective-power, vote-for: vote-for, voted-at-block: stacks-block-height, conviction-start: stacks-block-height })
    
    (map-set voting-power-snapshot { proposal-id: proposal-id, voter: voter } voter-power)
    
    ;; Update vote counts
    (if vote-for
      (map-set proposals proposal-id (merge proposal { votes-for: (+ (get votes-for proposal) effective-power) }))
      (begin
        (map-set proposals proposal-id (merge proposal { 
          votes-against: (+ (get votes-against proposal) effective-power),
          objections: (if (is-eq (get status proposal) STATUS-OPTIMISTIC)
                        (+ (get objections proposal) effective-power)
                        (get objections proposal))
        }))
      )
    )
    
    ;; Record vote reward
    (map-set participation-rewards 
      { proposal-id: proposal-id, participant: voter }
      { amount: VOTE-REWARD, claimed: false, reward-type: "vote" })
    
    ;; Update user stats
    (let ((stats (default-to { proposals-created: u0, votes-cast: u0, total-rewards: u0 } 
                            (map-get? user-participation voter))))
      (map-set user-participation voter 
        (merge stats { votes-cast: (+ (get votes-cast stats) u1) })))
    
    (print { 
      event: "vote-cast", 
      version: "5.1",
      proposal-id: proposal-id, 
      voter: voter, 
      vote-for: vote-for, 
      amount: effective-power,
      voting-mode: voting-mode
    })
    (ok true)
  )
)

;; Change vote
(define-public (change-vote (proposal-id uint) (new-vote-for bool))
  (let (
    (voter tx-sender)
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (existing-vote (unwrap! (map-get? votes { proposal-id: proposal-id, voter: voter }) ERR-NO-VOTE-TO-CHANGE))
    (vote-amount (get amount existing-vote))
    (old-vote-for (get vote-for existing-vote))
  )
    (asserts! (or (is-eq (get status proposal) STATUS-ACTIVE)
                  (is-eq (get status proposal) STATUS-OPTIMISTIC)) ERR-PROPOSAL-NOT-ACTIVE)
    (asserts! (<= stacks-block-height (get end-block proposal)) ERR-PROPOSAL-EXPIRED)
    
    (if (is-eq old-vote-for new-vote-for)
      (ok true)
      (begin
        ;; Update vote record
        (map-set votes { proposal-id: proposal-id, voter: voter }
          (merge existing-vote { vote-for: new-vote-for }))
        
        ;; Adjust vote counts
        (if new-vote-for
          (map-set proposals proposal-id (merge proposal { 
            votes-for: (+ (get votes-for proposal) vote-amount),
            votes-against: (- (get votes-against proposal) vote-amount)
          }))
          (map-set proposals proposal-id (merge proposal { 
            votes-for: (- (get votes-for proposal) vote-amount),
            votes-against: (+ (get votes-against proposal) vote-amount)
          }))
        )
        
        (print { event: "vote-changed", version: "5.1", proposal-id: proposal-id, voter: voter, new-vote: new-vote-for })
        (ok true)
      )
    )
  )
)

;; =====================
;; FINALIZATION FUNCTIONS
;; =====================

(define-public (finalize-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
    (total-votes (+ (get votes-for proposal) (get votes-against proposal)))
    (quorum (calculate-quorum (get total-supply-snapshot proposal)))
    (is-optimistic (is-eq (get status proposal) STATUS-OPTIMISTIC))
    (objection-limit (/ (* (get total-supply-snapshot proposal) OBJECTION-THRESHOLD) u100))
  )
    (asserts! (or (is-eq (get status proposal) STATUS-ACTIVE)
                  (is-eq (get status proposal) STATUS-OPTIMISTIC)) ERR-PROPOSAL-NOT-ACTIVE)
    (asserts! (> stacks-block-height (get end-block proposal)) ERR-VOTING-NOT-ENDED)
    
    ;; Handle optimistic proposals
    (if is-optimistic
      (if (>= (get objections proposal) objection-limit)
        (begin
          (map-set proposals proposal-id (merge proposal { status: STATUS-REJECTED }))
          (print { event: "optimistic-rejected", version: "5.1", proposal-id: proposal-id })
          (ok STATUS-REJECTED)
        )
        (begin
          (map-set proposals proposal-id (merge proposal { status: STATUS-PASSED }))
          (print { event: "optimistic-passed", version: "5.1", proposal-id: proposal-id })
          (ok STATUS-PASSED)
        )
      )
      ;; Standard proposal
      (if (< total-votes quorum)
        (begin
          (map-set proposals proposal-id (merge proposal { status: STATUS-EXPIRED }))
          (print { event: "proposal-expired", version: "5.1", proposal-id: proposal-id, reason: "quorum-not-met" })
          (ok STATUS-EXPIRED)
        )
        (if (> (* (get votes-for proposal) u100) (* total-votes APPROVAL-THRESHOLD))
          (begin
            (map-set proposals proposal-id (merge proposal { status: STATUS-PASSED }))
            (print { event: "proposal-passed", version: "5.1", proposal-id: proposal-id })
            (ok STATUS-PASSED)
          )
          (begin
            (map-set proposals proposal-id (merge proposal { status: STATUS-REJECTED }))
            (print { event: "proposal-rejected", version: "5.1", proposal-id: proposal-id })
            (ok STATUS-REJECTED)
          )
        )
      )
    )
  )
)

;; Execute passed proposal
(define-public (execute-proposal (proposal-id uint))
  (let (
    (proposal (unwrap! (map-get? proposals proposal-id) ERR-PROPOSAL-NOT-FOUND))
  )
    (asserts! (is-eq (get status proposal) STATUS-PASSED) ERR-PROPOSAL-NOT-PASSED)
    (asserts! (>= stacks-block-height (get execution-block proposal)) ERR-TIMELOCK-NOT-EXPIRED)
    
    (map-set proposals proposal-id (merge proposal { 
      status: STATUS-EXECUTED,
      executed-at: stacks-block-height
    }))
    
    (print { event: "proposal-executed", version: "5.1", proposal-id: proposal-id })
    (ok true)
  )
)

;; =====================
;; REWARD FUNCTIONS
;; =====================

(define-public (claim-participation-reward (proposal-id uint))
  (let (
    (reward-entry (unwrap! (map-get? participation-rewards { proposal-id: proposal-id, participant: tx-sender }) 
                          ERR-NO-REWARDS))
    (reward-amount (get amount reward-entry))
  )
    (asserts! (not (get claimed reward-entry)) ERR-ALREADY-CLAIMED)
    (asserts! (> reward-amount u0) ERR-NO-REWARDS)
    
    ;; Mark as claimed
    (map-set participation-rewards { proposal-id: proposal-id, participant: tx-sender }
      (merge reward-entry { claimed: true }))
    
    ;; Update total rewards
    (let ((stats (default-to { proposals-created: u0, votes-cast: u0, total-rewards: u0 } 
                            (map-get? user-participation tx-sender))))
      (map-set user-participation tx-sender 
        (merge stats { total-rewards: (+ (get total-rewards stats) reward-amount) })))
    
    ;; Note: Actual token transfer would be handled by treasury or minting
    (print { event: "reward-claimed", version: "5.1", proposal-id: proposal-id, participant: tx-sender, amount: reward-amount })
    (ok reward-amount)
  )
)

;; Fund rewards pool
(define-public (fund-rewards-pool (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set rewards-pool (+ (var-get rewards-pool) amount))
    (print { event: "rewards-pool-funded", version: "5.1", amount: amount })
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id)
)

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes { proposal-id: proposal-id, voter: voter })
)

(define-read-only (get-delegation (delegator principal))
  (map-get? delegations delegator)
)

(define-read-only (get-user-voting-power (user principal))
  (calculate-voting-power user)
)

(define-read-only (get-proposal-count)
  (var-get proposal-count)
)

(define-read-only (get-user-participation (user principal))
  (default-to { proposals-created: u0, votes-cast: u0, total-rewards: u0 } 
              (map-get? user-participation user))
)

(define-read-only (get-participation-reward (proposal-id uint) (participant principal))
  (map-get? participation-rewards { proposal-id: proposal-id, participant: participant })
)

(define-read-only (get-rewards-pool)
  (var-get rewards-pool)
)

(define-read-only (get-conviction-power (proposal-id uint) (voter principal))
  (match (map-get? votes { proposal-id: proposal-id, voter: voter })
    vote-data
    (let (
      (conviction (calculate-conviction (get conviction-start vote-data) stacks-block-height))
    )
      (/ (* (get amount vote-data) conviction) u10000)
    )
    u0
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (set-token-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set token-contract new-contract)
    (ok true)
  )
)

(define-public (set-treasury-contract (new-contract principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set treasury-contract new-contract)
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
;; INITIALIZATION
;; =====================

(begin
  (print { event: "governance-deployed", version: "5.1" })
)
