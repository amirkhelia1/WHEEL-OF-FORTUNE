const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');

const overlay = document.getElementById('overlay');
const modal = document.getElementById('resultModal');
const modalTitle = document.getElementById('modalTitle');
const modalResult = document.getElementById('modalResult');
const closeBtn = document.getElementById('closeBtn');

// 33 segments data
const segmentData = [
  { label: "Next Time", type: "loss", value: 0 },
  { label: "10% sur les accessoires", type: "win", value: 10 },
  { label: "Coque Air pods 1/2", type: "win", value: "gift", prize: "Coque Air pods 1/2" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "25dt Bon D'Achat", type: "win", value: 25, isVoucher: true },
  { label: "Stickers", type: "win", value: "gift", prize: "Stickers" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "20% sur les accessoires", type: "win", value: 20 },
  { label: "lens Gratuit (iP 11/12/13)", type: "win", value: "gift", prize: "lens Gratuit (iP 11/12/13)" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "Souris", type: "win", value: "gift", prize: "Souris" },
  { label: "Etuit manette Ps4/PS5", type: "win", value: "gift", prize: "Etuit manette Ps4/PS5" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "2eme Achat Gratuit (le moin cher)", type: "win", value: "bogo", prize: "2eme Achat Gratuit" },
  { label: "Stickers", type: "win", value: "gift", prize: "Stickers" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "20DT Bon D'Achat", type: "win", value: 20, isVoucher: true },
  { label: "Protection Camera (iP 11/ 12/ 13)", type: "win", value: "gift", prize: "Protection Camera" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "30% sur les accessoires", type: "win", value: 30 },
  { label: "Coque Air pods 1/2", type: "win", value: "gift", prize: "Coque Air pods 1/2" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "Coque Karl (iP 11 / 12 /13 /14)", type: "win", value: "gift", prize: "Coque Karl" },
  { label: "Stickers", type: "win", value: "gift", prize: "Stickers" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "Power Bank", type: "win", value: "gift", prize: "Power Bank" },
  { label: "Film de Protection (iP 11/12/13)", type: "win", value: "gift", prize: "Film de Protection" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "Etuit Space", type: "win", value: "gift", prize: "Etuit Space" },
  { label: "stickers", type: "win", value: "gift", prize: "stickers" },
  { label: "Next Time", type: "loss", value: 0 },
  { label: "écouteur Inkax TO2 D", type: "win", value: "gift", prize: "écouteur Inkax TO2 D" },
  { label: "lens Gratuit (iP 11/12/13)", type: "win", value: "gift", prize: "lens Gratuit" }
];

let currentRotation = 0;
let spinning = false;

function pickOutcome() {
  const mainRoll = Math.random();
  
  // 40% chance of "Next Time" (loss)
  if (mainRoll < 0.40) return { type: "loss", label: "Next Time", value: 0 };

  // 60% chance of winning something
  const prizeRoll = Math.random() * 100;
  
  // Percentage discounts (30% of wins)
  if (prizeRoll < 15) return segmentData[1];  // 10%
  if (prizeRoll < 25) return segmentData[7];  // 20%
  if (prizeRoll < 30) return segmentData[19]; // 30%
  
  // Vouchers (15% of wins)
  if (prizeRoll < 37.5) return segmentData[16]; // 20DT
  if (prizeRoll < 45) return segmentData[4];    // 25DT
  
  // Special offer (10% of wins)
  if (prizeRoll < 55) return segmentData[13]; // BOGO
  
  // Free gifts (45% of wins)
  const giftIndexes = [2, 5, 8, 10, 11, 14, 17, 20, 22, 23, 25, 26, 28, 29, 31, 32];
  const randomGift = giftIndexes[Math.floor(Math.random() * giftIndexes.length)];
  return segmentData[randomGift];
}

function findTargetIndex(outcome) {
  const valid = [];
  segmentData.forEach((seg, idx) => {
    if (outcome.type === "loss" && seg.type === "loss") {
      valid.push(idx);
    } else if (outcome.type === "win" && seg.label === outcome.label) {
      valid.push(idx);
    }
  });
  return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : 0;
}

function spinToIndex(targetIndex) {
  const segmentAngle = 360 / 33;
  const randomOffset = (Math.random() * 6) - 3;
  const minSpin = 1800; // 5 full rotations
  
  const baseTarget = (targetIndex * segmentAngle) + (segmentAngle / 2) + randomOffset;
  const currentMod = currentRotation % 360;
  
  let distance = baseTarget - currentMod;
  if (distance < 0) distance += 360;

  const totalSpin = minSpin + distance;
  currentRotation += totalSpin;

  wheel.style.transform = `rotate(-${currentRotation}deg)`;
}

function formatResult(outcome) {
  if (outcome.type === "loss") return "Next Time";
  if (outcome.isVoucher) return `${outcome.value}DT Bon D'Achat`;
  if (outcome.value === "bogo") return "2eme Achat Gratuit";
  if (outcome.value === "gift") return outcome.prize;
  return `${outcome.value}% sur les accessoires`;
}

function openModal(title, resultText, color) {
  modalTitle.textContent = title;
  modalResult.textContent = resultText;
  modalResult.style.color = color;
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
  if (spinning) return;

  spinning = true;
  spinBtn.disabled = true;

  const outcome = pickOutcome();
  const targetIndex = findTargetIndex(outcome);
  spinToIndex(targetIndex);

  setTimeout(() => {
    if (outcome.type === "loss") {
      openModal("Result", "Good Luck Next Time!", "#c0392b");
    } else {
      openModal("Congratulations!", `You won: ${formatResult(outcome)}`, "#27ae60");
    }

    spinning = false;
    spinBtn.disabled = false;
  }, 4000);
});
