;; Bounty System Contract v5.1
;; Create, fund, and claim bounties for DAO tasks
;; Clarity 4
;;
;; FEATURES:
;; - Create bounties with token rewards
;; - Multiple submissions per bounty
;; - Reviewer/judge system
;; - Milestone-based bounties
;; - Skill tags and categories
;; - Reputation tracking for hunters
;; - Dispute resolution mechanism

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u500))
(define-constant ERR-BOUNTY-NOT-FOUND (err u501))
(define-constant ERR-BOUNTY-CLOSED (err u502))
(define-constant ERR-ALREADY-SUBMITTED (err u503))
(define-constant ERR-SUBMISSION-NOT-FOUND (err u504))
(define-constant ERR-INVALID-AMOUNT (err u505))
(define-constant ERR-NOT-REVIEWER (err u506))
(define-constant ERR-ALREADY-CLAIMED (err u507))
(define-constant ERR-DISPUTE-ACTIVE (err u508))
(define-constant ERR-NO-DISPUTE (err u509))
(define-constant ERR-BOUNTY-EXPIRED (err u510))
(define-constant ERR-INSUFFICIENT-FUNDS (err u511))
(define-constant ERR-INVALID-STATUS (err u512))
(define-constant ERR-COOLDOWN (err u513))

;; Bounty statuses
(define-constant STATUS-OPEN u1)
(define-constant STATUS-IN-REVIEW u2)
(define-constant STATUS-COMPLETED u3)
(define-constant STATUS-CANCELLED u4)
(define-constant STATUS-DISPUTED u5)

;; Submission statuses
(define-constant SUBMISSION-PENDING u1)
(define-constant SUBMISSION-APPROVED u2)
(define-constant SUBMISSION-REJECTED u3)
(define-constant SUBMISSION-DISPUTED u4)

;; Categories
(define-constant CAT-DEVELOPMENT u1)
(define-constant CAT-DESIGN u2)
(define-constant CAT-CONTENT u3)
(define-constant CAT-MARKETING u4)
(define-constant CAT-RESEARCH u5)
(define-constant CAT-COMMUNITY u6)
(define-constant CAT-SECURITY u7)
(define-constant CAT-OTHER u8)

;; Difficulty levels
(define-constant DIFFICULTY-EASY u1)
(define-constant DIFFICULTY-MEDIUM u2)
(define-constant DIFFICULTY-HARD u3)
(define-constant DIFFICULTY-EXPERT u4)

;; Dispute resolution period
(define-constant DISPUTE-PERIOD u1008)  ;; ~7 days

;; Creator fee
(define-constant PLATFORM-FEE u250)  ;; 2.5%

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var admin principal tx-sender)
(define-data-var treasury-address principal tx-sender)
(define-data-var bounty-counter uint u0)
(define-data-var submission-counter uint u0)
(define-data-var total-bounties-paid uint u0)
(define-data-var paused bool false)

;; =====================
;; DATA MAPS
;; =====================

;; Bounty listings
(define-map bounties
  uint  ;; bounty-id
  {
    creator: principal,
    title: (string-ascii 100),
    description: (string-utf8 1000),
    category: uint,
    difficulty: uint,
    reward-amount: uint,
    deadline: uint,
    status: uint,
    submissions-count: uint,
    winner: (optional principal),
    created-at: uint,
    max-submissions: uint,
    requires-review: bool
  }
)

;; Bounty funding (escrowed tokens)
(define-map bounty-escrow uint uint)

;; Submissions
(define-map submissions
  uint  ;; submission-id
  {
    bounty-id: uint,
    hunter: principal,
    submission-url: (string-utf8 500),
    description: (string-utf8 500),
    submitted-at: uint,
    status: uint,
    reviewer: (optional principal),
    review-notes: (optional (string-utf8 500)),
    reviewed-at: uint
  }
)

;; Track submissions per bounty
(define-map bounty-submissions uint (list 50 uint))

;; Track submissions per hunter
(define-map hunter-submissions principal (list 100 uint))

