use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::TokenFactoryError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdatePlatformConfigParams {
    pub new_authority: Option<Pubkey>,
    pub new_treasury: Option<Pubkey>,
    pub creation_fee_lamports: Option<u64>,
    pub transfer_fee_bps: Option<u16>,
    pub fees_enabled: Option<bool>,
}

#[derive(Accounts)]
pub struct UpdatePlatformConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump,
        constraint = platform_config.authority == authority.key() @ TokenFactoryError::UnauthorizedPlatform
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

pub fn handler(
    ctx: Context<UpdatePlatformConfig>,
    params: UpdatePlatformConfigParams
) -> Result<()> {
    let platform_config = &mut ctx.accounts.platform_config;
    
    // Update authority if provided
    if let Some(new_authority) = params.new_authority {
        platform_config.authority = new_authority;
        msg!("Platform authority updated to: {}", new_authority);
    }
    
    // Update treasury if provided
    if let Some(new_treasury) = params.new_treasury {
        platform_config.treasury = new_treasury;
        msg!("Platform treasury updated to: {}", new_treasury);
    }
    
    // Update creation fee if provided
    if let Some(creation_fee) = params.creation_fee_lamports {
        require!(
            creation_fee <= PlatformConfig::MAX_CREATION_FEE,
            TokenFactoryError::FeeExceedsMaximum
        );
        platform_config.creation_fee_lamports = creation_fee;
        msg!("Creation fee updated to: {} lamports", creation_fee);
    }
    
    // Update transfer fee if provided
    if let Some(transfer_fee) = params.transfer_fee_bps {
        require!(
            transfer_fee <= PlatformConfig::MAX_TRANSFER_FEE_BPS,
            TokenFactoryError::FeeExceedsMaximum
        );
        platform_config.transfer_fee_bps = transfer_fee;
        msg!("Transfer fee updated to: {} bps", transfer_fee);
    }
    
    // Update fees enabled flag if provided
    if let Some(enabled) = params.fees_enabled {
        platform_config.fees_enabled = enabled;
        msg!("Platform fees enabled: {}", enabled);
    }
    
    Ok(())
} 