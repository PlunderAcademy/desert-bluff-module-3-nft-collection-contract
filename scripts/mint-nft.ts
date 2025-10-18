import { network } from "hardhat";
import { parseEther } from "viem";

const networkName = process.env.HARDHAT_NETWORK || "localhost";
console.log(`Minting NFTs on ${networkName}...`);

const { viem } = await network.connect({
  network: networkName,
});

const publicClient = await viem.getPublicClient();
const walletClients = await viem.getWalletClients();
const [walletClient] = walletClients;

async function main() {
  try {
    // Get contract address from environment
    const nftAddress = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
    
    if (!nftAddress) {
      console.error("❌ NFT_CONTRACT_ADDRESS not set in .env");
      console.log("Please set the deployed contract address");
      process.exit(1);
    }
    
    // Mint parameters
    const quantity = parseInt(process.env.MINT_QUANTITY || "1");
    
    console.log("Minting from account:", walletClient.account.address);
    console.log("NFT contract:", nftAddress);
    console.log("Quantity to mint:", quantity);
    
    // Get contract instance
    const nft = await viem.getContractAt("SimpleNFTCollection", nftAddress);
    
    // Get contract info
    const mintPrice = await nft.read.mintPrice();
    const totalMinted = await nft.read.totalMinted();
    const maxSupply = await nft.read.MAX_SUPPLY();
    const remainingSupply = await nft.read.remainingSupply();
    
    console.log("\n📊 Collection status:");
    console.log("Mint price:", mintPrice.toString(), "wei");
    console.log("Total minted:", totalMinted.toString());
    console.log("Max supply:", maxSupply.toString());
    console.log("Remaining:", remainingSupply.toString());
    
    // Calculate payment
    const payment = mintPrice * BigInt(quantity);
    console.log("\n💰 Payment required:", payment.toString(), "wei");
    
    // Mint NFTs
    console.log("\n🎨 Minting", quantity, "NFT(s)...");
    const hash = await nft.write.mint([BigInt(quantity)], {
      value: payment,
    });
    console.log("Transaction hash:", hash);
    
    // Wait for confirmation
    console.log("⏳ Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    if (receipt.status === "success") {
      console.log("✅ Minting successful!");
      
      // Get updated info
      const newTotalMinted = await nft.read.totalMinted();
      const userBalance = await nft.read.balanceOf([walletClient.account.address]);
      const userTokens = await nft.read.walletOfOwner([walletClient.account.address]);
      
      console.log("\n📊 Updated status:");
      console.log("Total minted:", newTotalMinted.toString());
      console.log("Your NFT balance:", userBalance.toString());
      console.log("Your token IDs:", userTokens.map(id => id.toString()).join(", "));
      
      console.log("\n🎉 Minting completed successfully!");
      console.log("Transaction ID:", hash);
      
    } else {
      console.error("❌ Transaction failed");
      process.exit(1);
    }
    
  } catch (error: any) {
    console.error("❌ Minting failed:", error);
    
    // Provide helpful error messages
    if (error.message?.includes("Exceeds max supply")) {
      console.log("\n💡 Collection is sold out!");
    } else if (error.message?.includes("Insufficient payment")) {
      console.log("\n💡 Not enough ZIL sent for minting");
    }
    
    process.exit(1);
  }
}

main().catch(console.error);
