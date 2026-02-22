from youtube_transcript_api import YouTubeTranscriptApi
import google.generativeai as genai
from openai import OpenAI
from config import load_config
import re

DEFAULT_PROMPT = """Quero que você resuma o transcript em anexo para mim em tópicos como se fossem capítulos em ordem cronológica, adicione por conta própria insights valiosos e faça um resumo geral no final."""

def extract_video_id(url: str) -> str:
    """Extracts the YouTube video ID from a URL."""
    video_id_match = re.search(r'(?:v=|\/)([0-9A-Za-z_-]{11}).*', url)
    if video_id_match:
        return video_id_match.group(1)
    return ""

def get_transcript(url: str) -> str:
    """Fetches and concatenates the transcript for a given YouTube URL."""
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    
    try:
        # Try fetching the transcript (auto-generated or manual, preference for pt then en)
        transcript_list = YouTubeTranscriptApi().list(video_id)
        
        try:
            transcript = transcript_list.find_transcript(['pt', 'en', 'pt-BR'])
        except Exception:
            # If preferred languages aren't found, fallback to the first available
            transcript = list(transcript_list)[0]
            
        transcript_data = transcript.fetch()
        text = " ".join([item.text for item in transcript_data])
        return text
    except Exception as e:
        raise Exception(f"Failed to fetch transcript: {str(e)}")

def summarize_with_gemini(transcript: str, prompt_supplement: str) -> str:
    config = load_config()
    if not config.gemini_api_key:
        raise ValueError("Gemini API key is not configured.")
    
    genai.configure(api_key=config.gemini_api_key)
    # Using gemini-2.5-flash since it handles large contexts (like transcripts) well
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    full_prompt = f"{DEFAULT_PROMPT}\n\n"
    if prompt_supplement:
        full_prompt += f"Complemento ao prompt: {prompt_supplement}\n\n"
    
    full_prompt += f"Transcript:\n{transcript}"
    
    response = model.generate_content(full_prompt)
    return response.text

def summarize_with_openai(transcript: str, prompt_supplement: str) -> str:
    config = load_config()
    if not config.openai_api_key:
        raise ValueError("OpenAI API key is not configured.")
    
    client = OpenAI(api_key=config.openai_api_key)
    
    system_prompt = DEFAULT_PROMPT
    if prompt_supplement:
        system_prompt += f"\nComplemento ao prompt: {prompt_supplement}"
        
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Transcript:\n{transcript}"}
        ]
    )
    
    return response.choices[0].message.content

def generate_summary(url: str, provider: str, prompt_supplement: str = "") -> str:
    transcript = get_transcript(url)
    
    if provider.lower() == "gemini":
        return summarize_with_gemini(transcript, prompt_supplement)
    elif provider.lower() == "openai":
        return summarize_with_openai(transcript, prompt_supplement)
    else:
        raise ValueError("Invalid provider selected. Choose 'gemini' or 'openai'.")
