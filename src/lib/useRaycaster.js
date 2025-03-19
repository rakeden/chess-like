import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Custom hook for detecting hover events using raycasting
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.types - Array of object types to detect ('cell', 'piece')
 * @param {string} options.gamePhase - Current game phase
 * @param {Array<string>} options.allowedPhases - Game phases when raycasting is active
 * @returns {Object} - Object containing the hovered elements and handler functions
 */
export default function useRaycaster({ 
  types = ['cell', 'piece'], 
  gamePhase, 
  allowedPhases = [] 
}) {
  const { scene, raycaster, camera, gl } = useThree();
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  
  useEffect(() => {
    // Only enable raycasting if the current phase is in allowedPhases
    if (allowedPhases.length > 0 && !allowedPhases.includes(gamePhase)) {
      setHoveredCell(null);
      setHoveredPiece(null);
      return;
    }
    
    const canvas = gl.domElement;
    
    const handleMouseMove = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      raycaster.setFromCamera({ x, y }, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Find the first intersected object of each type
      let cellIntersect = null;
      let pieceIntersect = null;
      
      for (const intersect of intersects) {
        const userData = intersect.object.userData;
        
        if (!cellIntersect && userData && userData.isCell) {
          cellIntersect = intersect;
        }
        
        if (!pieceIntersect && userData && userData.isPiece) {
          pieceIntersect = intersect;
        }
        
        if ((cellIntersect || !types.includes('cell')) && 
            (pieceIntersect || !types.includes('piece'))) {
          break;
        }
      }
      
      // Update hovered elements
      if (types.includes('cell')) {
        if (cellIntersect) {
          const { row, col } = cellIntersect.object.userData;
          setHoveredCell({ row, col });
        } else {
          setHoveredCell(null);
        }
      }
      
      if (types.includes('piece')) {
        if (pieceIntersect) {
          const { pieceId, pieceType, pieceColor } = pieceIntersect.object.userData;
          setHoveredPiece({ id: pieceId, type: pieceType, color: pieceColor });
        } else {
          setHoveredPiece(null);
        }
      }
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [scene, camera, raycaster, gl, gamePhase, allowedPhases, types]);
  
  return {
    hoveredCell,
    hoveredPiece,
    resetHoveredCell: () => setHoveredCell(null),
    resetHoveredPiece: () => setHoveredPiece(null)
  };
} 