from __future__ import annotations

import logging
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.schemas.ai import AIChatRequest, AIChatResponse, AISummaryRequest, AISummaryResponse
from app.services.ai import (
    NLUService,
    KnowledgeBaseService,
    ConversationService,
    PromptBuilder,
    LLMService,
    IntentRouter
)
from app.firebase import database
from app.utils.logger import setup_logger

router = APIRouter(prefix='/api/ai', tags=['ai'])
logger = setup_logger(__name__)

# Dependencies for Dependency Injection
def get_nlu_service() -> NLUService:
    return NLUService()

def get_kb_service() -> KnowledgeBaseService:
    return KnowledgeBaseService()

def get_conversation_service() -> ConversationService:
    return ConversationService()

def get_prompt_builder() -> PromptBuilder:
    return PromptBuilder()

def get_llm_service() -> LLMService:
    return LLMService()

def get_intent_router(kb: KnowledgeBaseService = Depends(get_kb_service)) -> IntentRouter:
    return IntentRouter(kb)


@router.post('/chat', response_model=AIChatResponse)
def ai_chat(
    payload: AIChatRequest,
    nlu: NLUService = Depends(get_nlu_service),
    conversation_service: ConversationService = Depends(get_conversation_service),
    intent_router: IntentRouter = Depends(get_intent_router),
    prompt_builder: PromptBuilder = Depends(get_prompt_builder),
    llm: LLMService = Depends(get_llm_service),
) -> JSONResponse | AIChatResponse:
    """
    Modular AI Pipeline for the Live Chat Widget.
    """
    logger.info("================ START AI PIPELINE ================")
    logger.info(f"Processing AI request for conversation {payload.conversation_id}")
    logger.info(f"User Input: {payload.message}")

    try:
        # 1. Conversation History
        raw_history = conversation_service.get_history(payload.conversation_id, limit=20)
        
        # Clean history to only keep role ('agent' or 'chat'), content, and created_at timestamp
        history = [
            {
                'role': 'agent' if msg.get('sender_type') == 'agent' else 'chat',
                'content': msg.get('content', ''),
                'created_at': msg.get('created_at', '')
            }
            for msg in raw_history
            if isinstance(msg, dict) and msg.get('content')
        ]
        
        logger.info(f"conversationhistory: {history}")
        logger.info(f"Fetched {len(history)} historical messages from conversation.")
         


        # 2. NLU (Intent + Entity Extraction)
        nlu_result = nlu.extract(payload.message)
        intent = nlu_result['intent']
        entities = nlu_result['entities']
        confidence = nlu_result['confidence']
        logger.info(f"NLU Result - Intent: {intent} (Confidence: {confidence}), Entities: {entities}")

        # Fetch conversation data early to resolve workspace ID
        conv_data = database.child('conversations').child(payload.conversation_id).get()
        workspace_id = 'ws_demo'
        if isinstance(conv_data, dict):
            workspace_id = conv_data.get('workspace_id', 'ws_demo')

        # 3. Intent Router & Knowledge Base Retrieval
        route_result = intent_router.route(intent, payload.message)
        raw_kb_articles = route_result.get('kb_articles', [])
        logger.info(f"Intent Router - KB Articles Retrieved: {[art.get('title') for art in raw_kb_articles]}")
        
        kb_articles = []
        custom_domain = None

        if raw_kb_articles:
            # Let's perform a selection LLM call to identify which KB articles can resolve the query (can be multiple)
            article_titles = [f"'{art.get('title')}'" for art in raw_kb_articles]
            titles_str = ", ".join(article_titles)
            
            selection_prompt = (
                "You are a routing agent. Determine which of the following knowledge base articles "
                "can help resolve or are relevant to the customer's query. Select all that apply.\n\n"
                f"Customer Message: \"{payload.message}\"\n"
                f"Available Articles: [{titles_str}]\n\n"
                "Return the exact titles of the matching articles as a comma-separated list. "
                "For example: 'Refund Policy, Track Order'. "
                "If none of them are relevant, return 'None'."
            )
            
            selected_response = llm.generate_reply(selection_prompt).strip()
            logger.info(f"Selection LLM response: '{selected_response}'")
            
            selected_titles = []
            if selected_response.lower() != 'none':
                # Split by comma and clean quotes
                selected_titles = [t.strip().strip("'\"").lower() for t in selected_response.split(',')]
            
            # Match all relevant articles
            for art in raw_kb_articles:
                art_title = art.get('title', '').strip().lower()
                if any(sel_title == art_title or sel_title in art_title or art_title in sel_title for sel_title in selected_titles):
                    kb_articles.append(art)
                
            # Retrieve workspace details to verify custom domain status
            if kb_articles:
                ws_details = database.child('workspaces').child(workspace_id).get()
                if isinstance(ws_details, dict):
                    if ws_details.get('custom_domain_status') == 'verified':
                        custom_domain = ws_details.get('custom_domain')

        # 4. Prompt Builder
        prompt = prompt_builder.build(
            message=payload.message,
            history=history,
            kb_articles=kb_articles
        )
        
        # Inject custom domain URL or local fallback URL instructions for all matched articles
        if kb_articles:
            links_instr = []
            for art in kb_articles:
                slug = art.get('slug')
                title = art.get('title')
                if slug:
                    link = f"http://{custom_domain}/articles/{slug}" if custom_domain else f"http://localhost:5173/knowledge-base/{slug}"
                    links_instr.append(f"- [{title}]({link})")
            
            if links_instr:
                links_str = "\n".join(links_instr)
                prompt += (
                    f"\n\n### CRITICAL INSTRUCTION ###\n"
                    f"You MUST include markdown links to the relevant knowledge base articles at the end of your response. "
                    f"Format the links exactly as this bullet list:\n"
                    f"{links_str}\n"
                    f"Ensure you output these exact links and do not change their URLs or hallucinate the domain name."
                )
            
        logger.debug(f"Prompt constructed:\n{prompt}")

        # 5. LLM
        reply = llm.generate_reply(prompt)
        logger.info(f"Final AI Reply: {reply}")

        print(conv_data,'conv_dataconv_dataconv_data')
        
        now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
        
        # Resolve customer details from payload or fallback
        cust_id = payload.customer_id or 'customer_01'
        cust_name = payload.customer_name or 'Test Customer'
        cust_email = payload.customer_email or f"{cust_id}@acme.com"
        cust_avatar = payload.customer_avatar or (cust_name[:2].upper() if len(cust_name) >= 2 else 'TC')

        # Check if customer profile exists, if not, create it
        customer_data = database.child('customers').child(cust_id).get()
        if not isinstance(customer_data, dict):
            logger.info(f"Customer {cust_id} profile not found. Creating customer record...")
            new_customer = {
                'customer_id': cust_id,
                'name': cust_name,
                'email': cust_email,
                'avatar': cust_avatar,
                'created_at': now
            }
            database.child('customers').child(cust_id).set(new_customer)

        if not isinstance(conv_data, dict):
            logger.info(f"Conversation {payload.conversation_id} not found. Creating a new one for customer {cust_id} ({cust_name})...")
            
            cust_msg_id = f"msg_{payload.conversation_id}_01"
            cust_message = {
                'message_id': cust_msg_id,
                'conversation_id': payload.conversation_id,
                'workspace_id': 'ws_demo',
                'sender_type': 'customer',
                'sender_id': cust_id,
                'sender_name': cust_name,
                'content': payload.message,
                'created_at': now,
            }
            database.child('messages').child(cust_msg_id).set(cust_message)
            
            ai_msg_id = f"msg_{payload.conversation_id}_02"
            new_message = {
                'message_id': ai_msg_id,
                'conversation_id': payload.conversation_id,
                'workspace_id': 'ws_demo',
                'sender_type': 'agent',
                'sender_id': 'agent_01',
                'sender_name': 'AI Agent',
                'content': reply,
                'created_at': now,
            }
            database.child('messages').child(ai_msg_id).set(new_message)
            
            random_agent = random.choice(['agent_01', 'agent_02', 'agent_03', 'agent_04'])
            new_conv = {
                'conversation_id': payload.conversation_id,
                'workspace_id': 'ws_demo',
                'customer_id': cust_id,
                'assigned_agent': random_agent,
                'status': 'Open',
                'channel': 'chat',
                'priority': 'medium',
                'created_at': now,
                'last_message_at': now,
                'subject': f'{cust_name} conversation',
                'summary': 'New conversation started by AI',
                'message_count': 2,
                'message_ids': [cust_msg_id, ai_msg_id],
            }
            database.child('conversations').child(payload.conversation_id).set(new_conv)
            logger.info(f"Created conversation {payload.conversation_id} and added initial messages in Firebase.")
            logger.info("================= END AI PIPELINE =================")
            
        else:
            # If conversation exists, append the AI response
            message_count = conv_data.get('message_count', 0) + 1
            message_id = f"msg_{payload.conversation_id}_{message_count:02d}"
            
            new_message = {
                'message_id': message_id,
                'conversation_id': payload.conversation_id,
                'workspace_id': conv_data.get('workspace_id', ''),
                'sender_type': 'agent',
                'sender_id': 'agent_01',
                'sender_name': 'AI Agent',
                'content': reply,
                'created_at': now,
            }
            
            # Write message to RTDB
            database.child('messages').child(message_id).set(new_message)
            
            # Update conversation metadata
            message_ids = conv_data.get('message_ids', [])
            message_ids.append(message_id)
            database.child('conversations').child(payload.conversation_id).update({
                'message_count': message_count,
                'message_ids': message_ids,
                'last_message_at': now,
            })
            logger.info(f"AI response successfully saved as message {message_id} in Firebase.")
            logger.info("================= END AI PIPELINE =================")

        # 7. AI Response
        return AIChatResponse(
            reply=reply,
            intent=intent,
            entities=entities,
            kb_used=kb_articles,
            confidence=confidence
        )

    except Exception as e:
        logger.exception(f"Error in AI pipeline: {str(e)}")
        logger.info("================= END AI PIPELINE =================")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'success': False, 'message': 'Internal Server Error'}
        )

