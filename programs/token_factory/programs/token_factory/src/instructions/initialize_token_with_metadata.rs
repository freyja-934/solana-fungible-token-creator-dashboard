use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use anchor_spl::token_2022::{self, Token2022};
use mpl_token_metadata::{
    ID as TOKEN_METADATA_ID,
    types::{DataV2, Creator, Collection, Uses},
};

use crate::state::*;
use crate::errors::TokenFactoryError;



#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitializeTokenWithMetadataParams {
    // Token metadata (Metaplex standard)
    pub name: String,
    pub symbol: String,
    pub uri: String,  // Points to off-chain JSON
    pub decimals: u8,
    pub initial_supply: u64,
    
    // Fee configuration
    pub treasury: Pubkey,
    pub staking: Pubkey,
    pub marketing: Pubkey,
    pub treasury_bps: u16,
    pub staking_bps: u16,
    pub marketing_bps: u16,
    
    // Metaplex metadata options
    pub seller_fee_basis_points: u16,
    pub creators: Option<Vec<Creator>>,
    pub collection: Option<Collection>,
    pub uses: Option<Uses>,
    pub is_mutable: bool,
}

#[derive(Accounts)]
#[instruction(params: InitializeTokenWithMetadataParams)]
pub struct InitializeTokenWithMetadata<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: This will be initialized as a mint account
    #[account(mut)]
    pub mint: Signer<'info>,
    
    /// CHECK: Metaplex metadata account (PDA)
    #[account(
        mut,
        seeds = [
            b"metadata",
            TOKEN_METADATA_ID.as_ref(),
            mint.key().as_ref()
        ],
        bump,
        seeds::program = TOKEN_METADATA_ID
    )]
    pub metadata_account: UncheckedAccount<'info>,
    
    // Our custom PDAs for fee configuration
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
        space = FeeExemptList::calculate_len(100),
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
    
    /// CHECK: Token metadata program
    pub token_metadata_program: AccountInfo<'info>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeTokenWithMetadata>, params: InitializeTokenWithMetadataParams) -> Result<()> {
    let fee_config = &mut ctx.accounts.fee_config;
    let fee_exempt_list = &mut ctx.accounts.fee_exempt_list;
    let platform_config = &mut ctx.accounts.platform_config;
    
    // 1. Collect platform creation fee
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
    
    // 2. Create Token-2022 mint
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
    
    // 3. Create Metaplex metadata account
    let data_v2 = DataV2 {
        name: params.name.clone(),
        symbol: params.symbol.clone(),
        uri: params.uri.clone(),
        seller_fee_basis_points: params.seller_fee_basis_points,
        creators: params.creators,
        collection: params.collection,
        uses: params.uses,
    };
    
    // Build the CPI instruction to Metaplex Token Metadata program
    let create_metadata_ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata_account.key(),
        mint: ctx.accounts.mint.key(),
        mint_authority: ctx.accounts.authority.key(),
        payer: ctx.accounts.authority.key(),
        update_authority: (ctx.accounts.authority.key(), params.is_mutable),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    }
    .instruction(mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
        data: data_v2,
        is_mutable: params.is_mutable,
        collection_details: None,
    });
    
    // Invoke the instruction
    anchor_lang::solana_program::program::invoke(
        &create_metadata_ix,
        &[
            ctx.accounts.metadata_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;
    
    // 4. Initialize our custom fee configuration
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
    
    // 5. Initialize fee exempt list
    fee_exempt_list.exempt_addresses = vec![ctx.accounts.authority.key()];
    fee_exempt_list.authority = ctx.accounts.authority.key();
    fee_exempt_list.mint = ctx.accounts.mint.key();
    fee_exempt_list.bump = ctx.bumps.fee_exempt_list;
    
    msg!("Token created with Metaplex metadata and custom fee configuration!");
    
    Ok(())
} 