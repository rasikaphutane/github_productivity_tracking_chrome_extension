# 🚀 DevPulse – GitHub Productivity Tracking Chrome Extension

DevPulse is a lightweight Chrome Extension that tracks your daily GitHub activity (commits, PRs, moods), helps you build consistent streaks, and gives you productivity feedback with scores, trend summaries, and custom targets. 

> 🔍 Designed for developers who want to stay accountable, motivated, and productive every day.

---

## 🔧 Features

- ✅ **Track Commits & PRs**: Pulls latest public activity from GitHub Events API.
- 🧠 **Mood Analyzer**: Sentiment analysis on commit messages (powered by FastAPI backend).
- 📊 **DevPulse Score**: Combines commit/PR frequency and mood to calculate a 0–100 score.
- 📆 **Streak Tracking**: Customizable streak goals from 3 to 365+ days.
- ⏱️ **Daily Time Goals**: Track activity time and get notified when you’re close to completion.
- 🎉 **Celebrations & Alerts**: Popup rewards for milestones, inactivity alerts after 7 days.
- 📜 **Weekly History View**: Mood summaries, streaks, and average gap between sessions.
- 📤 **CSV Export (optional)**: Download history as CSV for analysis (coming soon).
- 📈 **Charts (optional)**: Line charts for mood/commit trends (optional with local Chart.js).

---

## 🧠 Technologies Used

| Frontend (Chrome Extension) | Backend (API) | Styling |
|-----------------------------|----------------|---------|
| JavaScript, HTML, CSS       | FastAPI (Python) | PicoCSS |

- **Local storage** for persistence
- **Chrome Notifications API** for alerts
- **Mistral 7B** (via local Ollama or inference API) for sentiment analysis

---

## 🛠️ Installation Instructions

### 🔗 Chrome Extension

1. Clone the repo:
git clone https://github.com/rasikaphutane/github_productivity_tracking_chrome_extension.git
cd github_productivity_tracking_chrome_extension 
2. Open Chrome → chrome://extensions/
3. Enable Developer Mode
4. Click "Load Unpacked"
5. Select the root folder of this project

🔍 Use the extension from your toolbar and start analyzing GitHub usernames!

⚙️ Backend (FastAPI Sentiment Server)
Required for mood/sentiment analysis

## To Run Locally
1. Install dependencies:
pip install -r requirements.txt

2. Run the API:
uvicorn main:app --reload --port 8080
Please make sure this is running at http://localhost:8080/sentiment when using the extension.

## 🧪 Sample Commit Message Sentiment

Your commit messages are sent to the backend like:

POST /sentiment
{
  "messages": ["fixed bug", "added dashboard feature", "refactored utils"]
}
The response might be:
{
  "result": ["neutral", "positive", "positive"]
}
Which gets mapped to: 😐 🔥 🔥

## 🎯 Productivity & Streak Goals
Set your streak goal (3–365 days) from the extension UI

Set your daily time goal (30 min – 6 hours)

Receive pop-up alerts when you're close or done

Track progress live with a score, mood emojis, and time metrics

## 📦 Optional Future Features(yet to be added :) )

 CSV Export Button

 Chart.js Line Charts

 GitHub Actions Integration

 Auto sync to GitHub Gists

 
