use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token_2022::{self, Token2022};

use crate::state::*;
use crate::errors::TokenFactoryError;

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeTokenParams {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub initial_supply: u64,
    pub treasury: Pubkey,
    pub staking: Pubkey,
    pub marketing: Pubkey,
    pub treasury_bps: u16,
    pub staking_bps: u16,
    pub marketing_bps: u16,
}

#[derive(Accounts)]
#[instruction(params: InitializeTokenParams)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: This will be initialized as a mint account
    #[account(mut)]
    pub mint: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = TokenConfig::calculate_len(params.name.len(), params.symbol.len()),
        seeds = [TokenConfig::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = authority,
        space = FeeConfig::LEN,
        seeds = [FeeConfig::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub fee_config: Account<'info, FeeConfig>,
    
    #[account(
        init,
        payer = authority,
        space = FeeExemptList::calculate_len(100), // Max 100 exempt addresses
        seeds = [FeeExemptList::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub fee_exempt_list: Account<'info, FeeExemptList>,
    
    // Platform fee collection
    #[account(
        mut,
        seeds = [PlatformConfig::SEED_PREFIX],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// CHECK: Platform treasury receives the creation fee
    #[account(mut)]
    pub platform_treasury: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeToken>, params: InitializeTokenParams) -> Result<()> {
    let token_config = &mut ctx.accounts.token_config;
    let fee_config = &mut ctx.accounts.fee_config;
    let fee_exempt_list = &mut ctx.accounts.fee_exempt_list;
    let platform_config = &mut ctx.accounts.platform_config;
    
    // Collect platform creation fee if enabled
    if platform_config.fees_enabled && platform_config.creation_fee_lamports > 0 {
        // Validate treasury account matches platform config
        require!(
            ctx.accounts.platform_treasury.key() == platform_config.treasury,
            TokenFactoryError::InvalidPlatformTreasury
        );
        
        // Transfer creation fee from authority to platform treasury
        let ix = anchor_lang::system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.platform_treasury.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            ix,
        );
        anchor_lang::system_program::transfer(cpi_ctx, platform_config.creation_fee_lamports)?;
        
        // Update platform stats
        platform_config.total_creation_fees_collected = platform_config
            .total_creation_fees_collected
            .checked_add(platform_config.creation_fee_lamports)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?;
        platform_config.tokens_created = platform_config
            .tokens_created
            .checked_add(1)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?;
        
        msg!("Collected creation fee: {} lamports", platform_config.creation_fee_lamports);
    }
    
    // Validate fee configuration
    let total_fee_bps = params.treasury_bps + params.staking_bps + params.marketing_bps;
    require!(total_fee_bps <= 1000, TokenFactoryError::FeeExceedsMaximum); // Max 10%
    require!(
        total_fee_bps == params.treasury_bps + params.staking_bps + params.marketing_bps,
        TokenFactoryError::FeeSumMismatch
    );
    
    // Initialize the mint account using Token-2022
    let mint_size = spl_token_2022::state::Mint::get_packed_len();
    let rent = ctx.accounts.rent.minimum_balance(mint_size);
    
    // Create the mint account
    anchor_lang::system_program::create_account(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.mint.to_account_info(),
            },
        ),
        rent,
        mint_size as u64,
        &ctx.accounts.token_program.key(),
    )?;
    
    // Initialize the mint
    let cpi_accounts = token_2022::InitializeMint2 {
        mint: ctx.accounts.mint.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token_2022::initialize_mint2(
        cpi_ctx,
        params.decimals,
        &ctx.accounts.authority.key(),
        Some(&ctx.accounts.authority.key()),
    )?;
    
    // Initialize token config
    token_config.mint = ctx.accounts.mint.key();
    token_config.name = params.name;
    token_config.symbol = params.symbol;
    token_config.authority = ctx.accounts.authority.key();
    token_config.fees_enabled = true;
    token_config.created_at = Clock::get()?.unix_timestamp;
    token_config.bump = ctx.bumps.token_config;
    
    // Initialize fee config
    fee_config.treasury = params.treasury;
    fee_config.staking = params.staking;
    fee_config.marketing = params.marketing;
    fee_config.treasury_bps = params.treasury_bps;
    fee_config.staking_bps = params.staking_bps;
    fee_config.marketing_bps = params.marketing_bps;
    fee_config.total_fee_bps = total_fee_bps;
    fee_config.authority = ctx.accounts.authority.key();
    fee_config.mint = ctx.accounts.mint.key();
    fee_config.bump = ctx.bumps.fee_config;
    
    // Initialize fee exempt list with authority as first exempt address
    fee_exempt_list.exempt_addresses = vec![ctx.accounts.authority.key()];
    fee_exempt_list.authority = ctx.accounts.authority.key();
    fee_exempt_list.mint = ctx.accounts.mint.key();
    fee_exempt_list.bump = ctx.bumps.fee_exempt_list;
    
    // Note: Initial supply minting will be done separately
    
    Ok(())
} 