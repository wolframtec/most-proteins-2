import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  createContext,
  useContext,
  Suspense,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Float,
  Environment,
  Stars,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// ============================================
// CONSTANTS & DATA
// ============================================

const COLORS = {
  black: '#0a0a0f',
  cyan: '#00f5d4',
  violet: '#9b5de5',
  white: '#f5f5f7',
}

const PRODUCTS = [
  {
    id: 1,
    name: 'Neural Optimizer',
    price: 149,
    description: 'Cognitive enhancement formula',
    longDescription: 'Advanced nootropic blend designed to enhance focus, memory, and mental clarity through targeted neural pathway optimization.',
    image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=400&fit=crop',
    color: '#00f5d4',
  },
  {
    id: 2,
    name: 'Cellular Restore',
    price: 199,
    description: 'Mitochondrial support complex',
    longDescription: 'Powerful cellular regeneration complex that supports mitochondrial function and ATP production for sustained energy.',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop',
    color: '#9b5de5',
  },
  {
    id: 3,
    name: 'Gene Shield',
    price: 249,
    description: 'DNA protection supplement',
    longDescription: 'Cutting-edge antioxidant formula that helps protect DNA from oxidative stress and environmental damage.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
    color: '#00f5d4',
  },
  {
    id: 4,
    name: 'Synapse Boost',
    price: 179,
    description: 'Neurotransmitter optimization',
    longDescription: 'Precision-formulated to support healthy neurotransmitter levels and synaptic plasticity for optimal brain function.',
    image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400&h=400&fit=crop',
    color: '#9b5de5',
  },
  {
    id: 5,
    name: 'Longevity Core',
    price: 299,
    description: 'Telomere maintenance blend',
    longDescription: 'Revolutionary formula targeting telomere health and cellular longevity pathways for graceful aging.',
    image: 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop',
    color: '#00f5d4',
  },
]

// ============================================
// CONTEXT
// ============================================

const CartContext = createContext()

const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckout, setIsCheckout] = useState(false)

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
    // Play sound effect
    playAddSound()
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cart])

  const cartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        isCheckout,
        setIsCheckout,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

const useCart = () => useContext(CartContext)

// ============================================
// SOUND EFFECTS
// ============================================

const playAddSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(880, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1)

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  } catch (e) {
    // Audio not supported
  }
}

// ============================================
// 3D COMPONENTS
// ============================================

// DNA Helix geometry generator
const useDNAGeometry = (segments = 100, radius = 2, height = 50, turns = 5) => {
  return useMemo(() => {
    const strand1Points = []
    const strand2Points = []
    const rungs = []
    const nodePositions = []

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const y = (t - 0.5) * height
      const angle = t * Math.PI * 2 * turns

      // First strand
      const x1 = Math.cos(angle) * radius
      const z1 = Math.sin(angle) * radius
      strand1Points.push(new THREE.Vector3(x1, y, z1))

      // Second strand (offset by PI)
      const x2 = Math.cos(angle + Math.PI) * radius
      const z2 = Math.sin(angle + Math.PI) * radius
      strand2Points.push(new THREE.Vector3(x2, y, z2))

      // Rungs every few segments
      if (i % 5 === 0 && i > 0 && i < segments) {
        rungs.push({
          start: new THREE.Vector3(x1, y, z1),
          end: new THREE.Vector3(x2, y, z2),
        })
      }
    }

    // Product node positions (5 nodes along the helix)
    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / 6
      const y = (t - 0.5) * height
      const angle = t * Math.PI * 2 * turns
      const nodeRadius = radius + 1.5
      nodePositions.push({
        position: new THREE.Vector3(
          Math.cos(angle) * nodeRadius,
          y,
          Math.sin(angle) * nodeRadius
        ),
        cameraTarget: new THREE.Vector3(
          Math.cos(angle + Math.PI * 0.25) * (radius + 4),
          y,
          Math.sin(angle + Math.PI * 0.25) * (radius + 4)
        ),
      })
    }

    return { strand1Points, strand2Points, rungs, nodePositions }
  }, [segments, radius, height, turns])
}

// DNA Strand component
const DNAStrand = ({ points, color }) => {
  const lineRef = useRef()

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points)
    const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.15, 8, false)
    return tubeGeometry
  }, [points])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  )
}

