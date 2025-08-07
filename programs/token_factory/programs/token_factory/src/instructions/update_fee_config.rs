use anchor_lang::prelude::*;

use crate::state::*;
use crate::errors::TokenFactoryError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct UpdateFeeConfigParams {
    pub treasury: Option<Pubkey>,
    pub staking: Option<Pubkey>,
    pub marketing: Option<Pubkey>,
    pub treasury_bps: Option<u16>,
    pub staking_bps: Option<u16>,
    pub marketing_bps: Option<u16>,
}

#[derive(Accounts)]
pub struct UpdateFeeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [FeeConfig::SEED_PREFIX, mint.key().as_ref()],
        bump = fee_config.bump,
        constraint = fee_config.authority == authority.key() @ TokenFactoryError::Unauthorized
    )]
    pub fee_config: Account<'info, FeeConfig>,
    
    /// CHECK: Mint validation done via PDA seed
    pub mint: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<UpdateFeeConfig>,
    params: UpdateFeeConfigParams
) -> Result<()> {
    let fee_config = &mut ctx.accounts.fee_config;
    
    // Update recipient addresses if provided
    if let Some(treasury) = params.treasury {
        fee_config.treasury = treasury;
    }
    
    if let Some(staking) = params.staking {
        fee_config.staking = staking;
    }
    
    if let Some(marketing) = params.marketing {
        fee_config.marketing = marketing;
    }
    
    // Update fee percentages if provided
    let mut new_treasury_bps = fee_config.treasury_bps;
    let mut new_staking_bps = fee_config.staking_bps;
    let mut new_marketing_bps = fee_config.marketing_bps;
    
    if let Some(treasury_bps) = params.treasury_bps {
        new_treasury_bps = treasury_bps;
    }
    
    if let Some(staking_bps) = params.staking_bps {
        new_staking_bps = staking_bps;
    }
    
    if let Some(marketing_bps) = params.marketing_bps {
        new_marketing_bps = marketing_bps;
    }
    
    // Validate new fee configuration
    let new_total = new_treasury_bps + new_staking_bps + new_marketing_bps;
    require!(new_total <= 1000, TokenFactoryError::FeeExceedsMaximum); // Max 10%
    
    // Update the fee configuration
    fee_config.treasury_bps = new_treasury_bps;
    fee_config.staking_bps = new_staking_bps;
    fee_config.marketing_bps = new_marketing_bps;
    fee_config.total_fee_bps = new_total;
    
    Ok(())
} 