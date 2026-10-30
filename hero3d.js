import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";

import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

// ==========================================
// 1. CONFIGURATION
// ==========================================

const MODEL_PATH = "./herosecmodel1OPTIMIZEDVERSION2.glb";

const PRESERVED_MESH_NAMES = new Set([
  "Geom3D_72",
  "Geom3D_191"
]);

const SOURCE_MATERIAL_NAME = "sofa";
const TARGET_MATERIAL_NAME = "3Seat";
const RUG_MATERIAL_NAME = "rug";
// const FLOOR_MATERIAL_NAME = "Dunstone _ Contract_ limestone stone effect ceramic - Ceramiche Keope";



// Edit these values to tune each material independently.
// color: "#dfe9ff" changes the material tint.
// emissiveIntensity: 0 means no self-glow; use small values such as 0.03–0.10.
const SOFA_SETTINGS = {
  // color: "#d6dfad", 
  metalness: 0.0,
  roughness: 0.85,
  envMapIntensity: 0.2,
//   emissiveColor: "#FF0000", yeh hai tone..... 
  emissiveIntensity: 0.05
};

const RUG_SETTINGS = {
metalness: 0.0,
  // color: "#ff0000",

roughness: 0.7,
envMapIntensity: 0.25,
emissiveIntensity: 0
};

const THREE_SEAT_SETTINGS = {
  color: "#B7B09E",
  metalness: 0.0,
  roughness: 0.85,
  envMapIntensity: 0.3,
//   emissiveColor: "#dfe9ff",
  emissiveIntensity: 0
};



// const FLOOR_SETTINGS = {
//   metalness: 0.0,
//   roughness: 0.04,
//   envMapIntensity: 2.5,
//   emissiveIntensity: 0
// };




// Selected mesh names to print for debugging.
const TARGET_MESH_NAMES = [
  "Geom3D_127",
  "Geom3D_128",
  "Geom3D_187",
  "Geom3D_188",
  "Geom3D_189",
  "Geom3D_191"
];

// ==========================================
// 2. DOM ELEMENTS
// ==========================================

const container = document.getElementById("canvas-container");
const loaderElement = document.getElementById("loader");
const progressElement = document.getElementById("loader-progress");
const percentageElement = document.getElementById("loader-percentage");
const statusElement = document.getElementById("model-status");
const errorElement = document.getElementById("error-message");

// ==========================================
// 3. SCENE
// ==========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x777777);




// ==========================================
// 4. CAMERA
// ==========================================

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.01,
  10000
);
camera.position.set(5, 4, 7);

// ==========================================
// 5. RENDERER
// ==========================================

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// ==========================================
// CUSTOM RUG IMAGE TEXTURE
// Put your image at: ./textures/rug-texture.jpg
// ==========================================
const textureLoader = new THREE.TextureLoader();
const rugTexture = textureLoader.load(
  "rug.png",
  () => console.log("CUSTOM RUG IMAGE TEXTURE LOADED"),
  undefined,
  (error) => console.error("RUG TEXTURE LOAD ERROR:", error)
);
rugTexture.center.set(0.5, 0.5);
rugTexture.rotation = THREE.MathUtils.degToRad(90);
rugTexture.colorSpace = THREE.SRGBColorSpace;
rugTexture.wrapS = THREE.RepeatWrapping;
rugTexture.wrapT = THREE.RepeatWrapping;
rugTexture.repeat.set(2, 2);
rugTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

RectAreaLightUniformsLib.init();

// ==========================================
// 6. ENVIRONMENT LIGHTING
// ==========================================

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const environmentScene = new RoomEnvironment();
const environmentTexture = pmremGenerator.fromScene(
  environmentScene,
  0.04
).texture;

scene.environment = environmentTexture;
pmremGenerator.dispose();

const ambientLight = new THREE.AmbientLight(0xFFFBE6,3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFCB3D, 50);

directionalLight.position.set(-3.5, 1, 1.9);
directionalLight.target.position.set(-3.2,-0.05,1);