// DNA Sphere (node on strand)
const DNASphere = ({ position, color, scale = 1 }) => {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        scale * (1 + Math.sin(state.clock.elapsedTime * 2 + position.y) * 0.1)
      )
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  )
}

// DNA Rung (connecting base pairs)
const DNARung = ({ start, end, color }) => {
  const geometry = useMemo(() => {
    const midPoint = new THREE.Vector3().lerpVectors(start, end, 0.5)
    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()

    return { midPoint, length, direction }
  }, [start, end])

  return (
    <group position={geometry.midPoint}>
      <mesh
        rotation={[0, 0, Math.atan2(geometry.direction.z, geometry.direction.x)]}
      >
        <cylinderGeometry args={[0.08, 0.08, geometry.length, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// Product Node Marker
const ProductNode = ({ position, index, isActive }) => {
  const meshRef = useRef()
  const ringRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      const scale = isActive ? 1.5 : 1
      meshRef.current.scale.lerp(
        new THREE.Vector3(scale, scale, scale),
        0.1
      )
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01
      ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime + index) * 0.2
    }
  })

  const color = index % 2 === 0 ? COLORS.cyan : COLORS.violet

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 1.2 : 0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.8, 0.05, 16, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  )
}

// Complete DNA Helix
const DNAHelix = ({ scrollProgress, activeNode }) => {
  const groupRef = useRef()
  const { strand1Points, strand2Points, rungs, nodePositions } = useDNAGeometry()

  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation when idle
      groupRef.current.rotation.y += 0.002
    }
  })

  // Generate sphere positions along strands
  const spherePositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < strand1Points.length; i += 3) {
      positions.push({
        strand1: strand1Points[i],
        strand2: strand2Points[i],
      })
    }
    return positions
  }, [strand1Points, strand2Points])

  return (
    <group ref={groupRef}>
      {/* Main strands */}
      <DNAStrand points={strand1Points} color={COLORS.cyan} />
      <DNAStrand points={strand2Points} color={COLORS.violet} />

      {/* Spheres along strands */}
      {spherePositions.map((pos, i) => (
        <React.Fragment key={i}>
          <DNASphere position={pos.strand1} color={COLORS.cyan} />
          <DNASphere position={pos.strand2} color={COLORS.violet} />
        </React.Fragment>
      ))}

      {/* Rungs */}
      {rungs.map((rung, i) => (
        <DNARung
          key={i}
          start={rung.start}
          end={rung.end}
          color={i % 2 === 0 ? COLORS.cyan : COLORS.violet}
        />
      ))}

      {/* Product nodes */}
      {nodePositions.map((node, i) => (
        <ProductNode
          key={i}
          position={node.position}
          index={i}
          isActive={activeNode === i}
        />
      ))}
    </group>
  )
}

// Particle Field Background
const ParticleField = ({ count = 500 }) => {
  const points = useRef()

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return positions
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.0005
      points.current.rotation.x += 0.0002
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        color={COLORS.cyan}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

// Camera Controller
const CameraController = ({ scrollProgress, nodePositions }) => {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3(0, 0, 15))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    // Interpolate camera position
    const progress = scrollProgress.current

    // Spiral camera path
    const baseY = (progress - 0.5) * 40
    const spiralAngle = progress * Math.PI * 2
    const spiralRadius = 12 + Math.sin(progress * Math.PI * 4) * 2

    targetPosition.current.set(
      Math.cos(spiralAngle) * spiralRadius,
      baseY,
      Math.sin(spiralAngle) * spiralRadius
    )

    // Look at center of DNA
    targetLookAt.current.set(0, baseY * 0.8, 0)

    // Smooth interpolation
    camera.position.lerp(targetPosition.current, 0.05)

    const lookAtTarget = new THREE.Vector3()
    lookAtTarget.lerpVectors(
      new THREE.Vector3(
        camera.getWorldDirection(new THREE.Vector3()).x,
        camera.getWorldDirection(new THREE.Vector3()).y,
        camera.getWorldDirection(new THREE.Vector3()).z
      ),
      targetLookAt.current.clone().sub(camera.position).normalize(),
      0.05
    )

    camera.lookAt(targetLookAt.current)
  })

  return null
}

