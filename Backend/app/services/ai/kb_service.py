import re
from typing import Any
from app.firebase import database

def _slugify(value: str) -> str:
    cleaned = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return cleaned or 'article'

class KnowledgeBaseService:
    """
    Service for retrieving relevant knowledge base articles.
    """

    def search_articles(self, query: str) -> list[dict[str, Any]]:
        """
        Return the top 5 articles matching the query.
        For now, this performs a basic keyword match against the Firebase KB,
        or returns static articles if none match, simulating a semantic search.
        """
        all_articles = database.child('knowledge_base').get()
        results = []
        
        if isinstance(all_articles, dict):
            for article_id, article in all_articles.items():
                if isinstance(article, dict):
                    text_to_search = f"{article.get('title', '')} {article.get('excerpt', '')}".lower()
                    if any(word in text_to_search for word in query.lower().split()):
                        results.append({
                            'article_id': article_id,
                            'slug': article.get('slug') or _slugify(article.get('title', '')),
                            'title': article.get('title'),
                            'content': article.get('body', article.get('excerpt')),
                            'category': article.get('category', 'Support')
                        })
                        if len(results) >= 5:
                            break
                            
        # If no strict match, just return the first 3 as general context
        if not results and isinstance(all_articles, dict):
            for article_id, article in list(all_articles.items())[:3]:
                 if isinstance(article, dict):
                     results.append({
                            'article_id': article_id,
                            'slug': article.get('slug') or _slugify(article.get('title', '')),
                            'title': article.get('title'),
                            'content': article.get('body', article.get('excerpt')),
                            'category': article.get('category', 'Support')
                     })

        # Fallback if no matching articles found
        if not results:
            results.append({
                'article_id': 'contact-support',
                'slug': 'contact-support',
                'title': 'Contact Support',
                'content': 'If you cannot find the answer you are looking for, please reach out to our human support team.',
                'category': 'General'
            })
            
        return results