;; Authorized reviewers
(define-map reviewers principal bool)

;; Hunter reputation
(define-map hunter-reputation
  principal
  {
    bounties-completed: uint,
    bounties-submitted: uint,
    total-earned: uint,
    reputation-score: uint,
    disputes-won: uint,
    disputes-lost: uint
  }
)

;; Disputes
(define-map disputes
  uint  ;; submission-id
  {
    disputer: principal,
    reason: (string-utf8 500),
    created-at: uint,
    resolved: bool,
    resolution: (optional bool),
    resolver: (optional principal)
  }
)

;; Hunter skill tags
(define-map hunter-skills
  principal
  (list 10 uint)  ;; category IDs they've completed bounties in
)

;; =====================
;; PRIVATE FUNCTIONS
;; =====================

;; Update hunter reputation
(define-private (update-hunter-rep (hunter principal) (completed bool) (amount uint))
  (let (
    (current (default-to 
      { bounties-completed: u0, bounties-submitted: u0, total-earned: u0, reputation-score: u100, disputes-won: u0, disputes-lost: u0 }
      (map-get? hunter-reputation hunter)))
  )
    (if completed
      (map-set hunter-reputation hunter {
        bounties-completed: (+ (get bounties-completed current) u1),
        bounties-submitted: (get bounties-submitted current),
        total-earned: (+ (get total-earned current) amount),
        reputation-score: (+ (get reputation-score current) u10),
        disputes-won: (get disputes-won current),
        disputes-lost: (get disputes-lost current)
      })
      (map-set hunter-reputation hunter {
        bounties-completed: (get bounties-completed current),
        bounties-submitted: (+ (get bounties-submitted current) u1),
        total-earned: (get total-earned current),
        reputation-score: (get reputation-score current),
        disputes-won: (get disputes-won current),
        disputes-lost: (get disputes-lost current)
      })
    )
  )
)

;; =====================
;; PUBLIC FUNCTIONS
;; =====================

;; Create a new bounty
(define-public (create-bounty
  (title (string-ascii 100))
  (description (string-utf8 1000))
  (category uint)
  (difficulty uint)
  (reward-amount uint)
  (deadline uint)
  (max-submissions uint)
  (requires-review bool))
  (let (
    (bounty-id (+ (var-get bounty-counter) u1))
    (creator tx-sender)
  )
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    (asserts! (> reward-amount u0) ERR-INVALID-AMOUNT)
    (asserts! (> deadline stacks-block-height) ERR-BOUNTY-EXPIRED)
    (asserts! (and (>= category CAT-DEVELOPMENT) (<= category CAT-OTHER)) ERR-INVALID-STATUS)
    
    ;; Transfer tokens to escrow
    (try! (contract-call? .dao-token-v5-1 transfer reward-amount creator (as-contract tx-sender) none))
    
    ;; Create bounty
    (map-set bounties bounty-id {
      creator: creator,
      title: title,
      description: description,
      category: category,
      difficulty: difficulty,
      reward-amount: reward-amount,
      deadline: deadline,
      status: STATUS-OPEN,
      submissions-count: u0,
      winner: none,
      created-at: stacks-block-height,
      max-submissions: max-submissions,
      requires-review: requires-review
    })
    
    ;; Track escrow
    (map-set bounty-escrow bounty-id reward-amount)
    
    (var-set bounty-counter bounty-id)
    
    (print { 
      event: "bounty-created", 
      version: "5.1",
      bounty-id: bounty-id, 
      creator: creator, 
      title: title,
      reward: reward-amount,
      category: category,
      deadline: deadline
    })
    (ok bounty-id)
  )
)

