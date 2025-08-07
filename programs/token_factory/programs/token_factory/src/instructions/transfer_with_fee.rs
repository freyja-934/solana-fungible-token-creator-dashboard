use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token_2022::{self, Token2022};

use crate::state::*;
use crate::errors::TokenFactoryError;

#[derive(Accounts)]
pub struct TransferWithFee<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    
    /// CHECK: Can be any account that will receive tokens
    pub to: AccountInfo<'info>,
    
    #[account(
        seeds = [FeeConfig::SEED_PREFIX, mint.key().as_ref()],
        bump = fee_config.bump
    )]
    pub fee_config: Account<'info, FeeConfig>,
    
    #[account(
        seeds = [FeeExemptList::SEED_PREFIX, mint.key().as_ref()],
        bump = fee_exempt_list.bump
    )]
    pub fee_exempt_list: Account<'info, FeeExemptList>,
    
    /// CHECK: Validated by the fee_config PDA derivation
    #[account(mut)]
    pub mint: AccountInfo<'info>,
    
    /// CHECK: Validated as token account in handler
    #[account(mut)]
    pub from_token_account: AccountInfo<'info>,
    
    /// CHECK: Validated as token account in handler
    #[account(mut)]
    pub to_token_account: AccountInfo<'info>,
    
    // Platform fee collection
    #[account(
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// CHECK: Platform treasury token account for receiving platform fees
    #[account(mut)]
    pub platform_treasury_token_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<TransferWithFee>, amount: u64) -> Result<()> {
    let fee_config = &ctx.accounts.fee_config;
    let fee_exempt_list = &ctx.accounts.fee_exempt_list;
    let platform_config = &ctx.accounts.platform_config;
    
    // Get decimals from mint account
    let mint_data = ctx.accounts.mint.try_borrow_data()?;
    let mint_state = spl_token_2022::state::Mint::unpack(&mint_data)?;
    
    // Check if either sender or receiver is exempt from token fees
    let is_exempt_from_token_fees = fee_exempt_list.is_exempt(&ctx.accounts.from.key()) ||
                                    fee_exempt_list.is_exempt(&ctx.accounts.to.key());
    
    // Calculate platform fee (always applied unless sender is platform treasury)
    let mut platform_fee = 0u64;
    if platform_config.fees_enabled && 
       platform_config.transfer_fee_bps > 0 &&
       ctx.accounts.from.key() != platform_config.treasury {
        platform_fee = amount
            .checked_mul(platform_config.transfer_fee_bps as u64)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?;
    }
    
    // Calculate token-specific fees if not exempt
    let mut token_fee = 0u64;
    if !is_exempt_from_token_fees && fee_config.total_fee_bps > 0 {
        token_fee = amount
            .checked_mul(fee_config.total_fee_bps as u64)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?;
    }
    
    // Calculate final transfer amount after all fees
    let total_fees = platform_fee
        .checked_add(token_fee)
        .ok_or(TokenFactoryError::ArithmeticOverflow)?;
    let transfer_amount = amount
        .checked_sub(total_fees)
        .ok_or(TokenFactoryError::InsufficientBalance)?;
    
    // Transfer main amount to recipient
    if transfer_amount > 0 {
        let cpi_accounts = token_2022::TransferChecked {
            from: ctx.accounts.from_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.to_token_account.to_account_info(),
            authority: ctx.accounts.from.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token_2022::transfer_checked(
            cpi_ctx,
            transfer_amount,
            mint_state.decimals
        )?;
    }
    
    // Transfer platform fee if applicable
    if platform_fee > 0 {
        let cpi_accounts = token_2022::TransferChecked {
            from: ctx.accounts.from_token_account.to_account_info(),
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.platform_treasury_token_account.to_account_info(),
            authority: ctx.accounts.from.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token_2022::transfer_checked(
            cpi_ctx,
            platform_fee,
            mint_state.decimals
        )?;
        
        msg!("Collected platform fee: {} (smallest unit)", platform_fee);
    }
    
    // Note: Token-specific fee distribution (treasury, staking, marketing) 
    // would be implemented here similar to platform fee
    
    Ok(())
} 