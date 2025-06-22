document.getElementById('analyze-btn').addEventListener('click', async () => {
  const username = document.getElementById('github-username').value.trim();
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = "🔄 Fetching...";

  if (!username) {
    resultDiv.innerHTML = "⚠️ Please enter a GitHub username.";
    return;
  }

  try {
    const res = await fetch(`https://api.github.com/users/${username}/events`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      resultDiv.innerHTML = "❌ No recent public activity found for this user.";
      return;
    }

    const commits = data.filter(e => e.type === "PushEvent").length;
    const prs = data.filter(e => e.type === "PullRequestEvent").length;

    const commitMessages = data
      .filter(e => e.type === "PushEvent")
      .flatMap(e => e.payload?.commits || [])
      .map(c => c.message)
      .filter(msg => msg);

    if (commitMessages.length === 0) {
      resultDiv.innerHTML = `
        <p>✅ Commits: ${commits}</p>
        <p>📦 PRs: ${prs}</p>
        <p>⚠️ No commit messages found for sentiment analysis.</p>
      `;
      return;
    }

    const sentimentRes = await fetch("http://localhost:8080/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: commitMessages.slice(0, 5) })
    });

    if (!sentimentRes.ok) {
      throw new Error(`Backend error: ${sentimentRes.status}`);
    }

    const sentimentJson = await sentimentRes.json();
    const moodEmojis = sentimentJson.result.map(s =>
      s === "positive" ? "🔥" : s === "neutral" ? "😐" : "💤"
    );

    resultDiv.innerHTML = `
      <div class="space-y-2">
        <p>✅ <strong>Commits:</strong> ${commits}</p>
        <p>📦 <strong>PRs:</strong> ${prs}</p>
        <p>🧠 <strong>Mood:</strong> ${moodEmojis.join(" ")}</p>
      </div>
    `;

    const activityMinutes = commits * 15 + prs * 30;
    const timestamp = new Date().toISOString();

    saveResultToStorage(username, {
      commits,
      prs,
      mood: sentimentJson.result,
      activityMinutes,
      timestamp
    });

    showAlerts(username, activityMinutes);
  } catch (err) {
    console.error("❌ Full error during analysis:", err);
    resultDiv.innerHTML = "🚫 Error loading data. Check console for details.";
  }
});

function saveResultToStorage(username, result) {
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || {};
    const userHistory = history[username] || [];

    userHistory.unshift(result);
    if (userHistory.length > 60) userHistory.pop();

    history[username] = userHistory;
    chrome.storage.local.set({ history });
  });
}

function renderHistory(username) {
  const resultDiv = document.getElementById("result");
  const oldHistory = document.getElementById("history-section");
  if (oldHistory) oldHistory.remove();

  chrome.storage.local.get(["history", "devpulseSettings"], (data) => {
    const history = data.history?.[username] || [];
    const settings = data.devpulseSettings || {};
    const streakTarget = settings.streakGoal || 7;
    const dailyTarget = settings.dailyTargetMinutes || 60;

    if (history.length === 0) {
      resultDiv.innerHTML += "<p>📭 No saved history found.</p>";
      return;
    }

    const historySection = document.createElement("div");
    historySection.id = "history-section";
    historySection.innerHTML = `<hr><h3>📜 Weekly History:</h3>`;

    if (history.length > 1) {
      const timestamps = history.map(e => new Date(e.timestamp).getTime());
      const timeDiffs = timestamps.slice(0, -1).map((t, i) => Math.abs(t - timestamps[i + 1]));
      const avgGap = Math.round(
        timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length / (1000 * 3600 * 24)
      );
      historySection.innerHTML += `<p>⏱ Avg gap between sessions: ${avgGap} day(s)</p>`;
    }

    const streak = calculateStreak(history);
    let bonus = 0;
    if (streak >= streakTarget) {
      bonus = 20;
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "🎉 DevPulse",
        message: `🔥 You're on a ${streak}-day streak! +${bonus} bonus points!`
      });
    }

    let score = history[0].commits * 5 + history[0].prs * 10;
    const moodCounts = { positive: 0, neutral: 0, negative: 0 };
    let lastDate = new Date(history[0].timestamp);
    let allMoods = [];

    history.forEach(entry => {
      const date = new Date(entry.timestamp).toLocaleDateString();
      const moodEmoji = entry.mood.map(m => {
        moodCounts[m]++;
        return m === "positive" ? "🔥" : m === "neutral" ? "😐" : "💤";
      }).join(" ");
      allMoods = allMoods.concat(entry.mood);

      historySection.innerHTML += `
        <div style="margin-bottom: 0.5rem; padding-bottom: 0.3rem; border-bottom: 1px solid #334155;">
          <strong>${date}</strong><br/>
          Commits: ${entry.commits}, PRs: ${entry.prs}<br/>
          Mood: ${moodEmoji}
        </div>
      `;
    });

    const now = new Date();
    const daysInactive = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
    const penalty = Math.floor(daysInactive / 15);
    score += moodCounts.positive * 7 - moodCounts.negative * 4 - penalty + bonus;
    score = Math.max(0, Math.min(100, score));

    historySection.innerHTML += `
      <p><strong>📊 DevPulse Score:</strong> ${score} / 100</p>
      <p><strong>🔥 Streak:</strong> ${streak} days / 🎯 ${streakTarget}</p>
      <p><strong>💡 Daily Target:</strong> ${dailyTarget} min</p>
      <p><strong>Weekly Mood Summary:</strong> 🔥 ${moodCounts.positive} 😐 ${moodCounts.neutral} 💤 ${moodCounts.negative}</p>
    `;

    resultDiv.appendChild(historySection);
    renderChart(username);
  });
}

