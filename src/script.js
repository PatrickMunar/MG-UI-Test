import './style.css'
// import * as dat from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'
import Scrollbar from 'smooth-scrollbar'
import gsap from 'gsap'

// Clear Scroll Memory
window.history.scrollRestoration = 'manual'

// Scroll Triggers
gsap.registerPlugin(ScrollTrigger)

// 3rd party library setup:
const bodyScrollBar = Scrollbar.init(document.querySelector('#bodyScrollbar'), { damping: 0.1, delegateTo: document })

let scrollY = 0

// Tell ScrollTrigger to use these proxy getter/setter methods for the "body" element: 
ScrollTrigger.scrollerProxy('#bodyScrollbar', {
  scrollTop(value) {
    if (arguments.length) {
      bodyScrollBar.scrollTop = value; // setter
    }
    return bodyScrollBar.scrollTop    // getter
  },
  getBoundingClientRect() {
    return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight}
  }
})

// when the smooth scroller updates, tell ScrollTrigger to update() too: 
bodyScrollBar.addListener(ScrollTrigger.update);

// Functions
const lerp = (start, end, t) => {
    return start * ( 1 - t ) + end * t;
}

// -----------------------------------------------------------------
/**
 * Base
 */

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Fix Position
bodyScrollBar.addListener(({ offset }) => {  
    canvas.style.top = offset.y + 'px'
})

// Scene
const scene = new THREE.Scene()
// scene.background = new THREE.Color(0xF8F0E3)

/**
 * Loaders
 */
// Loading Manager
const loadingBar = document.getElementById('loadingBar')
const loadingPage = document.getElementById('loadingPage')

const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
       
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => {

    }
)

const images = []

// Texture loader
const textureLoader = new THREE.TextureLoader()
images[0] = textureLoader.load('./images/q2.PNG')

// Draco loader
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF loader
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

// Font Loader
const fontLoader = new FontLoader()

// Lighting

const ambientLight = new THREE.AmbientLight(0xaa00ff, 0.1)
scene.add(ambientLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {    
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

// Mesh
const PGroups = new THREE.Group

const questionImageDimensions = {
    x: document.querySelector('.questionImage').naturalWidth,
    y: document.querySelector('.questionImage').naturalHeight
}

console.log(questionImageDimensions)

const parameters = {
    width: questionImageDimensions.x,
    height: questionImageDimensions.y,
    sectionDistance: 15,
    rotationAngle: 0
}

const offsetGains = {
    mx: 0.001, 
    my: 0.001
}

const g = new THREE.PlaneGeometry(parameters.width/75, parameters.height/75, parameters.width/10, parameters.height)
const m1 = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uTexture: {value: images[0]},
        uAlpha: {value: 0},
        uOffset: {value: new THREE.Vector2(0,0)},
        uTime: {value: 0},
        uRedact: {value: 0}
    },
    transparent: true,
    side: THREE.DoubleSide
})
const p1 = new THREE.Mesh(g, m1)
const p1g = new THREE.Group
p1g.add(p1)
PGroups.add(p1g)

