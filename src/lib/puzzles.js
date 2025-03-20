import { PIECE_VALUES } from './puzzle-engine';

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
  {
    id: 'puzzle-1',
    name: 'Pawn Defense',
    description: 'Set up your pieces to counter the opponent\'s pawn formation while protecting your king.',
    difficulty: 1,
    maxPlayerValue: 15,
    fen: 'r1k1r/1ppp1/5/5/2K2 w - - 0 1'  // Black king on e3, rooks on a5 and e5, pawns on b4,c4,d4
  },
  {
    id: 'puzzle-2',
    name: 'Queen Challenge',
    description: 'Deal with a powerful queen and her knights while keeping your king safe.',
    difficulty: 2,
    maxPlayerValue: 18,
    fen: '1nn2/2q2/3k1/5/2K2 w - - 0 1'  // Black king on e3, queen on c4, knights on b5 and c5
  },
  {
    id: 'puzzle-3',
    name: 'Bishop Challenge',
    description: 'Beware of the bishops controlling diagonals while protecting your king.',
    difficulty: 2,
    maxPlayerValue: 16,
    fen: 'r3b/1b3/3k1/5/2K2 w - - 0 1'  // Black king on e3, bishops on b4 and e5, rook on a5
  },
  {
    id: 'puzzle-4',
    name: 'Knight Ambush',
    description: 'A formation of knights threatens both kings.',
    difficulty: 3,
    maxPlayerValue: 20,
    fen: '2n1b/rn3/3k1/5/2K2 w - - 0 1'  // Black king on e3, knights on c5,b4, bishop on e5, rook on a4
  },
  {
    id: 'puzzle-5',
    name: 'Rook Fortress',
    description: 'Break through the opponent\'s rook defense while maintaining king safety.',
    difficulty: 3,
    maxPlayerValue: 22,
    fen: 'r2r1/1p1p1/3k1/5/2K2 w - - 0 1'  // Black king on e3, rooks on a5 and d5, pawns on b4 and d4
  },
  {
    id: 'puzzle-6',
    name: 'Checkmate in One',
    description: 'Find the one move checkmate with your queen, working around both kings.',
    difficulty: 1,
    maxPlayerValue: 9,
    fen: '3r1/5/3k1/5/2K2 w - - 0 1',  // Black king on e3, rook on d5
    solution: 'Qc3#'  // Updated solution for the new position
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