@router.post('/summarize', response_model=AISummaryResponse)
def summarize_conversation(
    payload: AISummaryRequest,
    conversation_service: ConversationService = Depends(get_conversation_service),
    llm: LLMService = Depends(get_llm_service),
) -> JSONResponse | AISummaryResponse:
    """
    Generates a concise summary of a long conversation.
    Focuses on: what the user wants, what's been tried, current status.
    """
    logger.info(f"================ START AI SUMMARIZATION ================")
    logger.info(f"Summarizing conversation {payload.conversation_id}")

    try:
        # Fetch up to 50 latest messages to summarize
        history = conversation_service.get_history(payload.conversation_id, limit=50)
        
        if not history:
            return AISummaryResponse(summary="No conversation history available to summarize.")

        # Format history to include role ('agent' or 'chat'), timestamp, and content
        formatted_history = []
        for msg in history:
            if not isinstance(msg, dict) or not msg.get('content'):
                continue
            role = 'agent' if msg.get('sender_type') == 'agent' or msg.get('role') == 'agent' else 'chat'
            content = msg.get('content', '')
            created_at = msg.get('created_at', '')
            time_str = f" [{created_at}]" if created_at else ""
            formatted_history.append(f'{role}{time_str}: "{content}"')
            
        history_text = "\n".join(formatted_history)
        logger.info(f"history_text:\n{history_text}")
        prompt = (
            "Please generate a concise summary of the following conversation. \n"
            "Key details to include:\n"
            "- What the user wants\n"
            "- What has been tried so far\n"
            "- The current status\n\n"
            "Keep the summary brief, professional, and easy to read for a support agent.\n\n"
            "### Conversation History ###\n"
            f"{history_text}\n"

        )
        
        logger.info("Calling LLM to generate summary...")
        summary = llm.generate_reply(prompt)
        logger.info(f"Generated Summary: {summary}")
        logger.info("================ END AI SUMMARIZATION ================")
        
        return AISummaryResponse(summary=summary)

    except Exception as e:
        logger.exception(f"Error in AI summarization: {str(e)}")
        logger.info("================ END AI SUMMARIZATION ================")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'success': False, 'message': 'Internal Server Error'}
        )
