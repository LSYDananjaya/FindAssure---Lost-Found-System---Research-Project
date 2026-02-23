
# Text Matching & Ranking Component — Semantic Lost & Found Engine

This document describes the complete flow, components, and developer steps for the text matching / ranking component implemented in this service. It focuses on converting noisy user LOST descriptions into structured attributes, retrieving candidate FOUND items, performing hybrid ranking (semantic + keyword + attributes + identifiers), logging impressions & selections, and producing training data for a re-ranker.

**Quick map:** `app/core/normalizer.py`, `app/core/semantic.py`, `app/core/retriever.py`, `app/core/scorer.py`, `app/core/impression_logger.py`, `scripts/train_reranker.py`, `scripts/batch_extract_found_attributes.py`

**Goals**
- Convert messy user text to structured JSON (attributes, keywords, must-match identifiers) using Gemini.
- Avoid calling Gemini for FOUND items at query-time by running offline extraction and caching results.
- Retrieve candidates using vector (FAISS) + keyword/BM25 + identifier lookup.
- Apply a rule-based scorer initially and replace with a trained re-ranker (LightGBM/XGBoost) when data is available.
- Log impressions, selections, and use verification outcomes as ground-truth for training.

**Architecture & Modules**
- `LostTextNormalizer` (`app/core/normalizer.py`): calls Gemini (via a client wrapper), returns the normalized JSON and caches it in Mongo collection `text_normalizations` keyed by sha256(text+category).
- `FoundTextAttributeCache` (`scripts/batch_extract_found_attributes.py` / `app/core/retriever.py`): offline job that extracts attributes from found descriptions and writes `extracted_attributes` + `keywords` into `found_items` in Mongo.
- `SemanticEngine` (`app/core/semantic.py`): holds SentenceTransformer model, FAISS index and in-memory `items_metadata`; provides vectorize, add_item, load_from_mongodb, and candidate retrieval helper.
- `CandidateRetriever` (`app/core/retriever.py`): merges identifier-first hits, FAISS vector hits (top N), and BM25/keyword hits (top M); returns deduped ordered list.
- `ReRanker` (`app/core/scorer.py`): computes pair features and scores candidates. Uses rule-based formula until an ML model (LightGBM) is loaded.
- `Logging` (`app/core/impression_logger.py`): writes `match_impressions` and `match_selections` documents to Mongo for training data later.
- `Training pipeline` (`scripts/train_reranker.py`): builds labeled pairs from impressions + selections + handover verification, trains and saves model into `data/models/reranker/`.

Request-time (online) flow
1. API receives search: category + user text. (`app/api/routes.py` `/search`)
2. `LostTextNormalizer` called (cached lookup first). Returns structured JSON with `clean_description`, `keywords`, `attributes`, `must_match_tokens`, `missing_fields`, `language_detected`.
3. `CandidateRetriever`:
	 - If `must_match_tokens` present, query Mongo for exact identifier matches and add as high-priority candidates.
	 - Vector search using FAISS to get top N (default 200).
	 - Keyword/BM25 search in Mongo text index to get top M (default 50).
	 - Merge and dedupe results preserving priority.
4. `ReRanker` computes features per (lost, found) pair (semantic_sim, keyword overlap, attribute matches, identifier matches, contradiction flags, retrieval rank, age, popularity) and either uses ML model or rule-based scoring to produce final ranking.
5. `Logging` persists an impression document containing ordered `shown_found_ids`, scores, `model_version`, `session_id`/`user_id` and `timestamp`. Impression id is returned to frontend.
6. User selection triggers a selection log (`/log/selection`) referencing the impression id. Verification service later writes verification document (`handover_verifications`) indicating if the selection was correct.

Offline / Batch jobs
- `batch_extract_found_attributes.py`: iterate `found_items` and call Gemini to extract and store `extracted_attributes` and `keywords`.
- `rebuild_index.py`: re-generate FAISS index from `found_items.vector` when items are added/changed.
- `train_reranker.py`: build dataset from `match_impressions`, `match_selections`, and `handover_verifications`, run LightGBM/XGBoost training, and export model artifact.

Data & Mongo Collections
- `found_items` — document fields: `item_id`, `description`, `category`, `created_at`, `vector` (float[]), `index_position`, `extracted_attributes` (JSON: brand, model, color, material, size, identifiers[], unique_marks[]), `keywords` (array)
- `text_normalizations` — cached normalizations keyed by sha256(text+category)
- `match_impressions` — `lost_id`, `shown_found_ids` (ordered), `shown_scores`, `model_version`, `session_id`, `user_id`, `created_at`
- `match_selections` — `impression_id`, `lost_id`, `selected_found_id`, `rank_at_selection`, `user_id`, `created_at`
- `handover_verifications` — `lost_id`, `found_id`, `verified_boolean`, `verified_at`, `verification_method`

Scoring basics (rule-based fallback)
- Normalize cosine to [0,1]. Compute
	- semantic_sim (0..1)
	- keyword_score (TF-IDF or Jaccard normalized)
	- attribute_score (weighted brand/model/color/material)
	- identifier_exact (1 or 0)
	- contradiction_penalty (0..1)
- If `identifier_exact` true → force candidate high (e.g., score 0.99+small tie-breaker). Otherwise: final = penalty * (0.55*semantic + 0.20*keyword + 0.25*attribute)

Training data builder (high level)
- For impressions where selection verified true: positive = (lost, selected_found) label=1; hard negatives = other shown candidates label=0 (prefer top-K non-selected)
- Ratio: target 1 pos : 5–10 neg

Endpoints & developer hooks
- `POST /index` — add a FOUND item (calls `SemanticEngine.add_item`) — already implemented.
- `POST /search` — new flow: normalizer -> retriever -> reranker -> log impression (returns impression id).
- `POST /log/selection` — log selection tied to an impression id.

Run & dev notes
- Env: ensure Mongo URL present in `app/config.py` settings and set `MODEL_PATH` if you have a fine-tuned embedder.
- Run server: `uvicorn app.main:app --reload`
- Extract found attributes (one-time / periodic): `python scripts/batch_extract_found_attributes.py`
- Rebuild FAISS index after updates: `python scripts/rebuild_index.py`
- Train re-ranker: `python scripts/train_reranker.py`

Monitoring & rollout
- Start with rule-based scorer and log impressions. Collect verified positives (~1k) then train re-ranker offline and run in shadow mode. A/B or gradual rollout when metrics (P@1, P@5, verification rate) improve.

