use anchor_lang::prelude::*;

#[account]
pub struct PlatformConfig {
    /// Platform authority who can update fees
    pub authority: Pubkey,
    /// Platform treasury wallet that receives fees
    pub treasury: Pubkey,
    /// Token creation fee in lamports (SOL)
    pub creation_fee_lamports: u64,
    /// Platform transfer fee in basis points (100 = 1%)
    pub transfer_fee_bps: u16,
    /// Whether platform fees are enabled
    pub fees_enabled: bool,
    /// Total fees collected (for tracking)
    pub total_creation_fees_collected: u64,
    /// Number of tokens created
    pub tokens_created: u64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl PlatformConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // treasury
        8 + // creation_fee_lamports
        2 + // transfer_fee_bps
        1 + // fees_enabled
        8 + // total_creation_fees_collected
        8 + // tokens_created
        1; // bump
    
    pub const SEED_PREFIX: &'static [u8] = b"platform_config";
    
    // Default creation fee: 0.1 SOL
    pub const DEFAULT_CREATION_FEE: u64 = 100_000_000; // 0.1 SOL in lamports
    
    // Default transfer fee: 0.1% (10 basis points)
    pub const DEFAULT_TRANSFER_FEE_BPS: u16 = 10;
    
    // Maximum allowed fees to prevent abuse
    pub const MAX_CREATION_FEE: u64 = 10_000_000_000; // 10 SOL
    pub const MAX_TRANSFER_FEE_BPS: u16 = 100; // 1%
} 