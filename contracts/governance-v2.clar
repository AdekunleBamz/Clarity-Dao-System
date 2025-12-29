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
