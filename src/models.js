import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three'

// Model path mapping
export const modelPaths = {
  king: '/assets/king.glb',
  queen: '/assets/queen.glb',
  bishop: '/assets/bishop.glb',
  knight: '/assets/knight.glb',
  rook: '/assets/rook.glb',
  pawn: '/assets/pawn.glb'
}

// Store for preloaded models
export const modelStore = {
  models: {},
  loaded: false,
  loading: false,
  errorMessage: null
}

// Preload all models
export const preloadModels = (callback) => {
  if (modelStore.loading) return
  if (modelStore.loaded) {
    if (callback) callback(null, modelStore.models)
    return
  }
  
  modelStore.loading = true
  console.log('Starting to preload all chess models')
  
  const loader = new GLTFLoader()
  const pendingLoads = Object.entries(modelPaths).length
  let completedLoads = 0
  let errors = []
  
  // Load each model sequentially
  Object.entries(modelPaths).forEach(([type, path]) => {
    console.log(`Loading model: ${type} from ${path}`)
    
    loader.load(
      path,
      (gltf) => {
        console.log(`Successfully loaded ${type} model`)
        modelStore.models[type] = gltf
        completedLoads++
        
        // When all models are loaded
        if (completedLoads === pendingLoads) {
          finishLoading(errors, callback)
        }
      },
      (progress) => {
        // Optional: track loading progress
      },
      (error) => {
        console.error(`Error loading ${type} model:`, error)
        errors.push({ type, error: error.message })
        completedLoads++
        
        // Continue even if some models fail to load
        if (completedLoads === pendingLoads) {
          finishLoading(errors, callback)
        }
      }
    )
  })
}

// Helper function to handle load completion
function finishLoading(errors, callback) {
  modelStore.loading = false
  modelStore.loaded = true
  
  if (errors.length > 0) {
    const errorMessage = `Failed to load some models: ${errors.map(e => e.type).join(', ')}`
    console.error(errorMessage)
    modelStore.errorMessage = errorMessage
  } else {
    console.log('All chess models loaded successfully')
  }
  
  if (callback) callback(modelStore.errorMessage, modelStore.models)
}

// Get a model by type, returns null if not loaded
export const getModel = (type) => {
  const modelType = type.toLowerCase()
  return modelStore.models[modelType] || null
}

// Create a colored clone of a model
export const createColoredModel = (model, color) => {
  if (!model || !model.scene) return null
  
  try {
    // Clone the scene
    const clonedScene = model.scene.clone()
    
    // Apply material color
    const materialColor = color === 'white' ? '#f0f0e0' : '#333333'
    clonedScene.traverse((node) => {
      if (node.isMesh && node.material) {
        // Handle single material
        if (!Array.isArray(node.material)) {
          node.material = node.material.clone()
          node.material.color = new THREE.Color(materialColor)
          
          // Enhance white pieces with better material properties
          if (color === 'white') {
            node.material.roughness = 0.3;  // Lower roughness for more shine
            node.material.metalness = 0.1;  // Slight metalness for better visibility
          }
          
          node.material.needsUpdate = true
        } 
        // Handle material array
        else {
          node.material = node.material.map(mat => {
            const newMat = mat.clone()
            newMat.color = new THREE.Color(materialColor)
            
            // Enhance white pieces with better material properties
            if (color === 'white') {
              newMat.roughness = 0.3;  // Lower roughness for more shine
              newMat.metalness = 0.2;  // Slight metalness for better visibility
            }
            
            newMat.needsUpdate = true
            return newMat
          })
        }
      }
    })
    
    return clonedScene
  } catch (error) {
    console.error("Error creating colored model:", error)
    return null
  }
} 