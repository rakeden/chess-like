import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
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

// Animation easing functions
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function Piece({ 
  type = 'pawn', 
  color = 'white', 
  position = [0, 0, 0], 
  scale = [1, 1, 1],
  onHover = () => {},
  isInteractive = false,
  isDisabled = false
}) {
  const groupRef = useRef();
  const materialRef = useRef();
  const [opacity, setOpacity] = useState(isDisabled ? 0.3 : 0);
  const [animScale, setAnimScale] = useState(0.01);
  const animationStartTimeRef = useRef(null);
  const hoverAnimationRef = useRef({ startTime: null, isHovering: false });
  
  const ANIMATION_DURATION = 1.2;
  const HOVER_ANIM_DURATION = 0.3;
  const MAX_TILT_ANGLE = -5;
  
  // Load and clone the model
  const { scene: modelScene } = useGLTF(PIECE_MODELS[type] || PIECE_MODELS.pawn);
  const model = useMemo(() => {
    const clonedScene = modelScene.clone();
    clonedScene.traverse((node) => {
      if (node.isMesh) {
        node.material = new THREE.MeshStandardMaterial({
          color: color === 'white' ? 0xFFFFFF : 0x202020,
          emissive: color === 'white' ? 0x303030 : 0x101010,
          metalness: color === 'white' ? 0.2 : 0.4,
          roughness: color === 'white' ? 0.3 : 0.6,
          transparent: true,
          opacity: opacity
        });
        materialRef.current = node.material;
      }
    });
    return clonedScene;
  }, [modelScene, color, opacity]);

  // Start the appearance animation
  useEffect(() => {
    if (!groupRef.current) return;
    animationStartTimeRef.current = Date.now() / 1000;
  }, []);
  
  // Handle animations
  useFrame(() => {
    if (!groupRef.current || !animationStartTimeRef.current) return;
    
    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - animationStartTimeRef.current;
    const progress = Math.min(elapsedTime / ANIMATION_DURATION, 1);
    
    // Update scale and opacity during appearance
    const currentScale = easeOutQuad(progress);
    setAnimScale(currentScale);
    setOpacity(isDisabled ? 0.3 : currentScale);
    
    // Add rotation during appearance
    if (progress < 1) {
      groupRef.current.rotation.y = 4 * Math.PI * easeOutQuad(progress);
    } else {
      groupRef.current.rotation.y = 0;
    }
  });

  // Handle hover interactions
  const handlePointerOver = (e) => {
    if (isInteractive && !isDisabled) {
      e.stopPropagation();
      console.log('mouseover piece')
      document.body.style.cursor = 'pointer';
      onHover(true);
    }
  };
  
  const handlePointerOut = (e) => {
    if (isInteractive && !isDisabled) {
      e.stopPropagation();
      document.body.style.cursor = 'auto';
      onHover(false);
    }
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale.map(s => s * animScale)}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <primitive object={model} />
    </group>
  );
} 