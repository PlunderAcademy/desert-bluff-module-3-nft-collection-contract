import { network } from "hardhat";

const nftAddress = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
const networkName = process.env.HARDHAT_NETWORK || "localhost";

if (!nftAddress) {
  console.error("Set NFT_CONTRACT_ADDRESS in .env");
  process.exit(1);
}

const { viem } = await network.connect({ network: networkName });
const publicClient = await viem.getPublicClient();
const [walletClient] = await viem.getWalletClients();

async function main() {
  console.log(`Interacting with NFT Collection on ${networkName}...`);
  console.log("Contract address:", nftAddress);
  console.log("Using account:", walletClient.account.address);
  
  const nft = await viem.getContractAt("SimpleNFTCollection", nftAddress);
  
  // Get collection info
  console.log("\n=== Collection Information ===");
  const name = await nft.read.name();
  const symbol = await nft.read.symbol();
  const maxSupply = await nft.read.MAX_SUPPLY();
  const mintPrice = await nft.read.mintPrice();
  const totalMinted = await nft.read.totalMinted();
  const remainingSupply = await nft.read.remainingSupply();
  const isRevealed = await nft.read.isRevealed();
  const claimant = await nft.read.claimant();
  const owner = await nft.read.owner();
  
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Max Supply:", maxSupply.toString());
  console.log("Mint Price:", mintPrice.toString(), "wei");
  console.log("Total Minted:", totalMinted.toString());
  console.log("Remaining:", remainingSupply.toString());
  console.log("Is Revealed:", isRevealed);
  console.log("Claimant:", claimant);
  console.log("Owner:", owner);
  
  // Get user info
  console.log("\n=== Your NFT Holdings ===");
  const userBalance = await nft.read.balanceOf([walletClient.account.address]);
  console.log("Your NFT Balance:", userBalance.toString());
  
  if (userBalance > 0n) {
    const userTokens = await nft.read.walletOfOwner([walletClient.account.address]);
    console.log("Your Token IDs:", userTokens.map(id => id.toString()).join(", "));
    
    // Show metadata URIs for your tokens
    for (const tokenId of userTokens) {
      const uri = await nft.read.tokenURI([tokenId]);
      console.log(`Token ${tokenId} URI:`, uri);
    }
  }
  
  console.log("\n✅ Interaction completed successfully!");
}

main().catch(console.error);
