from __future__ import annotations

import json
import logging
import os
from typing import Any
from google import genai
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

class NLUService:
    """
    Extracts intents and entities from a customer message using Gemini LLM via google-genai SDK.
    """

    SUPPORTED_INTENTS = [
        'greeting',
        'small_talk',
        'knowledge_base_query',
        'refund_request',
        'order_status',
        'shipping_question',
        'billing_question',
        'human_support',
        'goodbye',
        'unknown',
    ]

    def __init__(self):
        # Configure Gemini API key
        api_key = os.environ.get("GEMENI_API_KEY")
        if not api_key:
            logger.warning("GEMENI_API_KEY is not set. NLU will fallback to basic heuristics.")
            self.client = None
        else:
            self.client = genai.Client(api_key=api_key)

    def extract(self, message: str) -> dict[str, Any]:
        if not self.client:
            return self._fallback_extract(message)

        prompt = f"""You are an NLU engine for a customer support chat.
Your task is to classify the intent of the following customer message and extract relevant entities.

Supported intents: {", ".join(self.SUPPORTED_INTENTS)}

Examples:
Message: "Hi there!"
Output: {{"intent": "greeting", "entities": {{}}, "confidence": 0.99}}

Message: "I want a refund for order #123"
Output: {{"intent": "refund_request", "entities": {{"Order ID": "123"}}, "confidence": 0.95}}

Message: "How do I reset my password?"
Output: {{"intent": "knowledge_base_query", "entities": {{"Topic": "reset password"}}, "confidence": 0.90}}

Message: "Can I talk to a human?"
Output: {{"intent": "human_support", "entities": {{}}, "confidence": 0.98}}

Analyze this message:
Message: "{message}"

Return ONLY valid JSON.
Output:"""
        try:
            response = self.client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
            )
            text = response.text.strip()
            # Clean up potential markdown formatting around json
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            
            result = json.loads(text.strip())
            logger.debug(f"NLU Extraction Result: {result}")
            return {
                'intent': result.get('intent', 'unknown'),
                'entities': result.get('entities', {}),
                'confidence': result.get('confidence', 0.5)
            }
        except Exception as e:
            logger.exception(f"Gemini NLU extraction failed: {e}")
            return self._fallback_extract(message)

    def _fallback_extract(self, message: str) -> dict[str, Any]:
        text = message.lower()
        intent = 'unknown'
        entities = {}
        confidence = 0.95

        if any(word in text for word in ['hi', 'hello', 'hey', 'greetings']):
            intent = 'greeting'
        elif any(word in text for word in ['bye', 'goodbye', 'see ya']):
            intent = 'goodbye'
        elif any(word in text for word in ['refund', 'money back', 'return']):
            intent = 'refund_request'
        elif any(word in text for word in ['order', 'where is my stuff', 'track']):
            intent = 'order_status'
            entities['Topic'] = 'Order Tracking'
            if 'order' in text:
                entities['Order ID'] = '12345'
        elif any(word in text for word in ['ship', 'delivery', 'arriving']):
            intent = 'shipping_question'
        elif any(word in text for word in ['bill', 'charge', 'invoice', 'payment']):
            intent = 'billing_question'
        elif any(word in text for word in ['human', 'agent', 'support', 'help', 'representative', 'talk to someone']):
            intent = 'human_support'
        elif any(word in text for word in ['how to', 'what is', 'can i', 'policy', 'reset password']):
            intent = 'knowledge_base_query'
            entities['Topic'] = message
        else:
            intent = 'small_talk'

        if len(text.split()) < 2 and intent == 'unknown':
            intent = 'unknown'
            confidence = 0.50

        return {
            'intent': intent,
            'entities': entities,
            'confidence': confidence
        }
