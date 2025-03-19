import { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DragControls } from '@react-three/drei';
import * as THREE from 'three';

// Simple 3D representations for each piece type
const createPieceGeometry = (type) => {
  switch (type) {
    case 'pawn':
      return new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
    case 'knight': {
      const group = new THREE.Group();
      const base = new THREE.CylinderGeometry(0.25, 0.3, 0.3, 8);
      const head = new THREE.BoxGeometry(0.3, 0.4, 0.2);
      const baseMesh = new THREE.Mesh(base);
      baseMesh.position.y = -0.1;
      const headMesh = new THREE.Mesh(head);
      headMesh.position.y = 0.3;
      headMesh.rotation.y = Math.PI / 4;
      group.add(baseMesh, headMesh);
      return group;
    }
    case 'bishop':
      return new THREE.ConeGeometry(0.25, 0.7, 8);
    case 'rook': {
      const group = new THREE.Group();
      const base = new THREE.CylinderGeometry(0.28, 0.3, 0.5, 8);
      const top = new THREE.BoxGeometry(0.6, 0.2, 0.6);
      const baseMesh = new THREE.Mesh(base);
      const topMesh = new THREE.Mesh(top);
      topMesh.position.y = 0.35;
      group.add(baseMesh, topMesh);
      return group;
    }
    case 'queen': {
      const group = new THREE.Group();
      const base = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 8);
      const crown = new THREE.SphereGeometry(0.2, 8, 8);
      const baseMesh = new THREE.Mesh(base);
      const crownMesh = new THREE.Mesh(crown);
      crownMesh.position.y = 0.4;
      group.add(baseMesh, crownMesh);
      return group;
    }
    case 'king': {
      const group = new THREE.Group();
      const base = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 8);
      const crown = new THREE.BoxGeometry(0.15, 0.4, 0.15);
      const crossbar = new THREE.BoxGeometry(0.35, 0.1, 0.1);
      const baseMesh = new THREE.Mesh(base);
      const crownMesh = new THREE.Mesh(crown);
      const crossbarMesh = new THREE.Mesh(crossbar);
      crownMesh.position.y = 0.5;
      crossbarMesh.position.y = 0.5;
      group.add(baseMesh, crownMesh, crossbarMesh);
      return group;
    }
    default:
      return new THREE.BoxGeometry(0.4, 0.4, 0.4);
  }
};

