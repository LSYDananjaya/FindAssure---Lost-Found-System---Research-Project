from fastapi import APIRouter, BackgroundTasks, Depends
from app.schemas.item import ItemCreate
from app.schemas.search import SearchQuery, SearchResponse, MatchResult, SelectionLog
from app.core.semantic import SemanticEngine
from app.core.modeling import DataModelingEngine
from app.core.fraud import FraudDetectionEngine
from app.core.scorer import inference_rerank
from app.core.impression_logger import ImpressionLogger
from app.core.database import get_database
import logging
import uuid

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency Injection
def get_semantic():
    return SemanticEngine()

def get_modeling():
    return DataModelingEngine()

def get_fraud():
    return FraudDetectionEngine()

def get_db():
    return get_database()


# ---------------------------------------------------------------------------
# POST /index — Add a found item (unchanged behaviour; adds Gemini batch trigger)
# ---------------------------------------------------------------------------

@router.post("/index", summary="Add Found Item to Database")
async def index_item(item: ItemCreate, engine: SemanticEngine = Depends(get_semantic)):
    """Add a FOUND item to the database for future matching."""
    item_id = await engine.add_item(item.dict())
    return {
        "message": "Found item added successfully",
        "item_id": item_id,
        "status": "indexed",
        "note": "Run scripts/batch_extract_found_attributes.py to pre-extract Gemini attributes for this item.",
    }


# ---------------------------------------------------------------------------
# POST /search — Main endpoint  (now uses full hybrid pipeline)
# ---------------------------------------------------------------------------

@router.post("/search", response_model=SearchResponse, summary="Search for Lost Item")
async def search_items(
    query: SearchQuery,
    db=Depends(get_db),
    modeling: DataModelingEngine = Depends(get_modeling),
):
    """
    Search for a LOST item using the full AI-powered pipeline:
      1. Gemini text normalization + attribute extraction (cached)
      2. FAISS vector search + MongoDB text keyword search
      3. Feature computation per candidate
      4. Rule-based scoring (or LightGBM when deployed)
      5. Async impression logging

    Response includes query_id and impression_id — pass these to /log-selection
    when the user selects an item.
    """
    session_id = query.session_id or str(uuid.uuid4())

    # --- Full pipeline (Gemini normalizer + hybrid retrieval + scoring) ---
    try:
        pipeline_result = await inference_rerank(
            db=db,
            raw_lost_text=query.text,
            category=query.category or "",
            session_id=session_id,
            top_k=query.limit or 10,
        )
    except Exception as e:
        logger.error(f"Pipeline error: {e} — falling back to legacy search")
        pipeline_result = None

    # --- Fallback to legacy SemanticEngine if pipeline fails ---
    if pipeline_result is None or not pipeline_result.get("ranked_results"):
        logger.warning("Pipeline returned empty — using legacy SemanticEngine fallback")
        engine = SemanticEngine()
        raw_results = engine.search(
            query.text,
            limit=query.limit or 10,
            category_filter=query.category if query.category else None,
        )
        context_suggestions = []
        if query.category:
            context_suggestions = modeling.get_context(query.category)

        formatted_matches = []
        for res in raw_results:
            reason_parts = [
                f"Raw Cosine: {res['raw_cosine_similarity']:.4f}",
                f"Vector: {res['vector_score']}%",
                f"Keyword: {res['keyword_score']}%",
            ]
            formatted_matches.append(MatchResult(
                id=res["item"]["id"],
                description=res["item"]["description"],
                category=res["item"]["category"],
                score=res["semantic_score"],
                reason=" | ".join(reason_parts),
            ))

        return SearchResponse(
            matches=formatted_matches,
            total_matches=len(formatted_matches),
            inferred_context=context_suggestions,
        )

    # --- Format full pipeline results ---
    context_suggestions = []
    if query.category:
        try:
            context_suggestions = modeling.get_context(query.category)
        except Exception:
            pass

    formatted_matches = []
    for r in pipeline_result["ranked_results"]:
        breakdown = r.get("score_breakdown") or {}
        reason_parts = [
            f"Score: {r['score']:.4f}",
            f"Semantic: {breakdown.get('f_semantic_sim', '?')}",
            f"BM25: {breakdown.get('f_bm25_score_norm', '?')}",
            f"Attr: brand={breakdown.get('f_attr_brand_match', '?')}"
               f"/color={breakdown.get('f_attr_color_match', '?')}",
            f"Model: {r.get('model_version', 'rule_based_v1')}",
        ]
        formatted_matches.append(MatchResult(
            id=r["found_id"],
            description=r.get("description", ""),
            category=r.get("category", ""),
            score=r["score"],
            reason=" | ".join(reason_parts),
            score_breakdown=breakdown,
            model_version=r.get("model_version"),
        ))

    return SearchResponse(
        matches=formatted_matches,
        total_matches=len(formatted_matches),
        inferred_context=context_suggestions,
        query_id=pipeline_result.get("query_id"),
        impression_id=pipeline_result.get("impression_id"),
    )


# ---------------------------------------------------------------------------
# POST /log-selection — Called when user selects a result
# ---------------------------------------------------------------------------

@router.post("/log-selection", summary="Log User Item Selection")
async def log_selection(payload: SelectionLog, db=Depends(get_db)):
    """
    Log which item the user selected from the ranked list.
    Call this endpoint from the frontend when user clicks/selects a result.

    Body fields:
      - impression_id:     from the /search response
      - query_id:          from the /search response
      - lost_item_raw:     original search text
      - selected_found_id: the found_id of the item selected
      - selected_rank:     1-indexed rank position of selected item
    """
    impression_logger = ImpressionLogger()
    success = await impression_logger.log_selection(
        db=db,
        impression_id=payload.impression_id,
        query_id=payload.query_id,
        lost_raw=payload.lost_item_raw,
        selected_found_id=payload.selected_found_id,
        selected_rank=payload.selected_rank,
    )
    return {"status": "ok" if success else "skipped", "logged": success}


# ---------------------------------------------------------------------------
# POST /fraud-check — Unchanged
# ---------------------------------------------------------------------------

@router.post("/fraud-check", summary="Check User Behavior for Fraud")
def check_fraud(user_metadata: dict, fraud_engine: FraudDetectionEngine = Depends(get_fraud)):
    result = fraud_engine.predict_fraud(user_metadata)
    return result