directionalLight.castShadow = true;

directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;



directionalLight.shadow.bias = -0.0001;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.camera.near = 0.1;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.updateProjectionMatrix();

scene.add(directionalLight);
scene.add(directionalLight.target);

const directionallighthelper =
new THREE.DirectionalLightHelper(directionalLight, 0.2);

scene.add(directionallighthelper);

// const directionallighthelper = new THREE.DirectionalLightHelper(directionalLight,0.2);
// scene.add(directionallighthelper);

const pointlight  = new THREE.PointLight(0xFFF7EB,6,20);
pointlight.position.set(-2.6, 0.3, -1.2);
scene.add(pointlight);
// const pointlighthelper = new THREE.PointLightHelper(pointlight,1);
// scene.add(pointlighthelper);

const spoptlight = new THREE.SpotLight(
'#FFCB56',
40,
2,
Math.PI * 0.1,
1,
1
);


spoptlight.position.set(0.43, 1.4, -1.33);


spoptlight.target.position.set(0.5, -1.35, -1.33);

scene.add(spoptlight);
scene.add(spoptlight.target);


// const spotlighthelper = new THREE.SpotLightHelper(spoptlight);
// scene.add(spotlighthelper);



const directionalLightface = new THREE.DirectionalLight(0xFFCB3D, 10);

directionalLightface.position.set(-2.5, 2.5, 3.4);
directionalLightface.target.position.set(-2.5, 0, 2.2);

directionalLightface.castShadow = true;

directionalLightface.shadow.mapSize.width = 1048;
directionalLightface.shadow.mapSize.height = 1048;


directionalLightface.shadow.bias = -0.0001;
directionalLightface.shadow.camera.left = -20;
directionalLightface.shadow.camera.right = 20;
directionalLightface.shadow.camera.top = 20;
directionalLightface.shadow.camera.bottom = -20;
directionalLightface.shadow.camera.near = 0.1;
directionalLightface.shadow.camera.far = 100;
directionalLightface.shadow.camera.updateProjectionMatrix();

scene.add(directionalLightface);
scene.add(directionalLightface.target);
const directionalLightfacehelper = new THREE.DirectionalLightHelper(
directionalLightface
);

// scene.add(directionalLightfacehelper);


// ==========================================
// RECTANGULAR CEILING STRIP LIGHT
// ==========================================

const stripLight = new THREE.RectAreaLight(
0xFFD749,  // Color
30,        // Intensity
0.03,         // Width
4       // Height
);

stripLight.position.set(0.46, 0, -0.75);
stripLight.lookAt(0.44, 0, -0.75);

scene.add(stripLight);
const stripLight1 = new THREE.RectAreaLight(
0xFF9C4C,  // Color
2,        // Intensity
0.2,         // Width
5.4      // Height
);

stripLight1.position.set(0.3,1.76, -1.6);
// stripLight1.lookAt(-5, 0, -0.75);

scene.add(stripLight1);
const striplighthelper1 = new RectAreaLightHelper(stripLight1);

scene.add(striplighthelper1);
stripLight1.rotation.x = Math.PI / -2;
stripLight1.rotation.y = THREE.MathUtils.degToRad(-90);


const stripLight2 = new THREE.RectAreaLight(
0xFF9C4C,  // Color
2,        // Intensity
0.2,         // Width
5.7      // Height
);

stripLight2.position.set(-5.1,1.76, -1.6);
// stripLight1.lookAt(-5, 0, -0.75);

scene.add(stripLight2);
const striplighthelper2 = new RectAreaLightHelper(stripLight2);

scene.add(striplighthelper2);
stripLight2.rotation.x = Math.PI / -2;
stripLight2.rotation.y = THREE.MathUtils.degToRad(90);

const stripLight3 = new THREE.RectAreaLight(
0xFF9C4C,  // Color
2,        // Intensity
0.2,         // Width
5.7      // Height
);

stripLight3.position.set(-5.1,1.76, -1.6);
// stripLight1.lookAt(-5, 0, -0.75);