;; Submit work for a bounty
(define-public (submit-work
  (bounty-id uint)
  (submission-url (string-utf8 500))
  (description (string-utf8 500)))
  (let (
    (bounty (unwrap! (map-get? bounties bounty-id) ERR-BOUNTY-NOT-FOUND))
    (submission-id (+ (var-get submission-counter) u1))
    (hunter tx-sender)
    (current-submissions (default-to (list) (map-get? bounty-submissions bounty-id)))
  )
    (asserts! (is-eq (get status bounty) STATUS-OPEN) ERR-BOUNTY-CLOSED)
    (asserts! (<= stacks-block-height (get deadline bounty)) ERR-BOUNTY-EXPIRED)
    (asserts! (< (get submissions-count bounty) (get max-submissions bounty)) ERR-BOUNTY-CLOSED)
    
    ;; Create submission
    (map-set submissions submission-id {
      bounty-id: bounty-id,
      hunter: hunter,
      submission-url: submission-url,
      description: description,
      submitted-at: stacks-block-height,
      status: SUBMISSION-PENDING,
      reviewer: none,
      review-notes: none,
      reviewed-at: u0
    })
    
    ;; Update bounty submissions count
    (map-set bounties bounty-id 
      (merge bounty { submissions-count: (+ (get submissions-count bounty) u1) }))
    
    ;; Track submission
    (map-set bounty-submissions bounty-id (unwrap-panic (as-max-len? (append current-submissions submission-id) u50)))
    
    ;; Update hunter stats
    (update-hunter-rep hunter false u0)
    
    (var-set submission-counter submission-id)
    
    (print { 
      event: "submission-created", 
      version: "5.1",
      submission-id: submission-id, 
      bounty-id: bounty-id, 
      hunter: hunter 
    })
    (ok submission-id)
  )
)

;; Approve submission (by creator or reviewer)
(define-public (approve-submission (submission-id uint))
  (let (
    (submission (unwrap! (map-get? submissions submission-id) ERR-SUBMISSION-NOT-FOUND))
    (bounty (unwrap! (map-get? bounties (get bounty-id submission)) ERR-BOUNTY-NOT-FOUND))
    (reward (get reward-amount bounty))
    (platform-cut (/ (* reward PLATFORM-FEE) u10000))
    (hunter-reward (- reward platform-cut))
    (hunter (get hunter submission))
  )
    ;; Check authorization
    (asserts! (or 
      (is-eq tx-sender (get creator bounty))
      (default-to false (map-get? reviewers tx-sender))
    ) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status submission) SUBMISSION-PENDING) ERR-INVALID-STATUS)
    (asserts! (is-eq (get status bounty) STATUS-OPEN) ERR-BOUNTY-CLOSED)
    
    ;; Update submission
    (map-set submissions submission-id 
      (merge submission { 
        status: SUBMISSION-APPROVED,
        reviewer: (some tx-sender),
        reviewed-at: stacks-block-height
      }))
    
    ;; Update bounty
    (map-set bounties (get bounty-id submission) 
      (merge bounty { 
        status: STATUS-COMPLETED,
        winner: (some hunter)
      }))
    
    ;; Pay hunter
    (try! (as-contract (contract-call? .dao-token-v5-1 transfer hunter-reward tx-sender hunter none)))
    
    ;; Pay platform fee
    (try! (as-contract (contract-call? .dao-token-v5-1 transfer platform-cut tx-sender (var-get treasury-address) none)))
    
    ;; Update escrow
    (map-set bounty-escrow (get bounty-id submission) u0)
    
    ;; Update hunter reputation
    (update-hunter-rep hunter true hunter-reward)
    
    (var-set total-bounties-paid (+ (var-get total-bounties-paid) hunter-reward))
    
    (print { 
      event: "submission-approved", 
      version: "5.1",
      submission-id: submission-id, 
      bounty-id: (get bounty-id submission),
      hunter: hunter,
      reward: hunter-reward
    })
    (ok hunter-reward)
  )
)

;; Reject submission
(define-public (reject-submission (submission-id uint) (reason (string-utf8 500)))
  (let (
    (submission (unwrap! (map-get? submissions submission-id) ERR-SUBMISSION-NOT-FOUND))
    (bounty (unwrap! (map-get? bounties (get bounty-id submission)) ERR-BOUNTY-NOT-FOUND))
  )
    (asserts! (or 
      (is-eq tx-sender (get creator bounty))
      (default-to false (map-get? reviewers tx-sender))
    ) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status submission) SUBMISSION-PENDING) ERR-INVALID-STATUS)
    
    (map-set submissions submission-id 
      (merge submission { 
        status: SUBMISSION-REJECTED,
        reviewer: (some tx-sender),
        review-notes: (some reason),
        reviewed-at: stacks-block-height
      }))
    
    (print { event: "submission-rejected", version: "5.1", submission-id: submission-id })
    (ok true)
  )
)

