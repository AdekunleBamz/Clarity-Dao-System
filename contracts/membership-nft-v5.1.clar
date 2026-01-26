;; Membership NFT Contract v5.1
;; SIP-009 compliant NFT for DAO membership badges and achievements
;; Clarity 4
;;
;; FEATURES:
;; - Tiered membership levels (Bronze, Silver, Gold, Platinum, Diamond)
;; - Achievement badges for contributions
;; - Soulbound option (non-transferable)
;; - Upgradeable membership tiers
;; - Governance participation tracking
;; - Exclusive perks per tier
;; - Metadata on-chain or IPFS

;; =====================
;; TRAIT REFERENCES
;; =====================

;; Note: Would implement sip-009-trait in production

;; =====================
;; CONSTANTS
;; =====================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u600))
(define-constant ERR-NOT-FOUND (err u601))
(define-constant ERR-ALREADY-MINTED (err u602))
(define-constant ERR-NOT-TOKEN-OWNER (err u603))
(define-constant ERR-SOULBOUND (err u604))
(define-constant ERR-INVALID-TIER (err u605))
(define-constant ERR-INSUFFICIENT-TOKENS (err u606))
(define-constant ERR-INSUFFICIENT-PARTICIPATION (err u607))
(define-constant ERR-BADGE-EXISTS (err u608))
(define-constant ERR-MAX-SUPPLY (err u609))
(define-constant ERR-COOLDOWN (err u610))
(define-constant ERR-UPGRADE-REQUIREMENTS (err u611))

;; Membership tiers
(define-constant TIER-BRONZE u1)
(define-constant TIER-SILVER u2)
(define-constant TIER-GOLD u3)
(define-constant TIER-PLATINUM u4)
(define-constant TIER-DIAMOND u5)

;; Badge types
(define-constant BADGE-EARLY-ADOPTER u1)
(define-constant BADGE-PROPOSAL-MASTER u2)
(define-constant BADGE-VOTE-CHAMPION u3)
(define-constant BADGE-BOUNTY-HUNTER u4)
(define-constant BADGE-STAKING-WHALE u5)
(define-constant BADGE-COMMUNITY-HERO u6)
(define-constant BADGE-DEVELOPER u7)
(define-constant BADGE-GOVERNANCE-VETERAN u8)

;; Tier token requirements
(define-constant BRONZE-TOKENS u1000000000)      ;; 1,000 tokens
(define-constant SILVER-TOKENS u10000000000)     ;; 10,000 tokens
(define-constant GOLD-TOKENS u50000000000)       ;; 50,000 tokens
(define-constant PLATINUM-TOKENS u100000000000)  ;; 100,000 tokens
(define-constant DIAMOND-TOKENS u500000000000)   ;; 500,000 tokens

;; Tier participation requirements (votes cast)
(define-constant BRONZE-VOTES u0)
(define-constant SILVER-VOTES u5)
(define-constant GOLD-VOTES u20)
(define-constant PLATINUM-VOTES u50)
(define-constant DIAMOND-VOTES u100)

;; Max supply per tier
(define-constant MAX-DIAMOND u100)
(define-constant MAX-PLATINUM u500)
(define-constant MAX-GOLD u2000)

;; NFT metadata base
(define-constant BASE-URI "https://clarity-dao-system.io/membership/")

;; =====================
;; DATA VARIABLES
;; =====================

(define-data-var admin principal tx-sender)
(define-data-var token-counter uint u0)
(define-data-var badge-counter uint u0)
(define-data-var paused bool false)

;; Tier supply tracking
(define-data-var diamond-minted uint u0)
(define-data-var platinum-minted uint u0)
(define-data-var gold-minted uint u0)

;; =====================
;; DATA MAPS
;; =====================

;; NFT ownership
(define-map token-owners uint principal)
(define-map owned-tokens principal uint)  ;; principal -> their membership token-id
(define-map token-count principal uint)

;; Membership data
(define-map memberships
  uint  ;; token-id
  {
    owner: principal,
    tier: uint,
    joined-at: uint,
    upgraded-at: uint,
    is-soulbound: bool,
    governance-votes: uint,
    proposals-created: uint,
    bounties-completed: uint,
    staking-amount: uint
  }
)

;; Achievement badges (separate from membership)
(define-map badges
  uint  ;; badge-id
  {
    owner: principal,
    badge-type: uint,
    name: (string-ascii 50),
    description: (string-utf8 200),
    earned-at: uint,
    is-soulbound: bool
  }
)

