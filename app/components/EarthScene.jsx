import { useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Stars, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { TextureLoader } from 'three'

// NASA textures via three.js repo CDN
const EARTH_DAY_MAP    = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg'
const EARTH_NORMAL_MAP = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg'
const EARTH_SPECULAR   = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg'
const EARTH_CLOUDS     = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png'
const MOON_MAP         = 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg'

// ─── Earth + Atmosphere + Clouds ─────────────────────────────────────────────
function Earth() {
  const earthRef  = useRef()
  const cloudsRef = useRef()
  const atmRef    = useRef()
  const rimRef    = useRef()

  const [dayMap, normalMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    EARTH_DAY_MAP, EARTH_NORMAL_MAP, EARTH_SPECULAR, EARTH_CLOUDS,
  ])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (earthRef.current)  earthRef.current.rotation.y  = t * 0.055
    if (cloudsRef.current) cloudsRef.current.rotation.y = t * 0.075
  })

  return (
    <group>
      {/* Outer rim glow (back-lit atmosphere) */}
      <mesh ref={rimRef}>
        <sphereGeometry args={[2.28, 64, 64]} />
        <meshStandardMaterial
          color="#2255ff"
          transparent
          opacity={0.035}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere haze */}
      <mesh ref={atmRef}>
        <sphereGeometry args={[2.16, 64, 64]} />
        <meshStandardMaterial
          color="#3a8eff"
          transparent
          opacity={0.12}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Earth surface */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(8, 8)}
          specularMap={specularMap}
          specular={new THREE.Color(0x446688)}
          shininess={28}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.04, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ─── Equatorial Orbital Ring ──────────────────────────────────────────────────
function OrbitalRing() {
  const ringRef = useRef()

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.03
    }
  })

  return (
    <group ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
      {/* Outer glow ring */}
      <mesh>
        <torusGeometry args={[3.2, 0.015, 4, 180]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#6366f1"
          emissiveIntensity={2.5}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Inner thin ring */}
      <mesh>
        <torusGeometry args={[3.0, 0.006, 4, 180]} />
        <meshStandardMaterial
          color="#a5b4fc"
          emissive="#a5b4fc"
          emissiveIntensity={1.5}
          transparent
          opacity={0.25}
        />
      </mesh>
    </group>
  )
}

// ─── Orbiting Moon ────────────────────────────────────────────────────────────
function Moon() {
  const moonGroupRef = useRef()
  const moonRef      = useRef()
  const [moonMap] = useLoader(TextureLoader, [MOON_MAP])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (moonGroupRef.current) {
      // Orbit around Earth
      moonGroupRef.current.rotation.y = t * 0.18
      // Slight tilt wave
      moonGroupRef.current.rotation.x = Math.sin(t * 0.07) * 0.15
    }
    if (moonRef.current) {
      // Moon self-rotation (tidally locked feel)
      moonRef.current.rotation.y = t * 0.18
    }
  })

  return (
    <group ref={moonGroupRef}>
      <mesh ref={moonRef} position={[3.8, 0.4, 0]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshPhongMaterial
          map={moonMap}
          specular={new THREE.Color(0x111111)}
          shininess={4}
        />
      </mesh>
      {/* Moon glow */}
      <mesh position={[3.8, 0.4, 0]}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          color="#c7d2fe"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  )
}

// ─── Ambient Orbital Dust ─────────────────────────────────────────────────────
function OrbitalDust() {
  const ref   = useRef()
  const count = 220

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const palette = [
      [0.647, 0.698, 0.988], // indigo-400
      [0.647, 0.502, 0.976], // violet-400
      [0.647, 0.827, 0.988], // sky-300
      [1.0,   0.749, 0.141], // gold
    ]
    for (let i = 0; i < count; i++) {
      const r     = 4.5 + Math.random() * 9
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      pos[i*3]   = r * Math.sin(phi) * Math.cos(theta)
      pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i*3+2] = r * Math.cos(phi)
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i*3]   = c[0]; col[i*3+1] = c[1]; col[i*3+2] = c[2]
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime()
      ref.current.rotation.y = t * 0.012
      ref.current.rotation.x = Math.sin(t * 0.006) * 0.12
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors,    3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
      />
    </points>
  )
}

// ─── Nebula Background Quad ───────────────────────────────────────────────────
function NebulaBackground() {
  const meshRef = useRef()

  // Build a canvas-based nebula texture procedurally
  const texture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')

    // Deep space base
    ctx.fillStyle = '#000008'
    ctx.fillRect(0, 0, size, size)

    // Nebula blobs
    const blobs = [
      { x: 0.3, y: 0.4, r: 180, c: 'rgba(60,40,140,0.18)' },
      { x: 0.7, y: 0.6, r: 160, c: 'rgba(20,60,120,0.15)' },
      { x: 0.5, y: 0.3, r: 200, c: 'rgba(80,20,120,0.12)' },
      { x: 0.2, y: 0.7, r: 130, c: 'rgba(20,80,100,0.10)' },
      { x: 0.8, y: 0.2, r: 140, c: 'rgba(60,20,80,0.10)'  },
    ]
    blobs.forEach(({ x, y, r, c }) => {
      const g = ctx.createRadialGradient(x*size, y*size, 0, x*size, y*size, r)
      g.addColorStop(0, c)
      g.addColorStop(1, 'transparent')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    })

    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.005
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -80]}>
      <planeGeometry args={[300, 300]} />
      <meshBasicMaterial map={texture} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}

// ─── Scene Root ───────────────────────────────────────────────────────────────
export default function EarthScene() {
  return (
    <>
      {/* Procedural nebula backdrop */}
      <NebulaBackground />

      {/* Stars */}
      <Stars radius={140} depth={90} count={8000} factor={5.5} saturation={0.4} fade speed={0.3} />

      {/* Lighting rig */}
      <ambientLight intensity={0.18} />
      {/* Primary sunlight */}
      <directionalLight position={[6, 3, 5]} intensity={2.8} color="#fff8e8" castShadow />
      {/* Rim / fill */}
      <pointLight position={[-12, -6, -4]} intensity={0.5}  color="#3355ff" />
      <pointLight position={[0,   10, -10]} intensity={0.25} color="#7744ff" />
      {/* Earth underlight warm */}
      <pointLight position={[4, -8, 2]}   intensity={0.3}  color="#ff8844" />

      {/* Main Earth */}
      <Earth />

      {/* Equatorial ring */}
      <OrbitalRing />

      {/* Orbiting Moon */}
      <Moon />

      {/* Orbital dust */}
      <OrbitalDust />

      {/* Interactive camera */}
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.35}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(3 * Math.PI) / 4}
        enableDamping
        dampingFactor={0.04}
      />
    </>
  )
}