;; Dispute a rejection
(define-public (dispute-submission (submission-id uint) (reason (string-utf8 500)))
  (let (
    (submission (unwrap! (map-get? submissions submission-id) ERR-SUBMISSION-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender (get hunter submission)) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status submission) SUBMISSION-REJECTED) ERR-INVALID-STATUS)
    (asserts! (is-none (map-get? disputes submission-id)) ERR-DISPUTE-ACTIVE)
    
    ;; Create dispute
    (map-set disputes submission-id {
      disputer: tx-sender,
      reason: reason,
      created-at: stacks-block-height,
      resolved: false,
      resolution: none,
      resolver: none
    })
    
    ;; Update submission status
    (map-set submissions submission-id (merge submission { status: SUBMISSION-DISPUTED }))
    
    (print { event: "dispute-created", version: "5.1", submission-id: submission-id })
    (ok true)
  )
)

;; Resolve dispute (admin only)
(define-public (resolve-dispute (submission-id uint) (in-favor-of-hunter bool))
  (let (
    (dispute (unwrap! (map-get? disputes submission-id) ERR-NO-DISPUTE))
    (submission (unwrap! (map-get? submissions submission-id) ERR-SUBMISSION-NOT-FOUND))
    (bounty (unwrap! (map-get? bounties (get bounty-id submission)) ERR-BOUNTY-NOT-FOUND))
    (hunter (get hunter submission))
  )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get resolved dispute)) ERR-DISPUTE-ACTIVE)
    
    ;; Update dispute
    (map-set disputes submission-id 
      (merge dispute { 
        resolved: true, 
        resolution: (some in-favor-of-hunter),
        resolver: (some tx-sender)
      }))
    
    (if in-favor-of-hunter
      (begin
        ;; Pay the hunter
        (let (
          (reward (get reward-amount bounty))
          (platform-cut (/ (* reward PLATFORM-FEE) u10000))
          (hunter-reward (- reward platform-cut))
        )
          (try! (as-contract (contract-call? .dao-token-v5-1 transfer hunter-reward tx-sender hunter none)))
          (map-set bounties (get bounty-id submission) (merge bounty { status: STATUS-COMPLETED, winner: (some hunter) }))
          (update-hunter-rep hunter true hunter-reward)
          
          ;; Update hunter disputes won
          (let ((rep (unwrap-panic (map-get? hunter-reputation hunter))))
            (map-set hunter-reputation hunter (merge rep { disputes-won: (+ (get disputes-won rep) u1) })))
        )
        (print { event: "dispute-resolved", version: "5.1", submission-id: submission-id, favor: "hunter" })
      )
      (begin
        ;; Return funds to creator
        (let ((escrowed (default-to u0 (map-get? bounty-escrow (get bounty-id submission)))))
          (if (> escrowed u0)
            (try! (as-contract (contract-call? .dao-token-v5-1 transfer escrowed tx-sender (get creator bounty) none)))
            true
          )
        )
        
        ;; Update hunter disputes lost
        (let ((rep (unwrap-panic (map-get? hunter-reputation hunter))))
          (map-set hunter-reputation hunter 
            (merge rep { 
              disputes-lost: (+ (get disputes-lost rep) u1),
              reputation-score: (if (> (get reputation-score rep) u10) 
                                  (- (get reputation-score rep) u10) 
                                  u0)
            })))
        
        (print { event: "dispute-resolved", version: "5.1", submission-id: submission-id, favor: "creator" })
      )
    )
    (ok in-favor-of-hunter)
  )
)

