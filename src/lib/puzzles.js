import { PIECE_VALUES } from './game-context';

// Function to generate a unique ID for pieces
const createPieceId = (type, row, col, color) => `${type}-${row}-${col}-${color}`;

// Collection of pre-generated puzzles
const puzzles = [
  // Puzzle 1: Simple pawn setup with two rooks
  {
    id: 'puzzle-1',
    name: 'Pawn Defense',
    description: 'Set up your pieces to counter the opponent\'s pawn formation.',
    difficulty: 1,
    maxPlayerValue: 15,
    opponentPieces: [
      { id: createPieceId('rook', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king },
      { id: createPieceId('rook', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
      { id: createPieceId('pawn', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
      { id: createPieceId('pawn', 1, 2, 'black'), position: { row: 1, col: 2 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
      { id: createPieceId('pawn', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn }
    ]
  },
  
  // Puzzle 2: Queen attack
  {
    id: 'puzzle-2',
    name: 'Queen Challenge',
    description: 'Deal with a powerful queen and her knights.',
    difficulty: 2,
    maxPlayerValue: 18,
    opponentPieces: [
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king },
      { id: createPieceId('queen', 1, 2, 'black'), position: { row: 1, col: 2 }, type: 'queen', color: 'black', value: PIECE_VALUES.queen },
      { id: createPieceId('knight', 0, 1, 'black'), position: { row: 0, col: 1 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight },
      { id: createPieceId('knight', 0, 3, 'black'), position: { row: 0, col: 3 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight },
      { id: createPieceId('pawn', 2, 1, 'black'), position: { row: 2, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
      { id: createPieceId('pawn', 2, 3, 'black'), position: { row: 2, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn }
    ]
  },
  
  // Puzzle 3: Bishop trap
  {
    id: 'puzzle-3',
    name: 'Bishop Challenge',
    description: 'Beware of the bishops controlling diagonals.',
    difficulty: 2,
    maxPlayerValue: 16,
    opponentPieces: [
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king },
      { id: createPieceId('bishop', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'bishop', color: 'black', value: PIECE_VALUES.bishop },
      { id: createPieceId('bishop', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'bishop', color: 'black', value: PIECE_VALUES.bishop },
      { id: createPieceId('rook', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
      { id: createPieceId('pawn', 2, 0, 'black'), position: { row: 2, col: 0 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
      { id: createPieceId('pawn', 2, 4, 'black'), position: { row: 2, col: 4 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn }
    ]
  },
  
  // Puzzle 4: Knight formation
  {
    id: 'puzzle-4',
    name: 'Knight Ambush',
    description: 'A formation of knights threatens your position.',
    difficulty: 3,
    maxPlayerValue: 20,
    opponentPieces: [
      { id: createPieceId('king', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'king', color: 'black', value: PIECE_VALUES.king },
      { id: createPieceId('knight', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight },
      { id: createPieceId('knight', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight },
      { id: createPieceId('knight', 2, 2, 'black'), position: { row: 2, col: 2 }, type: 'knight', color: 'black', value: PIECE_VALUES.knight },
      { id: createPieceId('bishop', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'bishop', color: 'black', value: PIECE_VALUES.bishop },
      { id: createPieceId('rook', 1, 0, 'black'), position: { row: 1, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook }
    ]
  },
  
  // Puzzle 5: Rook fortress
  {
    id: 'puzzle-5',
    name: 'Rook Fortress',
    description: 'Break through the opponent\'s rook defense.',
    difficulty: 3,
    maxPlayerValue: 22,
    opponentPieces: [
      { id: createPieceId('king', 0, 2, 'black'), position: { row: 0, col: 2 }, type: 'king', color: 'black', value: PIECE_VALUES.king },
      { id: createPieceId('rook', 0, 0, 'black'), position: { row: 0, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
      { id: createPieceId('rook', 0, 4, 'black'), position: { row: 0, col: 4 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
      { id: createPieceId('rook', 2, 0, 'black'), position: { row: 2, col: 0 }, type: 'rook', color: 'black', value: PIECE_VALUES.rook },
      { id: createPieceId('pawn', 1, 1, 'black'), position: { row: 1, col: 1 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn },
      { id: createPieceId('pawn', 1, 3, 'black'), position: { row: 1, col: 3 }, type: 'pawn', color: 'black', value: PIECE_VALUES.pawn }
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

// Export all puzzles
export default puzzles; 