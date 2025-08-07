use anchor_lang::prelude::*;

/// Enhanced TokenConfig with metadata URI support
#[account]
pub struct TokenConfigV2 {
    /// Mint address
    pub mint: Pubkey,
    /// Token name
    pub name: String,
    /// Token symbol
    pub symbol: String,
    /// Metadata URI (points to off-chain JSON)
    pub uri: String,
    /// Token creator/authority
    pub authority: Pubkey,
    /// Whether fees are enabled
    pub fees_enabled: bool,
    /// Timestamp of creation
    pub created_at: i64,
    /// Bump seed for PDA
    pub bump: u8,
}

impl TokenConfigV2 {
    pub const SEED_PREFIX: &'static [u8] = b"token_config_v2";
    
    pub fn calculate_len(name_len: usize, symbol_len: usize, uri_len: usize) -> usize {
        8 + // discriminator
        32 + // mint
        4 + name_len + // string (length + data)
        4 + symbol_len + // string (length + data)
        4 + uri_len + // string (length + data)
        32 + // authority
        1 + // fees_enabled
        8 + // created_at
        1 // bump
    }
    
    /// Standard metadata JSON format
    pub fn metadata_standard() -> &'static str {
        r#"{
            "name": "Token Name",
            "symbol": "SYMBOL",
            "description": "Token description",
            "image": "https://...",
            "external_url": "https://...",
            "attributes": [],
            "properties": {
                "category": "fungible",
                "creators": []
            }
        }"#
    }
} 