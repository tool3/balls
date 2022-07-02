import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { FlakesTexture } from './FlakesTexture';
import gsap from 'gsap';

/**
 * Debug
 */
const gui = new dat.GUI();
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

const canvas = document.querySelector('canvas.webgl');
const scene = new THREE.Scene();

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

const texture = new THREE.CanvasTexture(new FlakesTexture());
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.x = 10;
texture.repeat.y = 6;

const ballMaterial = {
  clearcoat: 1.0,
  cleacoatRoughness: 0.1,
  metalness: 0.9,
  roughness: 0.5,
  normalMap: texture,
  normalScale: new THREE.Vector2(0.15, 0.15),
  envMap: null
};

const ballGeo = new THREE.SphereGeometry(100, 64, 64);

function makeSpehre(hdrmap, color, position, scale) {
  const envmap = envmaploader.fromCubemap(hdrmap);
  console.log(color);
  ballMaterial.color = color;
  const ballMat = new THREE.MeshPhysicalMaterial(ballMaterial);
  ballMaterial.envMap = envmap.texture;

  const ballMesh = new THREE.Mesh(ballGeo, ballMat);

  ballMesh.position.set(position.x, position.y, position.z);
  ballMesh.scale.set(scale.x, scale.y, scale.z);

  return ballMesh;
}

const tl = gsap.timeline();
new RGBELoader().setPath('textures/').load('cayley_interior_4k.hdr', function (hdrmap) {
  for (let i = 0; i < 500; i++) {
    const color = Math.random() * 0xffffff;
    const scale = Math.random();
    const sphere = makeSpehre(
      hdrmap,
      color,
      // { x: (Math.random() - 0.5) * 3000, y: (Math.random() - 0.5) * 3000, z: (Math.random() - 0.5) * 3000 },
      { x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, z: -i * 300 },
      { x: scale, y: scale, z: scale }
    );
    scene.add(sphere);
  }
  // const sphere1 = makeSpehre(hdrmap, 'pink', { x: 150, y: 0, z: -1000 }, { x: 3, y: 3, z: 3 });
  // scene.add(sphere1);
  // const sphere1 = makeSpehre(hdrmap, 'yellow', {x: -50, y: 0, z: 0});
  // const sphere2 = makeSpehre(hdrmap, 'blue', {x: 50, y: 0, z: 0});
  // scene.add(sphere1);
  // scene.add(sphere2);
  gsap.from(camera.position, { z: -20000, duration: 100 });
  // tl.from(camera.position, { duration: 3, x: 1000 })
  //   // .to(camera.position, { duration: 3, x: 100 })
  //   .from(sphere1.position, { duration: 3, y: 100 });

  // tl.to(camera.position, { z: -300, y: 10 });
  // gsap.to(sphere1.position, { z: 100, duration: 2 });,
});

const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 10000);
camera.position.set(0, 50, 150);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */

const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};

tick();
