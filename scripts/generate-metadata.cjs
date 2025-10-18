#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Shape types (matches SVG generation pattern)
const shapes = ['Circle', 'Rectangle', 'Triangle', 'Diamond', 'Ellipse'];
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52C76A',
  // Add more colors to match your SVGs...
];

// Rarity distribution
function getRarity(tokenId) {
  if (tokenId <= 10) return 'Legendary';
  if (tokenId <= 30) return 'Epic';
  if (tokenId <= 60) return 'Rare';
  return 'Common';
}

// Get shape type from token ID
function getShape(tokenId) {
  const patterns = [
    [0, 3, 6, 9],    // Circle indices
    [1, 4, 7],       // Rectangle indices
    [2, 5, 8],       // Triangle indices
  ];
  
  const mod = (tokenId - 1) % 12;
  if (patterns[0].includes(mod)) return 'Circle';
  if (patterns[1].includes(mod)) return 'Rectangle';
  if (patterns[2].includes(mod)) return 'Triangle';
  if (mod >= 9) return 'Diamond';
  return 'Ellipse';
}

// Get color from token ID
function getColor(tokenId) {
  return colors[(tokenId - 1) % colors.length] || '#000000';
}

const revealedDir = 'metadata/revealed';
const imagesCID = process.env.IMAGES_CID || 'REPLACE_WITH_IMAGES_CID';

// Create directory if it doesn't exist
if (!fs.existsSync(revealedDir)) {
  fs.mkdirSync(revealedDir, { recursive: true });
}

// Generate metadata for each token (1-100)
for (let i = 1; i <= 100; i++) {
  const num = String(i).padStart(3, '0');
  const shape = getShape(i);
  const color = getColor(i);
  const rarity = getRarity(i);
  
  const metadata = {
    name: `Plunder NFT #${i}`,
    description: `A unique ${shape.toLowerCase()} from the Plunder NFT Collection. This is token #${i} of 100.`,
    image: `ipfs://${imagesCID}/shape-${num}.svg`,
    attributes: [
      {
        trait_type: 'Shape',
        value: shape
      },
      {
        trait_type: 'Color',
        value: color
      },
      {
        trait_type: 'Rarity',
        value: rarity
      },
      {
        trait_type: 'Number',
        value: i
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(revealedDir, `${i}.json`),
    JSON.stringify(metadata, null, 2)
  );
}

console.log(`✅ Successfully created 100 metadata JSON files in ${revealedDir}/`);
console.log(`📝 Don't forget to replace IMAGES_CID in the files after uploading images to IPFS!`);
