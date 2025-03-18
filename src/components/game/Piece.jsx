import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
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

export default function Piece({ type, color, position }) {
  const meshRef = useRef();
  const hoverRef = useRef(false);
  
  // Create the piece geometry based on type
  const geometry = useMemo(() => createPieceGeometry(type), [type]);
  
  // Define the material color
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: color === 'white' ? 0xf5f5f5 : 0x212121,
      metalness: 0.1,
      roughness: 0.5,
    });
  }, [color]);
  
  // Add hover effect and slight bobbing animation
  useFrame((state) => {
    if (!meshRef.current) return;
    
    if (hoverRef.current) {
      meshRef.current.scale.setScalar(1.1); // Scale up when hovered
    } else {
      meshRef.current.scale.setScalar(1);
    }
    
    // Add a subtle floating animation
    meshRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
  });
  
  // Handle pointer events
  const handlePointerOver = (e) => {
    e.stopPropagation();
    hoverRef.current = true;
    document.body.style.cursor = 'pointer';
  };
  
  const handlePointerOut = () => {
    hoverRef.current = false;
    document.body.style.cursor = 'auto';
  };
  
  return (
    <group
      position={[position[0], position[1], position[2]]}
      ref={meshRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {Array.isArray(geometry.children) ? (
        // If the geometry is a group (complex piece)
        geometry.children.map((child, index) => (
          <mesh
            key={index}
            position={child.position}
            rotation={child.rotation}
          >
            <primitive object={child.geometry} attach="geometry" />
            <meshStandardMaterial
              color={color === 'white' ? 0xf5f5f5 : 0x212121}
              metalness={0.1}
              roughness={0.5}
            />
          </mesh>
        ))
      ) : (
        // If the geometry is a simple mesh
        <mesh>
          <primitive object={geometry} attach="geometry" />
          <primitive object={material} attach="material" />
        </mesh>
      )}
    </group>
  );
} 