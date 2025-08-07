use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::TokenFactoryError;

#[derive(Accounts)]
pub struct ManageExemption<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [FeeExemptList::SEED_PREFIX, mint.key().as_ref()],
        bump = fee_exempt_list.bump,
        constraint = fee_exempt_list.authority == authority.key() @ TokenFactoryError::Unauthorized
    )]
    pub fee_exempt_list: Account<'info, FeeExemptList>,
    
    /// CHECK: Mint validation done via PDA seed
    pub mint: AccountInfo<'info>,
}

pub fn add_fee_exempt_address(
    ctx: Context<ManageExemption>,
    address_to_exempt: Pubkey
) -> Result<()> {
    let fee_exempt_list = &mut ctx.accounts.fee_exempt_list;
    
    // Check if we've reached the maximum
    require!(
        fee_exempt_list.exempt_addresses.len() < 100,
        TokenFactoryError::ExemptListFull
    );
    
    fee_exempt_list.add_exempt(address_to_exempt)?;
    
    Ok(())
}

pub fn remove_fee_exempt_address(
    ctx: Context<ManageExemption>,
    address_to_remove: Pubkey
) -> Result<()> {
    let fee_exempt_list = &mut ctx.accounts.fee_exempt_list;
    
    // Check if address exists in the list
    require!(
        fee_exempt_list.is_exempt(&address_to_remove),
        TokenFactoryError::AddressNotExempt
    );
    
    fee_exempt_list.remove_exempt(&address_to_remove)?;
    
    Ok(())
} 