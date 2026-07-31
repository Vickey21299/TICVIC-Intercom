from __future__ import annotations

import logging
import os
from google import genai
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class LLMService:
    """
    Isolated LLM execution service using Gemini via google-genai SDK.
    """

    def __init__(self):
        api_key = os.environ.get("GEMENI_API_KEY")
        if not api_key:
            logger.warning("GEMENI_API_KEY is not set. LLMService will fallback to mock.")
            self.client = None
        else:
            self.client = genai.Client(api_key=api_key)

    def generate_reply(self, prompt: str) -> str:
        """
        Takes the fully constructed prompt and returns the AI's reply.
        """
        logger.info("Generating reply from LLM...")
        
        if not self.client:
            return self._fallback_reply(prompt)

        try:
            response = self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
            )
            reply_text = response.text.strip()
            logger.info("Successfully generated reply from Gemini.")
            return reply_text
        except Exception as e:
            logger.exception(f"Gemini LLM generation failed: {e}")
            return self._fallback_reply(prompt)

    def _fallback_reply(self, prompt: str) -> str:
        lower_prompt = prompt.lower()
        
        if "human" in lower_prompt.split("### current customer message ###")[-1]:
            return "I will connect you with a human agent shortly. Please hold on."
        
        if "refund" in lower_prompt.split("### current customer message ###")[-1]:
            return "According to our refund policy, you can request a refund within 30 days of purchase. Would you like me to start that process?"
            
        if "order" in lower_prompt.split("### current customer message ###")[-1]:
            return "I can help with your order status. Let me check the details for you."
            
        if "### knowledge base articles ###" in lower_prompt:
            return "Based on our knowledge base, here is the information you requested. Is there anything else I can help with?"
            
        return "Thank you for reaching out! I'm an AI assistant. How can I help you today?"