;; Track badges per user
(define-map user-badges principal (list 20 uint))

;; Track which badge types user has
(define-map user-badge-types { owner: principal, badge-type: uint } bool)

;; Tier perks
(define-map tier-perks
  uint  ;; tier
  {
    voting-multiplier: uint,      ;; Basis points (10000 = 1x)
    proposal-discount: uint,      ;; Reduced token requirement (%)
    treasury-access: bool,        ;; Can view treasury details
    early-access: bool,           ;; Early access to new features
    exclusive-channel: bool,      ;; Access to exclusive community
    airdrop-multiplier: uint      ;; Airdrop bonus multiplier
  }
)

;; Approved operators
(define-map approvals { owner: principal, operator: principal } bool)
(define-map approved-all { owner: principal, operator: principal } bool)

;; =====================
;; PRIVATE FUNCTIONS
;; =====================

;; Get tier requirements
(define-private (get-tier-token-requirement (tier uint))
  (if (is-eq tier TIER-DIAMOND) DIAMOND-TOKENS
    (if (is-eq tier TIER-PLATINUM) PLATINUM-TOKENS
      (if (is-eq tier TIER-GOLD) GOLD-TOKENS
        (if (is-eq tier TIER-SILVER) SILVER-TOKENS
          BRONZE-TOKENS
        )
      )
    )
  )
)

(define-private (get-tier-vote-requirement (tier uint))
  (if (is-eq tier TIER-DIAMOND) DIAMOND-VOTES
    (if (is-eq tier TIER-PLATINUM) PLATINUM-VOTES
      (if (is-eq tier TIER-GOLD) GOLD-VOTES
        (if (is-eq tier TIER-SILVER) SILVER-VOTES
          BRONZE-VOTES
        )
      )
    )
  )
)

;; Check tier supply limits
(define-private (check-tier-supply (tier uint))
  (if (is-eq tier TIER-DIAMOND)
    (< (var-get diamond-minted) MAX-DIAMOND)
    (if (is-eq tier TIER-PLATINUM)
      (< (var-get platinum-minted) MAX-PLATINUM)
      (if (is-eq tier TIER-GOLD)
        (< (var-get gold-minted) MAX-GOLD)
        true
      )
    )
  )
)

;; Update tier supply
(define-private (update-tier-supply (tier uint) (increment bool))
  (if increment
    (begin
      (if (is-eq tier TIER-DIAMOND)
        (var-set diamond-minted (+ (var-get diamond-minted) u1))
        (if (is-eq tier TIER-PLATINUM)
          (var-set platinum-minted (+ (var-get platinum-minted) u1))
          (if (is-eq tier TIER-GOLD)
            (var-set gold-minted (+ (var-get gold-minted) u1))
            true
          )
        )
      )
    )
    true
  )
)

;; Get tier name
(define-private (get-tier-name (tier uint))
  (if (is-eq tier TIER-DIAMOND) "Diamond"
    (if (is-eq tier TIER-PLATINUM) "Platinum"
      (if (is-eq tier TIER-GOLD) "Gold"
        (if (is-eq tier TIER-SILVER) "Silver"
          "Bronze"
        )
      )
    )
  )
)

;; =====================
;; SIP-009 FUNCTIONS
;; =====================

(define-read-only (get-last-token-id)
  (ok (var-get token-counter))
)

(define-read-only (get-token-uri (token-id uint))
  (match (map-get? memberships token-id)
    membership (ok (some (concat BASE-URI (get-tier-name (get tier membership)))))
    (err ERR-NOT-FOUND)
  )
)

(define-read-only (get-owner (token-id uint))
  (ok (map-get? token-owners token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (let (
    (membership (unwrap! (map-get? memberships token-id) ERR-NOT-FOUND))
  )
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq sender (get owner membership)) ERR-NOT-TOKEN-OWNER)
    (asserts! (not (get is-soulbound membership)) ERR-SOULBOUND)
    
    ;; Update ownership
    (map-set token-owners token-id recipient)
    (map-set owned-tokens recipient token-id)
    (map-delete owned-tokens sender)
    
    ;; Update membership owner
    (map-set memberships token-id (merge membership { owner: recipient }))
    
    ;; Update token counts
    (map-set token-count sender 
      (- (default-to u0 (map-get? token-count sender)) u1))
    (map-set token-count recipient 
      (+ (default-to u0 (map-get? token-count recipient)) u1))
    
    (print { event: "transfer", version: "5.1", token-id: token-id, sender: sender, recipient: recipient })
    (ok true)
  )
)

