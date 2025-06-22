import requests

def summarize_pr(text: str) -> str:
    prompt = f"""
You are an expert software engineer. Summarize the following GitHub Pull Request:
- What is being changed?
- Why was it changed?
- Key files or functions modified.

PR Content:
\"\"\"
{text}
\"\"\"
"""

    response = requests.post(
        "http://localhost:11434/api/generate",
        json={
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }
    )
    return response.json().get("response", "No response from model.")