;; Cancel bounty (creator only, if no approved submissions)
(define-public (cancel-bounty (bounty-id uint))
  (let (
    (bounty (unwrap! (map-get? bounties bounty-id) ERR-BOUNTY-NOT-FOUND))
    (escrowed (default-to u0 (map-get? bounty-escrow bounty-id)))
  )
    (asserts! (is-eq tx-sender (get creator bounty)) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status bounty) STATUS-OPEN) ERR-BOUNTY-CLOSED)
    (asserts! (is-none (get winner bounty)) ERR-ALREADY-CLAIMED)
    
    ;; Return escrowed funds
    (if (> escrowed u0)
      (try! (as-contract (contract-call? .dao-token-v5-1 transfer escrowed tx-sender (get creator bounty) none)))
      true
    )
    
    ;; Update bounty
    (map-set bounties bounty-id (merge bounty { status: STATUS-CANCELLED }))
    (map-set bounty-escrow bounty-id u0)
    
    (print { event: "bounty-cancelled", version: "5.1", bounty-id: bounty-id })
    (ok true)
  )
)

;; Increase bounty reward
(define-public (increase-bounty (bounty-id uint) (additional-amount uint))
  (let (
    (bounty (unwrap! (map-get? bounties bounty-id) ERR-BOUNTY-NOT-FOUND))
    (current-escrow (default-to u0 (map-get? bounty-escrow bounty-id)))
  )
    (asserts! (is-eq (get status bounty) STATUS-OPEN) ERR-BOUNTY-CLOSED)
    (asserts! (> additional-amount u0) ERR-INVALID-AMOUNT)
    
    ;; Transfer additional tokens
    (try! (contract-call? .dao-token-v5-1 transfer additional-amount tx-sender (as-contract tx-sender) none))
    
    ;; Update bounty and escrow
    (map-set bounties bounty-id 
      (merge bounty { reward-amount: (+ (get reward-amount bounty) additional-amount) }))
    (map-set bounty-escrow bounty-id (+ current-escrow additional-amount))
    
    (print { event: "bounty-increased", version: "5.1", bounty-id: bounty-id, additional: additional-amount })
    (ok (+ (get reward-amount bounty) additional-amount))
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (add-reviewer (reviewer principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-set reviewers reviewer true)
    (print { event: "reviewer-added", version: "5.1", reviewer: reviewer })
    (ok true)
  )
)

(define-public (remove-reviewer (reviewer principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (map-delete reviewers reviewer)
    (ok true)
  )
)

(define-public (set-treasury (new-treasury principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set treasury-address new-treasury)
    (ok true)
  )
)

(define-public (toggle-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set paused (not (var-get paused)))
    (ok (var-get paused))
  )
)

(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (var-set admin new-admin)
    (ok true)
  )
)

;; =====================
;; READ-ONLY FUNCTIONS
;; =====================

(define-read-only (get-bounty (bounty-id uint))
  (map-get? bounties bounty-id)
)

(define-read-only (get-submission (submission-id uint))
  (map-get? submissions submission-id)
)

(define-read-only (get-bounty-submissions (bounty-id uint))
  (default-to (list) (map-get? bounty-submissions bounty-id))
)

(define-read-only (get-hunter-reputation (hunter principal))
  (default-to 
    { bounties-completed: u0, bounties-submitted: u0, total-earned: u0, reputation-score: u100, disputes-won: u0, disputes-lost: u0 }
    (map-get? hunter-reputation hunter))
)

(define-read-only (get-dispute (submission-id uint))
  (map-get? disputes submission-id)
)

(define-read-only (is-reviewer (account principal))
  (default-to false (map-get? reviewers account))
)

(define-read-only (get-bounty-escrow (bounty-id uint))
  (default-to u0 (map-get? bounty-escrow bounty-id))
)

(define-read-only (get-total-bounties-paid)
  (var-get total-bounties-paid)
)

(define-read-only (get-bounty-count)
  (var-get bounty-counter)
)

;; =====================
;; INITIALIZATION
;; =====================

(begin
  (print { event: "bounty-system-deployed", version: "5.1" })
)
