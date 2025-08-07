use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token_2022::{self, Token2022};

declare_id!("7RSKqnZYg6wsPyHAjKK1i7RCYrYoyoSDw2AaPxMnAnWT");

#[program]
pub mod token_factory {
    use super::*;

    pub fn initialize_platform(ctx: Context<InitializePlatform>, treasury: Pubkey) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;
        
        platform_config.authority = ctx.accounts.authority.key();
        platform_config.treasury = treasury;
        platform_config.creation_fee_lamports = PlatformConfig::DEFAULT_CREATION_FEE;
        platform_config.transfer_fee_bps = PlatformConfig::DEFAULT_TRANSFER_FEE_BPS;
        platform_config.fees_enabled = true;
        platform_config.total_creation_fees_collected = 0;
        platform_config.tokens_created = 0;
        platform_config.bump = ctx.bumps.platform_config;
        
        msg!("Platform initialized with treasury: {}", treasury);
        Ok(())
    }

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        params: InitializeTokenParams
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        let fee_config = &mut ctx.accounts.fee_config;
        let fee_exempt_list = &mut ctx.accounts.fee_exempt_list;
        let platform_config = &mut ctx.accounts.platform_config;
        
        // Collect platform creation fee
        if platform_config.fees_enabled && platform_config.creation_fee_lamports > 0 {
            require!(
                ctx.accounts.platform_treasury.key() == platform_config.treasury,
                TokenFactoryError::InvalidPlatformTreasury
            );
            
            let ix = anchor_lang::system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.platform_treasury.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                ix,
            );
            anchor_lang::system_program::transfer(cpi_ctx, platform_config.creation_fee_lamports)?;
            
            platform_config.total_creation_fees_collected = platform_config
                .total_creation_fees_collected
                .checked_add(platform_config.creation_fee_lamports)
                .ok_or(TokenFactoryError::ArithmeticOverflow)?;
            platform_config.tokens_created = platform_config
                .tokens_created
                .checked_add(1)
                .ok_or(TokenFactoryError::ArithmeticOverflow)?;
        }
        
        // Create mint
        let mint_size = spl_token_2022::state::Mint::get_packed_len();
        let rent = ctx.accounts.rent.minimum_balance(mint_size);
        
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
        token_config.name = params.name.clone();
        token_config.symbol = params.symbol.clone();
        token_config.authority = ctx.accounts.authority.key();
        token_config.fees_enabled = true;
        token_config.created_at = Clock::get()?.unix_timestamp;
        token_config.bump = ctx.bumps.token_config;
        
        // Initialize fee config
        let total_fee_bps = params.treasury_bps + params.staking_bps + params.marketing_bps;
        require!(total_fee_bps <= 1000, TokenFactoryError::FeeExceedsMaximum);
        
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
        
        // Initialize fee exempt list with creator
        fee_exempt_list.exempt_addresses = vec![ctx.accounts.authority.key()];
        fee_exempt_list.authority = ctx.accounts.authority.key();
        fee_exempt_list.mint = ctx.accounts.mint.key();
        fee_exempt_list.bump = ctx.bumps.fee_exempt_list;
        
        msg!("Token initialized: {} ({})", params.name, params.symbol);
        Ok(())
    }

    pub fn transfer_with_fee(
        ctx: Context<TransferWithFee>,
        amount: u64
    ) -> Result<()> {
        let fee_config = &ctx.accounts.fee_config;
        let fee_exempt_list = &ctx.accounts.fee_exempt_list;
        let platform_config = &ctx.accounts.platform_config;
        
        // Check if sender or receiver is exempt
        let is_exempt_from_token_fees = 
            fee_exempt_list.exempt_addresses.contains(&ctx.accounts.from.key()) ||
            fee_exempt_list.exempt_addresses.contains(&ctx.accounts.to.key());
        
        // Get mint decimals
        let mint_data = ctx.accounts.mint.data.borrow();
        let mint_state = spl_token_2022::state::Mint::unpack(&mint_data)?;
        
        // Calculate platform fee
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
        
        // Calculate token-specific fees
        let mut token_fee = 0u64;
        if !is_exempt_from_token_fees && fee_config.total_fee_bps > 0 {
            token_fee = amount
                .checked_mul(fee_config.total_fee_bps as u64)
                .ok_or(TokenFactoryError::ArithmeticOverflow)?
                .checked_div(10000)
                .ok_or(TokenFactoryError::ArithmeticOverflow)?;
        }
        
        // Calculate final transfer amount
        let total_fees = platform_fee
            .checked_add(token_fee)
            .ok_or(TokenFactoryError::ArithmeticOverflow)?;
        let transfer_amount = amount
            .checked_sub(total_fees)
            .ok_or(TokenFactoryError::InsufficientBalance)?;
        
        // Transfer main amount
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
        
        // Transfer platform fee
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
        }
        
        msg!("Transfer completed: {} tokens (fees: {})", transfer_amount, total_fees);
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct InitializePlatform<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"platform_config"],
        bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(params: InitializeTokenParams)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Will be initialized as mint
    #[account(mut)]
    pub mint: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + TokenConfig::INIT_SPACE,
        seeds = [b"token_config", mint.key().as_ref()],
        bump
    )]
    pub token_config: Account<'info, TokenConfig>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + FeeConfig::INIT_SPACE,
        seeds = [b"fee_config", mint.key().as_ref()],
        bump
    )]
    pub fee_config: Account<'info, FeeConfig>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + FeeExemptList::INIT_SPACE,
        seeds = [b"fee_exempt_list", mint.key().as_ref()],
        bump
    )]
    pub fee_exempt_list: Account<'info, FeeExemptList>,
    
    #[account(
        mut,
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// CHECK: Platform treasury
    #[account(mut)]
    pub platform_treasury: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferWithFee<'info> {
    #[account(mut)]
    pub from: Signer<'info>,
    
    /// CHECK: Token account
    #[account(mut)]
    pub from_token_account: AccountInfo<'info>,
    
    /// CHECK: Recipient
    pub to: AccountInfo<'info>,
    
    /// CHECK: Token account
    #[account(mut)]
    pub to_token_account: AccountInfo<'info>,
    
    /// CHECK: Mint
    pub mint: AccountInfo<'info>,
    
    #[account(
        seeds = [b"fee_config", mint.key().as_ref()],
        bump = fee_config.bump
    )]
    pub fee_config: Account<'info, FeeConfig>,
    
    #[account(
        seeds = [b"fee_exempt_list", mint.key().as_ref()],
        bump = fee_exempt_list.bump
    )]
    pub fee_exempt_list: Account<'info, FeeExemptList>,
    
    #[account(
        seeds = [b"platform_config"],
        bump = platform_config.bump
    )]
    pub platform_config: Account<'info, PlatformConfig>,
    
    /// CHECK: Platform treasury token account
    #[account(mut)]
    pub platform_treasury_token_account: AccountInfo<'info>,
    
    pub token_program: Program<'info, Token2022>,
}

