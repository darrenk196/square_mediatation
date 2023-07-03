// Imports
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

// Variable declarations
let scene,
  camera,
  controls,
  renderer,
  geometry,
  cube,
  starParticles,
  particleGeometry,
  particles,
  burstParticleGeometry,
  burstParticles,
  clock,
  textClock,
  corners,
  previousTValues;

let raycaster,
  mouse,
  INTERSECTED,
  animationOn = false;

//load images for a skybox
const loader = new THREE.CubeTextureLoader();

// Set up the scene, camera, renderer, and controls
function setup() {
  scene = new THREE.Scene();
  const canvas = document.querySelector("canvas.webgl");

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // set up camer postion like it was a 50mm lens standing right in front of the cube.
  camera.position.x = 0;
  camera.position.y = 0;
  camera.position.z = 75;

  scene.add(camera);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // controls = new OrbitControls(camera, canvas);
  // controls.enableDamping = true;

  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

// Handle window resize events
function onWindowResize() {
  // Update sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", onWindowResize);
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("mousedown", onMouseDown, false);

function onMouseMove(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseDown(event) {
  event.preventDefault();

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObject(cube);

  if (intersects.length > 0) {
    animationOn = !animationOn;
  }
}

// Create the cube and particles
function createCubeAndParticles() {
  // Create a BoxGeometry and a ShaderMaterial
  geometry = new THREE.BoxGeometry(7, 7, 7);

  geometry.computeBoundingBox();

  // Calculate the center of the bounding box
  const cubeCenter = geometry.boundingBox.getCenter(new THREE.Vector3());

  // Move the geometry so that its center is at the origin
  geometry.center();

  cube = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0xffffff }) // the main cube is white
  );
  // Position the cube so that the front face is facing the camera
  // Adjust the position of the cube based on the calculated center

  cube.position.x = cubeCenter.x;
  cube.position.y = cubeCenter.y;
  cube.position.z = cubeCenter.z;
  cube.rotation.x = Math.PI / 2;
  cube.rotation.z = Math.PI / 40;
  scene.add(cube);

  // make a stary night using tiny particles on a sphere
  const starGeometry = new THREE.SphereGeometry(500, 200, 200);
  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
  });
  starParticles = new THREE.Points(starGeometry, starMaterial);
  scene.add(starParticles);

  // Create particle system
  particleGeometry = new THREE.BufferGeometry();
  var positions = [];
  for (let i = 0; i < 100; i++) {
    positions.push(0, 0, 0); // initial positions
  }
  particleGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  var particleMaterial = new THREE.PointsMaterial({
    color: 0xff0000,
    size: 1,
  });
  particles = new THREE.Points(particleGeometry, particleMaterial);

  // make the particle much bigger
  particles.scale.set(10, 10, 10);

  scene.add(particles);

  previousTValues = new Array(positions.length / 3).fill(0);

  burstParticleGeometry = new THREE.Points(
    new THREE.BufferGeometry().setAttribute(
      "position",
      new THREE.Float32BufferAttribute([0, 0, 0], 3)
    ),
    new THREE.PointsMaterial({
      color: 0xffe600,
      size: 0.1,
    })
  );
  burstParticles = [];
}

const textToDisplay = [
  ["Breath In", "2", "3", "4"],
  ["Hold", "2", "3", "4"],
  ["Breath Out", "2", "3", "4"],
  ["Hold", "2", "3", "4"],
];

let textMeshes = [];
let currentIndex = 0;
let subIndex = 0;

