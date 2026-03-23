import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

function MonumentGeometry({ profile }) {
  const accent = profile.accent
  const base = profile.base

  if (profile.type === 'mausoleum') {
    return (
      <group>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[2.4, 1.1, 2.4]} />
          <meshStandardMaterial color={base} metalness={0.18} roughness={0.28} />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <sphereGeometry args={[0.9, 48, 48]} />
          <meshStandardMaterial color={accent} metalness={0.12} roughness={0.22} />
        </mesh>
        {[[-1.25, 0, -1.25], [1.25, 0, -1.25], [-1.25, 0, 1.25], [1.25, 0, 1.25]].map(
          ([x, , z], index) => (
            <group key={index} position={[x, 0.25, z]}>
              <mesh position={[0, 0.7, 0]}>
                <cylinderGeometry args={[0.16, 0.22, 1.8, 18]} />
                <meshStandardMaterial color={base} metalness={0.16} roughness={0.28} />
              </mesh>
              <mesh position={[0, 1.7, 0]}>
                <coneGeometry args={[0.22, 0.4, 18]} />
                <meshStandardMaterial color={accent} metalness={0.15} roughness={0.3} />
              </mesh>
            </group>
          ),
        )}
      </group>
    )
  }

  if (profile.type === 'tower') {
    return (
      <group>
        <mesh position={[0, 1.4, 0]}>
          <cylinderGeometry args={[0.5, 0.72, 3.6, 28]} />
          <meshStandardMaterial color={base} metalness={0.16} roughness={0.28} />
        </mesh>
        <mesh position={[0, 3.45, 0]}>
          <coneGeometry args={[0.58, 1.05, 28]} />
          <meshStandardMaterial color={accent} metalness={0.16} roughness={0.28} />
        </mesh>
        {[0.55, 1.35, 2.15].map((y, index) => (
          <mesh key={index} position={[0, y, 0]}>
            <torusGeometry args={[0.6, 0.05, 12, 32]} />
            <meshStandardMaterial color={accent} metalness={0.2} roughness={0.3} />
          </mesh>
        ))}
      </group>
    )
  }

  if (profile.type === 'arch') {
    return (
      <group>
        <mesh position={[-0.78, 1.15, 0]}>
          <boxGeometry args={[0.62, 2.3, 1]} />
          <meshStandardMaterial color={base} metalness={0.14} roughness={0.36} />
        </mesh>
        <mesh position={[0.78, 1.15, 0]}>
          <boxGeometry args={[0.62, 2.3, 1]} />
          <meshStandardMaterial color={base} metalness={0.14} roughness={0.36} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[2.2, 0.6, 1]} />
          <meshStandardMaterial color={accent} metalness={0.14} roughness={0.34} />
        </mesh>
        <mesh position={[0, 1.15, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.78, 0.16, 18, 32, Math.PI]} />
          <meshStandardMaterial color={accent} metalness={0.18} roughness={0.26} />
        </mesh>
      </group>
    )
  }

  if (profile.type === 'fort') {
    return (
      <group>
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[2.8, 1.6, 2]} />
          <meshStandardMaterial color={base} metalness={0.08} roughness={0.52} />
        </mesh>
        {[-1.1, 1.1].map((x) => (
          <mesh key={x} position={[x, 1.45, 0]}>
            <boxGeometry args={[0.5, 0.4, 2.1]} />
            <meshStandardMaterial color={accent} metalness={0.1} roughness={0.48} />
          </mesh>
        ))}
        {[-1.2, -0.6, 0, 0.6, 1.2].map((x, index) => (
          <mesh key={index} position={[x, 1.95, 0.9]}>
            <boxGeometry args={[0.24, 0.28, 0.24]} />
            <meshStandardMaterial color={accent} metalness={0.1} roughness={0.48} />
          </mesh>
        ))}
      </group>
    )
  }

  if (profile.type === 'minaret') {
    return (
      <group>
        <mesh position={[0, 1.65, 0]}>
          <cylinderGeometry args={[0.38, 0.55, 4.2, 24]} />
          <meshStandardMaterial color={base} metalness={0.14} roughness={0.3} />
        </mesh>
        {[1, 2.2, 3.2].map((y, index) => (
          <mesh key={index} position={[0, y, 0]}>
            <torusGeometry args={[0.46, 0.05, 12, 28]} />
            <meshStandardMaterial color={accent} metalness={0.16} roughness={0.28} />
          </mesh>
        ))}
        <mesh position={[0, 4.2, 0]}>
          <coneGeometry args={[0.42, 0.85, 24]} />
          <meshStandardMaterial color={accent} metalness={0.16} roughness={0.26} />
        </mesh>
      </group>
    )
  }

  return (
    <group>
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[1.3, 2.5, 1.3]} />
        <meshStandardMaterial color={base} metalness={0.15} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <coneGeometry args={[0.45, 0.95, 18]} />
        <meshStandardMaterial color={accent} metalness={0.18} roughness={0.26} />
      </mesh>
    </group>
  )
}

