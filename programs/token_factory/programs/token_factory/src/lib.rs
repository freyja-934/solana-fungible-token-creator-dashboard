use anchor_lang::prelude::*;

declare_id!("H7hosUTUzvSebYWvj4oFw8DrpjNZVAXBYNzAwZbaFcWg");

#[program]
pub mod token_factory {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
