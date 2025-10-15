// ------------------- ELEMENTS -------------------
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const userInput = document.getElementById("user-input");

const emergencyModal = document.getElementById("emergencyModal");
const emergencyReason = document.getElementById("emergencyReason");
const sirenAudio = document.getElementById("sirenAudio");
const call108Btn = document.getElementById("call108");
const nearbyBtn = document.getElementById("nearbyHospitals");
const falseAlarmBtn = document.getElementById("falseAlarm");
const hospitalList = document.getElementById("hospitalList");

let mediaRecorder;
let audioChunks = [];

// ------------------- CHAT UTILITIES -------------------
function appendMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(sender === "user" ? "user-message" : "bot-message");

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", sender);
  bubble.innerHTML = message.replace(/\n/g, "<br>");
  msgDiv.appendChild(bubble);

  // 💬 Add feedback section under bot replies only
  if (sender === "bot") {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.classList.add("feedback-container");
    feedbackDiv.innerHTML = `
      <span class="feedback-label">Was this helpful?</span>
      <div class="stars">
        <i class="fa fa-star" data-rating="1"></i>
        <i class="fa fa-star" data-rating="2"></i>
        <i class="fa fa-star" data-rating="3"></i>
        <i class="fa fa-star" data-rating="4"></i>
        <i class="fa fa-star" data-rating="5"></i>
      </div>
      <textarea class="feedback-text" placeholder="Leave feedback (optional)..."></textarea>
      <button class="submit-feedback">Submit</button>
    `;
    msgDiv.appendChild(feedbackDiv);

    // ⭐ Star click handler
    feedbackDiv.querySelectorAll(".fa-star").forEach(star => {
      star.addEventListener("click", () => {
        const rating = star.dataset.rating;
        feedbackDiv.querySelectorAll(".fa-star").forEach(s => s.classList.remove("active"));
        for (let i = 0; i < rating; i++) {
          feedbackDiv.querySelectorAll(".fa-star")[i].classList.add("active");
        }
        feedbackDiv.dataset.rating = rating;
      });
    });

    // 💾 Feedback submission
    feedbackDiv.querySelector(".submit-feedback").addEventListener("click", async () => {
      const rating = feedbackDiv.dataset.rating || null;
      const feedbackText = feedbackDiv.querySelector(".feedback-text").value.trim();
      if (!rating && !feedbackText) return alert("Please rate or write feedback.");

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, feedback: feedbackText }),
      });

      feedbackDiv.innerHTML = `<span class="thank-you">💙 Thank you for your feedback!</span>`;
    });
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}



function showTyping() {
  const typingDiv = document.createElement("div");
  typingDiv.classList.add("typing");
  typingDiv.id = "typing";
  typingDiv.textContent = "Pranaya is thinking...";
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const typingDiv = document.getElementById("typing");
  if (typingDiv) typingDiv.remove();
}

// ------------------- EMERGENCY HANDLING -------------------
function triggerEmergency(reason) {
  emergencyReason.textContent = reason || "Potential emergency detected!";
  emergencyModal.classList.remove("hidden");
  sirenAudio.currentTime = 0;
  sirenAudio.play().catch(() => console.log("Siren autoplay blocked by browser"));
}

function stopEmergency() {
  emergencyModal.classList.add("hidden");
  sirenAudio.pause();
  sirenAudio.currentTime = 0;
  hospitalList.innerHTML = "";
}

// 108 Call
call108Btn.addEventListener("click", () => {
  stopEmergency();
  window.open("tel:108");
});

// False alarm
falseAlarmBtn.addEventListener("click", stopEmergency);

// Nearby Hospitals
nearbyBtn.addEventListener("click", async () => {
  hospitalList.innerHTML = "<p>Fetching nearby hospitals...</p>";

  if (!navigator.geolocation) {
    hospitalList.innerHTML = "<p>Geolocation not supported.</p>";
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;

    try {
      const res = await fetch("/api/nearby_hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await res.json();

      if (data.hospitals && data.hospitals.length > 0) {
        hospitalList.innerHTML =
          `<h4>Hospitals near ${data.city}:</h4>` +
          data.hospitals
            .map(
              (h) => `<div>🏥 <b>${h.name}</b> — ${h.distance}</div>`
            )
            .join("");
      } else {
        hospitalList.innerHTML = "<p>No hospitals found nearby.</p>";
      }
    } catch (err) {
      hospitalList.innerHTML = "<p>Could not fetch hospitals.</p>";
    }
  });
});