;; =====================
;; MEMBERSHIP FUNCTIONS
;; =====================

;; Mint membership NFT
(define-public (mint-membership (tier uint) (soulbound bool))
  (let (
    (minter tx-sender)
    (token-id (+ (var-get token-counter) u1))
    (token-balance (unwrap-panic (contract-call? .dao-token-v5-1 get-balance minter)))
    (required-tokens (get-tier-token-requirement tier))
  )
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= tier TIER-BRONZE) (<= tier TIER-DIAMOND)) ERR-INVALID-TIER)
    (asserts! (is-none (map-get? owned-tokens minter)) ERR-ALREADY-MINTED)
    (asserts! (>= token-balance required-tokens) ERR-INSUFFICIENT-TOKENS)
    (asserts! (check-tier-supply tier) ERR-MAX-SUPPLY)
    
    ;; Create membership
    (map-set memberships token-id {
      owner: minter,
      tier: tier,
      joined-at: stacks-block-height,
      upgraded-at: stacks-block-height,
      is-soulbound: soulbound,
      governance-votes: u0,
      proposals-created: u0,
      bounties-completed: u0,
      staking-amount: u0
    })
    
    ;; Set ownership
    (map-set token-owners token-id minter)
    (map-set owned-tokens minter token-id)
    (map-set token-count minter u1)
    
    ;; Update counters
    (var-set token-counter token-id)
    (update-tier-supply tier true)
    
    (print { 
      event: "membership-minted", 
      version: "5.1",
      token-id: token-id, 
      owner: minter, 
      tier: tier,
      tier-name: (get-tier-name tier),
      soulbound: soulbound
    })
    (ok token-id)
  )
)

;; Upgrade membership tier
(define-public (upgrade-tier)
  (let (
    (owner tx-sender)
    (token-id (unwrap! (map-get? owned-tokens owner) ERR-NOT-FOUND))
    (membership (unwrap! (map-get? memberships token-id) ERR-NOT-FOUND))
    (current-tier (get tier membership))
    (new-tier (+ current-tier u1))
    (token-balance (unwrap-panic (contract-call? .dao-token-v5-1 get-balance owner)))
    (required-tokens (get-tier-token-requirement new-tier))
    (votes-cast (get governance-votes membership))
    (required-votes (get-tier-vote-requirement new-tier))
  )
    (asserts! (is-eq owner (get owner membership)) ERR-NOT-TOKEN-OWNER)
    (asserts! (< current-tier TIER-DIAMOND) ERR-INVALID-TIER)
    (asserts! (>= token-balance required-tokens) ERR-INSUFFICIENT-TOKENS)
    (asserts! (>= votes-cast required-votes) ERR-INSUFFICIENT-PARTICIPATION)
    (asserts! (check-tier-supply new-tier) ERR-MAX-SUPPLY)
    
    ;; Update membership
    (map-set memberships token-id 
      (merge membership { 
        tier: new-tier,
        upgraded-at: stacks-block-height
      }))
    
    ;; Update tier supply
    (update-tier-supply new-tier true)
    
    (print { 
      event: "tier-upgraded", 
      version: "5.1",
      token-id: token-id, 
      owner: owner, 
      from-tier: current-tier,
      to-tier: new-tier,
      tier-name: (get-tier-name new-tier)
    })
    (ok new-tier)
  )
)

;; Record governance participation
(define-public (record-vote (member principal))
  (let (
    (token-id (unwrap! (map-get? owned-tokens member) ERR-NOT-FOUND))
    (membership (unwrap! (map-get? memberships token-id) ERR-NOT-FOUND))
  )
    (asserts! (or 
      (is-eq tx-sender (var-get admin))
      (is-eq tx-sender .governance-v5-1)
    ) ERR-NOT-AUTHORIZED)
    
    (map-set memberships token-id 
      (merge membership { governance-votes: (+ (get governance-votes membership) u1) }))
    
    (ok true)
  )
)

