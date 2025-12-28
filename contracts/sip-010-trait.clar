;; SIP-010 Trait Definition
;; Standard trait for fungible tokens on Stacks
;; Clarity 4

(define-trait sip-010-trait
  (
    ;; Transfer tokens from sender to recipient
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    
    ;; Get token name
    (get-name () (response (string-ascii 32) uint))
    
    ;; Get token symbol
    (get-symbol () (response (string-ascii 10) uint))
    
    ;; Get decimals
    (get-decimals () (response uint uint))
    
    ;; Get balance of principal
    (get-balance (principal) (response uint uint))
    
    ;; Get total supply
    (get-total-supply () (response uint uint))
    
    ;; Get token URI
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)
