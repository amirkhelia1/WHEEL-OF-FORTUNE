// No localStorage limit, no phone verification: unlimited rounds
// Each round: 3 spins, best discount kept, promo code generated at end of round. [web:24][web:35]

const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const statusLine = document.getElementById('statusLine');

const overlay = document.getElementById('overlay');
const modal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalResult = document.getElementById('modalResult');
const spinsLog = document.getElementById('spinsLog');
const codeContainer = document.getElementById('codeContainer');
const generatedCodeDisplay = document.getElementById('generatedCode');
const closeBtn = document.getElementById('closeBtn');

const segmentData = [
  { label: "2%", type: "win",  value: 2 },
  { label: "GL", type: "loss", value: 0 },
  { label: "4%", type: "win",  value: 4 },
  { label: "GL", type: "loss", value: 0 },
  { label: "6%", type: "win",  value: 6 },
  { label: "GL", type: "loss", value: 0 },
  { label: "8%", type: "win",  value: 8 },
  { label: "GL", type: "loss", value: 0 },
  { label: "10%", type: "win", value: 10 },
  { label: "GL", type: "loss", value: 0 }
];

let currentRotation = 0;
let spinning = false;

// Round state in memory only (no localStorage limit)
let spinsUsed = 0;
let results = [];
let bestValue = 0;
let bestLabel = "GL";
let promoCode = null;

function resetRound() {
  spinsUsed = 0;
  results = [];
  bestValue = 0;
  bestLabel = "GL";
  promoCode = null;
  codeContainer.style.display = "none";
  generatedCodeDisplay.textContent = "";
  updateUI();
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function updateUI() {
  spinBtn.disabled = spinning;
  spinBtn.textContent = `SPIN (${Math.min(spinsUsed, 3)}/3)`;

  statusLine.style.display = "block";
  if (spinsUsed >= 3) {
    statusLine.textContent = `Round finished. Best result: ${bestValue}% — click SPIN to start a new round.`;
  } else {
    statusLine.textContent = `You have ${3 - spinsUsed} spins left this round. Best so far: ${bestValue}%`;
  }
}

function pickOutcome() {
  const mainRoll = Math.random();
  if (mainRoll < 0.50) return { type: "loss", label: "GL", value: 0 };

  const prizeRoll = Math.random() * 100;
  if (prizeRoll < 30) return { type: "win", label: "2%", value: 2 };
  if (prizeRoll < 55) return { type: "win", label: "4%", value: 4 };
  if (prizeRoll < 75) return { type: "win", label: "6%", value: 6 };
  if (prizeRoll < 90) return { type: "win", label: "8%", value: 8 };
  return { type: "win", label: "10%", value: 10 };
}

function findTargetIndex(outcome) {
  const valid = [];
  segmentData.forEach((seg, idx) => {
    if (outcome.type === "loss" && seg.type === "loss") valid.push(idx);
    if (outcome.type === "win" && seg.type === "win" && seg.label === outcome.label) valid.push(idx);
  });
  return valid[Math.floor(Math.random() * valid.length)];
}

function spinToIndex(targetIndex) {
  const randomOffset = Math.floor(Math.random() * 20) - 10;
  const minSpin = 1800;
  const baseTarget = (targetIndex * 36) + 18 + randomOffset;

  const currentMod = currentRotation % 360;

  let distance = baseTarget - currentMod;
  if (distance < 0) distance += 360;

  const totalSpin = minSpin + distance;
  currentRotation += totalSpin;

  wheel.style.transform = `rotate(-${currentRotation}deg)`;
}

function openModal(title, resultText, okColor) {
  modalTitle.textContent = title;
  modalResult.textContent = resultText;
  modalResult.style.color = okColor;
  overlay.style.display = "block";
  modal.style.display = "block";
}

function closeModal() {
  overlay.style.display = "none";
  modal.style.display = "none";
}

closeBtn.addEventListener("click", closeModal);
overlay.addEventListener("click", closeModal);

spinBtn.addEventListener("click", () => {
  // If previous round finished, starting a new round.
  if (spinsUsed >= 3 && !spinning) {
    resetRound();
  }

  if (spinning) return;
  spinning = true;
  updateUI();

  const outcome = pickOutcome();
  const targetIndex = findTargetIndex(outcome);
  spinToIndex(targetIndex);

  setTimeout(() => {
    spinsUsed += 1;

    results.push({ label: outcome.label, value: outcome.value });

    if (outcome.value > bestValue) {
      bestValue = outcome.value;
      bestLabel = outcome.label;
    }

    if (spinsUsed >= 3 && !promoCode) {
      promoCode = generateCode();
    }

    spinsLog.textContent = results
      .map((r, i) => `Spin ${i+1}: ${r.label === "GL" ? "GL" : r.label + " OFF"}`)
      .join(" | ");

    if (spinsUsed < 3) {
      codeContainer.style.display = "none";
      generatedCodeDisplay.textContent = "";
      if (outcome.value === 0) {
        openModal("Spin Result", "Good Luck Next Time", "#c0392b");
      } else {
        openModal("Spin Result", `You won ${outcome.label} OFF`, "#27ae60");
      }
    } else {
      codeContainer.style.display = "block";
      generatedCodeDisplay.textContent = promoCode;

      if (bestValue === 0) {
        openModal("Final Result", "No discount this time (best of 3 = GL)", "#c0392b");
      } else {
        openModal("Final Result", `Best of 3: ${bestValue}% OFF`, "#27ae60");
      }
    }

    spinning = false;
    updateUI();
  }, 4000);
});

// Initial UI state
updateUI();
