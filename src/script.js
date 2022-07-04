import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { FlakesTexture } from './FlakesTexture';
import gsap from 'gsap';

const gui = new dat.GUI();
gui.close();
const scene = new THREE.Scene();
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
const overlayMaterial = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    uAlpha: { value: 1 }
  },
  vertexShader: `
  
  void main() {
    gl_Position = vec4(position, 1.0);
  }
   `,
  fragmentShader: `
  uniform float uAlpha;
  void main() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
  }
  `
});
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
scene.add(overlay);

const element = document.querySelector('.loading-bar');
const title = document.querySelector('.intro-title');

const loadingManager = new THREE.LoadingManager(
  (done) => {
    gsap.delayedCall(0.5, () => {
      gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 });
      element.style.transform = `scaleY(0)`;
      element.classList.add('ended');
      title.style.opacity = 0;
      setTimeout(() => {
        title.style.display = 'none';
      }, 2000);
    });
  },
  (url, loaded, total) => {
    element.style.transform = `scaleX(${loaded / total})`;
  }
);

const canvas = document.querySelector('canvas.webgl');

const pointlight = new THREE.PointLight(0xffffff, 1);
pointlight.position.set(200, 200, 200);
scene.add(pointlight);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas });
const envmaploader = new THREE.PMREMGenerator(renderer);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

function makeSpehre(hdrmap, color, position, scale, textureRepeat) {
  const envmap = envmaploader.fromCubemap(hdrmap);
  const texture = new THREE.CanvasTexture(new FlakesTexture());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.x = textureRepeat.x;
  texture.repeat.y = textureRepeat.y;

  const ballMaterial = {
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.5,
    normalMap: texture,
    normalScale: new THREE.Vector2(0.15, 0.15),
    envMap: envmap.texture,
    color: new THREE.Color(Math.random() * 0xffffff).getHex()
  };

  gui.add(texture.repeat, 'x').name('texture repeat x').min(0.1).max(100).step(0.1);
  gui.add(texture.repeat, 'y').name('texture repeat y').min(0.1).max(100).step(0.1);
  gui.addColor(ballMaterial, 'color').onChange((val) => {
    ballMat.color.set(val);
  });

  const ballGeo = new THREE.SphereGeometry(100, 64, 64);
  const ballMat = new THREE.MeshPhysicalMaterial(ballMaterial);

  ballMaterial.color = color;
  ballMaterial.envMap = envmap.texture;

  const ballMesh = new THREE.Mesh(ballGeo, ballMat);

  ballMesh.position.set(position.x, position.y, position.z);
  ballMesh.scale.set(scale.x, scale.y, scale.z);

  return ballMesh;
}

const tl = gsap.timeline();
new RGBELoader(loadingManager).setPath('textures/').load('cayley_interior_4k.hdr', function (hdrmap) {
  for (let i = 0; i < 1; i++) {
    const scale = 1;
    const sphere = makeSpehre(
      hdrmap,
      Math.random() * 0xffffff,
      { x: (Math.random() - 0.5) * 3000, y: (Math.random() - 0.5) * 3000, z: (Math.random() - 0.5) * 3000 },
      // { x: i, y: i, z: i },
      { x: scale, y: scale, z: scale },
      { x: 20, y: 20 }
    );

    scene.add(sphere);
  }

  const scale = 1;
  const sphere = makeSpehre(
    hdrmap,
    Math.random() * 0xffffff,
    { x: 0, y: 0, z: 0 },
    { x: scale, y: scale, z: scale },
    { x: 20, y: 20 }
  );

  scene.add(sphere);
  // camera.lookAt(sphere);
});

const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 10000);
camera.position.set(1, 1, -200);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minDistance = 0.1;
controls.maxDistance = 10000;

/**
 * Renderer
 */
let INTERSECTED;
const pointer = new THREE.Vector2();

const raycaster = new THREE.Raycaster();
window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('mousemove', onPointerMove);
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

let tapedTwice = false;

function tapHandler(event) {
  if (!tapedTwice) {
    tapedTwice = true;
    setTimeout(function () {
      tapedTwice = false;
    }, 300);
    return false;
  }
  event.preventDefault();
  //action on double tap goes below
  lock();
}

window.addEventListener('dblclick', function (e) {
  lock();
});

// window.addEventListener('touchstart', function (e) {
//   tapHandler(e);
// });

function lock() {
  const intersects = raycaster.intersectObjects(scene.children, false);

  if (intersects.length > 0) {
    // console.log('fired', intersects[0].object);
    const target = intersects[0].object;
    gsap.to(camera.position, {
      duration: 1,
      x: 100,
      y: 10,
      z: 100,
      onUpdate: function () {
        camera.lookAt(target.position.x, target.position.y, target.position.z);
        controls.target.set(target.position.x, target.position.y, target.position.z);
        camera.updateMatrixWorld();
      }
    });
  }
}

const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;
  controls.update();

  camera.updateMatrixWorld();

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(scene.children, false);

  if (intersects.length > 0) {
    if (INTERSECTED != intersects[0].object) {
      if (INTERSECTED) {
        INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
      }

      INTERSECTED = intersects[0].object;
      INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
      INTERSECTED.material.emissive.setHex(INTERSECTED.material.color.getHex());
      INTERSECTED.material.emissiveIntensity = 0.5;
    }
  } else {
    if (INTERSECTED) INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
    INTERSECTED = null;
  }

  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
