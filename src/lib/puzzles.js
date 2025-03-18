import { PIECE_VALUES } from './game-context';

// Function to generate a unique ID for pieces
const createPieceId = (type, row, col, color) => `${type}-${row}-${col}-${color}`;

// Helper to convert from algebraic to board coordinates
const algebraicToCoords = (algebraic) => {
  if (!algebraic || algebraic.length !== 2) return null;
  const col = algebraic.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, etc.
  const row = 5 - parseInt(algebraic.charAt(1)); // '5' -> 0, '4' -> 1, etc. (inverted for our 5x5 board)
  return { row, col };
};

// Helper to convert from board coordinates to algebraic notation
const coordsToAlgebraic = (row, col) => {
  const file = String.fromCharCode(97 + col); // 0 -> 'a', 1 -> 'b', etc.
  const rank = 5 - row; // 0 -> '5', 1 -> '4', etc. (inverted for our 5x5 board)
  return `${file}${rank}`;
};

// Collection of pre-generated puzzles
const puzzles = [
  // Puzzle 1: Simple pawn setup with two rooks
  {
    id: 'puzzle-1',
    name: 'Pawn Defense',
    description: 'Set up your pieces to counter the opponent\'s pawn formation.',
    difficulty: 1,
    maxPlayerValue: 15,
    // FEN notation for a 5x5 board
    fen: 'r1k1r/1ppp1/5/5/5 w - - 0 1',
    startSquare: null, // For direct move puzzles
    solution: null, // For direct move puzzles
    opponentPieces: [
      { id: createPieceId('rook', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'a5' },
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king, algebraic: 'c5' },
      { id: createPieceId('rook', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'e5' },
      { id: createPieceId('pawn', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'b4' },
      { id: createPieceId('pawn', 1, 2, 'black'), position: { row: 1, col: 2 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'c4' },
      { id: createPieceId('pawn', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'd4' }
    ]
  },
  
  // Puzzle 2: Queen attack
  {
    id: 'puzzle-2',
    name: 'Queen Challenge',
    description: 'Deal with a powerful queen and her knights.',
    difficulty: 2,
    maxPlayerValue: 18,
    fen: '1nkn1/2q2/5/5/5 w - - 0 1',
    startSquare: null,
    solution: null,
    opponentPieces: [
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king, algebraic: 'c5' },
      { id: createPieceId('queen', 1, 2, 'black'), position: { row: 1, col: 2 }, type: 'queen', color: 'black', value: PIECE_VALUES.queen, algebraic: 'c4' },
      { id: createPieceId('knight', 0, 1, 'black'), position: { row: 0, col: 1 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight, algebraic: 'b5' },
      { id: createPieceId('knight', 0, 3, 'black'), position: { row: 0, col: 3 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight, algebraic: 'd5' },
      { id: createPieceId('pawn', 2, 1, 'black'), position: { row: 2, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'b3' },
      { id: createPieceId('pawn', 2, 3, 'black'), position: { row: 2, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'd3' }
    ]
  },
  
  // Puzzle 3: Bishop trap
  {
    id: 'puzzle-3',
    name: 'Bishop Challenge',
    description: 'Beware of the bishops controlling diagonals.',
    difficulty: 2,
    maxPlayerValue: 16,
    fen: 'r1k2/1b1b1/5/5/p3p w - - 0 1',
    startSquare: null,
    solution: null,
    opponentPieces: [
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king, algebraic: 'c5' },
      { id: createPieceId('bishop', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'bishop', color: 'black', value: PIECE_VALUES.bishop, algebraic: 'b4' },
      { id: createPieceId('bishop', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'bishop', color: 'black', value: PIECE_VALUES.bishop, algebraic: 'd4' },
      { id: createPieceId('rook', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'a5' },
      { id: createPieceId('pawn', 2, 0, 'black'), position: { row: 2, col: 0 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'a3' },
      { id: createPieceId('pawn', 2, 4, 'black'), position: { row: 2, col: 4 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'e3' }
    ]
  },
  
  // Puzzle 4: Knight formation
  {
    id: 'puzzle-4',
    name: 'Knight Ambush',
    description: 'A formation of knights threatens your position.',
    difficulty: 3,
    maxPlayerValue: 20,
    fen: 'k3b/rn1n1/2n2/5/5 w - - 0 1',
    startSquare: null,
    solution: null,
    opponentPieces: [
      { id: createPieceId('king', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'king', color: 'black', value: PIECE_VALUES.king, algebraic: 'a5' },
      { id: createPieceId('knight', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight, algebraic: 'b4' },
      { id: createPieceId('knight', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight, algebraic: 'd4' },
      { id: createPieceId('knight', 2, 2, 'black'), position: { row: 2, col: 2 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight, algebraic: 'c3' },
      { id: createPieceId('bishop', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'bishop', color: 'black', value: PIECE_VALUES.bishop, algebraic: 'e5' },
      { id: createPieceId('rook', 1, 0, 'black'), position: { row: 1, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'a4' }
    ]
  },
  
  // Puzzle 5: Rook fortress
  {
    id: 'puzzle-5',
    name: 'Rook Fortress',
    description: 'Break through the opponent\'s rook defense.',
    difficulty: 3,
    maxPlayerValue: 22,
    fen: 'r1k1r/1p1p1/5/5/r3r w - - 0 1',
    startSquare: null,
    solution: null,
    opponentPieces: [
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king, algebraic: 'c5' },
      { id: createPieceId('rook', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'a5' },
      { id: createPieceId('rook', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'e5' },
      { id: createPieceId('rook', 2, 0, 'black'), position: { row: 2, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'a3' },
      { id: createPieceId('pawn', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'b4' },
      { id: createPieceId('pawn', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn, algebraic: 'd4' }
    ]
  },
  
  // Puzzle 6: Mate in One position (adding a tactical puzzle)
  {
    id: 'puzzle-6',
    name: 'Checkmate in One',
    description: 'Find the one move checkmate. Place only the queen to deliver mate.',
    difficulty: 1,
    maxPlayerValue: 9, // Only need a queen
    fen: '3kr/8/8/8/8 w - - 0 1',
    startSquare: null,
    solution: 'Qe7#', // Queen to e7 is checkmate
    opponentPieces: [
      { id: createPieceId('king', 0, 3, 'black'), position: { row: 0, col: 3 }, type: 'king', color: 'black', value: PIECE_VALUES.king, algebraic: 'd5' },
      { id: createPieceId('rook', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook, algebraic: 'e5' }
    ]
  }
];

// Function to get a random puzzle
export const getRandomPuzzle = () => {
  const index = Math.floor(Math.random() * puzzles.length);
  return puzzles[index];
};

// Function to get a puzzle by ID
export const getPuzzleById = (id) => {
  return puzzles.find(puzzle => puzzle.id === id) || puzzles[0];
};

// Export utility functions for working with algebraic notation
export const chessUtils = {
  algebraicToCoords,
  coordsToAlgebraic
};

// Export all puzzles
export default puzzles; 