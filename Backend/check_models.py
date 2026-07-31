import os
from dotenv import load_dotenv
from google import genai

# Load environment variables
load_dotenv()

# Fetch Gemini API Key
api_key = os.environ.get("GEMENI_API_KEY")

if not api_key:
    print("Error: GEMENI_API_KEY is not set in .env")
    exit(1)

# Initialize Client
client = genai.Client(api_key=api_key)

print("Available models:")
for model in client.models.list():
    print(f"- {model.name}")