// State structures
#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub creation_fee_lamports: u64,
    pub transfer_fee_bps: u16,
    pub fees_enabled: bool,
    pub total_creation_fees_collected: u64,
    pub tokens_created: u64,
    pub bump: u8,
}

impl PlatformConfig {
    pub const DEFAULT_CREATION_FEE: u64 = 100_000_000; // 0.1 SOL
    pub const DEFAULT_TRANSFER_FEE_BPS: u16 = 10; // 0.1%
}

#[account]
#[derive(InitSpace)]
pub struct TokenConfig {
    pub mint: Pubkey,
    #[max_len(50)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    pub authority: Pubkey,
    pub fees_enabled: bool,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct FeeConfig {
    pub treasury: Pubkey,
    pub staking: Pubkey,
    pub marketing: Pubkey,
    pub treasury_bps: u16,
    pub staking_bps: u16,
    pub marketing_bps: u16,
    pub total_fee_bps: u16,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct FeeExemptList {
    #[max_len(100)]
    pub exempt_addresses: Vec<Pubkey>,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

// Parameters
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

// Errors
#[error_code]
pub enum TokenFactoryError {
    #[msg("Invalid platform treasury account")]
    InvalidPlatformTreasury,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Fee basis points cannot exceed 10% (1000 bps)")]
    FeeExceedsMaximum,
    #[msg("Insufficient balance for transfer")]
    InsufficientBalance,
} 