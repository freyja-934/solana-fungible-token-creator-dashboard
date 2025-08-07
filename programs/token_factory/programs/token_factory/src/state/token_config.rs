use anchor_lang::prelude::*;

#[account]
pub struct TokenConfig {
    /// Mint address
    pub mint: Pubkey,
    /// Token name
    pub name: String,
    /// Token symbol
    pub symbol: String,
    /// Token creator/authority
    pub authority: Pubkey,
    /// Whether fees are enabled
    pub fees_enabled: bool,
    /// Timestamp of creation
    pub created_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl TokenConfig {
    pub const SEED_PREFIX: &'static [u8] = b"token_config";
    
    pub fn calculate_len(name_len: usize, symbol_len: usize) -> usize {
        8 + // discriminator
        32 + // mint
        4 + name_len + // string (length + data)
        4 + symbol_len + // string (length + data)
        32 + // authority
        1 + // fees_enabled
        8 + // created_at
        1 // bump
    }
} 