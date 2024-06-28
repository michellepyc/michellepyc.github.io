// Get the circle element
const cursorCircle = document.querySelector(".cursor-circle");

// Initialize cursor position and target position
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let targetX = cursorX;
let targetY = cursorY;

// Variables for detecting movement
let isMoving = false;
let moveTimeout;

// Function to update the position smoothly
function updatePosition() {
  cursorX += (targetX - cursorX) * 0.1; // Smooth follow effect
  cursorY += (targetY - cursorY) * 0.1;

  cursorCircle.style.left = cursorX + "px";
  cursorCircle.style.top = cursorY + "px";

  requestAnimationFrame(updatePosition);
}

// Function to handle mouse move event
function handleMouseMove(e) {
  targetX = e.clientX;
  targetY = e.clientY;
  cursorCircle.style.width = "100px"; // Larger size when moving
  cursorCircle.style.height = "100px"; // Larger size when moving
  cursorCircle.style.filter = "blur(90px)";

  cursorCircle.classList.add("moving");

  // Clear any existing timeout
  clearTimeout(moveTimeout);

  // Set a timeout to detect when the mouse stops moving
  moveTimeout = setTimeout(() => {
    cursorCircle.style.width = "50px"; // Smaller size when not moving
    cursorCircle.style.height = "50px"; // Smaller size when not moving
    cursorCircle.style.filter = "blur(30px)";
  }, 100); // Adjust the delay as needed
}

// Event listener to update target position
document.addEventListener("mousemove", handleMouseMove);

// Start the animation
updatePosition();