;; Record proposal created
(define-public (record-proposal (member principal))
  (let (
    (token-id (unwrap! (map-get? owned-tokens member) ERR-NOT-FOUND))
    (membership (unwrap! (map-get? memberships token-id) ERR-NOT-FOUND))
  )
    (asserts! (or 
      (is-eq tx-sender (var-get admin))
      (is-eq tx-sender .governance-v5-1)
    ) ERR-NOT-AUTHORIZED)
    
    (map-set memberships token-id 
      (merge membership { proposals-created: (+ (get proposals-created membership) u1) }))
    
    (ok true)
  )
)

;; Record bounty completed
(define-public (record-bounty (member principal))
  (let (
    (token-id (unwrap! (map-get? owned-tokens member) ERR-NOT-FOUND))
    (membership (unwrap! (map-get? memberships token-id) ERR-NOT-FOUND))
  )
    (asserts! (or 
      (is-eq tx-sender (var-get admin))
      (is-eq tx-sender .bounty-v5-1)
    ) ERR-NOT-AUTHORIZED)
    
    (map-set memberships token-id 
      (merge membership { bounties-completed: (+ (get bounties-completed membership) u1) }))
    
    (ok true)
  )
)

;; Update staking amount
(define-public (update-staking (member principal) (amount uint))
  (let (
    (token-id (unwrap! (map-get? owned-tokens member) ERR-NOT-FOUND))
    (membership (unwrap! (map-get? memberships token-id) ERR-NOT-FOUND))
  )
    (asserts! (or 
      (is-eq tx-sender (var-get admin))
      (is-eq tx-sender .staking-v5-1)
    ) ERR-NOT-AUTHORIZED)
    
    (map-set memberships token-id 
      (merge membership { staking-amount: amount }))
    
    (ok true)
  )
)

;; =====================
;; BADGE FUNCTIONS
;; =====================

;; Mint achievement badge
(define-public (mint-badge 
  (recipient principal) 
  (badge-type uint)
  (name (string-ascii 50))
  (description (string-utf8 200)))
  (let (
    (badge-id (+ (var-get badge-counter) u1))
    (current-badges (default-to (list) (map-get? user-badges recipient)))
  )
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= badge-type BADGE-EARLY-ADOPTER) (<= badge-type BADGE-GOVERNANCE-VETERAN)) ERR-INVALID-TIER)
    (asserts! (is-none (map-get? user-badge-types { owner: recipient, badge-type: badge-type })) ERR-BADGE-EXISTS)
    
    ;; Create badge
    (map-set badges badge-id {
      owner: recipient,
      badge-type: badge-type,
      name: name,
      description: description,
      earned-at: stacks-block-height,
      is-soulbound: true  ;; Badges are always soulbound
    })
    
    ;; Track badge
    (map-set user-badges recipient 
      (unwrap-panic (as-max-len? (append current-badges badge-id) u20)))
    (map-set user-badge-types { owner: recipient, badge-type: badge-type } true)
    
    (var-set badge-counter badge-id)
    
    (print { 
      event: "badge-minted", 
      version: "5.1",
      badge-id: badge-id, 
      recipient: recipient, 
      badge-type: badge-type,
      name: name
    })
    (ok badge-id)
  )
)

;; Auto-award badges based on activity
(define-public (check-and-award-badges (member principal))
  (let (
    (token-id (map-get? owned-tokens member))
  )
    (asserts! (is-some token-id) ERR-NOT-FOUND)
    
    (let (
      (membership (unwrap-panic (map-get? memberships (unwrap-panic token-id))))
    )
      ;; Check Proposal Master (5+ proposals)
      (if (and 
            (>= (get proposals-created membership) u5)
            (is-none (map-get? user-badge-types { owner: member, badge-type: BADGE-PROPOSAL-MASTER })))
        (begin (try! (mint-badge member BADGE-PROPOSAL-MASTER "Proposal Master" u"Created 5+ governance proposals")) true)
        true
      )
      
      ;; Check Vote Champion (50+ votes)
      (if (and 
            (>= (get governance-votes membership) u50)
            (is-none (map-get? user-badge-types { owner: member, badge-type: BADGE-VOTE-CHAMPION })))
        (begin (try! (mint-badge member BADGE-VOTE-CHAMPION "Vote Champion" u"Cast 50+ governance votes")) true)
        true
      )
      
      ;; Check Bounty Hunter (10+ bounties)
      (if (and 
            (>= (get bounties-completed membership) u10)
            (is-none (map-get? user-badge-types { owner: member, badge-type: BADGE-BOUNTY-HUNTER })))
        (begin (try! (mint-badge member BADGE-BOUNTY-HUNTER "Bounty Hunter" u"Completed 10+ bounties")) true)
        true
      )
      
      ;; Check Staking Whale (100k+ staked)
      (if (and 
            (>= (get staking-amount membership) u100000000000)
            (is-none (map-get? user-badge-types { owner: member, badge-type: BADGE-STAKING-WHALE })))
        (begin (try! (mint-badge member BADGE-STAKING-WHALE "Staking Whale" u"Staked 100,000+ tokens")) true)
        true
      )
      
      (ok true)
    )
  )
)

