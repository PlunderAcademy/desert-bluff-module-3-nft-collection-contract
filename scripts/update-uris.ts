import { network } from "hardhat";

const nftAddress = process.env.NFT_CONTRACT_ADDRESS as `0x${string}`;
const networkName = process.env.HARDHAT_NETWORK || "localhost";

const hiddenURI = "ipfs://bafkreic2nlpka3e6zfhhcbuejmuy2a3qu7cjlfwimhw62safo4t3nhfumq/hidden.json";  // Your hidden metadata CID
const baseURI = "ipfs://bafybeicsdmsbk7jfxdpxp7s7gvuadqmiwglaeaslxcexdokfjeztatqnai/";  // Your revealed metadata folder CID

const { viem } = await network.connect({ network: networkName });
const publicClient = await viem.getPublicClient();
const [walletClient] = await viem.getWalletClients();

async function main() {
  console.log(`Updating URIs on ${networkName}...`);
  
  const nft = await viem.getContractAt("SimpleNFTCollection", nftAddress);
  
  // Update hidden URI
  console.log("\n📝 Updating hidden URI...");
  console.log("New hidden URI:", hiddenURI);
  const hiddenHash = await nft.write.setNotRevealedURI([hiddenURI]);
  await publicClient.waitForTransactionReceipt({ hash: hiddenHash });
  console.log("✅ Hidden URI updated!");
  
  // Update base URI
  console.log("\n📝 Updating base URI...");
  console.log("New base URI:", baseURI);
  const baseHash = await nft.write.setBaseURI([baseURI]);
  await publicClient.waitForTransactionReceipt({ hash: baseHash });
  console.log("✅ Base URI updated!");
  
  console.log("\n🎉 All URIs updated successfully!");
}

main().catch(console.error);