// Main 3D Scene
const Scene3D = ({ scrollProgress, activeNode }) => {
  const { nodePositions } = useDNAGeometry()

  return (
    <>
      <color attach="background" args={[COLORS.black]} />
      <fog attach="fog" args={[COLORS.black, 20, 80]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color={COLORS.cyan} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color={COLORS.violet} />
      <spotLight
        position={[0, 20, 0]}
        angle={0.5}
        penumbra={1}
        intensity={1}
        color={COLORS.white}
      />

      <DNAHelix scrollProgress={scrollProgress} activeNode={activeNode} />
      <ParticleField count={typeof window !== 'undefined' && window.innerWidth < 768 ? 200 : 500} />
      <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

      <CameraController scrollProgress={scrollProgress} nodePositions={nodePositions} />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
          radius={0.8}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>
    </>
  )
}

// ============================================
// UI COMPONENTS
// ============================================

// Loading Screen
const LoadingScreen = ({ isLoading }) => {
  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bio-black">
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 dna-loader">
            <div className="absolute w-4 h-4 bg-bio-cyan rounded-full top-0 left-1/2 -translate-x-1/2 animate-pulse-glow" />
            <div className="absolute w-4 h-4 bg-bio-violet rounded-full bottom-0 left-1/2 -translate-x-1/2 animate-pulse-glow" />
            <div className="absolute w-1 h-full bg-gradient-to-b from-bio-cyan to-bio-violet left-1/2 -translate-x-1/2 opacity-50" />
          </div>
        </div>
        <h2 className="text-2xl font-geo font-light text-bio-white mb-2">
          MOST <span className="text-bio-cyan">PROTEINS</span>
        </h2>
        <p className="text-bio-white/50 font-mono text-sm">
          Initializing bio-sequences...
        </p>
      </div>
    </div>
  )
}

// Header
const Header = () => {
  const { cartCount, setIsCartOpen } = useCart()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        scrolled ? 'glass-dark py-4' : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-bio-cyan to-bio-violet rounded-lg opacity-80" />
            <div className="absolute inset-1 bg-bio-black rounded-md" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-bio-cyan font-bold text-xs">MP</span>
            </div>
          </div>
          <span className="font-geo font-semibold text-lg text-bio-white">
            MOST <span className="text-bio-cyan">PROTEINS</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#products" className="text-bio-white/70 hover:text-bio-cyan transition-colors text-sm">
            Products
          </a>
          <a href="#science" className="text-bio-white/70 hover:text-bio-cyan transition-colors text-sm">
            Science
          </a>
          <a href="#about" className="text-bio-white/70 hover:text-bio-cyan transition-colors text-sm">
            About
          </a>
        </nav>

        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 rounded-lg glass hover:glow-cyan transition-all duration-300 group"
        >
          <svg
            className="w-6 h-6 text-bio-white group-hover:text-bio-cyan transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-bio-cyan text-bio-black text-xs font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

// Product Card with 3D tilt effect
const ProductCard = ({ product, isVisible, index }) => {
  const cardRef = useRef()
  const [transform, setTransform] = useState({ rotateX: 0, rotateY: 0 })
  const { addToCart } = useCart()

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10
    setTransform({ rotateX, rotateY })
  }

  const handleMouseLeave = () => {
    setTransform({ rotateX: 0, rotateY: 0 })
  }

  return (
    <div
      ref={cardRef}
      className={`product-card glass rounded-2xl p-6 max-w-sm transition-all duration-700 ${
        isVisible
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-20'
      }`}
      style={{
        transform: `perspective(1000px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
        transitionDelay: `${index * 100}ms`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="product-card-inner">
        <div className="relative mb-4 overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at center, ${product.color}, transparent)`,
            }}
          />
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
            loading="lazy"
          />
        </div>

        <h3 className="font-geo font-semibold text-xl text-bio-white mb-2">
          {product.name}
        </h3>
        <p className="text-bio-white/60 text-sm mb-4">
          {product.description}
        </p>
        <p className="text-bio-white/40 text-xs mb-4 line-clamp-2">
          {product.longDescription}
        </p>

        <div className="flex items-center justify-between">
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: product.color }}
          >
            ${product.price}
          </span>
          <button
            onClick={() => addToCart(product)}
            className="btn-primary text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

