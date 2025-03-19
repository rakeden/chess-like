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
      // Get mouse position in normalized device coordinates (-1 to +1)
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update raycaster with camera and mouse position
      raycaster.setFromCamera({ x, y }, camera);
      
      // Find all objects the ray intersects, with deep traversal
      const intersects = raycaster.intersectObjects(scene.children, true);
      
      // Find the first intersected object of each type
      let cellIntersect = null;
      let pieceIntersect = null;
      
      for (const intersect of intersects) {
        // Check the current object and traverse up to parent objects
        let currentObj = intersect.object;
        let foundUserData = false;
        
        // Check up to 3 levels of parent objects for userData
        for (let i = 0; i < 3; i++) {
          if (!currentObj) break;
          
          const userData = currentObj.userData;
          
          if (!cellIntersect && userData && userData.isCell) {
            cellIntersect = { object: currentObj };
            foundUserData = true;
          }
          
          if (!pieceIntersect && userData && userData.isPiece) {
            pieceIntersect = { object: currentObj };
            foundUserData = true;
          }
          
          if (foundUserData) break;
          currentObj = currentObj.parent;
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
          // console.log(`Raycaster detected cell at row ${row}, col ${col}`);
        } else {
          setHoveredCell(null);
        }
      }
      
      if (types.includes('piece')) {
        if (pieceIntersect) {
          const { pieceId, pieceType, pieceColor } = pieceIntersect.object.userData;
          console.log(`Raycaster detected piece: ${pieceId} (${pieceType})`);
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