function ReconstructionBillboard({ imageUrl }) {
  const texture = useMemo(() => {
    if (!imageUrl) {
      return null
    }

    const loader = new THREE.TextureLoader()
    const loaded = loader.load(imageUrl)
    loaded.colorSpace = THREE.SRGBColorSpace
    return loaded
  }, [imageUrl])

  if (!texture) {
    return null
  }

  return (
    <mesh position={[0, 2.1, -2.4]}>
      <planeGeometry args={[2.4, 1.5]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  )
}

function Scene({ profile, reconstructionImage }) {
  return (
    <>
      <color attach="background" args={['#08111d']} />
      <fog attach="fog" args={['#08111d', 8, 18]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 5]} intensity={2} color="#a8eeff" />
      <directionalLight position={[-4, 4, -4]} intensity={0.9} color="#9f8dff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#091522" metalness={0.3} roughness={0.7} />
      </mesh>
      <group position={[0, 0.08, 0]}>
        <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[2.6, 2.9, 0.18, 48]} />
          <meshStandardMaterial color="#11263b" metalness={0.45} roughness={0.36} />
        </mesh>
        <group castShadow receiveShadow>
          <MonumentGeometry profile={profile} />
        </group>
      </group>
      <ReconstructionBillboard imageUrl={reconstructionImage} />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.55}
        width={10}
        height={10}
        blur={2.2}
        far={8}
      />
    </>
  )
}

function getProfile({ selectedPlace, recognitionResult }) {
  const category = (
    recognitionResult?.architectural_style ||
    selectedPlace?.category ||
    recognitionResult?.name ||
    ''
  ).toLowerCase()

  if (category.includes('mausoleum') || category.includes('taj')) {
    return { type: 'mausoleum', base: '#ebe5df', accent: '#8cf2ff' }
  }
  if (category.includes('minaret')) {
    return { type: 'minaret', base: '#c88e66', accent: '#73d8ff' }
  }
  if (category.includes('tower') || category.includes('clock')) {
    return { type: 'tower', base: '#7c8b9d', accent: '#89e7ff' }
  }
  if (category.includes('fort')) {
    return { type: 'fort', base: '#9d5a42', accent: '#7da7ff' }
  }
  if (
    category.includes('war memorial') ||
    category.includes('monument') ||
    category.includes('arch')
  ) {
    return { type: 'arch', base: '#c7b097', accent: '#89e7ff' }
  }

  return { type: 'generic', base: '#8da0b3', accent: '#89e7ff' }
}

export default function MonumentViewer({ selectedPlace, recognitionResult, reconstructionImage }) {
  const profile = useMemo(
    () => getProfile({ selectedPlace, recognitionResult }),
    [recognitionResult, selectedPlace],
  )

  return (
    <div className="viewer-shell">
      <Canvas dpr={[1, 2]} shadows>
        <PerspectiveCamera makeDefault position={[4.6, 3.2, 4.8]} fov={34} />
        <Scene profile={profile} reconstructionImage={reconstructionImage} />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={4}
          maxDistance={10}
          minPolarAngle={0.6}
          maxPolarAngle={1.45}
          autoRotate
          autoRotateSpeed={0.8}
        />
      </Canvas>
    </div>
  )
}
