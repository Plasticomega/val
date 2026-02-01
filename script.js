
// ===== elements =====
const neko = document.getElementById("neko");
const noBtn = document.querySelector(".no-btn");

// ===== sprite sheet =====
const TILE = 32;
const T = (c, r) => [c - 1, r - 1];

const SPRITES = {
	sit: T(4, 4),
	yawn: T(4, 3),

	walkU: [T(2, 4), T(2, 3)],
	walkD: [T(8, 3), T(7, 4)],

	scratchBottom: [T(7, 3), T(8, 2)],
	scratch: [T(3, 3), T(3, 4)],
	scratchSelf: [T(6, 1), T(7, 1)]

};

// ===== state =====
let mode = "idle";
// idle | goButton | scratch | return

let x = 0, y = 0;
let homeX = 0, homeY = 0;
let tx = 0, ty = 0;

const speed = 2.2;
const STOP_DIST = 18;

let walkFrame = 0;
let lastWalkTime = 0;
let scratchFrame = 0;
let lastScratchTime = 0;

let idleMode = "sit";     // sit | yawn | scratch | scratchSelf
let idleUntil = 0;
let nextIdleChange = performance.now() + 2000;
let idleFrame = 0;
let lastIdleTime = 0;


function animateIdle(ts) {

	// choose new idle action
	if (ts > nextIdleChange && ts > idleUntil) {

		const choices = ["yawn", "scratch", "scratchSelf"];
		idleMode = choices[Math.floor(Math.random() * choices.length)];

		if (idleMode === "yawn") idleUntil = ts + 2000;
		if (idleMode === "scratch") idleUntil = ts + 2500;
		if (idleMode === "scratchSelf") idleUntil = ts + 2000;

		nextIdleChange = ts + 6000;
		idleFrame = 0;
		lastIdleTime = 0;
	}

	// revert to sit
	if (ts > idleUntil) idleMode = "sit";

	// animate two-frame idles
	if (ts - lastIdleTime > 220) {
		idleFrame = (idleFrame + 1) % 2;
		lastIdleTime = ts;
	}

	if (idleMode === "sit")
		setSprite(SPRITES.sit);

	if (idleMode === "yawn")
		setSprite(SPRITES.yawn);

	if (idleMode === "scratch")
		setSprite(SPRITES.scratch[idleFrame]);

	if (idleMode === "scratchSelf")
		setSprite(SPRITES.scratchSelf[idleFrame]);
}

// ===== helpers =====
function setSprite([c, r]) {
	neko.style.backgroundPosition =
		`-${c * TILE}px -${r * TILE}px`;
}

function setPos(nx, ny) {
	x = nx; y = ny;
	neko.style.transform =
		`translate(${x}px, ${y}px) scale(4)`;
}

function animateWalk(dir, ts) {
	if (ts - lastWalkTime > 160) {
		walkFrame = (walkFrame + 1) % 2;
		lastWalkTime = ts;
	}
	setSprite(SPRITES[dir][walkFrame]);
}

function animateScratch(ts) {
	if (ts - lastScratchTime > 180) {
		scratchFrame = (scratchFrame + 1) % 2;
		lastScratchTime = ts;
	}
	setSprite(SPRITES.scratchBottom[scratchFrame]);
}

// ===== movement =====
function moveToward() {
	const dx = tx - x;
	const dy = ty - y;
	const d = Math.hypot(dx, dy);

	if (d < STOP_DIST) return true;

	setPos(
		x + (dx / d) * speed,
		y + (dy / d) * speed
	);

	if (Math.abs(dy) > Math.abs(dx)) {
		if (dy > 0) animateWalk("walkD", performance.now());
		else animateWalk("walkU", performance.now());
	}
	return false;
}

// ===== main loop =====
function tick(ts) {

	if (mode === "idle") {
		animateIdle(ts)
	}

	if (mode === "goButton") {
		if (moveToward()) {
			mode = "scratch";
			setTimeout(() => {
				noBtn.classList.add("destroyed");
				tx = homeX;
				ty = homeY;
				mode = "return";
			}, 1200);
		}
	}

	if (mode === "scratch") {
		animateScratch(ts);
	}

	if (mode === "return") {
		if (moveToward()) {
			mode = "idle";
		}
	}

	requestAnimationFrame(tick);
}

// ===== trigger =====
noBtn.addEventListener("click", () => {
	if (mode !== "idle") return;


	const r = noBtn.getBoundingClientRect();

	// center of button
	const bx = r.left + r.width / 2;
	const by = r.top + r.height / 2;

	// convert viewport → centered transform space
	tx = bx - window.innerWidth / 2;
	ty = by - window.innerHeight / 2 - 40; // paws above button
	mode = "goButton";
});


const container = document.querySelector(".neko-container");
const cr = container.getBoundingClientRect();

homeX = cr.left + cr.width / 2 - window.innerWidth / 2;
homeY = cr.top + cr.height / 2 - window.innerHeight / 2;

setPos(homeX, homeY);
requestAnimationFrame(tick);
