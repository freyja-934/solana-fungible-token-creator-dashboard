use anchor_lang::prelude::*;

#[account]
pub struct FeeExemptList {
    /// List of addresses exempt from fees
    pub exempt_addresses: Vec<Pubkey>,
    /// Authority who can manage the exempt list
    pub authority: Pubkey,
    /// Mint address this list is associated with
    pub mint: Pubkey,
    /// Bump seed for PDA
    pub bump: u8,
}

impl FeeExemptList {
    pub const SEED_PREFIX: &'static [u8] = b"fee_exempt_list";
    
    // Calculate size based on max number of exempt addresses
    pub fn calculate_len(max_addresses: usize) -> usize {
        8 + // discriminator
        4 + (32 * max_addresses) + // vec of pubkeys
        32 + // authority
        32 + // mint
        1 // bump
    }
    
    pub fn is_exempt(&self, address: &Pubkey) -> bool {
        self.exempt_addresses.contains(address)
    }
    
    pub fn add_exempt(&mut self, address: Pubkey) -> Result<()> {
        if !self.is_exempt(&address) {
            self.exempt_addresses.push(address);
        }
        Ok(())
    }
    
    pub fn remove_exempt(&mut self, address: &Pubkey) -> Result<()> {
        self.exempt_addresses.retain(|a| a != address);
        Ok(())
    }
} 