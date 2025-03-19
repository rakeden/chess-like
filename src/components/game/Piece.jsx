import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

// Import GLB models
import BishopModel from '@/assets/Bishop.glb';
import KingModel from '@/assets/King.glb';
import KnightModel from '@/assets/Knight.glb';
import PawnModel from '@/assets/Pawn.glb';
import QueenModel from '@/assets/Queen.glb';
import RookModel from '@/assets/Rook.glb';

// Cache the models
useGLTF.preload(BishopModel);
useGLTF.preload(KingModel);
useGLTF.preload(KnightModel);
useGLTF.preload(PawnModel);
useGLTF.preload(QueenModel);
useGLTF.preload(RookModel);

// Map piece types to their models
const PIECE_MODELS = {
  bishop: BishopModel,
  king: KingModel,
  knight: KnightModel,
  pawn: PawnModel,
  queen: QueenModel,
  rook: RookModel
};

// Ease out function
const easeOutQuad = (t) => {
  return 1 - (1 - t) * (1 - t);
};

export default function Piece({ 
  type = 'pawn', 
  color = 'white', 
  position = [0, 0, 0], 
  scale = [1, 1, 1], 
  visible = true,
  value,
  id,
  registerPiece = null,
  isBeingDragged = false,
  isDraggable = false,
  isHovered = false
}) {
  const groupRef = useRef();
  const materialRef = useRef();
  const [opacity, setOpacity] = useState(0);
  const [animScale, setAnimScale] = useState(0.01); 
  const [currentPosition, setCurrentPosition] = useState(position);
  const animationStartTimeRef = useRef(null);
  const animationDuration = 1.2;
  
  // Skip rendering if not visible
  if (!visible) return null;
  
  // Load the appropriate GLB model
  const { scene: modelScene } = useGLTF(PIECE_MODELS[type] || PIECE_MODELS.pawn);
  
  // Register this piece with the board's drag controls
  useEffect(() => {
    if (registerPiece && groupRef.current && id) {
      registerPiece(id, groupRef.current);
    }
  }, [registerPiece, id]);
  
  // Clone the model scene to avoid sharing materials between instances
  const model = useMemo(() => {
    const clonedScene = modelScene.clone();
    clonedScene.traverse((node) => {
      if (node.isMesh) {
        // Create new materials for each piece to allow independent colors
        node.material = new THREE.MeshStandardMaterial({
          color: color === 'white' ? 0xFFFFFF : 0x202020,
          emissive: color === 'white' ? 0x303030 : 0x101010,
          metalness: color === 'white' ? 0.2 : 0.4,
          roughness: color === 'white' ? 0.3 : 0.6,
          transparent: true,
          opacity: opacity
        });
        materialRef.current = node.material;
        
        // Add userData to each mesh for better raycasting detection
        node.userData = {
          isPiece: true,
          pieceId: id,
          pieceType: type,
          pieceColor: color,
          pieceValue: value,
          isDraggable,
          isDragging: isBeingDragged
        };
      }
    });
    
    // Also add userData to the scene root for parent-based detection
    clonedScene.userData = {
      isPiece: true,
      pieceId: id,
      pieceType: type,
      pieceColor: color,
      pieceValue: value,
      isDraggable,
      isDragging: isBeingDragged
    };
    
    return clonedScene;
  }, [modelScene, color, opacity, id, type, value, isDraggable, isBeingDragged]);

  // Ensure the piece sits properly on the square surface
  const safePosition = useMemo(() => {
    return Array.isArray(position) && position.length >= 3 
      ? [...position] 
      : [0, 0, 0];
  }, [position]);
  
  // Start the fade-in animation on mount
  useEffect(() => {
    if (!groupRef.current) return;
    animationStartTimeRef.current = Date.now() / 1000;
  }, []);
  
  // Update the animation on each frame
  useFrame(() => {
    if (!groupRef.current || !animationStartTimeRef.current) return;
    
    const elapsedTime = Date.now() / 1000 - animationStartTimeRef.current;
    const progress = Math.min(elapsedTime / animationDuration, 1);
    
    // Update scale and opacity
    const currentScale = easeOutQuad(progress);
    setAnimScale(currentScale);
    setOpacity(currentScale);
    
    // Add rotation during the appearance animation
    if (progress < 1) {
      groupRef.current.rotation.y = 4 * Math.PI * easeOutQuad(progress);
    }
    
    // Add hover animation effect
    if (progress >= 1 && isHovered && !isBeingDragged) {
      // Apply a gentle rotation when hovered
      groupRef.current.rotation.y = THREE.MathUtils.degToRad(5);
      console.log(`Piece ${id} (${type}) is hovered`);
    } else if (progress >= 1 && !isBeingDragged) {
      // Reset rotation when not hovered
      groupRef.current.rotation.y = 0;
    }
  });
  
  // Update position in real-time
  useFrame(() => {
    if (groupRef.current) {
      const pos = groupRef.current.position;
      setCurrentPosition([pos.x, pos.y, pos.z]);
    }
  });
  
  // Handle hover effects
  const handlePointerOver = (e) => {
    if (isDraggable) {
      e.stopPropagation();
      document.body.style.cursor = 'grab';
    }
  };
  
  const handlePointerOut = (e) => {
    if (isDraggable) {
      e.stopPropagation();
      document.body.style.cursor = 'auto';
    }
  };

  return (
    <group
      position={safePosition}
      scale={scale.map(s => s * animScale)}
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={model} />
      
      {/* Hover indicator */}
      {isHovered && !isBeingDragged && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#ffcc00" transparent opacity={0.7} />
        </mesh>
      )}
      
      <Html
        position={[0, 0, 0]}
        center
        sprite
        transform
        scale={0.15}
        style={{
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '2px 4px',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '8px',
          fontWeight: 'bold',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        {`${currentPosition[0].toFixed(1)},${currentPosition[1].toFixed(1)},${currentPosition[2].toFixed(1)}`}
      </Html>
    </group>
  );
} 