function renderChart(username) {
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history?.[username] || [];
    if (history.length === 0) return;

    const labels = history.map(entry =>
      new Date(entry.timestamp).toLocaleDateString()
    ).reverse();

    const commitData = history.map(entry => entry.commits).reverse();

    // Convert mood to numeric for visualization
    const moodData = history.map(entry => {
      const values = entry.mood.map(m =>
        m === "positive" ? 1 : m === "neutral" ? 0 : -1
      );
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      return avg;
    }).reverse();

    const ctx = document.getElementById("weeklyChart").getContext("2d");
    if (window.weeklyChartInstance) {
      window.weeklyChartInstance.destroy();
    }

    window.weeklyChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Commits",
            data: commitData,
            borderColor: "rgb(34, 197, 94)", // green
            tension: 0.3
          },
          {
            label: "Mood Trend",
            data: moodData,
            borderColor: "rgb(59, 130, 246)", // blue
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            suggestedMin: -1,
            suggestedMax: 5
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#cbd5e1'
            }
          }
        }
      }
    });
  });
}

function calculateStreak(history) {
  let streak = 1;
  for (let i = 1; i < history.length; i++) {
    const d1 = new Date(history[i - 1].timestamp);
    const d2 = new Date(history[i].timestamp);
    const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
    if (diff <= 1) streak++;
    else break;
  }
  return streak;
}

function showAlerts(username, todayMinutes) {
  chrome.storage.local.get(["devpulseSettings"], (data) => {
    const settings = data.devpulseSettings || {};
    const dailyTarget = settings.dailyTargetMinutes || 60;

    if (todayMinutes >= dailyTarget) {
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "✅ Target Met",
        message: `You completed ${todayMinutes} min today. Great job!`
      });
    } else if (todayMinutes >= dailyTarget * 0.8) {
      chrome.notifications?.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "⚡ Almost There",
        message: `You're at ${todayMinutes} min. Just a bit more to hit today's target!`
      });
    }

    chrome.storage.local.get(["history"], (data) => {
      const history = data.history?.[username] || [];
      if (history.length > 0) {
        const lastDate = new Date(history[0].timestamp);
        const now = new Date();
        const days = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
        if (days > 7) {
          chrome.notifications?.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "⚠️ Inactivity Alert",
            message: `No activity in the last ${days} days. Time to get back!`
          });
        }
      }
    });
  });
}

document.getElementById('show-history').addEventListener('click', () => {
  const username = document.getElementById('github-username').value.trim();
  if (!username) return alert("Enter a username to view history.");
  renderHistory(username);
});

document.getElementById('clear-history').addEventListener('click', () => {
  const username = document.getElementById('github-username').value.trim();
  if (!username) return alert("Enter a username to clear history.");
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || {};
    delete history[username];
    chrome.storage.local.set({ history }, () => {
      const oldHistory = document.getElementById("history-section");
      if (oldHistory) oldHistory.remove();
      const resultDiv = document.getElementById("result");
      resultDiv.innerHTML += `<p class="text-red-400 mt-2">🧹 History cleared for <strong>${username}</strong>.</p>`;
    });
  });
});
