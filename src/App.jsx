import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import Scene from './components/Scene'
import './App.css'
import { preloadModels, modelStore } from './models'

// Loading indicator component
const Loader = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial color="hotpink" wireframe />
    </mesh>
  )
}

// Instructions component
const Instructions = () => {
  const [visible, setVisible] = useState(true)
  
  useEffect(() => {
    // Hide instructions after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [])
  
  if (!visible) return null
  
  return (
    <div className="instructions">
      <p>🖱️ <strong>Drag pieces</strong> with left mouse button</p>
      <p>🔄 <strong>Orbit camera</strong> with right mouse button or shift+drag</p>
    </div>
  )
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  
  // Start preloading models as soon as the app mounts
  useEffect(() => {
    console.log('App mounted, beginning model preload')
    
    // Initiate preloading
    preloadModels((error, models) => {
      if (error) {
        console.error('Model preloading encountered errors:', error)
        setLoadError(error)
      } else {
        console.log('Models preloaded successfully')
      }
      setIsLoading(false)
    })
    
    // Cleanup
    return () => {
      console.log('App unmounting')
    }
  }, [])
  
  // Show loading screen outside of Canvas if models are still loading
  if (isLoading) {
    return (
      <div className="app loading">
        <div className="loading-container">
          <h2>Loading Chess Models...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }
  
  // Show error message if loading failed
  if (loadError) {
    console.warn('Continuing despite loading errors:', loadError)
  }
  
  // When loading is complete, show the 3D scene
  return (
    <div className="app">
      <Canvas shadows camera={{ position: [0, 6, 6], fov: 45 }}>
        <Suspense fallback={<Loader />}>
          <Scene />
        </Suspense>
      </Canvas>
      
      {/* Instructions overlay */}
      <Instructions />
    </div>
  )
}

export default App 