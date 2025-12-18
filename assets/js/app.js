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

const segmentData = [
  { label: "2%", type: "win", value: 2 },
  { label: "GL", type: "loss", value: 0 },
  { label: "4%", type: "win", value: 4 },
  { label: "GL", type: "loss", value: 0 },
  { label: "6%", type: "win", value: 6 },
  { label: "GL", type: "loss", value: 0 },
  { label: "8%", type: "win", value: 8 },
  { label: "GL", type: "loss", value: 0 },
  { label: "10%", type: "win", value: 10 },
  { label: "GL", type: "loss", value: 0 }
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
  const best = Number(st.bestValue || 0);

  phoneGate.style.display = activated ? "none" : "block";

  spinBtn.disabled = !activated || spinsUsed >= 3 || spinning;
  spinBtn.textContent = `SPIN (${Math.min(spinsUsed, 3)}/3)`;

  statusLine.style.display = activated ? "block" : "none";
  if (activated) {
    statusLine.textContent = spinsUsed >= 3
      ? `Done. Best result: ${best}%`
      : `You have ${3 - spinsUsed} spins left. Best so far: ${best}%`;
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
      bestValue: 0,
      bestLabel: "GL",
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
    results.push({ label: outcome.label, value: outcome.value });

    let bestValue = Number(st2.bestValue || 0);
    let bestLabel = st2.bestLabel || "GL";
    if (outcome.value > bestValue) {
      bestValue = outcome.value;
      bestLabel = outcome.label;
    }

    let promoCode = st2.promoCode || null;
    if (spinsUsed >= 3) promoCode = generateCode();

    setState({ ...st2, spinsUsed, results, bestValue, bestLabel, promoCode });

    spinsLog.textContent = results
      .map((r, i) => `Spin ${i+1}: ${r.label === "GL" ? "GL" : r.label + " OFF"}`)
      .join(" | ");

    if (spinsUsed < 3) {
      codeContainer.style.display = "none";
      generatedCodeDisplay.textContent = "";
      if (outcome.value === 0) openModal("Spin Result", "Good Luck Next Time", "#c0392b");
      else openModal("Spin Result", `You won ${outcome.label} OFF`, "#27ae60");
    } else {
      codeContainer.style.display = "block";
      generatedCodeDisplay.textContent = promoCode;

      if (bestValue === 0) openModal("Final Result", "No discount this time (best of 3 = GL)", "#c0392b");
      else openModal("Final Result", `Best of 3: ${bestValue}% OFF`, "#27ae60");
    }

    spinning = false;
    updateUI();
  }, 4000);
});

updateUI();

