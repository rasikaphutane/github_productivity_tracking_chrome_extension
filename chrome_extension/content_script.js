const page = window.location.href;
if (page.includes("pull")) {
  const btn = document.createElement("button");
  btn.innerText = "💡 DevPulse Summary";
  btn.style = "margin-left: 10px; padding: 5px; background: #28a745; color: white; border-radius: 4px;";
  btn.onclick = async () => {
    const prText = document.querySelector(".comment-body")?.innerText || "No PR description";
    const res = await fetch("http://localhost:8000/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pr_text: prText })
    });
    const data = await res.json();
    alert(data.summary);
  };
  document.querySelector(".gh-header-actions")?.appendChild(btn);
}