// Cart Panel
const CartPanel = () => {
  const {
    cart,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    isCheckout,
    setIsCheckout,
    clearCart,
  } = useCart()
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })

  const handlePlaceOrder = (e) => {
    e.preventDefault()
    setOrderPlaced(true)
    setTimeout(() => {
      clearCart()
      setOrderPlaced(false)
      setIsCheckout(false)
      setIsCartOpen(false)
      setFormData({ name: '', email: '' })
    }, 3000)
  }

  if (!isCartOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => {
          setIsCartOpen(false)
          setIsCheckout(false)
        }}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md glass-dark overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-geo font-semibold text-bio-white">
              {isCheckout ? 'Checkout' : 'Your Cart'}
            </h2>
            <button
              onClick={() => {
                setIsCartOpen(false)
                setIsCheckout(false)
              }}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg
                className="w-6 h-6 text-bio-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {orderPlaced ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bio-cyan/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-bio-cyan"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-geo text-bio-white mb-2">
                Order Placed!
              </h3>
              <p className="text-bio-white/60">
                Thank you for your purchase.
              </p>
            </div>
          ) : isCheckout ? (
            <form onSubmit={handlePlaceOrder}>
              <div className="space-y-4 mb-6">
                <div className="glass rounded-lg p-4">
                  <h3 className="font-geo text-bio-white mb-3">Order Summary</h3>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm text-bio-white/70 mb-2"
                    >
                      <span>
                        {item.name} x {item.quantity}
                      </span>
                      <span>${item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-semibold text-bio-white">
                    <span>Total</span>
                    <span className="text-bio-cyan">${cartTotal}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-bio-white/70 text-sm mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-bio-white focus:border-bio-cyan focus:outline-none transition-colors"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-bio-white/70 text-sm mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-bio-white focus:border-bio-cyan focus:outline-none transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary">
                Place Order
              </button>
              <button
                type="button"
                onClick={() => setIsCheckout(false)}
                className="w-full mt-3 btn-secondary"
              >
                Back to Cart
              </button>
            </form>
          ) : cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-bio-white/30"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <p className="text-bio-white/60">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="glass rounded-lg p-4 flex gap-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-geo text-bio-white mb-1">
                        {item.name}
                      </h4>
                      <p
                        className="font-mono text-sm"
                        style={{ color: item.color }}
                      >
                        ${item.price}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-lg bg-white/10 text-bio-white hover:bg-white/20 transition-colors"
                        >
                          -
                        </button>
                        <span className="text-bio-white font-mono w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-lg bg-white/10 text-bio-white hover:bg-white/20 transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="ml-auto p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between text-bio-white mb-2">
                  <span>Subtotal</span>
                  <span className="font-mono">${cartTotal}</span>
                </div>
                <div className="flex justify-between text-bio-white/60 text-sm">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>

              <button
                onClick={() => setIsCheckout(true)}
                className="w-full btn-primary"
              >
                Proceed to Checkout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Hero Section
const HeroSection = () => {
  return (
    <section className="h-screen flex items-center justify-center relative">
      <div className="text-center z-10 px-6">
        <h1 className="font-geo text-5xl md:text-7xl font-bold text-bio-white mb-6">
          <span className="text-glow-cyan">MOST</span>{' '}
          <span className="text-glow-violet">PROTEINS</span>
        </h1>
        <p className="text-bio-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light">
          Advanced biotech supplements engineered for peak human performance.
          Unlock your genetic potential.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#products" className="btn-primary">
            Explore Products
          </a>
          <button className="btn-secondary">Learn the Science</button>
        </div>

        <div className="mt-16 animate-bounce">
          <svg
            className="w-6 h-6 mx-auto text-bio-cyan"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}

// Product Section
const ProductSection = ({ product, index, activeNode }) => {
  const isActive = activeNode === index
  const isEven = index % 2 === 0

  return (
    <section
      id={`product-${index}`}
      className={`min-h-screen flex items-center px-6 py-20 ${
        isEven ? 'justify-start' : 'justify-end'
      }`}
    >
      <div className={`max-w-7xl w-full mx-auto flex ${isEven ? 'justify-start' : 'justify-end'}`}>
        <ProductCard product={product} isVisible={isActive} index={index} />
      </div>
    </section>
  )
}

// Footer Section
const FooterSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative">
      <div className="text-center z-10 px-6 max-w-3xl">
        <h2 className="font-geo text-4xl md:text-5xl font-bold text-bio-white mb-6">
          Ready to <span className="text-bio-cyan">Evolve</span>?
        </h2>
        <p className="text-bio-white/60 text-lg mb-8">
          Join thousands of biohackers who have elevated their performance with
          MOST PROTEINS. Your optimal self awaits.
        </p>
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-bio-cyan mb-2">50K+</div>
              <div className="text-bio-white/60 text-sm">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-bio-violet mb-2">99%</div>
              <div className="text-bio-white/60 text-sm">Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-bio-cyan mb-2">5 Yrs</div>
              <div className="text-bio-white/60 text-sm">Research</div>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-primary"
        >
          Start Your Journey
        </button>
      </div>
    </section>
  )
}

