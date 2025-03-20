# Chessy - Refactored with Pixi.js

This project has been refactored from Three.js to Pixi.js, a powerful 2D WebGL renderer.

## Refactoring Changes

The main changes include:

1. Replaced Three.js with Pixi.js for 2D rendering
2. Converted all 3D models to 2D sprites
3. Reimplemented drag and drop functionality
4. Maintained the same chess puzzle gameplay

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Required Assets

Before running the app, you'll need to add chess piece assets:

### Chess Piece Images

Place PNG images for chess pieces in the `public/assets/pieces/` directory with the following naming convention:

- White pieces: `w_pawn.png`, `w_knight.png`, `w_bishop.png`, `w_rook.png`, `w_queen.png`, `w_king.png`
- Black pieces: `b_pawn.png`, `b_knight.png`, `b_bishop.png`, `b_rook.png`, `b_queen.png`, `b_king.png`

You can use any standard chess piece sets in PNG format with transparent backgrounds. The images should be approximately 120x120 pixels.

## Project Structure

- `src/pages/PuzzlePage.jsx`: Main puzzle page component
- `src/components/game/Board.jsx`: Chess board component
- `src/components/game/Piece.jsx`: Chess piece component
- `src/components/game/PieceBench.jsx`: Component for holding available pieces
- `src/components/game/Square.jsx`: Board square component
- `src/lib/stockfish-utils.js`: Utilities for chess notation and board state

## Next Steps

1. Add proper piece assets in the `public/assets/pieces/` directory
2. Implement piece placement logic with the Stockfish engine
3. Add puzzle completion validation
4. Enhance the piece movement with animations
