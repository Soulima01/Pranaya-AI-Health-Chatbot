document.addEventListener("DOMContentLoaded", () => {
  const trackerBtn = document.getElementById("trackerButton");
  const dropdown = document.getElementById("dropdownMenu");
  const modal = document.getElementById("trackerModal");
  const modalBody = document.getElementById("modalBody");
  const closeModal = document.getElementById("closeModal");
  const emergencyModal = document.getElementById("emergencyModal");

  /* --- TRACKER DROPDOWN LOGIC --- */
  trackerBtn.addEventListener("click", () => dropdown.classList.toggle("hidden"));
  closeModal.addEventListener("click", () => modal.classList.add("hidden"));

  document.addEventListener("click", (e) => {
    if (!trackerBtn.contains(e.target) && !dropdown.contains(e.target))
      dropdown.classList.add("hidden");
  });

  /* --- OPEN SPECIFIC TRACKER --- */
  document.querySelectorAll(".dropdown-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      dropdown.classList.add("hidden");
      await openTracker(btn.dataset.tracker);
    });
  });

  async function openTracker(type) {
    // Hide emergency modal if active
    if (emergencyModal && !emergencyModal.classList.contains("hidden")) {
      emergencyModal.classList.add("hidden");
    }

    modal.classList.remove("hidden");
    modalBody.innerHTML = "<p>Loading...</p>";

    /* 💧 WATER TRACKER */
    if (type === "water") {
      modalBody.innerHTML = `
        <h3><i class="fa-solid fa-droplet" style="color:#007aff"></i> Water Tracker</h3>
        <div class="date-display" id="waterDate"></div>

        <div class="goal-section">
          <input id="waterGoal" type="number" placeholder="Set daily goal (ml)">
          <button class="submit" id="setGoal">Set Goal</button>
        </div>

        <div class="pie-container">
          <svg id="waterPie" width="160" height="160" viewBox="0 0 36 36">
            <path class="bg" d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831
            a15.9155 15.9155 0 1 1 0 -31.831" />
            <path class="progress" id="progressPath"
              stroke-dasharray="0, 100"
              d="M18 2.0845a15.9155 15.9155 0 1 1 0 31.831
              a15.9155 15.9155 0 1 1 0 -31.831" />
            <text x="18" y="20.35" class="percentage" id="progressText">0%</text>
          </svg>
        </div>

        <div class="log-section">
          <input id="waterAmount" type="number" placeholder="Add water (ml)">
          <button class="submit" id="addWater">Add</button>
          <button class="undo-btn" id="undoWater"><i class="fa fa-undo"></i> Undo</button>
        </div>
        
        <div id="waterSummary" class="water-summary"></div>


        <div id="waterData" class="dataList"></div>
      `;

      document.getElementById("setGoal").onclick = setGoal;
      document.getElementById("addWater").onclick = addWater;
      document.getElementById("undoWater").onclick = undoWater;

      loadWaterProgress();
      loadWater();
    }

    /* 💉 VACCINE TRACKER */
    else if (type === "vaccine") {
      modalBody.innerHTML = `
        <h3><i class="fa-solid fa-syringe" style="color:#007aff"></i> Vaccination Tracker</h3>
        <input id="vacName" placeholder="Vaccine name" list="vaccineList">
        <datalist id="vaccineList"></datalist>
        <input id="vacDose" placeholder="Dose (e.g. Booster)">
        <input id="vacDate" type="date">
        <button class="submit" id="addVac">Add</button>
        <div id="vacData" class="dataList"></div>`;

      loadVaccineList();
      document.getElementById("addVac").onclick = addVaccine;
      loadVaccine();
    }

    /* 🌸 MENSTRUAL TRACKER */
    else if (type === "menstrual") {
      modalBody.innerHTML = `
        <h3><i class="fa-solid fa-calendar-days" style="color:#007aff"></i> Menstrual Tracker</h3>
        <input id="startDate" type="date">
        <input id="endDate" type="date">
        <select id="flow">
          <option>Flow</option>
          <option>Light</option>
          <option>Medium</option>
          <option>Heavy</option>
        </select>
        <button class="submit" id="addCycle">Add</button>
        <div id="cycleData" class="dataList"></div>`;

      document.getElementById("addCycle").onclick = addCycle;
      loadCycle();
    }
  }

  /* ---------------- WATER TRACKER FUNCTIONS ---------------- */
  async function setGoal() {
    const target = Number(document.getElementById("waterGoal").value);
    if (!target || target <= 0) return alert("Enter a valid goal!");
    await fetch("/api/water/goal/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_ml: target }),
    });
    showTempMessage("Goal Set ✅");
    loadWaterProgress();
  }

  async function loadWaterProgress() {
    const res = await fetch("/api/water/progress");
    const data = await res.json();

    document.getElementById("waterDate").textContent = data.date;

    const percent = data.percent;
    const path = document.getElementById("progressPath");
    const text = document.getElementById("progressText");

    // Animate the progress circle
    path.style.transition = "stroke-dasharray 0.8s ease";
    path.style.strokeDasharray = `${percent}, 100`;
    text.textContent = `${percent}%`;

    document.getElementById("waterGoal").placeholder = `Goal: ${data.target_ml}ml`;
  }

  async function addWater() {
    const amount = Number(document.getElementById("waterAmount").value);
    if (!amount || amount <= 0) return alert("Enter a valid amount!");
    await fetch("/api/water/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount_ml: amount }),
    });
    document.getElementById("waterAmount").value = "";
    showTempMessage("Added ✅");
    loadWaterProgress();
    loadWater();
  }

  async function undoWater() {
    await fetch("/api/water/undo", { method: "DELETE" });
    showTempMessage("Last Entry Removed ⏪");
    loadWaterProgress();
    loadWater();
  }

  async function loadWater() {
    const res = await fetch("/api/water/list");
    const data = await res.json();
    document.getElementById("waterData").innerHTML = data.length
      ? data
          .map(
            (d) =>
              `<div>💧 ${d.amount_ml} ml • ${new Date(
                d.created_at
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>`
          )
          .join("")
      : "<p>No entries yet.</p>";
  }

  /* ---------------- VACCINE TRACKER ---------------- */
  async function loadVaccineList() {
    try {
      const res = await fetch("/static/vaccines.json");
      const vaccines = await res.json();
      const datalist = document.getElementById("vaccineList");
      datalist.innerHTML = vaccines.map(v => `<option value="${v}"></option>`).join("");
    } catch (err) {
      console.error("⚠️ Could not load vaccine list", err);
    }
  }

  async function addVaccine() {
    const n = document.getElementById("vacName").value.trim(),
      d = document.getElementById("vacDose").value.trim(),
      date = document.getElementById("vacDate").value;

    if (!n) return alert("Please enter a vaccine name.");

    await fetch("/api/vaccine/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaccine_name: n, dose: d, date_given: date }),
    });

    document.getElementById("vacName").value = "";
    document.getElementById("vacDose").value = "";
    document.getElementById("vacDate").value = "";
    showTempMessage("Added ✅");
    loadVaccine();
  }

  async function loadVaccine() {
    const res = await fetch("/api/vaccine/list");
    const data = await res.json();
    const vacData = document.getElementById("vacData");
    if (!data.length) {
      vacData.innerHTML = "<p>No vaccines logged yet.</p>";
      return;
    }

    vacData.innerHTML = data
      .map(
        (v) => `
          <div class="vaccine-entry">
            💉 <b>${v.vaccine_name}</b> — ${v.dose || "N/A"} • ${v.date_given || "No date"}
            <button class="delete-btn" data-id="${v.id}" title="Delete">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>`
      )
      .join("");

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this vaccine record?")) return;
        await fetch(`/api/vaccine/delete/${id}`, { method: "DELETE" });
        loadVaccine();
      });
    });
  }

  /* ---------------- MENSTRUAL TRACKER ---------------- */
  async function addCycle() {
    const s = document.getElementById("startDate").value,
      e = document.getElementById("endDate").value,
      f = document.getElementById("flow").value;

    if (!s || f === "Flow") return alert("Please fill all fields.");

    await fetch("/api/menstrual/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start_date: s, end_date: e, flow: f }),
    });
    showTempMessage("Added ✅");
    loadCycle();
  }

  async function loadCycle() {
    const res = await fetch("/api/menstrual/list");
    const data = await res.json();
    document.getElementById("cycleData").innerHTML = data.length
      ? data
          .map(
            (c) =>
              `<div>🩸 ${c.start_date} → ${c.end_date || "ongoing"} • ${c.flow}</div>`
          )
          .join("")
      : "<p>No cycle data yet.</p>";
  }

  /* --- TEMP MESSAGE --- */
  function showTempMessage(text) {
    const msg = document.createElement("div");
    msg.textContent = text;
    msg.style.position = "absolute";
    msg.style.bottom = "20px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.background = "#007aff";
    msg.style.color = "white";
    msg.style.padding = "6px 14px";
    msg.style.borderRadius = "12px";
    msg.style.fontSize = "14px";
    msg.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
    modal.appendChild(msg);
    setTimeout(() => msg.remove(), 1000);
  }

  /* --- SAFETY FEATURE --- */
  const observer = new MutationObserver(() => {
    if (emergencyModal && !emergencyModal.classList.contains("hidden")) {
      modal.classList.add("hidden");
      dropdown.classList.add("hidden");
    }
  });
  observer.observe(emergencyModal, { attributes: true, attributeFilter: ["class"] });
});
