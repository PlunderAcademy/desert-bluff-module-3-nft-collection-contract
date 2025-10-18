import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { parseEther, getAddress } from "viem";

describe("SimpleNFTCollection", async function () {
  const { viem, networkHelpers } = await network.connect();
  const [owner, user1, user2, claimant] = await viem.getWalletClients();

  it("Should set the correct name and symbol", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    assert.equal(await nft.read.name(), "Test NFT");
    assert.equal(await nft.read.symbol(), "TNFT");
  });

  it("Should set the correct owner", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const contractOwner = await nft.read.owner();
    assert.equal(getAddress(contractOwner), getAddress(owner.account.address));
  });

  it("Should set the correct claimant", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const contractClaimant = await nft.read.claimant();
    assert.equal(getAddress(contractClaimant), getAddress(claimant.account.address));
  });

  it("Should initialize with correct parameters", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    assert.equal(await nft.read.MAX_SUPPLY(), 100n);
    assert.equal(await nft.read.mintPrice(), parseEther("1"));
    assert.equal(await nft.read.totalMinted(), 0n);
    assert.equal(await nft.read.isRevealed(), false);
  });

  it("Should revert if claimant is zero address", async function () {
    await assert.rejects(
      async () => await viem.deployContract("SimpleNFTCollection", [
        "Test NFT",
        "TNFT",
        "ipfs://revealed/",
        "ipfs://hidden.json",
        "0x0000000000000000000000000000000000000000",
      ])
    );
  });

  it("Should mint a single NFT with correct payment", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([1n], {
      account: user1.account,
      value: mintPrice,
    });

    assert.equal(await nft.read.totalMinted(), 1n);
    assert.equal(await nft.read.balanceOf([user1.account.address]), 1n);
    assert.equal(await nft.read.ownerOf([1n]), getAddress(user1.account.address));
  });

  it("Should mint multiple NFTs in one transaction", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([5n], {
      account: user1.account,
      value: mintPrice * 5n,
    });

    assert.equal(await nft.read.totalMinted(), 5n);
    assert.equal(await nft.read.balanceOf([user1.account.address]), 5n);
    
    // Check all token IDs are owned correctly
    for (let i = 1; i <= 5; i++) {
      assert.equal(await nft.read.ownerOf([BigInt(i)]), getAddress(user1.account.address));
    }
  });

  it("Should refund excess payment", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    const mintPrice = await nft.read.mintPrice();
    const overpayment = mintPrice + parseEther("5"); // Pay 6 instead of 1

    const balanceBefore = await publicClient.getBalance({
      address: user1.account.address,
    });

    const hash = await nft.write.mint([1n], {
      account: user1.account,
      value: overpayment,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const balanceAfter = await publicClient.getBalance({
      address: user1.account.address,
    });

    const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
    const expectedBalance = balanceBefore - mintPrice - gasUsed;

    // Allow small difference for gas estimation
    const diff = balanceAfter > expectedBalance 
      ? balanceAfter - expectedBalance 
      : expectedBalance - balanceAfter;
    
    assert.ok(diff < parseEther("0.001"), "Refund should be within 0.001 ZIL"); // Within 0.001 ZIL
  });

  it("Should emit NFTMinted event", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    const mintPrice = await nft.read.mintPrice();
    const hash = await nft.write.mint([3n], {
      account: user1.account,
      value: mintPrice * 3n,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    // Check for NFTMinted event
    assert.ok(receipt.logs.length > 0, "Should emit NFTMinted event");
  });

  it("Should revert if quantity is zero", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const mintPrice = await nft.read.mintPrice();
    
    await assert.rejects(
      async () => await nft.write.mint([0n], {
        account: user1.account,
        value: mintPrice,
      }),
      /Quantity must be greater than 0/
    );
  });

  it("Should revert if quantity exceeds 10", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const mintPrice = await nft.read.mintPrice();
    
    await assert.rejects(
      async () => await nft.write.mint([11n], {
        account: user1.account,
        value: mintPrice * 11n,
      }),
      /Cannot mint more than 10 at once/
    );
  });

  it("Should revert if insufficient payment", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const mintPrice = await nft.read.mintPrice();
    const underpayment = mintPrice - 1n;
    
    await assert.rejects(
      async () => await nft.write.mint([1n], {
        account: user1.account,
        value: underpayment,
      }),
      /Insufficient payment/
    );
  });

  it("Should revert if exceeds max supply", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    // Mint 100 NFTs (max supply)
    for (let i = 0; i < 10; i++) {
      await nft.write.ownerMint([owner.account.address, 10n]);
    }

    assert.equal(await nft.read.totalMinted(), 100n);

    // Try to mint one more
    const mintPrice = await nft.read.mintPrice();
    
    await assert.rejects(
      async () => await nft.write.mint([1n], {
        account: owner.account,
        value: mintPrice,
      }),
      /Exceeds max supply/
    );
  });

  it("Should allow owner to mint for free", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    await nft.write.ownerMint([user1.account.address, 5n]);

    assert.equal(await nft.read.totalMinted(), 5n);
    assert.equal(await nft.read.balanceOf([user1.account.address]), 5n);
  });

  it("Should revert if non-owner tries to owner mint", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    await assert.rejects(
      async () => await nft.write.ownerMint([user1.account.address, 1n], {
        account: user1.account,
      })
    ); // OwnableUnauthorizedAccount
  });

  it("Should respect max supply for owner minting", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    // Mint 95 NFTs
    await nft.write.ownerMint([owner.account.address, 95n]);

    // Try to mint 10 more (would exceed 100)
    await assert.rejects(
      async () => await nft.write.ownerMint([owner.account.address, 10n]),
      /Exceeds max supply/
    );

    // But 5 more should work
    await nft.write.ownerMint([owner.account.address, 5n]);

    assert.equal(await nft.read.totalMinted(), 100n);
  });

  it("Should return hidden URI when not revealed", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([1n], {
      account: user1.account,
      value: mintPrice,
    });

    const tokenURI = await nft.read.tokenURI([1n]);
    assert.equal(tokenURI, "ipfs://hidden.json");
  });

  it("Should return unique URI after reveal", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    // Mint some tokens
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([3n], {
      account: user1.account,
      value: mintPrice * 3n,
    });

    // Reveal
    await nft.write.reveal();

    // Check URIs
    assert.equal(await nft.read.tokenURI([1n]), "ipfs://revealed/1.json");
    assert.equal(await nft.read.tokenURI([2n]), "ipfs://revealed/2.json");
    assert.equal(await nft.read.tokenURI([3n]), "ipfs://revealed/3.json");
  });

  it("Should emit Revealed event", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    const hash = await nft.write.reveal();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Check for Revealed event
    assert.ok(receipt.logs.length > 0, "Should emit Revealed event");
  });

  it("Should revert if trying to reveal twice", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    // First reveal
    await nft.write.reveal();

    // Second reveal should fail
    await assert.rejects(
      async () => await nft.write.reveal(),
      /Already revealed/
    );
  });

  it("Should revert if non-owner tries to reveal", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    await assert.rejects(
      async () => await nft.write.reveal({ account: user1.account })
    );
  });

  it("Should revert tokenURI for non-existent token", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    await assert.rejects(
      async () => await nft.read.tokenURI([999n])
    );
  });

  it("Should allow owner to update mint price", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const newPrice = parseEther("0.05");
    await nft.write.setMintPrice([newPrice]);

    assert.equal(await nft.read.mintPrice(), newPrice);
  });

  it("Should emit PriceUpdated event", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    const newPrice = parseEther("0.05");
    const hash = await nft.write.setMintPrice([newPrice]);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    assert.ok(receipt.logs.length > 0, "Should emit PriceUpdated event");
  });

  it("Should revert if non-owner tries to update price", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    await assert.rejects(
      async () => await nft.write.setMintPrice([parseEther("0.05")], {
        account: user1.account,
      })
    );
  });

  it("Should allow owner to update base URI", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const newBaseURI = "ipfs://newCID/";
    await nft.write.setBaseURI([newBaseURI]);

    // Reveal to check new base URI
    await nft.write.reveal();

    // Mint a token
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([1n], {
      value: mintPrice,
    });

    const tokenURI = await nft.read.tokenURI([1n]);
    assert.equal(tokenURI, "ipfs://newCID/1.json");
  });

  it("Should allow owner to update not revealed URI", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const newHiddenURI = "ipfs://newHidden.json";
    await nft.write.setNotRevealedURI([newHiddenURI]);

    // Mint a token
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([1n], {
      value: mintPrice,
    });

    const tokenURI = await nft.read.tokenURI([1n]);
    assert.equal(tokenURI, newHiddenURI);
  });

  it("Should allow owner to withdraw contract balance", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    // Mint some NFTs to accumulate funds
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([5n], {
      account: user1.account,
      value: mintPrice * 5n,
    });

    const contractBalance = await publicClient.getBalance({
      address: nft.address,
    });

    assert.equal(contractBalance, mintPrice * 5n);

    // Withdraw
    const ownerBalanceBefore = await publicClient.getBalance({
      address: owner.account.address,
    });

    const withdrawHash = await nft.write.withdraw();
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: withdrawHash,
    });

    const ownerBalanceAfter = await publicClient.getBalance({
      address: owner.account.address,
    });

    const gasUsed = receipt.gasUsed * receipt.effectiveGasPrice;
    const expectedBalance = ownerBalanceBefore + contractBalance - gasUsed;

    // Allow small difference for gas estimation
    const diff = ownerBalanceAfter > expectedBalance
      ? ownerBalanceAfter - expectedBalance
      : expectedBalance - ownerBalanceAfter;

    assert.ok(diff < parseEther("0.001"), "Withdrawal amount should be correct");
  });

  it("Should emit Withdrawn event", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    // Mint to add funds
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([1n], {
      account: user1.account,
      value: mintPrice,
    });

    // Withdraw
    const hash = await nft.write.withdraw();
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    assert.ok(receipt.logs.length > 0, "Should emit Withdrawn event");
  });

  it("Should revert if no funds to withdraw", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    await assert.rejects(
      async () => await nft.write.withdraw(),
      /No funds to withdraw/
    );
  });

  it("Should revert if non-owner tries to withdraw", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    // Mint to add funds
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([1n], {
      account: user1.account,
      value: mintPrice,
    });

    // Try to withdraw as non-owner
    await assert.rejects(
      async () => await nft.write.withdraw({ account: user1.account })
    );
  });

  it("Should return correct remaining supply", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    assert.equal(await nft.read.remainingSupply(), 100n);

    // Mint some
    const ownerAddr = await nft.read.owner();
    await nft.write.ownerMint([ownerAddr, 25n]);

    assert.equal(await nft.read.remainingSupply(), 75n);
  });

  it("Should return wallet of owner correctly", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    // Mint some tokens
    const mintPrice = await nft.read.mintPrice();
    await nft.write.mint([5n], {
      account: user1.account,
      value: mintPrice * 5n,
    });

    const wallet = await nft.read.walletOfOwner([user1.account.address]);
    
    assert.equal(wallet.length, 5);
    assert.equal(wallet[0], 1n);
    assert.equal(wallet[1], 2n);
    assert.equal(wallet[2], 3n);
    assert.equal(wallet[3], 4n);
    assert.equal(wallet[4], 5n);
  });

  it("Should return empty array for non-owners", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);

    const wallet = await nft.read.walletOfOwner([user2.account.address]);
    assert.equal(wallet.length, 0);
  });

  it("Should use reasonable gas for single mint", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    const mintPrice = await nft.read.mintPrice();
    const hash = await nft.write.mint([1n], {
      account: user1.account,
      value: mintPrice,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log("      Gas used for single mint:", receipt.gasUsed.toString());
    
    // Should be under 150k gas
    assert.ok(receipt.gasUsed < 150000n, "Gas should be under 150k");
  });

  it("Should be more efficient for batch minting", async function () {
    const nft = await viem.deployContract("SimpleNFTCollection", [
      "Test NFT",
      "TNFT",
      "ipfs://revealed/",
      "ipfs://hidden.json",
      claimant.account.address,
    ]);
    const publicClient = await viem.getPublicClient();

    const mintPrice = await nft.read.mintPrice();
    const hash = await nft.write.mint([10n], {
      account: user1.account,
      value: mintPrice * 10n,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    
    console.log("      Gas used for 10 mints:", receipt.gasUsed.toString());
    console.log("      Gas per NFT:", (receipt.gasUsed / 10n).toString());
    
    // Should be under 600k gas for 10 mints
    assert.ok(receipt.gasUsed < 600000n, "Gas should be under 600k for 10 mints");
  });
});
