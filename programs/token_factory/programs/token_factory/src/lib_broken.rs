use anchor_lang::prelude::*;

declare_id!("H7hosUTUzvSebYWvj4oFw8DrpjNZVAXBYNzAwZbaFcWg");

pub mod errors;
pub mod instructions;
pub mod state;

// Re-export instruction types at crate level
pub use instructions::{
    InitializeToken, InitializeTokenParams,
    // InitializeTokenWithMetadata, InitializeTokenWithMetadataParams,
    TransferWithFee, ManageExemption,
    UpdateFeeConfig, UpdateFeeConfigParams,
    InitializePlatform, UpdatePlatformConfig, UpdatePlatformConfigParams,
};

#[program]
pub mod token_factory {
    use super::*;

    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        params: InitializeTokenParams
    ) -> Result<()> {
        crate::instructions::initialize_token::handler(ctx, params)
    }
    
    // pub fn initialize_token_with_metadata(
    //     ctx: Context<InitializeTokenWithMetadata>,
    //     params: InitializeTokenWithMetadataParams
    // ) -> Result<()> {
    //     crate::instructions::initialize_token_with_metadata::handler(ctx, params)
    // }

    pub fn transfer_with_fee(
        ctx: Context<TransferWithFee>,
        amount: u64
    ) -> Result<()> {
        crate::instructions::transfer_with_fee::handler(ctx, amount)
    }

    pub fn add_fee_exempt_address(
        ctx: Context<ManageExemption>,
        address_to_exempt: Pubkey
    ) -> Result<()> {
        crate::instructions::manage_exemptions::add_fee_exempt_address(ctx, address_to_exempt)
    }

    pub fn remove_fee_exempt_address(
        ctx: Context<ManageExemption>,
        address_to_remove: Pubkey
    ) -> Result<()> {
        crate::instructions::manage_exemptions::remove_fee_exempt_address(ctx, address_to_remove)
    }

    pub fn update_fee_config(
        ctx: Context<UpdateFeeConfig>,
        params: UpdateFeeConfigParams
    ) -> Result<()> {
        crate::instructions::update_fee_config::handler(ctx, params)
    }
    
    pub fn initialize_platform(
        ctx: Context<InitializePlatform>,
        treasury: Pubkey
    ) -> Result<()> {
        crate::instructions::initialize_platform::handler(ctx, treasury)
    }
    
    pub fn update_platform_config(
        ctx: Context<UpdatePlatformConfig>,
        params: UpdatePlatformConfigParams
    ) -> Result<()> {
        crate::instructions::update_platform_config::handler(ctx, params)
    }
} 