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
  console.log(`Revealing NFT Collection on ${networkName}...`);
  console.log("Contract address:", nftAddress);
  console.log("Caller:", walletClient.account.address);
  
  const nft = await viem.getContractAt("SimpleNFTCollection", nftAddress);
  
  // Check current status
  const isRevealed = await nft.read.isRevealed();
  const owner = await nft.read.owner();
  
  console.log("Current reveal status:", isRevealed);
  console.log("Contract owner:", owner);
  
  if (isRevealed) {
    console.log("\n⚠️  Collection is already revealed!");
    process.exit(0);
  }
  
  if (owner.toLowerCase() !== walletClient.account.address.toLowerCase()) {
    console.error("\n❌ Only the owner can reveal the collection!");
    process.exit(1);
  }
  
  // Reveal
  console.log("\n🎉 Revealing collection...");
  const hash = await nft.write.reveal();
  console.log("Transaction hash:", hash);
  
  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  if (receipt.status === "success") {
    console.log("✅ Collection revealed successfully!");
    
    const newIsRevealed = await nft.read.isRevealed();
    console.log("New reveal status:", newIsRevealed);
    
    console.log("\n🎨 All NFTs now show their revealed metadata!");
    console.log("Transaction ID:", hash);
  } else {
    console.error("❌ Reveal failed");
    process.exit(1);
  }
}

main().catch(console.error);
