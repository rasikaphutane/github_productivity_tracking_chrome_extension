from fastapi import FastAPI
from pydantic import BaseModel
from summarise import summarize_pr
from sentiment import analyze_commit_sentiment
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PRRequest(BaseModel):
    pr_text: str

class CommitRequest(BaseModel):
    messages: list[str]

@app.post("/summarize")
def summarize(req: PRRequest):
    return {"summary": summarize_pr(req.pr_text)}

@app.post("/sentiment")
def sentiment(req: CommitRequest):
    return {"result": analyze_commit_sentiment(req.messages)}
