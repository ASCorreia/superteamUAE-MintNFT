import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MintNft } from "../target/types/mint_nft";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createInitializeMintInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js"

describe("mint-nft", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.MintNft as Program<MintNft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

  const getMetadata = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const getMasterEdition = async (mint: anchor.web3.PublicKey): Promise<anchor.web3.PublicKey> => {
    return (
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      )
    )[0];
  };

  const NFTmintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();

  it("Mint an NFT", async() => {
    const lamports: number = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);

    //Get the ATA for a token on a public key (but might not exist yet)
    let receiver = provider.publicKey;
    let associatedTokenAccount = await getAssociatedTokenAddress(NFTmintKey.publicKey, receiver);

    //Creates a transaction with a list of instructions
    const mint_nft_tx = new anchor.web3.Transaction().add(
        anchor.web3.SystemProgram.createAccount({
            fromPubkey: receiver,
            newAccountPubkey: NFTmintKey.publicKey,
            space: MINT_SIZE,
            programId: TOKEN_PROGRAM_ID,
            lamports,
        }),
        
        createInitializeMintInstruction(NFTmintKey.publicKey, 0, receiver, receiver),
        
        createAssociatedTokenAccountInstruction(receiver, associatedTokenAccount, receiver, NFTmintKey.publicKey)
    );

    //Sends and confirms the transaction
    console.log("Sending transaction");
    const res = await provider.sendAndConfirm(mint_nft_tx, [NFTmintKey]);

    console.log(await program.provider.connection.getParsedAccountInfo(NFTmintKey.publicKey));

    console.log("Account: ", res);
    console.log("Mint Key: ", NFTmintKey.publicKey.toString());
    console.log("User: ", provider.wallet.publicKey.toString());


    //Starts the Mint Operation
    console.log("Starting the NFT Mint Operation");
    const metadataAddress = await getMetadata(NFTmintKey.publicKey);
    const masterEdition = await getMasterEdition(NFTmintKey.publicKey);
    
    //Executes our smart contract to mint our token into our specified ATA
    //Don't forget to add your creator, uri and NFT title
    const tx = await program.methods.mintNft(
      new anchor.web3.PublicKey("YOUR_CREATOR_PUBKEY"),
      "YOUR_URI_PATH",
      "YOUR_NFT_TITLE").accounts(
        {
          mintAuthority: receiver,
          mint: NFTmintKey.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadata: metadataAddress,
          tokenAccount: associatedTokenAccount,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          payer: receiver,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          masterEdition: masterEdition,
        },
    ).rpc();
    console.log("Your transaction signature", tx);       
    console.log("NFT Mint Operation Finished!");

    /*
    The following can be used to verify your NFT

    const metaplex = Metaplex.make(provider.connection).use(keypairIdentity(keypair));
    let verified = await metaplex.nfts().verifyCreator({mintAddress: NFTmintKey.publicKey, creator: keypair});
    console.log("NFT Verified: TxID: ", verified.response.signature);
    */
  });
});