scene.add(stripLight3);
const striplighthelper3 = new RectAreaLightHelper(stripLight3);

scene.add(striplighthelper3);
stripLight3.rotation.x = Math.PI / -2;
stripLight3.rotation.y = THREE.MathUtils.degToRad(90);

// stripLight1.rotation.Y = Math.PI / 5;
// STRIP LIGHT HELPER

// ==========================================
// 8 WARM WHITE CEILING SPOTLIGHTS
// ==========================================

const ceilingLightColor = 0xFFF1D6; // Warm white

// // Ceiling Light 1
const ceilinglight1 = new THREE.SpotLight(
 ceilingLightColor, 2, 8, Math.PI * 0.26, 0.3, 0.2
);
ceilinglight1.position.set(-2.6, 1.7, -1.2);
ceilinglight1.target.position.set(-2.6, 0,-1.2);
scene.add(ceilinglight1, ceilinglight1.target);

const ceilinglight1helper = new THREE.SpotLightHelper(ceilinglight1);
//  scene.add(ceilinglight1helper);


// // Ceiling Light 2
// const ceilinglight2 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight2.position.set(0.43, 1.4, -0.8);
// ceilinglight2.target.position.set(0.5, -1.35, -0.8);
// scene.add(ceilinglight2, ceilinglight2.target);

// const ceilinglight2helper = new THREE.SpotLightHelper(ceilinglight2);
// scene.add(ceilinglight2helper);


// // Ceiling Light 3
// const ceilinglight3 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight3.position.set(0.43, 1.4, -0.25);
// ceilinglight3.target.position.set(0.5, -1.35, -0.25);
// scene.add(ceilinglight3, ceilinglight3.target);

// const ceilinglight3helper = new THREE.SpotLightHelper(ceilinglight3);
// scene.add(ceilinglight3helper);


// // Ceiling Light 4
// const ceilinglight4 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight4.position.set(0.43, 1.4, 0.3);
// ceilinglight4.target.position.set(0.5, -1.35, 0.3);
// scene.add(ceilinglight4, ceilinglight4.target);

// const ceilinglight4helper = new THREE.SpotLightHelper(ceilinglight4);
// scene.add(ceilinglight4helper);


// // Ceiling Light 5
// const ceilinglight5 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight5.position.set(-0.43, 1.4, -1.33);
// ceilinglight5.target.position.set(-0.5, -1.35, -1.33);
// scene.add(ceilinglight5, ceilinglight5.target);

// const ceilinglight5helper = new THREE.SpotLightHelper(ceilinglight5);
// scene.add(ceilinglight5helper);


// // Ceiling Light 6
// const ceilinglight6 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight6.position.set(-0.43, 1.4, -0.8);
// ceilinglight6.target.position.set(-0.5, -1.35, -0.8);
// scene.add(ceilinglight6, ceilinglight6.target);

// const ceilinglight6helper = new THREE.SpotLightHelper(ceilinglight6);
// scene.add(ceilinglight6helper);


// // Ceiling Light 7
// const ceilinglight7 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight7.position.set(-0.43, 1.4, -0.25);
// ceilinglight7.target.position.set(-0.5, -1.35, -0.25);
// scene.add(ceilinglight7, ceilinglight7.target);

// const ceilinglight7helper = new THREE.SpotLightHelper(ceilinglight7);
// scene.add(ceilinglight7helper);


// // Ceiling Light 8
// const ceilinglight8 = new THREE.SpotLight(
//     ceilingLightColor, 40, 2, Math.PI * 0.1, 1, 1
// );
// ceilinglight8.position.set(-0.43, 1.4, 0.3);
// ceilinglight8.target.position.set(-0.5, -1.35, 0.3);
// scene.add(ceilinglight8, ceilinglight8.target);

// const ceilinglight8helper = new THREE.SpotLightHelper(ceilinglight8);
// scene.add(ceilinglight8helper);