function createText() {
  const loader = new FontLoader();
  const textMaterial = new THREE.MeshBasicMaterial({
    color: 0xfffffff, // This is the text color. Change it as needed.
  });
  const textOutlineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00, // This is the outline color. Change it as needed.
    side: THREE.BackSide,
  });

  const textPromises = textToDisplay.map((phrase) =>
    phrase.map(
      (text) =>
        new Promise((resolve, reject) => {
          loader.load(
            "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
            (font) => {
              const textGeometry = new TextGeometry(text, {
                font: font,
                size: 15, // This is the font size. Increase it as needed.
                height: 3,
                curveSegments: 40, // This is the number of curve segments. Increase it for smoother text.
                bevelEnabled: true,
                bevelThickness: 1,
                bevelSize: 1,
                bevelOffset: 0,
                bevelSegments: 5,
              });

              // Compute the bounding box of the text geometry to get its dimensions
              textGeometry.computeBoundingBox();

              // Calculate the center of the bounding box
              const center = textGeometry.boundingBox.getCenter(
                new THREE.Vector3()
              );

              // Move the geometry so that its center is at the origin
              textGeometry.center();

              const textMesh = new THREE.Mesh(textGeometry, textMaterial);

              // Adjust the position of the text mesh based on the calculated center
              textMesh.position.x = -center.x;
              textMesh.position.y = 17; // Adjust y position here to make text appear above the cube
              textMesh.position.z = -center.z;

              textMesh.visible = false; // Make the text invisible by default

              // Create outline by cloning the textMesh and applying the outline material
              const outlineMesh = textMesh.clone();
              outlineMesh.material = textOutlineMaterial;
              outlineMesh.scale.multiplyScalar(1.05); // This is the outline thickness. Adjust it as needed.

              // Add the text and its outline to the scene
              scene.add(outlineMesh);
              scene.add(textMesh);
              resolve(textMesh);
            }
          );
        })
    )
  );

  Promise.all(textPromises.flat()).then((texts) => {
    textMeshes = texts;
    textMeshes[0].visible = true; // Make the first text visible
  });
}

// Function to create an intense burst of particles at a given position
function intenseBurst(position) {
  const burstSize = 700; // Increased burst size for an intense burst
  const speed = 10; // Increased speed for an intense burst

  for (let i = 0; i < burstSize; i++) {
    const particle = burstParticleGeometry.clone();
    particle.position.copy(position);
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);
    const velocity = new THREE.Vector3(
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.sin(phi) * Math.sin(theta),
      speed * Math.cos(phi)
    );
    particle.velocity = velocity;

    scene.add(particle);

    // Add the particle to the burstParticles array
    burstParticles.push(particle);
  }
}

// Function to update the position of each particle
function updateParticles(elapsedTime) {
  const positions = particles.geometry.attributes.position.array;

  for (let i = 0; i < positions.length / 3; i++) {
    const t = (elapsedTime + i / (positions.length / 3)) % 1;
    const index =
      Math.floor((elapsedTime + i / (positions.length / 3)) / 1) %
      corners.length;
    const corner1 = corners[index];
    const corner2 = corners[(index + 1) % corners.length];

    const vertex = new THREE.Vector3(
      positions[3 * i],
      positions[3 * i + 1],
      positions[3 * i + 2]
    );
    vertex.copy(corner1).lerp(corner2, t);
    positions[3 * i] = vertex.x;
    positions[3 * i + 1] = vertex.y;
    positions[3 * i + 2] = vertex.z;

    // Check if the particle has reached a corner
    if (previousTValues[i] > 0.99 && t < 0.01) {
      // The particle has looped from the end of one edge to the start of the next, so trigger a burst
      intenseBurst(vertex);
    }

    // Update the previous t value for this particle
    previousTValues[i] = t;
  }
  particles.geometry.attributes.position.needsUpdate = true;
}

// Function to update the position of each burst particle
function updateBurstParticles(elapsedTime) {
  for (let i = 0; i < burstParticles.length; i++) {
    const particle = burstParticles[i];
    // make every particle have a random color
    particle.material.color.setHSL(Math.random(), 1, 0.5);
    particle.position.add(particle.velocity);

    //  add some decay to the velocity to simulate drag
    particle.velocity.multiplyScalar(0.99);

    //  remove the particle from the scene and the burstParticles list when it's too far away
    if (particle.position.length() > 100) {
      scene.remove(particle);
      burstParticles.splice(i, 1);
      i--; // Make sure we don't skip a particle because of the removal
    }
  }
}
async function createTextStart(scene) {
  const loader = new FontLoader();

  try {
    const font = await new Promise((resolve, reject) => {
      loader.load(
        "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
        resolve,
        undefined,
        reject
      );
    });

    const textGeometry = new TextGeometry("CLICK The BOX !", {
      font: font,
      size: 7,
      height: 3,
      curveSegments: 40,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 1,
      bevelOffset: 0,
      bevelSegments: 5,
    });

    const textMaterial = new THREE.MeshBasicMaterial();

    const text = new THREE.Mesh(textGeometry, textMaterial);

    text.position.set(-35, -45, -100);
    text.visible = true;

    scene.add(text);
  } catch (error) {
    console.error("Error loading font:", error);
  }
}

