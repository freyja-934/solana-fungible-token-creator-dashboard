use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = PlatformConfig::LEN,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePlatform>, treasury: Pubkey) -> Result<()> {
    let platform_config = &mut ctx.accounts.platform_config;
    
    // Initialize platform configuration with defaults
    platform_config.authority = ctx.accounts.authority.key();
    platform_config.treasury = treasury;
    platform_config.creation_fee_lamports = PlatformConfig::DEFAULT_CREATION_FEE;
    platform_config.transfer_fee_bps = PlatformConfig::DEFAULT_TRANSFER_FEE_BPS;
    platform_config.fees_enabled = true;
    platform_config.total_creation_fees_collected = 0;
    platform_config.tokens_created = 0;
    platform_config.bump = ctx.bumps.platform_config;
    
    msg!("Platform initialized with treasury: {}", treasury);
    msg!("Creation fee: {} lamports", platform_config.creation_fee_lamports);
    msg!("Transfer fee: {} bps", platform_config.transfer_fee_bps);
    
    Ok(())
} 