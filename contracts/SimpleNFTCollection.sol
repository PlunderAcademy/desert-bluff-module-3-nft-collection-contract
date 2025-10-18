// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SimpleNFTCollection
 * @dev A production-ready NFT collection contract for educational purposes
 * Features:
 * - Fixed supply minting (100 tokens)
 * - Paid minting with ZIL
 * - Metadata URI management
 * - Reveal mechanics
 * - Owner controls for price and base URI
 * - Claimant tracking for achievement verification
 */
contract SimpleNFTCollection is ERC721, Ownable {
    using Strings for uint256;

    // Collection parameters
    uint256 public constant MAX_SUPPLY = 100;
    uint256 public mintPrice = 1 ether;
    uint256 public totalMinted = 0;
    
    // Metadata
    string private baseTokenURI;
    bool public isRevealed = false;
    string public notRevealedUri;
    
    // Achievement tracking
    address public claimant;

    // Events
    event NFTMinted(address indexed minter, uint256 indexed tokenId, uint256 quantity);
    event PriceUpdated(uint256 newPrice);
    event BaseURIUpdated(string newBaseURI);
    event Revealed(string newBaseURI);
    event Withdrawn(address indexed recipient, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initBaseURI,
        string memory _notRevealedUri,
        address _claimant
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        require(_claimant != address(0), "Invalid claimant address");
        baseTokenURI = _initBaseURI;
        notRevealedUri = _notRevealedUri;
        claimant = _claimant;
    }

    /**
     * @dev Mint NFTs (paid)
     * Requirements:
     * - Must send exact mint price * quantity
     * - Supply must not be exceeded
     */
    function mint(uint256 _quantity) public payable {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(_quantity <= 10, "Cannot mint more than 10 at once");
        require(totalMinted + _quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.value >= mintPrice * _quantity, "Insufficient payment");

        uint256 startTokenId = totalMinted + 1;
        
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = totalMinted + 1;
            totalMinted++;
            _safeMint(msg.sender, tokenId);
        }

        emit NFTMinted(msg.sender, startTokenId, _quantity);

        // Refund excess payment
        if (msg.value > mintPrice * _quantity) {
            payable(msg.sender).transfer(msg.value - (mintPrice * _quantity));
        }
    }

    /**
     * @dev Owner can mint for free (e.g., for giveaways)
     */
    function ownerMint(address _to, uint256 _quantity) public onlyOwner {
        require(_quantity > 0, "Quantity must be greater than 0");
        require(totalMinted + _quantity <= MAX_SUPPLY, "Exceeds max supply");

        uint256 startTokenId = totalMinted + 1;
        
        for (uint256 i = 0; i < _quantity; i++) {
            uint256 tokenId = totalMinted + 1;
            totalMinted++;
            _safeMint(_to, tokenId);
        }

        emit NFTMinted(_to, startTokenId, _quantity);
    }

    /**
     * @dev Returns the token URI for a given token ID
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        virtual 
        override 
        returns (string memory) 
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");

        if (!isRevealed) {
            return notRevealedUri;
        }

        return bytes(baseTokenURI).length > 0
            ? string(abi.encodePacked(baseTokenURI, tokenId.toString(), ".json"))
            : "";
    }

    /**
     * @dev Update the mint price (owner only)
     */
    function setMintPrice(uint256 _newPrice) public onlyOwner {
        mintPrice = _newPrice;
        emit PriceUpdated(_newPrice);
    }

    /**
     * @dev Update the base URI (owner only)
     */
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseTokenURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /**
     * @dev Set the not revealed URI
     */
    function setNotRevealedURI(string memory _notRevealedURI) public onlyOwner {
        notRevealedUri = _notRevealedURI;
    }

    /**
     * @dev Reveal the collection
     */
    function reveal() public onlyOwner {
        require(!isRevealed, "Already revealed");
        isRevealed = true;
        emit Revealed(baseTokenURI);
    }

    /**
     * @dev Withdraw contract balance (owner only)
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
        emit Withdrawn(owner(), balance);
    }

    /**
     * @dev Get tokens owned by an address
     */
    function walletOfOwner(address _owner) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i <= totalMinted; i++) {
            if (ownerOf(i) == _owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Check how many NFTs are still available
     */
    function remainingSupply() public view returns (uint256) {
        return MAX_SUPPLY - totalMinted;
    }
}