// Custom Cursor
const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updatePosition = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
      setIsVisible(true)
    }

    const handleMouseEnter = () => setIsHovering(true)
    const handleMouseLeave = () => setIsHovering(false)

    window.addEventListener('mousemove', updatePosition)

    const interactiveElements = document.querySelectorAll(
      'button, a, input, .product-card'
    )
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      window.removeEventListener('mousemove', updatePosition)
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  // Hide on mobile
  if (typeof window !== 'undefined' && window.innerWidth < 768) return null

  return (
    <>
      <div
        className={`fixed pointer-events-none z-50 transition-transform duration-150 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scale(${isHovering ? 2 : 1})`,
        }}
      >
        <div
          className={`w-4 h-4 rounded-full ${
            isHovering ? 'bg-bio-cyan/30' : 'bg-bio-cyan'
          } transition-all duration-300`}
        />
      </div>
      <div
        className="fixed pointer-events-none z-50 transition-all duration-300 ease-out"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`w-8 h-8 rounded-full border ${
            isHovering ? 'border-bio-cyan scale-150' : 'border-bio-cyan/50'
          } transition-all duration-300`}
        />
      </div>
    </>
  )
}

// ============================================
// MAIN APP
// ============================================

const App = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [activeNode, setActiveNode] = useState(-1)
  const scrollProgress = useRef(0)
  const containerRef = useRef()

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
    }
  }, [])

  // Setup GSAP ScrollTrigger animations
  useEffect(() => {
    if (isLoading) return

    const ctx = gsap.context(() => {
      // Main scroll progress
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          scrollProgress.current = self.progress
        },
      })

      // Product node triggers
      PRODUCTS.forEach((_, index) => {
        const sectionStart = (index + 1) / (PRODUCTS.length + 2)
        const sectionEnd = (index + 1.8) / (PRODUCTS.length + 2)

        ScrollTrigger.create({
          trigger: containerRef.current,
          start: `${sectionStart * 100}% top`,
          end: `${sectionEnd * 100}% top`,
          onEnter: () => setActiveNode(index),
          onEnterBack: () => setActiveNode(index),
          onLeave: () => {
            if (index === PRODUCTS.length - 1) setActiveNode(-1)
          },
          onLeaveBack: () => {
            if (index === 0) setActiveNode(-1)
          },
        })
      })
    })

    return () => ctx.revert()
  }, [isLoading])

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <CartProvider>
      <LoadingScreen isLoading={isLoading} />

      {!isLoading && (
        <>
          <CustomCursor />
          <Header />
          <CartPanel />

          {/* 3D Canvas */}
          <div className="canvas-container">
            <Suspense fallback={null}>
              <Canvas
                camera={{ position: [0, 0, 15], fov: 60 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: false }}
              >
                <Scene3D scrollProgress={scrollProgress} activeNode={activeNode} />
              </Canvas>
            </Suspense>
          </div>

          {/* Content Overlay */}
          <div ref={containerRef} className="content-overlay" style={{ height: '500vh' }}>
            <HeroSection />

            <div id="products">
              {PRODUCTS.map((product, index) => (
                <ProductSection
                  key={product.id}
                  product={product}
                  index={index}
                  activeNode={activeNode}
                />
              ))}
            </div>

            <FooterSection />
          </div>
        </>
      )}
    </CartProvider>
  )
}

export default App
