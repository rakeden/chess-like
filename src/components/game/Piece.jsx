import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DragControls, useGLTF } from '@react-three/drei';
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
  draggable = false,
  onDragStart,
  onDrag,
  onDragEnd
}) {
  const groupRef = useRef();
  const materialRef = useRef();
  const [opacity, setOpacity] = useState(0);
  const [animScale, setAnimScale] = useState(0.01); // Start with almost zero scale
  const animationStartTimeRef = useRef(null);
  const animationDuration = 1.2; // Slightly longer for bounce effect
  const { scene } = useThree();
  
  // Skip rendering if not visible
  if (!visible) return null;
  
  // Load the appropriate GLB model
  const { scene: modelScene } = useGLTF(PIECE_MODELS[type] || PIECE_MODELS.pawn);
  
  // Clone the model scene to avoid sharing materials between instances
  const model = useMemo(() => {
    const clonedScene = modelScene.clone();
    clonedScene.traverse((node) => {
      if (node.isMesh) {
        // Create new materials for each piece to allow independent colors
        node.material = new THREE.MeshStandardMaterial({
          color: color === 'white' ? 0xf0f0f0 : 0x202020,
          emissive: color === 'white' ? 0x404040 : 0x101010,
          metalness: color === 'white' ? 0.1 : 0.3,
          roughness: color === 'white' ? 0.5 : 0.7,
          transparent: true,
          opacity: opacity
        });
        materialRef.current = node.material;
      }
    });
    return clonedScene;
  }, [modelScene, color, opacity]);

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
  });
  
  // Handle pointer events for hover effects
  const handlePointerOver = (e) => {
    if (draggable) {
      e.stopPropagation();
      document.body.style.cursor = 'grab';
    }
  };
  
  const handlePointerOut = (e) => {
    if (draggable) {
      e.stopPropagation();
      document.body.style.cursor = 'auto';
    }
  };
  
  // Handle drag start
  const handleDragStart = (e) => {
    if (draggable && onDragStart) {
      document.body.style.cursor = 'grabbing';
      onDragStart(e);
    }
  };
  
  // Handle drag end
  const handleDragEnd = (e) => {
    if (!draggable) return;
    
    document.body.style.cursor = 'auto';
    
    if (onDragEnd) {
      // Use raycasting to find the cell under the piece
      const raycaster = new THREE.Raycaster();
      raycaster.layers.set(1); // Use layer 1 for board cells
      
      // Cast ray down from the piece position
      const origin = new THREE.Vector3(
        groupRef.current.position.x,
        groupRef.current.position.y + 1,
        groupRef.current.position.z
      );
      const direction = new THREE.Vector3(0, -1, 0);
      raycaster.set(origin, direction);
      
      // Find intersections with board cells
      const intersects = raycaster.intersectObjects(
        scene.children,
        true
      ).filter(hit => hit.object.userData.isCell);
      
      if (intersects.length > 0) {
        const cellData = intersects[0].object.userData;
        console.log("Drop detected on cell:", cellData);
        
        // Calculate the center position of the cell
        const centerX = cellData.col - 2;
        const centerZ = cellData.row - 2;
        
        // Snap the piece to the center of the cell
        groupRef.current.position.x = centerX;
        groupRef.current.position.z = centerZ;
        groupRef.current.position.y = 0.1; // Adjusted height to match the new board level
        
        onDragEnd(e, {
          cellData,
          position: groupRef.current.position.clone(),
          pieceData: {
            id: id || groupRef.current.userData.pieceId,
            type,
            color,
            value
          }
        });
      } else {
        // If dropped outside a valid board cell, still call onDragEnd with no cell data
        onDragEnd(e, {
          position: groupRef.current.position.clone(),
          pieceData: {
            id: id || groupRef.current.userData.pieceId,
            type,
            color,
            value
          }
        });
      }
    }
  };
  
  const handleDrag = (e) => {
    if (groupRef.current && onDrag) {
      onDrag(e);
    }
  };

  // Create userData for raycasting
  const pieceUserData = {
    isPiece: true,
    pieceId: id || `piece-${Math.random().toString(36).substr(2, 9)}`,
    pieceType: type,
    pieceColor: color,
    pieceValue: value,
    isDragging: false
  };
  
  // If draggable, wrap with DragControls
  const content = (
    <group
      position={safePosition}
      scale={scale.map(s => s * animScale)}
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      userData={pieceUserData}
    >
      <primitive object={model} />
    </group>
  );
  
  return draggable ? (
    <DragControls
      autoTransform
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      transformGroup={true}
    >
      {content}
    </DragControls>
  ) : content;
} 