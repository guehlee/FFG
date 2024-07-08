import * as THREE from "three";
import { CSS3DRenderer, CSS3DObject } from "jsm/renderers/CSS3DRenderer.js";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

// global variables
let renderer;
let scene;
let camera;
let controls;
let elements = [];
let shuffledIndices = [];
let currentIndex = 0;
let isAboutOpen = false; // Flag to check if the about section is open

//new list create

document.addEventListener("DOMContentLoaded", () => {
  const originalList = document.getElementById("original-list");
  const newList = document.getElementById("new-list");

  // Get all div elements inside the original list
  const quotes = originalList.querySelectorAll(".quote");

  // Loop through each quote and create a new structure
  quotes.forEach((quote, index) => {
    const newDiv = document.createElement("div");
    newDiv.id = `list-q${index + 1}`;
    newDiv.innerHTML = `
          <img src="/Asset/cursory.svg" width="10vw" height="10vw">
          <p>${quote.innerHTML}</p>
      `;
    newList.appendChild(newDiv);
  });
});

function init() {
  // create a scene, that will hold all our elements such as objects, cameras and lights.
  scene = new THREE.Scene();

  // create a camera, which defines where we're looking at.
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );

  // create a CSS3DRenderer
  renderer = new CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.top = 0;

  // add the output of the renderer to the html element
  document.body.appendChild(renderer.domElement);

  // create and configure the OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = true;
  controls.enableDamping = false;
  controls.dampingFactor = 0.03;
  // to disable zoom
  controls.enableZoom = false;

  let quoteElements = document.getElementsByClassName("quote");

  // Iterate through each element in the collection
  for (let i = 0; i < quoteElements.length; i++) {
    let cssElement = createCSS3DObject(quoteElements[i]);

    const x = Math.random() * 4000 - 2000;
    const y = Math.random() * 4000 - 2000;
    const z = Math.random() * 4000 - 2000;
    cssElement.position.set(x, y, z);

    const rx = Math.random() * 2 * Math.PI;
    const ry = Math.random() * 2 * Math.PI;
    const rz = Math.random() * 2 * Math.PI;
    cssElement.rotation.set(rx, ry, rz);

    scene.add(cssElement);
    elements.push(cssElement);

    quoteElements[i].addEventListener("pointerdown", function () {
      controls.enabled = false; // Disable controls temporarily

      if (currentIndex == i) {
        // Create and dispatch a new pointerup event to the document
        const pointerUpEvent = new PointerEvent("pointerup", {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 1,
          screenX: 0,
          screenY: 0,
          clientX: 0,
          clientY: 0,
          ctrlKey: false,
          altKey: false,
          shiftKey: false,
          metaKey: false,
          button: 0,
          relatedTarget: null,
        });
        document.dispatchEvent(pointerUpEvent);

        // Open the link in a new window
        window.open(quoteElements[i].querySelector("a").getAttribute("href"));
      } else {
        currentIndex = i;
        positionCameraToViewElement(elements[currentIndex]);
      }

      // Re-enable controls after a short delay to allow pointerup event to finish
      setTimeout(() => {
        controls.enabled = true;
      }, 500); // Adjust the delay as needed
    });
  }

  // Shuffle the elements indices
  shuffledIndices = shuffleArray([...Array(elements.length).keys()]);

  // Position the camera to view the first element
  positionCameraToViewElement(elements[currentIndex]);

  // Add scroll event listener
  window.addEventListener("wheel", throttle(onScroll, 1300));

  // Add click event listeners to the list items in the #list div
  for (let i = 1; i <= 70; i++) {
    let listItem = document.getElementById(`list-q${i}`);
    if (listItem) {
      listItem.addEventListener("click", function () {
        let qElement = document.getElementById(`q${i}`);
        if (qElement) {
          for (let j = 0; j < elements.length; j++) {
            if (elements[j].element === qElement) {
              currentIndex = j;
              positionCameraToViewElement(elements[currentIndex]);
              break;
            }
          }
        }
      });
    }
  }

  animate();
}

function createCSS3DObject(element) {
  let object = new CSS3DObject(element);
  return object;
}