;; =====================
;; ADMIN FUNCTIONS
;; =====================

(define-public (set-tier-perks 
  (tier uint)
  (voting-multiplier uint)
  (proposal-discount uint)
  (treasury-access bool)
  (early-access bool)
  (exclusive-channel bool)
  (airdrop-multiplier uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) ERR-NOT-AUTHORIZED)
    
    (map-set tier-perks tier {
      voting-multiplier: voting-multiplier,
      proposal-discount: proposal-discount,
      treasury-access: treasury-access,
      early-access: early-access,
      exclusive-channel: exclusive-channel,
      airdrop-multiplier: airdrop-multiplier
    })
    
    (print { event: "tier-perks-updated", version: "5.1", tier: tier })
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

(define-read-only (get-membership (token-id uint))
  (map-get? memberships token-id)
)

(define-read-only (get-member-token (member principal))
  (map-get? owned-tokens member)
)

(define-read-only (get-member-tier (member principal))
  (match (map-get? owned-tokens member)
    token-id (match (map-get? memberships token-id)
      membership (some (get tier membership))
      none
    )
    none
  )
)

(define-read-only (get-badge (badge-id uint))
  (map-get? badges badge-id)
)

(define-read-only (get-user-badges (owner principal))
  (default-to (list) (map-get? user-badges owner))
)

(define-read-only (has-badge (owner principal) (badge-type uint))
  (default-to false (map-get? user-badge-types { owner: owner, badge-type: badge-type }))
)

(define-read-only (get-tier-perks-info (tier uint))
  (map-get? tier-perks tier)
)

(define-read-only (get-tier-supply (tier uint))
  (if (is-eq tier TIER-DIAMOND) (var-get diamond-minted)
    (if (is-eq tier TIER-PLATINUM) (var-get platinum-minted)
      (if (is-eq tier TIER-GOLD) (var-get gold-minted)
        u0
      )
    )
  )
)

(define-read-only (get-total-members)
  (var-get token-counter)
)

(define-read-only (get-total-badges)
  (var-get badge-counter)
)

(define-read-only (is-member (account principal))
  (is-some (map-get? owned-tokens account))
)

(define-read-only (get-voting-multiplier (member principal))
  (match (get-member-tier member)
    tier (match (map-get? tier-perks tier)
      perks (get voting-multiplier perks)
      u10000  ;; Default 1x
    )
    u10000
  )
)

;; =====================
;; INITIALIZATION
;; =====================

(begin
  ;; Set default tier perks
  (map-set tier-perks TIER-BRONZE {
    voting-multiplier: u10000,   ;; 1x
    proposal-discount: u0,
    treasury-access: false,
    early-access: false,
    exclusive-channel: false,
    airdrop-multiplier: u10000
  })
  
  (map-set tier-perks TIER-SILVER {
    voting-multiplier: u11000,   ;; 1.1x
    proposal-discount: u10,      ;; 10% less tokens needed
    treasury-access: false,
    early-access: false,
    exclusive-channel: false,
    airdrop-multiplier: u11000
  })
  
  (map-set tier-perks TIER-GOLD {
    voting-multiplier: u12500,   ;; 1.25x
    proposal-discount: u20,
    treasury-access: true,
    early-access: false,
    exclusive-channel: true,
    airdrop-multiplier: u12500
  })
  
  (map-set tier-perks TIER-PLATINUM {
    voting-multiplier: u15000,   ;; 1.5x
    proposal-discount: u30,
    treasury-access: true,
    early-access: true,
    exclusive-channel: true,
    airdrop-multiplier: u15000
  })
  
  (map-set tier-perks TIER-DIAMOND {
    voting-multiplier: u20000,   ;; 2x
    proposal-discount: u50,
    treasury-access: true,
    early-access: true,
    exclusive-channel: true,
    airdrop-multiplier: u25000   ;; 2.5x for airdrops
  })
  
  (print { event: "membership-nft-deployed", version: "5.1" })
)