// Bounce easing function
const bounceEasing = (t) => {
  const bounce = 1.7; // Higher values = more bounce
  
  if (t < 0.5) {
    // First half - growing with slight overshoot
    return 4 * t * t * t;
  } else {
    // Second half - bounce effect
    t = t - 1;
    return 1 + t * t * ((bounce + 1) * t + bounce);
  }
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
  const meshRef = useRef();
  const hoverRef = useRef(false);
  const materialRef = useRef();
  const [opacity, setOpacity] = useState(0);
  const [animScale, setAnimScale] = useState(0.01); // Start with almost zero scale
  const animationStartTimeRef = useRef(null);
  const animationDuration = 1.2; // Slightly longer for bounce effect
  const { scene } = useThree();
  
  // Skip rendering if not visible
  if (!visible) return null;
  
  // Create the piece geometry based on type
  const geometry = useMemo(() => createPieceGeometry(type || 'pawn'), [type]);
  
  // Define the material color
  const material = useMemo(() => {
    // More visually distinct colors for black and white pieces
    const materialColor = color === 'white' ? 0xf0f0f0 : 0x202020;
    const materialEmissive = color === 'white' ? 0x404040 : 0x101010;
    
    return new THREE.MeshStandardMaterial({
      color: materialColor,
      emissive: materialEmissive,
      metalness: color === 'white' ? 0.1 : 0.3,
      roughness: color === 'white' ? 0.5 : 0.7,
      transparent: true, // Enable transparency for fade-in
      opacity: opacity, // Will be controlled by the animation
    });
  }, [color, opacity]);

  materialRef.current = material;
  
  // Start the fade-in animation on mount
  useEffect(() => {
    if (!meshRef.current) return;
    
    // Set animation start time
    animationStartTimeRef.current = Date.now() / 1000; // Current time in seconds
  }, []);
  
  // Update the animation on each frame
  useFrame((state) => {
    if (!meshRef.current || animationStartTimeRef.current === null) return;
    
    // Calculate elapsed time since animation started
    const currentTime = Date.now() / 1000;
    const elapsedTime = currentTime - animationStartTimeRef.current;
    
    // Calculate the animation progress (0 to 1)
    const progress = Math.min(elapsedTime / animationDuration, 1);
    
    // Calculate the new opacity value - linear fade in
    const newOpacity = Math.min(progress * 1.5, 1); // Fade in slightly faster than the bounce
    setOpacity(newOpacity);
    
    // Calculate scale with bounce effect
    const bounceScale = progress >= 1 ? 1 : bounceEasing(progress);
    setAnimScale(bounceScale);
    
    // For complex pieces (groups), manually update each child's material
    if (Array.isArray(geometry.children) && meshRef.current.children.length > 0) {
      meshRef.current.children.forEach(child => {
        if (child.material) {
          child.material.opacity = newOpacity;
        }
      });
    }
    
    // Handle hover effect - only after animation completes
    if (progress >= 1) {
      if (hoverRef.current) {
        meshRef.current.scale.setScalar(1.1); // Scale up when hovered
      } else {
        meshRef.current.scale.setScalar(1);
      }
    } else {
      // During animation, apply the bounce scale
      const baseScale = Array.isArray(scale) && scale.length >= 3 
        ? Math.max(scale[0], scale[1], scale[2]) 
        : 1;
      meshRef.current.scale.setScalar(baseScale * bounceScale);
    }
    
    // Add a subtle floating animation (only if not being dragged)
    if (!meshRef.current.userData.isDragging) {
      meshRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });
  
  // Handle pointer events
  const handlePointerOver = (e) => {
    e.stopPropagation();
    hoverRef.current = true;
    document.body.style.cursor = draggable ? 'grab' : 'pointer';
  };
  
  const handlePointerOut = () => {
    hoverRef.current = false;
    document.body.style.cursor = 'auto';
  };

  // Custom drag handlers
  const handleDragStart = (e) => {
    if (meshRef.current) {
      meshRef.current.userData.isDragging = true;
      document.body.style.cursor = 'grabbing';
      // Cancel the floating animation during drag
      meshRef.current.userData.originalY = meshRef.current.position.y;
      
      // Call the external onDragStart handler if provided
      if (onDragStart) {
        onDragStart(e);
      }
    }
  };
  
  const handleDragEnd = (e) => {
    if (meshRef.current) {
      meshRef.current.userData.isDragging = false;
      document.body.style.cursor = hoverRef.current ? 'grab' : 'auto';
      
      // Call the external onDragEnd handler if provided
      if (onDragEnd) {
        // Find intersections with the board to determine drop location
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, -1, 0); // Look downward
        raycaster.set(meshRef.current.position, direction);
        
        // Find all board cells
        const boardCells = [];
        scene.traverse((object) => {
          if (object.userData && object.userData.isCell) {
            boardCells.push(object);
          }
        });
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(boardCells, true);
        
        if (intersects.length > 0) {
          const cellData = intersects[0].object.userData;
          onDragEnd(e, {
            cellData,
            position: meshRef.current.position.clone(),
            pieceData: {
              id: id || meshRef.current.userData.pieceId,
              type,
              color,
              value
            }
          });
        } else {
          onDragEnd(e, null);
        }
      }
    }
  };
  
  const handleDrag = (e) => {
    if (meshRef.current && onDrag) {
      onDrag(e, {
        position: meshRef.current.position.clone(),
        pieceData: {
          id: id || meshRef.current.userData.pieceId,
          type,
          color,
          value
        }
      });
    }
  };

  // Ensure position is an array with 3 values
  const safePosition = Array.isArray(position) && position.length >= 3 
    ? position 
    : [0, 0, 0];
    
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
      scale={scale}
      ref={meshRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      userData={pieceUserData}
    >
      {Array.isArray(geometry.children) ? (
        // If the geometry is a group (complex piece)
        geometry.children.map((child, index) => (
          <mesh
            key={index}
            position={child.position}
            rotation={child.rotation}
            userData={pieceUserData}
          >
            <primitive object={child.geometry} attach="geometry" />
            <meshStandardMaterial
              color={color === 'white' ? 0xf0f0f0 : 0x202020}
              emissive={color === 'white' ? 0x404040 : 0x101010}
              metalness={color === 'white' ? 0.1 : 0.3}
              roughness={color === 'white' ? 0.5 : 0.7}
              transparent={true} // Enable transparency
              opacity={opacity}
            />
          </mesh>
        ))
      ) : (
        // If the geometry is a simple mesh
        <mesh userData={pieceUserData}>
          <primitive object={geometry} attach="geometry" />
          <primitive object={material} attach="material" />
        </mesh>
      )}
    </group>
  );
  
  return draggable ? (
    <DragControls
      autoTransform
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
    >
      {content}
    </DragControls>
  ) : content;
} 