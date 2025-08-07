use anchor_lang::prelude::*;

#[account]
pub struct FeeConfig {
    /// Treasury wallet address
    pub treasury: Pubkey,
    /// Staking wallet address
    pub staking: Pubkey,
    /// Marketing wallet address
    pub marketing: Pubkey,
    /// Treasury fee in basis points (1000 = 10%)
    pub treasury_bps: u16,
    /// Staking fee in basis points
    pub staking_bps: u16,
    /// Marketing fee in basis points
    pub marketing_bps: u16,
    /// Total fee in basis points
    pub total_fee_bps: u16,
    /// Authority who can update the fee config
    pub authority: Pubkey,
    /// Mint address this config is associated with
    pub mint: Pubkey,
    /// Bump seed for PDA
    pub bump: u8,
}

impl FeeConfig {
    pub const LEN: usize = 8 + // discriminator
        32 + // treasury
        32 + // staking
        32 + // marketing
        2 + // treasury_bps
        2 + // staking_bps
        2 + // marketing_bps
        2 + // total_fee_bps
        32 + // authority
        32 + // mint
        1; // bump
    
    pub const SEED_PREFIX: &'static [u8] = b"fee_config";
} 