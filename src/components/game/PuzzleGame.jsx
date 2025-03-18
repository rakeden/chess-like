import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useGameContext, GAME_PHASES } from '@/lib/game-context'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import Board from './Board'
import ThreeDPieceSelection from './ThreeDPieceSelection'
import { PlayerTurnCard } from './PlayerTurnCard'
import { PreparationTimer } from './PreparationTimer'
import { GamePhaseIndicator } from './GamePhaseIndicator'
import stockfishUtils from '@/lib/stockfish-utils'

export default function PuzzleGame({ puzzleData }) {
  const { 
    gamePhase, 
    GAME_PHASES, 
    playerColor,
    currentTurn,
    pieces,
    opponentPieces,
    board
  } = useGameContext();
  
  const [currentFEN, setCurrentFEN] = useState(puzzleData?.fen || '');
  const [copied, setCopied] = useState(false);
  
  // Generate and update FEN when the board changes
  useEffect(() => {
    if (board && pieces) {
      const fen = stockfishUtils.boardToFEN(
        board, 
        pieces, 
        opponentPieces, 
        playerColor === 'white' ? 'w' : 'b'
      );
      setCurrentFEN(fen);
    }
  }, [board, pieces, opponentPieces, playerColor]);
  
  // Copy FEN to clipboard
  const copyFEN = () => {
    navigator.clipboard.writeText(currentFEN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // Debug logging
  console.log("PuzzleGame rendering:", {
    gamePhase,
    playerColor,
    currentTurn,
    pieces: pieces?.length,
    opponentPieces: opponentPieces?.length,
    puzzleData
  });

  return (
    <div className="w-full h-[calc(100vh-8rem)] relative">
      {/* Display player's turn if in playing phase, otherwise preparation timer */}
      {gamePhase === GAME_PHASES.PLAYING ? (
        <PlayerTurnCard />
      ) : (
        <PreparationTimer />
      )}
      
      {/* Game phase indicator */}
      <GamePhaseIndicator />
      
      {/* Show a game status message */}
      {gamePhase === GAME_PHASES.PLAYING && currentTurn !== playerColor && (
        <div className="absolute top-20 left-4 z-10 bg-black/50 text-white px-4 py-2 rounded-md">
          Opponent's turn
        </div>
      )}
      
      {/* FEN notation display in preparation phase */}
      {gamePhase === GAME_PHASES.PREPARATION && (
        <div className="absolute top-20 left-4 right-4 z-10 bg-black/50 text-white p-2 rounded-md flex items-center">
          <div className="mr-2 font-mono text-xs truncate">
            FEN: {currentFEN}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm"
                variant="ghost"
                className="h-6 ml-auto text-xs"
                onClick={copyFEN}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy FEN to clipboard</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      
      {/* Three.js Canvas with board and piece selection */}
      <div className="w-full h-full pb-24">
        <Canvas camera={{ position: [0, 5, 5], fov: 50 }}>
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={10}
          />
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
          <Board />
          
          {/* Add the 3D piece selection component during preparation phase */}
          {gamePhase === GAME_PHASES.PREPARATION && <ThreeDPieceSelection />}
        </Canvas>
      </div>
    </div>
  );
} 