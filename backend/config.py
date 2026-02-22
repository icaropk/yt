import json
import os
from pydantic import BaseModel

CONFIG_FILE = "config.json"

class ConfigModel(BaseModel):
    gemini_api_key: str = ""
    openai_api_key: str = ""

def load_config() -> ConfigModel:
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                data = json.load(f)
                return ConfigModel(**data)
        except Exception:
            pass
    return ConfigModel()

def save_config(config: ConfigModel):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config.model_dump(), f, indent=4)
        return True
    except Exception:
        return False
