from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os

from config import load_config, save_config, ConfigModel
from summarizer import generate_summary

app = FastAPI(title="YouTube Summarizer API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    url: str
    provider: str
    prompt_supplement: str = ""

@app.get("/api/config", response_model=ConfigModel)
def get_config():
    return load_config()

@app.post("/api/config")
def update_config(config: ConfigModel):
    if save_config(config):
        return {"status": "success", "message": "Configuration saved successfully."}
    else:
        raise HTTPException(status_code=500, detail="Failed to save configuration.")

@app.post("/api/summarize")
def summarize_video(request: SummarizeRequest):
    try:
        if request.provider not in ["gemini", "openai"]:
            raise HTTPException(status_code=400, detail="Invalid provider.")
        
        summary = generate_summary(
            url=request.url,
            provider=request.provider,
            prompt_supplement=request.prompt_supplement
        )
        return {"summary": summary}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