function clickMe(scene) {
  createTextStart(scene);
}

// Function to animate the cube
function animateCube(elapsedTime) {
  // make the cube scale up and down smoothly
  cube.scale.set(
    6 + 1 * Math.sin(elapsedTime),
    6 + 1 * Math.sin(elapsedTime),
    6 + 1 * Math.sin(elapsedTime)
  );
}

function updateStarParticles(elapsedTime) {
  // make the star particles breath in and out smoothly
  starParticles.scale.set(
    1 + 0.5 * Math.sin(elapsedTime),
    1 + 0.5 * Math.sin(elapsedTime),
    1 + 0.5 * Math.sin(elapsedTime)
  );
}

// restet the scene when the animation is turned off
function resetScene() {
  // Reset animation state
  animationOn = false;

  // Reset cube scale
  cube.scale.set(1, 1, 1);

  // Reset particle positions
  const positions = particleGeometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i] = 0;
    positions[i + 1] = 0;
    positions[i + 2] = 0;
  }
  particleGeometry.attributes.position.needsUpdate = true;

  // Remove burst particles
  for (let i = 0; i < burstParticles.length; i++) {
    scene.remove(burstParticles[i]);
  }
  burstParticles = [];

  // Hide text meshes
  for (let i = 0; i < textMeshes.length; i++) {
    textMeshes[i].visible = false;
  }

  // Reset text index
  currentIndex = 0;
  subIndex = 0;
}

// Create a function to animate the cube and particles
function animate() {
  requestAnimationFrame(animate);

  // // Update the controls
  // controls.update();

  // Get the elapsed time
  const elapsedTime = clock.getElapsedTime();

  // Change the text every 2 seconds
  if (textClock.getElapsedTime() > 1.3) {
    textClock.start(); // Reset the clock
    textMeshes[currentIndex * 4 + subIndex].visible = false; // Hide the current text
    subIndex = (subIndex + 1) % 4;
    if (subIndex === 0) {
      currentIndex = (currentIndex + 1) % (textMeshes.length / 4);
    }
    const activeText = textMeshes[currentIndex * 4 + subIndex];
    activeText.visible = true; // Show the next text

    // Update the text position to match the cube's position and offset it by the cube's height
    const cubeHeight =
      cube.geometry.boundingBox.max.y - cube.geometry.boundingBox.min.y;
    const offset = cubeHeight + 20; // Adjust this value to increase or decrease the distance between the cube and the text
    activeText.position.x = cube.position.x;
    activeText.position.y = cube.position.y + offset;
    activeText.position.z = cube.position.z;
  }

  if (animationOn) {
    // Update the position of each particle and each burst particle

    updateParticles(elapsedTime);
    updateBurstParticles(elapsedTime);
    updateStarParticles(elapsedTime);
    particles.visible = true;
    // Animate the cube
    // animateCube(elapsedTime);
  } else {
    // hide the particles when the animation is off and the partilcle burst when the animation is off
    resetScene();
  }

  // Render the scene
  renderer.render(scene, camera);
}

// Define the corners of the square
corners = [
  new THREE.Vector3(-1, -1, 0),
  new THREE.Vector3(1, -1, 0),
  new THREE.Vector3(1, 1, 0),
  new THREE.Vector3(-1, 1, 0),
];

// every 4 sec change the color of the particle in cubeandparticles
setInterval(() => {
  particles.material.color.setHSL(Math.random(), 1, 0.5);
}, 5200);

// Initialize the clock
clock = new THREE.Clock();
textClock = new THREE.Clock();

// Call the setup function to initialize the scene, camera, renderer, and controls
setup();

// Call the function to create the cube and particles
createCubeAndParticles();

createText();

clickMe(scene);

// Call the animate function to start the animation
animate();
