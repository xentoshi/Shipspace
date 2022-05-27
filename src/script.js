import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { gsap } from 'gsap'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import { generateUUID } from 'three/src/math/MathUtils'
import { WebGLRenderTarget } from 'three'
/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}

/**
 * Loaders
 */
const loadingBarElement = document.querySelector('.loading-bar')
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => 
    {
        window.setTimeout(() => 
        {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0, delay: 1 })

            loadingBarElement.classList.add('ended')
            loadingBarElement.style.transform = ''
        }, 500)   
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => 
    {
        const progressRatio = itemsLoaded / itemsTotal
        loadingBarElement.style.transform = `scaleX(${progressRatio}`
    }
)
const gltfLoader = new GLTFLoader(loadingManager)

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Water
 */
// Geometry 
const waterGeometry = new THREE.PlaneGeometry(5, 5, 512, 512)

// Colors
debugObject.depthColor = '#186691'
debugObject.surfaceColor = '9bd8ff'

// Add Color to Debug UI
gui.addColor(debugObject, 'depthColor').onChange(() => { waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor) })
gui.addColor(debugObject, 'surfaceColor').onChange(() => { waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor) })

// Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    uniforms:
    {
        uTime: { value: 0 },
        uBigWavesElevation: { value: 0.2 },
        uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
        uBigWavesSpeed: { value: 0.75 },
        uSmallWavesElevation: { value: 0.15 },
        uSmallWavesFrequency: { value: 3 },
        uSmallWavesSpeed: { value: 0.2 },
        uSmallIterations: { value: 4 },
        uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        uColorOffset: { value: 0.08 },
        uColorMultiplier: { value: 1 },
    }
})

// GUI 
gui.add(waterMaterial.uniforms.uBigWavesElevation, 
    'value').min(0).max(1).step(0.001).name('uBigWavesElevation')
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 
        'x').min(0).max(10).step(0.001).name('uBigWavesFrequencyX')
gui.add(waterMaterial.uniforms.uBigWavesFrequency.value, 
        'y').min(0).max(10).step(0.001).name('uBigWavesFrequencyY')
gui.add(waterMaterial.uniforms.uBigWavesSpeed, 
    'value').min(0).max(10).step(0.001).name('uBigWavesSpeed')
gui.add(waterMaterial.uniforms.uColorOffset, 
    'value').min(0).max(1).step(0.001).name('uColorOffset')
gui.add(waterMaterial.uniforms.uColorMultiplier, 
    'value').min(0).max(10).step(0.001).name('uColorMultiplier')
 gui.add(waterMaterial.uniforms.uSmallWavesElevation, 
    'value').min(0).max(1).step(0.001).name('uSmallWavesElevation')
gui.add(waterMaterial.uniforms.uSmallWavesFrequency, 
    'value').min(0).max(30).step(0.001).name('uSmallWavesFrequency')
gui.add(waterMaterial.uniforms.uSmallWavesSpeed, 
    'value').min(0).max(4).step(0.001).name('uSmallWavesSpeed')
gui.add(waterMaterial.uniforms.uSmallIterations, 
    'value').min(0).max(5).step(1).name('uSmallIterations')

// Mesh 
const water = new THREE.Mesh(waterGeometry, waterMaterial)
scene.add(water)

water.rotation.x = - Math.PI * 0.5
water.position.y = 0.4

/**
 * Fog
 */
const fog = new THREE.Fog('#262837', 1, 15)
scene.fog = fog

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 2)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Overlay
 */
 const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
 const overlayMaterial = new THREE.ShaderMaterial({ 
     transparent: true,
     uniforms: 
     {
         uAlpha: { value: 1 }
     },
     vertexShader: `
     void main()
     {
         gl_Position = vec4(position, 1.0);
     }
     `,
     fragmentShader: `
     uniform float uAlpha;

     void main() 
     {
        gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
     }
     `
    })
 const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
 scene.add(overlay)


window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 0.5, 2)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 0.75, 0)
controls.enableDamping = true

/**
 * Models
 */
let mixer = null
 gltfLoader.load(
    '/models/tz_pirate_ship/scene.gltf',
    (gltf) =>
    {

        gltf.scene.scale.set(0.001, 0.001, 0.001)
        gltf.scene.position.set(1, 0.5, 1)
        scene.add(gltf.scene)

        mixer = new THREE.AnimationMixer(gltf.scene)
        const action = mixer.clipAction(gltf.animations[0])
        action.play()
    }
)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#262837')
/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Water
    waterMaterial.uniforms.uTime.value = elapsedTime
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    controls.update()

    if(mixer)
    {
        mixer.update(deltaTime)
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()