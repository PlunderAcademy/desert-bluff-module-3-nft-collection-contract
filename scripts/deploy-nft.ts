import { network } from "hardhat";

const networkName = process.env.HARDHAT_NETWORK || "localhost";
console.log(`Deploying NFT Collection to ${networkName}...`);

const { viem } = await network.connect({
  network: networkName,
});

const publicClient = await viem.getPublicClient();
const walletClients = await viem.getWalletClients();
const [walletClient] = walletClients;

async function main() {
  try {
    // Get parameters from environment
    const claimantAddress = process.env.CLAIMANT_ADDRESS as `0x${string}`;
    
    if (!claimantAddress) {
      console.error("❌ CLAIMANT_ADDRESS not set in .env");
      console.log("Please set your training portal wallet address");
      process.exit(1);
    }
    
    // Collection parameters
    const collectionName = "Plunder NFT Collection";
    const collectionSymbol = "PNFT";
    
    // Placeholder IPFS URIs (we'll add real metadata in next lesson)
    const baseURI = "ipfs://placeholder-revealed/";
    const hiddenURI = "ipfs://placeholder-hidden/hidden.json";
    
    console.log("Deploying from account:", walletClient.account.address);
    console.log("Collection name:", collectionName);
    console.log("Collection symbol:", collectionSymbol);
    console.log("Base URI (placeholder):", baseURI);
    console.log("Hidden URI (placeholder):", hiddenURI);
    console.log("Claimant:", claimantAddress);
    
    // Show network info
    const chainId = await publicClient.getChainId();
    console.log("Network:", networkName);
    console.log("Chain ID:", chainId);
    
    // Deploy NFT Collection contract
    console.log("\nDeploying NFT Collection...");
    
    const nftArtifact = (await import("../artifacts/contracts/SimpleNFTCollection.sol/SimpleNFTCollection.json")).default;
    
    const deploymentTx = await walletClient.deployContract({
      abi: nftArtifact.abi,
      bytecode: nftArtifact.bytecode as `0x${string}`,
      args: [collectionName, collectionSymbol, baseURI, hiddenURI, claimantAddress],
    });
    
    console.log("⏳ Deployment transaction submitted...");
    console.log("Transaction hash:", deploymentTx);
    
    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: deploymentTx 
    });
    
    const contractAddress = receipt.contractAddress!;
    console.log("✅ NFT Collection deployed to:", contractAddress);
    
    // Create contract instance
    const nft = await viem.getContractAt("SimpleNFTCollection", contractAddress);
    
    // Display transaction ID for achievement submission
    console.log("\n🎯 Transaction ID for Achievement Submission:");
    console.log(deploymentTx);
    
    // Wait for contract activation
    console.log("\n⏳ Waiting for contract activation...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify deployment
    console.log("\n📋 Verifying deployment...");
    try {
      const name = await nft.read.name();
      const symbol = await nft.read.symbol();
      const maxSupply = await nft.read.MAX_SUPPLY();
      const mintPrice = await nft.read.mintPrice();
      const totalMinted = await nft.read.totalMinted();
      const isRevealed = await nft.read.isRevealed();
      const claimant = await nft.read.claimant();
      const owner = await nft.read.owner();
      
      console.log("Collection Name:", name);
      console.log("Symbol:", symbol);
      console.log("Max Supply:", maxSupply.toString());
      console.log("Mint Price:", mintPrice.toString(), "wei (1 ZIL)");
      console.log("Total Minted:", totalMinted.toString());
      console.log("Is Revealed:", isRevealed);
      console.log("Claimant:", claimant);
      console.log("Owner:", owner);
      
      // Verification checks
      if (claimant.toLowerCase() !== claimantAddress.toLowerCase()) {
        console.error("⚠️  Warning: Claimant address mismatch!");
      }
      if (owner.toLowerCase() !== walletClient.account.address.toLowerCase()) {
        console.error("⚠️  Warning: Owner address mismatch!");
      }
      
      console.log("\n✅ All verifications passed!");
      
    } catch (verificationError) {
      console.log("⚠️  Contract verification failed (may need more time to activate)");
      console.log("Contract deployed successfully. Verify manually later.");
    }
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Contract address:", contractAddress);
    console.log("Transaction ID:", deploymentTx);
    console.log("Network:", networkName);
    console.log("Chain ID:", chainId);
    console.log("Deployer:", walletClient.account.address);
    console.log("Claimant:", claimantAddress);
    
    console.log("\n📋 Next Steps:");
    console.log("1. Test minting locally with mint-nft.ts script");
    console.log("2. In next lesson, generate metadata and pin to IPFS");
    console.log("3. Update contract URIs with real IPFS links");
    console.log("4. Reveal the collection");
    console.log("5. Submit deployment transaction for achievement verification");
    console.log("   https://plunderacademy.com/lessons/island3/nft-collection-practical");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);
