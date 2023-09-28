use anchor_lang::prelude::*;

declare_id!("3C1UFAwxLFK52J3drUMRia86Wpo98oxvR2JNZsgzJrjJ");

pub mod contexts;

pub use contexts::*;

#[program]
pub mod mint_nft {
    use super::*;

    pub fn mint_nft(ctx: Context<MintNFT>, creator_key: Pubkey, uri: String, title: String) -> Result<()> {
        ctx.accounts.mint_nft(creator_key, uri, title)?;
    
        msg!("NFT Successfully minted!");
            
        Ok(())
    }
}
