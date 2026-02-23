from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SearchQuery(BaseModel):
    text: str
    category: Optional[str] = None
    limit: Optional[int] = 10
    session_id: Optional[str] = None   # NEW: used for A/B routing + impression logging

class MatchResult(BaseModel):
    id: str
    description: str
    category: str
    score: float
    reason: str
    # NEW: enriched fields (optional — won't break existing callers)
    score_breakdown: Optional[Dict[str, Any]] = None
    model_version: Optional[str] = None

class SearchResponse(BaseModel):
    matches: List[MatchResult]
    total_matches: int = 0
    inferred_context: List[str] = []
    # NEW: logging identifiers for client to pass back on selection
    query_id: Optional[str] = None
    impression_id: Optional[str] = None

class SelectionLog(BaseModel):
    """Body for POST /log-selection — called when user selects an item."""
    impression_id: str
    query_id: str
    lost_item_raw: str
    selected_found_id: str
    selected_rank: int