// ==========================================
// 7. ORBIT CONTROLS
// ==========================================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enableRotate = true;
controls.enableZoom = true;
controls.enablePan = true;
controls.autoRotate = false;
controls.minDistance = 0.1;
controls.maxDistance = 10000;
controls.target.set(0, 0, 0);
controls.update();

// ==========================================
// 8. ANIMATION MIXERS
// ==========================================

const mixers = [];
const clock = new THREE.Clock();

// ==========================================
// 9. HELPERS
// ==========================================

function showError(message) {
  loaderElement.classList.add("hidden");
  errorElement.style.display = "block";
  errorElement.textContent = message;
  statusElement.textContent = "MODEL ERROR";
  console.error(message);
}

function getMaterials(mesh) {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function applyMaterialSettings(material, settings) {
  if (!material) return;

  if (settings.color && material.color) {
    material.color.set(settings.color);
  }

  if ("metalness" in material) {
    material.metalness = settings.metalness;
  }

  if ("roughness" in material) {
    material.roughness = settings.roughness;
  }

  if ("envMapIntensity" in material) {
    material.envMapIntensity = settings.envMapIntensity;
  }

  if (material.emissive && settings.emissiveColor) {
    material.emissive.set(settings.emissiveColor);
    material.emissiveIntensity = settings.emissiveIntensity;
  }

  if ("clearcoat" in material) {
    material.clearcoat = 0;
  }

  if ("clearcoatRoughness" in material) {
    material.clearcoatRoughness = 1;
  }

  material.needsUpdate = true;
}

// ==========================================
// 10. LOAD GLB MODEL
// ==========================================

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();

dracoLoader.setDecoderPath(
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/"
);
loader.setDRACOLoader(dracoLoader);

loader.load(
  MODEL_PATH,

(gltf) => {
    const model = gltf.scene;

    // ==========================================
    // WINDOW GLASS + FRAME SHADOW SETUP
    // ==========================================
    // Important: Three.js shadow casting is per mesh, not per material.
    // This works independently when glass and frame are separate meshes.

    const glassMaterialNames = new Set(["glass_basic_1"]);
    const frameMaterialNames = new Set(["color_009"]);
    const glassMeshes = [];
    const frameMeshes = [];

    model.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;

      const materials = getMaterials(child).filter(Boolean);
      const normalizedNames = materials.map((mat) =>
        (mat.name || "").trim().toLowerCase()
      );
      const hasGlass = normalizedNames.some((name) => glassMaterialNames.has(name));
      const hasFrame = normalizedNames.some((name) => frameMaterialNames.has(name));

      // Make the named glass visually transparent and stop it casting an
      // opaque shadow. The glass material itself is not replaced.
      if (hasGlass) {
        glassMeshes.push(child);

        materials.forEach((material) => {
          if ((material.name || "").trim().toLowerCase() !== "glass_basic_1") return;

          material.transparent = true;
          material.opacity = 0.18;
          material.depthWrite = false;
          if ("roughness" in material) material.roughness = 0.12;
          if ("metalness" in material) material.metalness = 0;
          material.needsUpdate = true;
        });

        if (hasFrame) {
          // One mesh contains both glass and frame materials. Since
          // castShadow is mesh-level, keep shadows enabled for the frame
          // rather than accidentally disabling the whole frame's shadow.
          child.castShadow = true;
          console.warn(
            "GLASS + FRAME share one mesh; separate their geometry in Blender/SketchUp for independent shadows:",
            child.name,
            materials.map((mat) => mat.name)
          );
        } else {
          child.castShadow = false;
        }

        console.log("WINDOW GLASS FOUND:", child.name, materials.map((mat) => mat.name));
      }

      if (hasFrame) {
        frameMeshes.push(child);
        child.castShadow = true;
        console.log("WINDOW FRAME FOUND:", child.name, materials.map((mat) => mat.name));
      }
    });

    console.log("Glass meshes:", glassMeshes.length, glassMeshes.map((mesh) => mesh.name));
    console.log("Frame meshes:", frameMeshes.length, frameMeshes.map((mesh) => mesh.name));

    // Print selected mesh names and material names.
    console.log("========== SELECTED MESH MATERIALS ==========");
    model.traverse((child) => {
      if (!child.isMesh || !TARGET_MESH_NAMES.includes(child.name)) return;

      console.log("Mesh Name:", child.name);
      console.log(
        "Material Names:",
        getMaterials(child).map((mat) => mat?.name || "Unnamed")
      );
      console.log("Mesh Object:", child);
      console.log("----------------------------------");
    });
    console.log("========== END SELECTED MESH MATERIALS ==========");

    // STEP A: find the original 3Seat material.
    let threeSeatMaterial = null;

    model.traverse((child) => {
      if (!child.isMesh) return;

      for (const mat of getMaterials(child)) {
        if (
          mat?.name?.trim().toLowerCase() ===
          TARGET_MATERIAL_NAME.toLowerCase()
        ) {
          threeSeatMaterial = mat;
          break;
        }
      }
    });
    // FLOOR MESH IDENTIFICATION
const FLOOR_MESH_NAME = "Geom3D_130";

model.traverse((child) => {
if (child.isMesh && child.name === FLOOR_MESH_NAME) {
console.log("FLOOR FOUND:", child.name);

child.material = Array.isArray(child.material)
  ? child.material.map((mat) => mat.clone())
  : child.material.clone();

const materials = Array.isArray(child.material)
  ? child.material
  : [child.material];

materials.forEach((mat) => {
  mat.metalness = 0.0;
  mat.roughness = 0.1;
  mat.envMapIntensity = 0.01;
  mat.needsUpdate = true;
});
}
});

    // STEP B: edit the original materials by material name.
    // Use a Set so a shared material is edited only once.
    const editedMaterials = new Set();

    model.traverse((child) => {
      if (!child.isMesh) return;

      getMaterials(child).forEach((mat) => {
        if (!mat || editedMaterials.has(mat)) return;

        const materialName = mat.name?.trim().toLowerCase();

        if (materialName === SOURCE_MATERIAL_NAME.toLowerCase()) {
          applyMaterialSettings(mat, SOFA_SETTINGS);
          editedMaterials.add(mat);
          console.log('SOFA material settings applied:', mat.name);
        }

        if (materialName === TARGET_MATERIAL_NAME.toLowerCase()) {
          applyMaterialSettings(mat, THREE_SEAT_SETTINGS);
          editedMaterials.add(mat);
          console.log('3Seat material settings applied:', mat.name);
        }
       
if (materialName === RUG_MATERIAL_NAME.toLowerCase()) {
applyMaterialSettings(mat, RUG_SETTINGS);

// Keep the existing GLB rug material and assign the custom image to it.
// The rug mesh must have UV coordinates for the image to display correctly.
if (child.geometry?.attributes?.uv) {
mat.map = rugTexture;
if (mat.color) mat.color.set(0xffffff); // prevents the old tint from darkening the image
mat.roughness = 0.85;
mat.metalness = 0.0;
mat.needsUpdate = true;
console.log("CUSTOM RUG TEXTURE ASSIGNED:", mat.name, "on mesh:", child.name);
} else {
console.warn("RUG MESH HAS NO UV COORDINATES; texture cannot map correctly:", child.name);
}

editedMaterials.add(mat);
console.log("RUG material settings applied:", mat.name);
}

// if (materialName === FLOOR_MATERIAL_NAME.toLowerCase()) {
//   applyMaterialSettings(mat, FLOOR_SETTINGS);
//   editedMaterials.add(mat);


// }



      });
    });

    // STEP C: replace "sofa" with "3Seat" except on preserved meshes.
    let replacedCount = 0;

    if (threeSeatMaterial) {
      model.traverse((child) => {
        if (!child.isMesh) return;

        if (PRESERVED_MESH_NAMES.has(child.name)) {
          console.log("Original material preserved:", child.name);
          return;
        }

        const replaceMaterial = (mat) => {
          if (
            mat?.name?.trim().toLowerCase() ===
            SOURCE_MATERIAL_NAME.toLowerCase()
          ) {
            replacedCount++;
            console.log('Replacing "sofa" material on:', child.name);
            return threeSeatMaterial;
          }
          return mat;
        };

        child.material = Array.isArray(child.material)
          ? child.material.map(replaceMaterial)
          : replaceMaterial(child.material);
      });

      console.log('"3Seat" material applied. Replacements:', replacedCount);
    } else {
      console.warn('Material "3Seat" was not found in the GLB.');
    }

    // STEP D: add model to scene.
    scene.add(model);

    // STEP E: center model.
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    model.position.x -= center.x;
    model.position.y -= center.y;
    model.position.z -= center.z;

    const centeredBox = new THREE.Box3().setFromObject(model);
    const size = centeredBox.getSize(new THREE.Vector3());
    const centeredSize = Math.max(size.x, size.y, size.z);

    // STEP F: fit camera to model.
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov = 2 * Math.atan(
      Math.tan(verticalFov / 2) * camera.aspect
    );

    const distanceForHeight = (size.y / 2) / Math.tan(verticalFov / 2);
    const distanceForWidth = (size.x / 2) / Math.tan(horizontalFov / 2);
    const cameraDistance = Math.max(
      distanceForHeight,
      distanceForWidth,
      centeredSize * 0.5
    ) * 1.5;

    camera.position.set(
      cameraDistance * 0.75,
      cameraDistance * 0.45,
      cameraDistance
    );

    camera.near = Math.max(0.01, centeredSize / 10000);
    camera.far = Math.max(10000, centeredSize * 100);
    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);
    controls.minDistance = Math.max(0.01, centeredSize * 0.1);
    controls.maxDistance = centeredSize * 10;
    controls.update();

    // STEP G: play embedded model animations, if any.
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
      mixers.push(mixer);
      console.log("Animations found:", gltf.animations.length);
    } else {
      console.log("No embedded animations found in this GLB.");
    }

    // STEP H: print model information.

