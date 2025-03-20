import { Assets } from 'pixi.js';

// Map of piece names to their SVG file paths
const pieceAssets = {
  'bB': '/assets/pieces/bB.svg',
  'bK': '/assets/pieces/bK.svg',
  'bN': '/assets/pieces/bN.svg',
  'bP': '/assets/pieces/bP.svg',
  'bQ': '/assets/pieces/bQ.svg',
  'bR': '/assets/pieces/bR.svg',
  'wB': '/assets/pieces/wB.svg',
  'wK': '/assets/pieces/wK.svg',
  'wN': '/assets/pieces/wN.svg',
  'wP': '/assets/pieces/wP.svg',
  'wQ': '/assets/pieces/wQ.svg',
  'wR': '/assets/pieces/wR.svg',
};

// Map FEN characters to texture keys
const fenToTextureKey = {
  'p': 'bP', 'n': 'bN', 'b': 'bB', 'r': 'bR', 'q': 'bQ', 'k': 'bK',
  'P': 'wP', 'N': 'wN', 'B': 'wB', 'R': 'wR', 'Q': 'wQ', 'K': 'wK'
};

// Keep track of whether assets have been added to the bundle
let assetsAdded = false;

// Load all piece textures
export async function loadPieceTextures() {
  try {
    // If assets are already loaded, just load the bundle
    if (assetsAdded) {
      return await Assets.loadBundle('pieces');
    }

    // Create a bundle for all piece textures
    const bundle = {};
    
    // Add each asset to the bundle with its full URL
    Object.entries(pieceAssets).forEach(([name, path]) => {
      // Get the base URL from the window location
      const baseUrl = window.location.origin;
      // Create the full URL
      const fullUrl = `${baseUrl}${path}`;
      // Add to bundle
      bundle[name] = {
        src: fullUrl,
        data: { resourceType: 'image' }
      };
    });

    // Add the bundle to Assets (only done once)
    Assets.addBundle('pieces', bundle);
    assetsAdded = true;

    // Load the bundle
    const textures = await Assets.loadBundle('pieces');
    return textures;
  } catch (error) {
    console.error('Failed to load piece textures:', error);
    throw error;
  }
}

// Get the piece key from a piece object
export function getPieceKey(piece) {
  if (!piece || typeof piece !== 'object') return null;
  
  // If we have the FEN character, use it directly
  if (piece.fenChar) {
    return fenToTextureKey[piece.fenChar];
  }
  
  // Fallback to the old method if fenChar is not available
  if (!piece.color || !piece.type) return null;
  
  try {
    const color = piece.color.toLowerCase() === 'white' ? 'w' : 'b';
    const type = piece.type.toString().charAt(0).toUpperCase();
    return `${color}${type}`;
  } catch (error) {
    console.warn('Error generating piece key:', error);
    return null;
  }
} 