function positionCameraToViewElement(element) {
  // Calculate the offset to position the camera at a certain distance from the element
  const offset = new THREE.Vector3(0, 0, 600);
  offset.applyQuaternion(element.quaternion);

  const targetPosition = new THREE.Vector3().copy(element.position).add(offset);
  const targetQuaternion = element.quaternion.clone();
  const targetUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
    element.quaternion
  );

  gsap.to(camera.position, {
    duration: 2,
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    onUpdate: function () {
      camera.lookAt(element.position);
      camera.up.copy(targetUp);
      controls.update();
    },
  });

  gsap.to(camera.quaternion, {
    duration: 2,
    x: targetQuaternion.x,
    y: targetQuaternion.y,
    z: targetQuaternion.z,
    w: targetQuaternion.w,
  });

  controls.target.copy(element.position);
}

function onScroll(event) {
  if (isAboutOpen) return; // If the about section is open, do nothing
  if (event.deltaY > 0) {
    // Scroll down
    currentIndex = (currentIndex + 1) % elements.length;
  } else {
    // Scroll up
    currentIndex = (currentIndex - 1 + elements.length) % elements.length;
  }
  positionCameraToViewElement(elements[shuffledIndices[currentIndex]]);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  render();
}

function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn.apply(this, args);
      lastTime = now;
    }
  };
}

function render() {
  renderer.render(scene, camera);
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* Here comes Menu open Function */

window.toggleSection = function (sectionId) {
  let aboutButton = document.getElementsByClassName("aboutbutton")[0];
  let howtoButton = document.getElementsByClassName("howtobutton")[0];
  let listButton = document.getElementsByClassName("listbutton")[0];
  let aboutDiv = document.getElementById("aboutb");
  let howtoDiv = document.getElementById("howto");
  let listDiv = document.getElementById("list");
  let textbookDiv = document.getElementsByClassName("textbook")[0];

  if (sectionId === "aboutb") {
    if (aboutDiv.classList.contains("visible")) {
      aboutDiv.classList.remove("visible");
      aboutButton.style.display = "flex";
      howtoButton.style.display = "flex"; // Show howtobutton when about section is closed
      textbookDiv.classList.remove("open");
      isAboutOpen = false; // Set to false when about section is closed
    } else {
      aboutDiv.classList.add("visible");
      aboutButton.style.display = "none";
      howtoDiv.classList.remove("visible");
      howtoButton.style.display = "none"; // Hide howtobutton when about section is open
      listDiv.classList.remove("visible");
      isAboutOpen = true; // Set to true when about section is open
    }
  } else if (sectionId === "howto") {
    if (howtoDiv.classList.contains("visible")) {
      howtoDiv.classList.remove("visible");
      howtoButton.style.display = "flex";
      aboutButton.style.display = "flex"; // Show aboutbutton when howto section is closed
      isAboutOpen = false; // Set to false when howto section is closed
    } else {
      howtoDiv.classList.add("visible");
      howtoButton.style.display = "none";
      aboutDiv.classList.remove("visible");
      aboutButton.style.display = "flex"; // Hide aboutbutton when howto section is open
      listDiv.classList.remove("visible");
      isAboutOpen = true; // Set to true when howto section is open
    }
  } else if (sectionId === "list") {
    if (listDiv.classList.contains("visible")) {
      listDiv.classList.remove("visible");
      listButton.style.display = "flex";
      isAboutOpen = false; // Set to false when list section is closed
    } else {
      listDiv.classList.add("visible");
      listButton.style.display = "none";
      aboutDiv.classList.remove("visible");
      aboutButton.style.display = "flex"; // Ensure aboutbutton is shown when list section is open
      howtoDiv.classList.remove("visible");
      howtoButton.style.display = "flex"; // Ensure howtobutton is shown when list section is open
      isAboutOpen = true; // Set to true when list section is open
    }
  }
};

window.toggleTextbook = function () {
  let textbookDiv = document.getElementsByClassName("textbook")[0];
  textbookDiv.classList.toggle("open");
};

// calls the init function when the window is done loading.
window.onload = init;
