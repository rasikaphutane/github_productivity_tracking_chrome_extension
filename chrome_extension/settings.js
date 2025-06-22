document.addEventListener("DOMContentLoaded", () => {
  const streakTarget = document.getElementById("streak-target");
  const dailyMinutes = document.getElementById("daily-minutes");
  const saveSettingsBtn = document.getElementById("save-settings");
  const settingsStatus = document.getElementById("settings-status"); // optional element

  function loadSettings() {
    const savedStreak = localStorage.getItem("devpulse-streak-target") || "7";
    const savedMinutes = localStorage.getItem("devpulse-daily-minutes") || "60";

    streakTarget.value = savedStreak;
    dailyMinutes.value = savedMinutes;

    // Show saved status
    if (settingsStatus) {
      settingsStatus.innerHTML = `
        🎯 Current Streak Goal: <strong>${savedStreak} days</strong><br>
        ⏱️ Daily Time Goal: <strong>${savedMinutes} mins</strong>
      `;
    }
  }

  function saveSettings() {
    const streak = streakTarget.value;
    const minutes = dailyMinutes.value;

    localStorage.setItem("devpulse-streak-target", streak);
    localStorage.setItem("devpulse-daily-minutes", minutes);

    // Visual confirmation
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.textContent = "✅ Saved!";
    saveSettingsBtn.style.backgroundColor = "#2ea043";

    setTimeout(() => {
      saveSettingsBtn.textContent = "💾 Save Settings";
      saveSettingsBtn.disabled = false;
      saveSettingsBtn.style.backgroundColor = "";
      loadSettings(); // Reload and show saved values
    }, 1500);
  }

  saveSettingsBtn.addEventListener("click", saveSettings);
  loadSettings();
});