console.log("========== FLOOR MESH SEARCH ==========");

model.traverse((child) => {
if (!child.isMesh) return;

const materials = Array.isArray(child.material)
? child.material
: [child.material];

console.log(
"MESH:", child.name,
"| MATERIALS:", materials.map((mat) => mat?.name)
);
});

console.log("========== END FLOOR SEARCH ==========");


    let meshCount = 0;
    const materialNames = new Set();

    model.traverse((child) => {
      if (!child.isMesh) return;
      meshCount++;

      getMaterials(child).forEach((mat) => {
        if (mat?.name) materialNames.add(mat.name);
      });
    });

    console.log("Total meshes:", meshCount);
    console.log("Materials in model:", [...materialNames]);

    // STEP I: hide loading screen.
    progressElement.style.width = "100%";
    percentageElement.textContent = "100%";
    statusElement.textContent = "MODEL LOADED";
    loaderElement.classList.add("hidden");
    console.log("GLB model loaded successfully.");
  },

  (xhr) => {
    if (xhr.total > 0) {
      const progress = (xhr.loaded / xhr.total) * 100;
      progressElement.style.width = progress + "%";
      percentageElement.textContent = Math.round(progress) + "%";
    }
  },

  (error) => {
    showError(
      "Could not load " + MODEL_PATH +
      ". Check that the file exists and that the page is running through a local server. Open the browser console for details."
    );
    console.error("GLB loading error:", error);
  }
);

// ==========================================
// 11. RESPONSIVE RESIZE
// ==========================================

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// ==========================================
// 12. ANIMATION LOOP
// ==========================================

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  mixers.forEach((mixer) => mixer.update(delta));
  controls.update();
  renderer.render(scene, camera);
}

animate();

// ==========================================
// 13. CLEANUP
// ==========================================

window.addEventListener("beforeunload", () => {
  controls.dispose();
  dracoLoader.dispose();
  renderer.dispose();
  environmentTexture.dispose();
});