// ------------------- SMOOTH BOT TYPING + VOICE -------------------
function typeAndSpeakMessage(fullText, audioUrl) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("bot-message");

  const bubble = document.createElement("div");
  bubble.classList.add("bubble", "bot");
  msgDiv.appendChild(bubble);
  chatBox.appendChild(msgDiv);

  let index = 0;
  const typingSpeed = 25;
  const audio = new Audio(audioUrl);

  // Start speaking after typing begins
  setTimeout(() => audio.play(), 400);

  const typing = setInterval(() => {
    bubble.innerHTML = fullText.slice(0, index).replace(/\n/g, "<br>");
    index++;

    if (index > fullText.length) {
      clearInterval(typing);
      bubble.innerHTML = fullText.replace(/\n/g, "<br>");

      // 💬 Add feedback section under bot replies
      const feedbackDiv = document.createElement("div");
      feedbackDiv.classList.add("feedback-container");
      feedbackDiv.innerHTML = `
        <span class="feedback-label">Was this helpful?</span>
        <div class="stars">
          <i class="fa fa-star" data-rating="1" title="Poor"></i>
          <i class="fa fa-star" data-rating="2" title="Fair"></i>
          <i class="fa fa-star" data-rating="3" title="Good"></i>
          <i class="fa fa-star" data-rating="4" title="Very Good"></i>
          <i class="fa fa-star" data-rating="5" title="Excellent"></i>
        </div>
        <textarea class="feedback-text" placeholder="Leave feedback (optional)..."></textarea>
        <button class="submit-feedback">Submit</button>
      `;
      msgDiv.appendChild(feedbackDiv);

      // ⭐ Star click handler
      feedbackDiv.querySelectorAll(".fa-star").forEach(star => {
        star.addEventListener("click", () => {
          const rating = star.dataset.rating;
          feedbackDiv.querySelectorAll(".fa-star").forEach(s => s.classList.remove("active"));
          for (let i = 0; i < rating; i++) {
            feedbackDiv.querySelectorAll(".fa-star")[i].classList.add("active");
          }
          feedbackDiv.dataset.rating = rating;
        });
      });

      // 💾 Feedback submission
      feedbackDiv.querySelector(".submit-feedback").addEventListener("click", async () => {
        const rating = feedbackDiv.dataset.rating || null;
        const feedbackText = feedbackDiv.querySelector(".feedback-text").value.trim();
        if (!rating && !feedbackText) return alert("Please rate or write feedback.");

        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, feedback: feedbackText }),
        });

        feedbackDiv.innerHTML = `<span class="thank-you">💙 Thank you for your feedback!</span>`;
      });
    }

    chatBox.scrollTop = chatBox.scrollHeight;
  }, typingSpeed);
}

// ------------------- TEXT INPUT -------------------
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";
  showTyping();

  try {
    const res = await fetch("/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    removeTyping();

    // 🧠 Typing + Speaking
    typeAndSpeakMessage(data.reply, data.audio);

    // 🚨 Emergency detected
    if (data.emergency && data.emergency.is_emergency) {
      triggerEmergency(data.emergency.reason);
    }

    // 💡 Nudges
    if (data.nudges && data.nudges.length > 0) {
      showNudges(data.nudges);
    }
  } catch (err) {
    removeTyping();
    appendMessage("bot", "⚠️ Network error. Please try again.");
  }
}

// ------------------- VOICE INPUT -------------------
micBtn.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    micBtn.classList.remove("recording");
    micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const formData = new FormData();
      formData.append("audio", audioBlob);

      showTyping();

      try {
        const res = await fetch("/voice", { method: "POST", body: formData });
        const data = await res.json();
        removeTyping();

        appendMessage("user", data.transcript || "🎙️ [Voice input]");
        typeAndSpeakMessage(data.response || "⚠️ Could not process audio.", data.audio);

        // 🚨 Emergency trigger for voice
        if (data.emergency && data.emergency.is_emergency) {
          triggerEmergency(data.emergency.reason);
        }

        // 💡 Nudges
        if (data.nudges && data.nudges.length > 0) {
          showNudges(data.nudges);
        }
      } catch {
        removeTyping();
        appendMessage("bot", "⚠️ Voice processing failed.");
      }
    };

    mediaRecorder.start();
    micBtn.classList.add("recording");
    micBtn.innerHTML = '<i class="fas fa-stop"></i>';
  } catch {
    appendMessage("bot", "⚠️ Microphone access denied or unavailable.");
  }
});

// ------------------- NUDGES -------------------
function showNudges(nudges) {
  const nudgeBox = document.createElement("div");
  nudgeBox.classList.add("nudge-box");
  nudgeBox.innerHTML = nudges
    .map((n) => `<button class="nudge-btn">${n}</button>`)
    .join("");

  chatBox.appendChild(nudgeBox);
  chatBox.scrollTop = chatBox.scrollHeight;

  document.querySelectorAll(".nudge-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      userInput.value = btn.textContent;
      nudgeBox.remove();
      sendMessage();
    });
  });
}

// ------------------- EVENT LISTENERS -------------------
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});