PGroups.rotation.z = parameters.rotationAngle
scene.add(PGroups)
// Offsets
const offset = {
    x: 0,
    y: 0
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enabled = false

controls.enableDamping = true
controls.maxPolarAngle = Math.PI/2
// controls.minAzimuthAngle = Math.PI*0/180
// controls.maxAzimuthAngle = Math.PI*90/180
controls.minDistance = 12  
controls.maxDistance = 80

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.CineonToneMapping

// Raycaster
const raycaster = new THREE.Raycaster()

// Parallax Camera Group
const cameraGroup = new THREE.Group
cameraGroup.add(camera)
cameraGroup.position.set(0,0,15)
scene.add(cameraGroup)

/**
 * Animate
 */
const clock = new THREE.Clock()
const randomGlitch = {
    x: 0,
    y: 0
}

// Event Listeners
const mouse = {
    x: 0,
    y: 0
}

let isMouseMoving = false
let timeout

window.addEventListener('mousemove', (e) => {
    isMouseMoving = true
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    if (timeout !== undefined) {
        window.clearTimeout(timeout)
    }
    timeout = window.setTimeout(function () {
        isMouseMoving = false
        console.log(isMouseMoving)
    }, 100)

    // Cursor Follorw
    gsap.to('.cursorFollower', {duration: 0, ease:'none', x: mouse.x - 10, y: mouse.y - 10})
})

// Glitch
const glitch = () => {
    const randomX = (Math.random() - 0.5) * window.innerWidth * 5
    const randomY = (Math.random() - 0.5) * window.innerHeight * 5
    const startTime = Math.random() * 0.075 + 0.025
    const endTime = Math.random() * 0.1
    const randomTime = Math.random() * 5 + startTime + endTime
    gsap.to(randomGlitch, {duration: startTime, delay: 0, x: randomX, y: randomY})
    gsap.to(randomGlitch, {duration: endTime, delay: startTime, x: 0, y: 0})
    // gsap.to(p1g.rotation, {duration: 0, x: Math.PI})
    // gsap.to(p1g.rotation, {duration: 0, delay: 0.1, x: 0})

    setTimeout(() => {
        glitch()
    }, randomTime * 1000)
}

glitch()

// Redact
const redact = () => {
      gsap.to(m1.uniforms.uRedact, {duration: 1, value: 1, ease: 'Power3.easeOut'})
}

// UnRedact
const unRedact = () => {
    gsap.to(m1.uniforms.uRedact, {duration: 1, value: 0, ease: 'Power3.easeOut'})
}

// User Chose Answer
let isRedacted = false

window.addEventListener('click', () => {
    if (isRedacted == false) {
        redact()
        isRedacted = true
        gsap.to(cameraGroup.rotation, {x: 0, y: 0})
    }
    else {
        unRedact()
        gsap.to(cameraGroup.rotation, {duration: 0.1, y: (mouse.x/window.innerWidth - 0.5) * 1, x: (mouse.y/window.innerHeight - 0.5) * 0.5})
        setTimeout(() => {
            isRedacted = false
        }, 100)
    }
})

redact()

let isQuestionIn = false
// Question Going In
const questionDrop = () => {
    gsap.fromTo(p1g.position, {y: 20}, {duration: 2, y: 0})
    setTimeout(() => {
        gsap.to(cameraGroup.rotation, {duration: 0.25, x: (mouse.y/window.innerHeight - 0.5) * 0.5, y: (mouse.x/window.innerWidth - 0.5) * 1})
    }, 2000)
    setTimeout(() => {
        isQuestionIn = true
        unRedact()
    }, 2250)
}

questionDrop()

const tick = () =>
{
    scrollY = bodyScrollBar.scrollTop
    const elapsedTime = clock.getElapsedTime()

    if (isMouseMoving == true || isRedacted == true) {
        randomGlitch.x = 0
        randomGlitch.y = 0
    }

    offset.x = lerp(offset.x, mouse.x + randomGlitch.x, 0.05)
    offset.y = lerp(offset.y, mouse.y + randomGlitch.y, 0.05)

    if (isQuestionIn == true) {
        m1.uniforms.uOffset.value.set((mouse.x - offset.x) * offsetGains.mx , (-(mouse.y - offset.y) * offsetGains.my * 16/9))
        m1.uniforms.uTime.value = elapsedTime
        
        p1g.position.y = Math.sin(elapsedTime) * 0.1
        p1g.rotation.x = Math.sin(elapsedTime) * 0.05
        p1g.rotation.y = Math.cos(elapsedTime) * 0.05
      
        if (isRedacted == false) {
            // Camera
            cameraGroup.rotation.y = (mouse.x/window.innerWidth - 0.5) * 1
            cameraGroup.rotation.x = (mouse.y/window.innerHeight - 0.5) * 0.5
        }
    }

    // Update controls
    if (controls.enabled == true) {
        controls.update()
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

// Scroll Triggers
gsap.fromTo(camera.position, {x: 0, y: 0}, {x: 0, y: 0})

gsap.fromTo(camera.position, {x: parameters.sectionDistance * 0 * Math.sin(parameters.rotationAngle), y: -parameters.sectionDistance * 0 * Math.cos(parameters.rotationAngle)}, {
    scrollTrigger: {
        trigger: '#section1',
        start: () =>  window.innerHeight*1 + ' bottom',
        end: () =>  window.innerHeight*1 + ' top',
        snap: 1, 
        scrub: true,
    },
    x: parameters.sectionDistance * 1 * Math.sin(parameters.rotationAngle),
    y: -parameters.sectionDistance * 1 * Math.cos(parameters.rotationAngle),
    ease: 'none'
})

tick()