use anchor_lang::prelude::*;

#[error_code]
pub enum TokenFactoryError {
    #[msg("Unauthorized: Only authority can perform this action")]
    Unauthorized,
    
    #[msg("Invalid fee configuration: Total fees exceed maximum allowed")]
    InvalidFeeConfig,
    
    #[msg("Fee percentages must sum to total fee")]
    FeeSumMismatch,
    
    #[msg("Maximum number of exempt addresses reached")]
    ExemptListFull,
    
    #[msg("Address not found in exempt list")]
    AddressNotExempt,
    
    #[msg("Invalid mint account")]
    InvalidMint,
    
    #[msg("Insufficient balance for transfer")]
    InsufficientBalance,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Token already initialized")]
    TokenAlreadyInitialized,
    
    #[msg("Fee basis points cannot exceed 10000 (100%)")]
    FeeExceedsMaximum,
    
    #[msg("Invalid platform treasury account")]
    InvalidPlatformTreasury,
    
    #[msg("Platform fees not initialized")]
    PlatformNotInitialized,
    
    #[msg("Unauthorized platform operation")]
    UnauthorizedPlatform,
} 