import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { FlakesTexture } from './FlakesTexture';
import gsap from 'gsap';

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

function makeSpehre(hdrmap, color, position, scale, textureRepeat) {
  const envmap = envmaploader.fromCubemap(hdrmap);
  const texture = new THREE.CanvasTexture(new FlakesTexture());
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.x = textureRepeat.x;
  texture.repeat.y = textureRepeat.y;

  gui.add(texture.repeat, 'x').name('texture repeat x').min(0.1).max(10);
  gui.add(texture.repeat, 'y').name('texture repeat y').min(0.1).max(10);

  const ballMaterial = {
    clearcoat: 1.0,
    cleacoatRoughness: 0.1,
    metalness: 0.9,
    roughness: 0.5,
    normalMap: texture,
    normalScale: new THREE.Vector2(0.15, 0.15),
    envMap: envmap.texture,
    color: Math.random() * 0xffffff
  };

  const ballGeo = new THREE.SphereGeometry(100, 64, 64);

  const ballMat = new THREE.MeshPhysicalMaterial(ballMaterial);
  ballMaterial.color = color;

  envmap.texture.repeat.x = textureRepeat.x;
  envmap.texture.repeat.y = textureRepeat.y;
  envmap.texture.needsUpdate = true;

  ballMaterial.envMap = envmap.texture;

  const ballMesh = new THREE.Mesh(ballGeo, ballMat);

  ballMesh.position.set(position.x, position.y, position.z);
  ballMesh.scale.set(scale.x, scale.y, scale.z);

  return ballMesh;
}

const tl = gsap.timeline();
new RGBELoader().setPath('textures/').load('cayley_interior_4k.hdr', function (hdrmap) {
  // for (let i = 0; i < 2; i++) {
  //   const color = Math.random() * 0xffffff;
  //   // const scale = Math.random() * 2;
  //   const scale = 2;
  //   const sphere = makeSpehre(
  //     hdrmap,
  //     color,
  //     { x: 1 + i * 2, y: 1, z: -100 },
  //     // { x: (Math.random() - 0.5) * 3000, y: (Math.random() - 0.5) * 3000, z: (Math.random() - 0.5) * 3000 },
  //     // { x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, z: (Math.random() - 0.5) * 1000 },
  //     { x: scale, y: scale, z: scale },
  //     { x: 20, y: 20 }
  //   );
  //   console.log('made');
  //   scene.add(sphere);
  // }
  // const sphere1 = makeSpehre(hdrmap, 'pink', { x: 150, y: 0, z: -1000 }, { x: 3, y: 3, z: 3 });
  // scene.add(sphere1);
  // const sphere1 = makeSpehre(hdrmap, 'yellow', {x: -50, y: 0, z: 0});
  // const sphere2 = makeSpehre(hdrmap, 'blue', {x: 50, y: 0, z: 0});
  // scene.add(sphere1);
  // scene.add(sphere2);
  // gsap.from(camera.position, { z: -20000, duration: 200 });
  // tl.from(camera.position, { duration: 3, x: 1000 })
  //   // .to(camera.position, { duration: 3, x: 100 })
  //   .from(sphere1.position, { duration: 3, y: 100 });

  // tl.to(camera.position, { z: -300, y: 10 });
  // gsap.to(sphere1.position, { z: 100, duration: 2 });,
  console.log(hdrmap);
  const scale = 1;
  const sphere = makeSpehre(
    hdrmap,
    Math.random() * 0xffffff,
    { x: 0, y: 0, z: 0 },
    { x: scale, y: scale, z: scale },
    { x: 20, y: 20 }
  );
  // const sphere1 = makeSpehre(
  //   hdrmap,
  //   Math.random() * 0xffffff,
  //   { x: 0, y: 0, z: 100 },
  //   { x: scale, y: scale, z: scale },
  //   { x: 10, y: 6 }
  // );
  scene.add(sphere);
});

const camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.1, 10000);
camera.position.set(1, 1, -200);
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
