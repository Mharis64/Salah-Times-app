import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import EarthScene from './EarthScene'

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin" />
        <p className="text-white/40 text-sm">Loading Earth…</p>
      </div>
    </div>
  )
}

export default function EarthCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2 }}
      style={{ width: '100%', height: '100%' }}
      aria-label="3D rotating Earth visualization"
    >
      <Suspense fallback={null}>
        <EarthScene />
      </Suspense>
    </Canvas>
  )
}
