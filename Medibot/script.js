let diseaseData = [];
let currentDisease = ""; // To store matched disease for speech

// Load disease symptoms
fetch("diseaseSymptoms.json")
  .then((response) => response.json())
  .then((data) => {
    diseaseData = data;
    console.log("Symptoms data loaded!");
  })
  .catch((error) => console.error("Error loading symptoms file:", error));

// Load disease precautions and treatments
fetch("diseasePrecautions.json")
  .then((response) => response.json())
  .then((data) => {
    window.precautionData = data;
    console.log("Precautions data loaded!");
  })
  .catch((error) => console.error("Error loading precautions file:", error));

// Analyze user input
function analyzeUserInput() {
  const userInput = document.getElementById("userInput").value.toLowerCase();
  const inputSymptoms = userInput.split(",").map((s) => s.trim());

  let matchedDisease = null;
  let maxMatch = 0;

  for (const diseaseEntry of diseaseData) {
    const disease = diseaseEntry.Disease;

    const symptoms = Object.keys(diseaseEntry)
      .filter((key) => key.startsWith("Symptom_"))
      .map((key) => diseaseEntry[key].toLowerCase().trim());

    const matchCount = inputSymptoms.filter((symptom) =>
      symptoms.includes(symptom)
    ).length;

    if (matchCount > maxMatch) {
      maxMatch = matchCount;
      matchedDisease = disease;
    }
  }

  const resultElement = document.getElementById("result");

  if (matchedDisease && maxMatch > 0) {
    currentDisease = matchedDisease; // store for speech
    let precautions = "No precautions found.";
    let treatment = "No treatment found.";

    if (window.precautionData) {
      const match = window.precautionData.find(
        (d) => d.Disease.toLowerCase() === matchedDisease.toLowerCase()
      );

      if (match) {
        const precautionList = Object.keys(match)
          .filter((k) => k.startsWith("Precaution_"))
          .map((k) => `<li>${match[k]}</li>`)
          .join("");

        precautions = `<ul style="padding-left: 20px; margin: 0;">${precautionList}</ul>`;

        if (match.Treatment) {
          treatment = `${match.Treatment}`;
        }
      }
    }

    resultElement.innerHTML = `
      <h2>🩺 Possible Disease: <span style="color: darkred;">${matchedDisease}</span></h2>
      <h3>✅ Precautions:</h3>
      <div id="precautionsText">${precautions}</div>
      <h3>💊 Treatment:</h3>
      <p id="treatmentText">${treatment}</p>
    `;

    document.getElementById("voiceControls").style.display = "block";
  } else {
    resultElement.innerHTML = "❌ Sorry, no disease matched your symptoms.";
    document.getElementById("voiceControls").style.display = "none";
    currentDisease = ""; // clear disease if no match
  }
}

// Text-to-Speech: Speak Result
function speakResult() {
  const precautions =
    document.getElementById("precautionsText")?.innerText || "";
  const treatment = document.getElementById("treatmentText")?.innerText || "";
  const diseaseName = currentDisease
    ? `The possible disease is ${currentDisease}. `
    : "";

  const textToSpeak = `${diseaseName}Here are the precautions: ${precautions}. And the treatment is: ${treatment}.`;

  const utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.lang = "en-US";

  speechSynthesis.speak(utterance);
}

// Text-to-Speech: Stop Speaking
function stopSpeaking() {
  speechSynthesis.cancel();
}

// Voice Input using Web Speech API
function startVoiceInput() {
  if (!("webkitSpeechRecognition" in window)) {
    alert("Sorry, your browser does not support speech recognition.");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  console.log("🟣 Starting speech recognition...");

  recognition.onstart = () => {
    console.log("🎤 Voice recognition started...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("✅ Recognized:", transcript);
    document.getElementById("userInput").value = transcript.toLowerCase();
    analyzeUserInput();
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    if (event.error === "no-speech") {
      alert("⚠️ No speech detected. Please speak clearly after clicking the mic.");
    }
  };

  recognition.onend = () => {
    console.log("🔴 Voice recognition stopped.");
  };

  recognition.start();
}
