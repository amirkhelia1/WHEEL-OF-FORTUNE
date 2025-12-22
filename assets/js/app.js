localStorage.removeItem("wheelState");

const VERIFY_URL = "";

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

const phoneGate = document.getElementById('phoneGate');
const phoneInput = document.getElementById('phoneInput');
const activateBtn = document.getElementById('activateBtn');
const phoneError = document.getElementById('phoneError');

// 33 segments data matching your HTML
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

function getState() {
  try { return JSON.parse(localStorage.getItem("wheelState") || "{}"); }
  catch { return {}; }
}

function setState(obj) {
  localStorage.setItem("wheelState", JSON.stringify(obj));
}

function normalizeTNPhone(value) {
  let p = (value || "").trim().replace(/\s+/g, '');
  if (/^\d{8}$/.test(p)) return "+216" + p;
  if (/^\+216\d{8}$/.test(p)) return p;
  return null;
}

function generateCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

function updateUI() {
  const st = getState();
  const activated = st.activated === true;
  const spinsUsed = Number(st.spinsUsed || 0);
  const bestResult = st.bestResult || "Next Time";

  phoneGate.style.display = activated ? "none" : "block";

  spinBtn.disabled = !activated || spinsUsed >= 3 || spinning;
  spinBtn.textContent = `SPIN (${Math.min(spinsUsed, 3)}/3)`;

  statusLine.style.display = activated ? "block" : "none";
  if (activated) {
    statusLine.textContent = spinsUsed >= 3
      ? `Done. Best result: ${bestResult}`
      : `You have ${3 - spinsUsed} spins left. Best so far: ${bestResult}`;
  }
}

async function verifyPhoneNotUsed(phoneE164) {
  if (!VERIFY_URL) return { ok: true, alreadyUsed: false, message: "" };

  const res = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: phoneE164 })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, alreadyUsed: true, message: data.message || "Verification failed." };
  return { ok: !!data.ok, alreadyUsed: !!data.alreadyUsed, message: data.message || "" };
}

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
  
  // Free gifts (45% of wins) - randomly select from gift items
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
  const segmentAngle = 360 / 33; // 10.909 degrees per segment
  const randomOffset = (Math.random() * 6) - 3; // Small random offset
  const minSpin = 1800; // 5 full rotations
  
  const baseTarget = (targetIndex * segmentAngle) + (segmentAngle / 2) + randomOffset;
  const currentMod = currentRotation % 360;
  
  let distance = baseTarget - currentMod;
  if (distance < 0) distance += 360;

  const totalSpin = minSpin + distance;
  currentRotation += totalSpin;

  wheel.style.transform = `rotate(-${currentRotation}deg)`;
}

function rankResult(outcome) {
  if (outcome.type === "loss") return 0;
  if (outcome.value === "bogo") return 100;
  if (outcome.isVoucher) return outcome.value + 50;
  if (typeof outcome.value === "number") return outcome.value;
  return 5; // gifts
}

function getBestResult(results) {
  let best = results[0];
  let bestRank = rankResult(best);
  
  results.forEach(r => {
    const rank = rankResult(r);
    if (rank > bestRank) {
      best = r;
      bestRank = rank;
    }
  });
  
  return best;
}

function formatResult(outcome) {
  if (outcome.type === "loss") return "Next Time";
  if (outcome.isVoucher) return `${outcome.value}DT Bon D'Achat`;
  if (outcome.value === "bogo") return "2eme Achat Gratuit";
  if (outcome.value === "gift") return outcome.prize;
  return `${outcome.value}% sur les accessoires`;
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

activateBtn.addEventListener("click", async () => {
  phoneError.style.display = "none";
  phoneError.textContent = "";

  if (!phoneInput.checkValidity()) {
    phoneError.style.display = "block";
    phoneError.textContent = "Tunisian number only (8 digits or +216 + 8 digits).";
    phoneInput.focus();
    return;
  }

  const phoneE164 = normalizeTNPhone(phoneInput.value);
  if (!phoneE164) {
    phoneError.style.display = "block";
    phoneError.textContent = "Tunisian number only (8 digits or +216 + 8 digits).";
    phoneInput.focus();
    return;
  }

  activateBtn.disabled = true;
  activateBtn.textContent = "Checking...";

  try {
    const v = await verifyPhoneNotUsed(phoneE164);
    if (!v.ok || v.alreadyUsed) {
      phoneError.style.display = "block";
      phoneError.textContent = v.message || "This phone number is already used.";
      activateBtn.disabled = false;
      activateBtn.textContent = "Activate";
      return;
    }

    setState({
      activated: true,
      phone: phoneE164,
      spinsUsed: 0,
      results: [],
      bestResult: "Next Time",
      promoCode: null
    });

    activateBtn.disabled = false;
    activateBtn.textContent = "Activate";
    updateUI();
  } catch (e) {
    phoneError.style.display = "block";
    phoneError.textContent = "Verification error. Try again.";
    activateBtn.disabled = false;
    activateBtn.textContent = "Activate";
  }
});

spinBtn.addEventListener("click", () => {
  if (spinning) return;

  const st = getState();
  if (!st.activated) return;
  if ((st.spinsUsed || 0) >= 3) return;

  spinning = true;
  updateUI();

  const outcome = pickOutcome();
  const targetIndex = findTargetIndex(outcome);
  spinToIndex(targetIndex);

  setTimeout(() => {
    const st2 = getState();
    const spinsUsed = Number(st2.spinsUsed || 0) + 1;

    const results = Array.isArray(st2.results) ? st2.results.slice() : [];
    results.push(outcome);

    const bestOutcome = getBestResult(results);
    const bestResult = formatResult(bestOutcome);

    let promoCode = st2.promoCode || null;
    if (spinsUsed >= 3) promoCode = generateCode();

    setState({ ...st2, spinsUsed, results, bestResult, bestOutcome, promoCode });

    spinsLog.textContent = results
      .map((r, i) => `Spin ${i+1}: ${formatResult(r)}`)
      .join(" | ");

    if (spinsUsed < 3) {
      codeContainer.style.display = "none";
      generatedCodeDisplay.textContent = "";
      if (outcome.type === "loss") {
        openModal("Spin Result", "Good Luck Next Time", "#c0392b");
      } else {
        openModal("Spin Result", `You won: ${formatResult(outcome)}`, "#27ae60");
      }
    } else {
      codeContainer.style.display = "block";
      generatedCodeDisplay.textContent = promoCode;

      if (bestOutcome.type === "loss") {
        openModal("Final Result", "No discount this time (best of 3 = Next Time)", "#c0392b");
      } else {
        openModal("Final Result", `Best of 3: ${bestResult}`, "#27ae60");
      }
    }

    spinning = false;
    updateUI();
  }, 4000);
});

updateUI();
