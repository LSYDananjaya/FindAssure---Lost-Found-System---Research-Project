# Vision Core Backend — FindAssure

> **Image Processing & Object Recognition Pipeline** for the FindAssure Lost & Found System

A high-performance, multi-model hybrid AI backend that **detects**, **analyzes**, **verifies**, and **re-identifies** lost items through two complementary processing phases:

| Phase | Purpose | Input | Key Output |
|-------|---------|-------|------------|
| **PP1** — Single-Image Analysis | Detect an object, extract rich metadata, generate embeddings | 1 image | Structured item profile + DINOv2 embeddings |
| **PP2** — Multi-View Verification & Fusion | Verify 3 views show the same object, fuse results, persist to DB + FAISS | 3 images | Verified fused profile + FAISS-indexed embedding |

---

## Table of Contents

- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [ML Models](#-ml-models)
- [PP1 Pipeline — Single-Image Analysis](#-pp1-pipeline--single-image-analysis)
- [PP2 Pipeline — Multi-View Verification & Fusion](#-pp2-pipeline--multi-view-verification--fusion)
- [Geometric Verification](#-geometric-verification)
- [Multi-View Fusion](#-multi-view-fusion)
- [FAISS Vector Index](#-faiss-vector-index)
- [Category Specification System (SSOT)](#-category-specification-system-ssot)
- [Database Schema](#-database-schema)
- [Storage & Caching](#-storage--caching)
- [API Reference](#-api-reference)
- [PP2 Response Schema](#-pp2-response-schema)
- [Application Lifecycle](#-application-lifecycle)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)

---

## 🏗 System Architecture

```mermaid
graph TB
    Client([Client Application])
    
    Client -->|"POST /pp1/analyze<br/>(1 image)"| PP1[PP1 Endpoint]
    Client -->|"POST /pp2/analyze_multiview<br/>(3 images)"| PP2[PP2 Endpoint]
    Client -->|"POST /pp2/verify_pair<br/>(2 images)"| VP[Verify Pair Endpoint]
    Client -->|"GET /"| HC[Health Check]
    
    subgraph FastAPI["FastAPI Application (Uvicorn)"]
        direction TB
        HC
        PP1
        PP2
        VP
    end
    
    subgraph MLServices["Shared ML Services"]
        direction LR
        YOLO["YOLOv8<br/>(Detection)"]
        FLOR["Florence-2<br/>(VLM Analysis)"]
        DINO["DINOv2<br/>(Embedding)"]
        GEMINI["Gemini 3 Flash<br/>(Reasoning)"]
    end
    
    subgraph PP2Services["PP2 Verification & Fusion Services"]
        direction LR
        GEO["Geometric Verifier<br/>(ORB + RANSAC)"]
        MVV["Multi-View Verifier<br/>(Similarity Matrices)"]
        FUS["Fusion Service<br/>(Majority Vote + Merge)"]
    end
    
    subgraph Storage["Persistence Layer"]
        direction LR
        PG[("PostgreSQL / SQLite<br/>(SQLAlchemy)")]
        REDIS[("Redis Cache<br/>(24h TTL)")]
        FAISS[("FAISS Index<br/>(128d, IndexFlatIP)")]
    end
    
    PP1 --> YOLO & FLOR & GEMINI & DINO
    PP2 --> YOLO & FLOR & DINO
    PP2 --> GEO & MVV & FUS
    VP --> YOLO & DINO & GEO & FAISS
    
    PP2 --> PG & REDIS & FAISS
    
    style FastAPI fill:#1a1a2e,stroke:#16213e,color:#e6e6e6
    style MLServices fill:#0f3460,stroke:#16213e,color:#e6e6e6
    style PP2Services fill:#533483,stroke:#16213e,color:#e6e6e6
    style Storage fill:#e94560,stroke:#16213e,color:#e6e6e6
```

---

## 🛠 Tech Stack

### Frameworks & Infrastructure

| Technology | Role |
|------------|------|
| **Python 3.10+** | Runtime |
| **FastAPI** | Async web framework |
| **Uvicorn** | ASGI server |
| **SQLAlchemy** | ORM (PostgreSQL / SQLite) |
| **psycopg2** | PostgreSQL driver |
| **Redis** (`redis-py`) | In-memory cache |
| **Pydantic Settings** | Configuration management (`.env` support) |

### Machine Learning & Computer Vision

| Technology | Role |
|------------|------|
| **PyTorch** + **Torchvision** | Deep learning backend |
| **Ultralytics** | YOLOv8 object detection |
| **Hugging Face Transformers** | Florence-2 / DINOv2 / SwinIR model inference |
| **Google GenAI SDK** | Gemini 3 Flash cloud API |
| **FAISS** (`faiss-cpu`) | Approximate nearest-neighbor vector search |
| **scikit-learn** | Cosine similarity matrices |
| **OpenCV** | ORB features, RANSAC homography, Laplacian quality |
| **Pillow** | Image I/O and basic enhancement |
| **timm** / **einops** | Model utilities |

---

## 🤖 ML Models

| Model | Role | Dimension | Status | Location |
|-------|------|-----------|--------|----------|
| **YOLOv8** (fine-tuned `final_master_model.pt`) | Object detection & localization (12 categories) | — | **Active** | `app/models/YoloV8n/` |
| **Florence-2** (Base-FT, local) | Captioning, OCR, VQA (color, defects, key count), phrase grounding | — | **Active** | `app/models/florence2-base-ft/` |
| **Florence-2** (Large-FT, local) | Extended VLM capacity | — | Available | `app/models/florence2-large-ft/` |
| **DINOv2** (`facebook/dinov2-base`) | Semantic embedding generation | 768d → 128d (Gaussian projection) | **Active** | `app/models/DINOv2/` |
| **Gemini 3 Flash** (Cloud API) | Evidence-locked reasoning & structured JSON synthesis | — | **Active** | Cloud (requires API key) |
| **SwinIR** | Image super-resolution / restoration | — | Placeholder (PIL enhancement) | `app/models/SwinIR/` |
| **LightGlue** (SuperPoint weights) | Learned feature matching | — | Weights present, **not integrated** | `app/models/LightGlue/` |
| **Qwen 2.5-VL** | Advanced VQA (drop-in Florence replacement) | — | Experimental, **not active** | `app/services/qwen_vl_service.py` |
| **Siamese Network** (ResNet-18 → 128d) | Pair-based re-identification | 128d | Architecture only, **not integrated** | `siamese_network.py` |

---

## 🔄 PP1 Pipeline — Single-Image Analysis

**Endpoint:** `POST /pp1/analyze` · **Input:** 1 image · **Orchestrator:** `app/services/unified_pipeline.py`

The PP1 pipeline takes a single image, detects objects, extracts rich visual evidence, reasons about the evidence using a cloud LLM, and generates embeddings for future similarity search.

```mermaid
graph TD
    A[📷 Client Upload] -->|"POST /pp1/analyze"| B(FastAPI Router)
    B --> C{"Validation<br/>(exactly 1 image)"}
    C -->|Pass| D["🔍 YOLOv8 Detection<br/>(conf ≥ 0.25)"]
    C -->|Fail| ERR[❌ 400 Error]
    D --> E{"Object Found?"}
    E -->|No| REJ["Rejected: No object detected"]
    E -->|Yes| F["✂️ Crop Best Detection<br/>(highest confidence)"]
    
    subgraph Florence["Florence-2 Visual Analysis"]
        direction TB
        F --> G1["📝 Dual Captioning<br/>(Detailed + Guided VQA)"]
        F --> G2["🔤 OCR Extraction"]
        F --> G3["🎨 Color VQA"]
        F --> G4["🔑 Key Count VQA<br/>(conditional: Key category)"]
        F --> G5["📍 Phrase Grounding<br/>(features/defects/attachments<br/>from CATEGORY_SPECS)"]
        F --> G6["🔗 Attachment VQA Validation"]
    end
    
    subgraph Gemini["Gemini 3 Flash — Evidence-Locked Reasoning"]
        G1 & G2 & G3 & G4 & G5 & G6 --> H["🧠 Structured JSON Synthesis<br/>(label, color, features,<br/>defects, attachments,<br/>key_count, description)"]
    end
    
    subgraph Embedding["DINOv2 Feature Extraction"]
        F --> J["🧬 CLS Token → 768d Vector"]
        J --> K["📐 Gaussian Projection → 128d Vector"]
    end
    
    H & K --> L["📦 Final Response"]
    L --> M[Client]
    
    style Florence fill:#0f3460,stroke:#16213e,color:#e6e6e6
    style Gemini fill:#533483,stroke:#16213e,color:#e6e6e6
    style Embedding fill:#e94560,stroke:#16213e,color:#e6e6e6
```

### PP1 Detailed Steps

1. **Input Validation** — Requires exactly 1 uploaded image. File is saved to `temp_uploads/`, processed, then cleaned up.
2. **Detection (YOLOv8)** — The fine-tuned model scans the full image for objects across 12 categories. Raw label strings are normalized through `canonicalize_label()` to one of the `ALLOWED_LABELS` (e.g., `"cell phone"` → `"Smart Phone"`). Confidence threshold: `0.25`.
3. **Cropping** — The highest-confidence detection's bounding box is clamped to image bounds, and the region of interest (ROI) is extracted.
4. **Visual Analysis (Florence-2)** — The `analyze_crop()` method runs a multi-task extraction:
   - **Dual Captioning** — Detailed caption + guided VQA caption, both sanitized to remove person/demographic references.
   - **OCR** — Reads text (brand names, serial numbers, "VISA", ID numbers, etc.).
   - **Color VQA** — Asks "What is the dominant color of this object?"
   - **Key Count VQA** — Conditional: only for `Key` category, asks "How many keys?"
   - **Phrase Grounding** — Uses `CATEGORY_SPECS` to physically locate features, defects, and attachments with bounding boxes. Phrases are chunked to avoid prompt overflow.
   - **Attachment VQA Validation** — Verifies detected attachments via yes/no VQA.
5. **Reasoning (Gemini 3 Flash)** — Receives the crop image + full evidence JSON. An **evidence-locked prompt** instructs Gemini to strictly synthesize (not hallucinate) structured JSON: `label`, `color`, `features`, `defects`, `attachments`, `key_count`, `description`.
6. **Embedding (DINOv2)** — The crop is embedded via the DINOv2 CLS token (768d), then projected to 128d via a deterministic random Gaussian matrix. Both vectors are returned.

---

## 🔄 PP2 Pipeline — Multi-View Verification & Fusion

**Endpoint:** `POST /pp2/analyze_multiview` · **Input:** 3 images · **Orchestrator:** `app/services/pp2_multiview_pipeline.py`

The PP2 pipeline improves re-identification accuracy by processing three different views of the same item. It independently analyzes each view, verifies they depict the same object, fuses the results into a single canonical profile, and persists everything to the database and vector index.

```mermaid
graph TD
    A["📷📷📷 Client Upload<br/>(3 images)"] -->|"POST /pp2/analyze_multiview"| VAL{"Validation<br/>(exactly 3 images)"}
    VAL -->|Fail| ERR["❌ 400 Error"]
    VAL -->|Pass| LOOP

    subgraph LOOP["Per-View Processing (×3)"]
        direction TB
        L1["Load Image"] --> L2["🔍 YOLOv8 Detect"]
        L2 --> L3["✂️ Crop Best Detection"]
        L3 --> L4["🔬 Florence-2 Extract<br/>(caption, OCR, grounding)"]
        L4 --> L5["🧬 DINOv2 Embed (128d)"]
        L5 --> L6["📊 Quality Score<br/>(Laplacian variance)"]
    end
    
    LOOP --> VER

    subgraph VER["Verification Stage"]
        direction TB
        V1["📐 3×3 Cosine Similarity Matrix<br/>(scikit-learn)"]
        V2["📐 3×3 FAISS Similarity Matrix<br/>(IndexFlatIP)"]
        V3["🔷 Pairwise Geometric Verification<br/>(ORB + RANSAC, 3 pairs)"]
        V4["🔤 Semantic Consistency Check<br/>(color contradictions)"]
        V1 & V2 & V3 & V4 --> DEC{"Decision Logic"}
    end
    
    DEC -->|"All pairs ≥ 0.85<br/>on cosine & FAISS"| PASS["✅ PASSED"]
    DEC -->|"Failed but ≥2 strong<br/>geometric pairs"| SALVAGE["✅ SALVAGED"]
    DEC -->|"Failed"| FAIL["❌ FAILED<br/>(no fusion/storage)"]
    
    PASS & SALVAGE --> FUS

    subgraph FUS["Fusion Stage"]
        direction TB
        F1["🗳 Majority Vote<br/>(category, brand, color)"]
        F2["🔤 OCR Token Union<br/>(≥3 chars, UPPER, deduped)"]
        F3["📋 Attribute Merge<br/>(with conflict tracking)"]
        F4["⚠️ Defects Union"]
        F5["⭐ Best View Selection<br/>(quality + confidence)"]
        F6["🧬 Fused Embedding<br/>(L2-norm → avg → renorm)"]
    end
    
    FUS --> STORE
    
    subgraph STORE["Storage Stage"]
        direction LR
        S1[("PostgreSQL / SQLite<br/>ItemRecord +<br/>ViewEvidence +<br/>EmbeddingRecord")]
        S2[("Redis Cache<br/>item:{uuid}<br/>TTL: 24h")]
        S3[("FAISS Index<br/>128d vector added")]
    end
    
    STORE --> RES["📦 PP2Response<br/>(item_id, per_view[3],<br/>verification, fused,<br/>stored, cache_key)"]
    FAIL --> RES
    RES --> Client([Client])
    
    style LOOP fill:#0f3460,stroke:#16213e,color:#e6e6e6
    style VER fill:#533483,stroke:#16213e,color:#e6e6e6
    style FUS fill:#1a5276,stroke:#16213e,color:#e6e6e6
    style STORE fill:#e94560,stroke:#16213e,color:#e6e6e6
```

### PP2 Detailed Steps

#### Stage 1 — Per-View Processing (×3)

For each of the 3 uploaded images:

| Step | Service | Details |
|------|---------|---------|
| **Load** | PIL | Convert `UploadFile` bytes → RGB `Image` |
| **Detect** | YOLOv8 | Find objects, select highest-confidence detection |
| **Crop** | PIL | Extract ROI with bounds clamping (fallback: full image) |
| **Extract** | Florence-2 | `analyze_crop()` → caption, OCR, grounded features |
| **Embed** | DINOv2 | `embed_128()` → 128d normalized vector (for verification) |
| **Quality** | OpenCV | Laplacian variance of grayscale crop (higher = sharper) |

#### Stage 2 — Verification

The `MultiViewVerifier` determines whether all 3 views depict the same physical object:

1. **Cosine Similarity Matrix** (3×3) — via `sklearn.metrics.pairwise.cosine_similarity` on the 128d vectors.
2. **FAISS Similarity Matrix** (3×3) — via `FaissService.pair_similarity()` using temporary `IndexFlatIP` with L2-normalized inner product.
3. **Geometric Verification** (3 pairs) — ORB + RANSAC (see [Geometric Verification](#-geometric-verification) below).
4. **Semantic Consistency** — Flags if all 3 views report completely different colors.

**Decision Logic:**

| Condition | Result |
|-----------|--------|
| All 3 pairs have cosine ≥ `0.85` **AND** FAISS ≥ `0.85` | **PASS** |
| Embedding check failed, but ≥ 2 geometric pairs have `inlier_ratio ≥ 0.15` | **SALVAGE** (pass with note) |
| Neither condition met | **FAIL** (no fusion or storage) |

#### Stage 3 — Fusion (if passed)

See [Multi-View Fusion](#-multi-view-fusion).

#### Stage 4 — Storage (if passed)

See [Storage & Caching](#-storage--caching).

---

## 🔷 Geometric Verification

**Service:** `app/services/pp2_geometric_verifier.py`

Determines whether two cropped images share enough structural/geometric consistency to be considered views of the same physical object.

```mermaid
graph LR
    A["Crop A"] --> ORB["ORB Feature Detector<br/>(2000 features)"]
    B["Crop B"] --> ORB
    ORB --> BF["BFMatcher<br/>(Hamming distance)"]
    BF --> LOWE["Lowe's Ratio Test<br/>(threshold: 0.75)"]
    LOWE --> RANSAC["RANSAC Homography<br/>(reprojection: 5.0px)"]
    RANSAC --> METRICS["Metrics"]
    
    METRICS --> M1["good_matches"]
    METRICS --> M2["inliers"]
    METRICS --> M3["inlier_ratio"]
    
    M1 & M2 & M3 --> DECISION{"Pass?"}
    DECISION -->|"≥30 good matches<br/>≥15 inliers<br/>≥0.15 inlier ratio"| PASS["✅ Passed"]
    DECISION -->|"Below thresholds"| FAIL["❌ Failed"]
    
    style PASS fill:#27ae60,stroke:#1e8449,color:#fff
    style FAIL fill:#e74c3c,stroke:#c0392b,color:#fff
```

### Thresholds

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `nfeatures` | 2000 | Max ORB keypoints per image |
| Lowe's ratio | 0.75 | Filter ambiguous matches |
| `MIN_GOOD_MATCHES` | 30 | Minimum matches after ratio test |
| `MIN_INLIERS` | 15 | Minimum RANSAC inliers |
| `MIN_INLIER_RATIO` | 0.15 | Inliers / good matches |
| RANSAC reprojection | 5.0 px | Homography error tolerance |

The `verify_triplet()` method runs all 3 pairwise combinations `(0-1, 0-2, 1-2)` and returns results for each pair.

---

## 🔀 Multi-View Fusion

**Service:** `app/services/pp2_fusion_service.py`

Merges the 3 per-view results into a single canonical item profile:

| Aspect | Strategy |
|--------|----------|
| **Category** | Majority vote (>50%); fallback to best view |
| **Brand** | Majority vote; fallback to best view |
| **Color** | Majority vote; fallback to best view |
| **Caption** | Best view caption (all captions stored in attributes) |
| **OCR Tokens** | Union across all views; tokens ≥ 3 chars, uppercased, deduplicated, sorted |
| **Attributes** | Merge all `grounded_features` keys; single value if unanimous, list if conflicting; conflicts tracked in `attributes.conflicts` |
| **Defects** | Union of all defect strings across views, sorted |
| **Best View** | Highest `quality_score`; tie-break by detection `confidence` |
| **Fused Embedding** | L2-normalize each 128d vector → elementwise average → renormalize |

Conflicts are recorded transparently:

```json
{
  "conflicts": {
    "color": "No majority. Candidates: {'black': 1, 'brown': 1, 'dark brown': 1}. Picked best view: black"
  }
}
```

---

## 📊 FAISS Vector Index

**Service:** `app/services/faiss_service.py`

A thread-safe wrapper around Facebook AI Similarity Search for fast nearest-neighbor retrieval:

| Property | Value |
|----------|-------|
| **Index Type** | `IndexFlatIP` (inner product on L2-normalized vectors = cosine similarity) |
| **Dimension** | 128 |
| **Persistence** | Saved to disk on shutdown; loaded on startup |
| **Index File** | `data/faiss.index` |
| **Mapping File** | `data/faiss_mapping.json` (faiss_id → item metadata) |
| **Thread Safety** | `threading.Lock` on all mutations |

### Operations

| Method | Description |
|--------|-------------|
| `load_or_create()` | Load existing index from disk or create a new empty one. Validates dimension match. |
| `add(vector, metadata)` | Normalize, add to index, store metadata mapping. Returns `faiss_id`. |
| `search(vector, top_k=5)` | Find `top_k` most similar vectors. Returns scores + metadata. |
| `pair_similarity(vec_a, vec_b)` | Cosine similarity between two arbitrary vectors (uses temporary index). |
| `save()` | Persist index + mapping to disk. |

---

## 🏷 Category Specification System (SSOT)

**File:** `app/domain/category_specs.py`

The **Single Source of Truth** for all recognized item categories, driving both Florence-2 phrase grounding and Gemini reasoning.

### Allowed Labels (12 categories)

| # | Category | Example Aliases |
|---|----------|-----------------|
| 1 | **Wallet** | billfold |
| 2 | **Handbag** | bag, purse, tote |
| 3 | **Backpack** | rucksack |
| 4 | **Laptop** | computer, notebook |
| 5 | **Smart Phone** | phone, mobile, cell |
| 6 | **Helmet** | — |
| 7 | **Key** | — |
| 8 | **Power Bank** | — |
| 9 | **Laptop/Mobile chargers & cables** | charger, cable, wire |
| 10 | **Earbuds - Earbuds case** | airpod |
| 11 | **Headphone** | headset |
| 12 | **Student ID** | id, card |

### Category Specs Structure

Each category defines three lists used for Florence-2 phrase grounding:

```
CATEGORY_SPECS[label] = {
    "features":    [...],  # Visual characteristics to locate (logo, zipper, ports, etc.)
    "defects":     [...],  # Damage indicators to detect (scratch, crack, frayed cable, etc.)
    "attachments": [...],  # Connected accessories to verify (strap, case, cable, etc.)
}
```

The `canonicalize_label(raw_label)` function maps raw detection strings and common aliases to one of the 12 canonical labels via case-insensitive partial matching.

---

## 🗄 Database Schema

**ORM:** SQLAlchemy · **File:** `app/models/item_models.py`

```mermaid
erDiagram
    items ||--o{ view_evidence : "has views"
    items ||--o{ embeddings : "has embeddings"
    
    items {
        UUID id PK
        DateTime created_at
        String category
        Integer best_view_index
        JSON attributes_json
        JSON defects_json
    }
    
    view_evidence {
        Integer id PK
        UUID item_id FK
        Integer view_index
        String filename
        Text caption
        Text ocr_text
        Float quality_score
        JSON bbox_json
        JSON grounded_json
    }
    
    embeddings {
        Integer id PK
        UUID item_id FK
        Integer view_index
        Integer dim
        BigInteger faiss_id
        LargeBinary vector_bytes
        DateTime created_at
    }
```

| Table | Records | Purpose |
|-------|---------|---------|
| **items** | 1 per multi-view analysis | Master item record with fused attributes |
| **view_evidence** | 3 per item | Per-view detection data, captions, OCR, quality |
| **embeddings** | 1 per item (fused) | Links to FAISS index via `faiss_id`, stores dimensionality |

---

## 💾 Storage & Caching

**Service:** `app/services/storage_service.py`

When PP2 verification passes, the `StorageService` persists results in a single atomic operation:

```mermaid
graph LR
    FUS["Fused Profile"] --> DB["PostgreSQL / SQLite<br/>(ItemRecord + ViewEvidence<br/>+ EmbeddingRecord)"]
    FUS --> REDIS["Redis Cache<br/>key: item:{uuid}<br/>TTL: 86400s (24h)"]
    FUS --> FAISS["FAISS Index<br/>(128d vector added)"]
    
    DB -.->|"Rollback on failure"| DB
    REDIS -.->|"Warning on failure<br/>(non-blocking)"| REDIS
    
    style DB fill:#2c3e50,stroke:#1a252f,color:#ecf0f1
    style REDIS fill:#c0392b,stroke:#962d22,color:#ecf0f1
    style FAISS fill:#2980b9,stroke:#1f6692,color:#ecf0f1
```

| Layer | Mechanism | Failure Behavior |
|-------|-----------|------------------|
| **Database** | SQLAlchemy transaction (`commit` / `rollback`) | Rolls back entire transaction |
| **Redis** | `SETEX` with 24h TTL, key format: `item:{uuid}` | Logs warning, does not fail main operation |
| **FAISS** | `add()` with metadata mapping | Added during pipeline; saved to disk on shutdown |

---

## 🔌 API Reference

| Method | Path | Input | Output | Description |
|--------|------|-------|--------|-------------|
| `GET` | `/` | — | `{"message": "Vision Core Backend is running."}` | Health check |
| `POST` | `/pp1/analyze` | `multipart/form-data`: 1 file (`files`) | JSON array of detection results | Single-image analysis (YOLO → Florence → Gemini → DINOv2) |
| `POST` | `/analyze` | — | `400` error | **Deprecated** — redirects to `/pp1/analyze` |
| `POST` | `/pp2/analyze_multiview` | `multipart/form-data`: 3 files (`files`) | `PP2Response` JSON | Full multi-view pipeline (detect → extract → verify → fuse → store) |
| `POST` | `/pp2/verify_pair` | `multipart/form-data`: 2 files (`files`) | `PP2VerifyPairResponse` JSON | Quick pair verification (detect → crop → embed → FAISS sim + geometric check) |

### `POST /pp1/analyze` — Response Structure

```json
{
  "status": "accepted",
  "message": "Success",
  "item_id": "uuid-string",
  "image": { "image_id": "uuid", "filename": "photo.jpg" },
  "label": "Wallet",
  "confidence": 0.92,
  "bbox": [x1, y1, x2, y2],
  "color": "Black",
  "ocr_text": "VISA",
  "final_description": "A black leather wallet with...",
  "category_details": {
    "features": ["logo", "card slots"],
    "defects": ["scratch"],
    "attachments": ["chain attached"]
  },
  "key_count": null,
  "tags": ["leather", "bi-fold"],
  "embeddings": {
    "vector_128d": [0.012, -0.034, ...],
    "vector_dinov2": [0.001, 0.045, ...]
  },
  "raw": {
    "yolo": { "label": "Wallet", "confidence": 0.92, "bbox": [...] },
    "florence": { "caption": "...", "ocr_text": "...", ... },
    "gemini": { ... }
  }
}
```

### `POST /pp2/verify_pair` — Response Structure

```json
{
  "cosine_like_score_faiss": 0.91,
  "geometric": {
    "num_keypoints_a": 500,
    "num_keypoints_b": 480,
    "num_matches": 200,
    "num_good_matches": 85,
    "num_inliers": 42,
    "inlier_ratio": 0.49,
    "passed": true
  },
  "passed": true,
  "threshold": 0.85
}
```

---

## 📋 PP2 Response Schema

The full `PP2Response` returned by `/pp2/analyze_multiview`:

```json
{
  "item_id": "uuid-string",
  "per_view": [
    {
      "view_index": 0,
      "filename": "front.jpg",
      "detection": {
        "bbox": [x1, y1, x2, y2],
        "cls_name": "Wallet",
        "confidence": 0.94
      },
      "extraction": {
        "caption": "A brown leather wallet with visible brand logo",
        "ocr_text": "TOMMY HILFIGER",
        "grounded_features": { "logo": [...], "color": "brown" },
        "extraction_confidence": 1.0
      },
      "embedding": {
        "dim": 128,
        "vector_preview": [0.012, -0.034, 0.056, ...],
        "vector_id": "uuid_view_0"
      },
      "quality_score": 245.7
    }
    // ... (×3 views total)
  ],
  "verification": {
    "cosine_sim_matrix": [[1.0, 0.92, 0.89], [0.92, 1.0, 0.91], [0.89, 0.91, 1.0]],
    "faiss_sim_matrix": [[1.0, 0.91, 0.88], [0.91, 1.0, 0.90], [0.88, 0.90, 1.0]],
    "geometric_scores": {
      "0-1": { "num_good_matches": 85, "num_inliers": 42, "inlier_ratio": 0.49, "passed": true },
      "0-2": { "...": "..." },
      "1-2": { "...": "..." }
    },
    "passed": true,
    "failure_reasons": []
  },
  "fused": {
    "category": "Wallet",
    "brand": "Tommy Hilfiger",
    "color": "Brown",
    "caption": "A brown leather wallet with visible brand logo",
    "merged_ocr_tokens": ["HILFIGER", "TOMMY"],
    "attributes": { "logo": "brand logo", "conflicts": {}, "captions": {"view_0": "...", "view_1": "...", "view_2": "..."} },
    "defects": ["scratch"],
    "best_view_index": 0,
    "fused_embedding_id": "uuid_fused"
  },
  "stored": true,
  "cache_key": "item:uuid-string"
}
```

---

## 🔄 Application Lifecycle

**File:** `app/core/lifespan.py`

The FastAPI lifespan context manager controls startup and shutdown behavior:

```mermaid
graph TD
    subgraph Startup["🚀 Startup Sequence"]
        direction TB
        S1["Create data/ directory"] --> S2["Ping Redis"]
        S2 --> S3["Configure DB engine"]
        S3 --> S4["Initialize FAISS<br/>(load or create, dim=128)"]
        S4 --> S5["Load YoloService"]
        S5 --> S6["Load FlorenceService"]
        S6 --> S7["Load DINOEmbedder"]
        S7 --> S8["Create GeometricVerifier"]
        S8 --> S9["Create MultiViewVerifier"]
        S9 --> S10["Create MultiViewFusionService"]
        S10 --> S11["Assemble MultiViewPipeline"]
        S11 --> S12["Store in app.state"]
    end
    
    S12 --> APP["Application Running"]
    
    subgraph Shutdown["🛑 Shutdown Sequence"]
        direction TB
        D1["Save FAISS index to disk"] --> D2["Clear app.state"]
        D2 --> D3["Close Redis connection"]
    end
    
    APP --> D1
    
    style Startup fill:#1a5276,stroke:#154360,color:#ecf0f1
    style Shutdown fill:#922b21,stroke:#78281f,color:#ecf0f1
```

> **Note:** PP1's `UnifiedPipeline` is instantiated directly in `app/main.py` (not via lifespan), loading its own copies of YOLO, Florence, DINOv2, and Gemini services.

---

## 📂 Project Structure

```
├── app/
│   ├── main.py                          # FastAPI app, PP1 endpoint, CORS, lifespan
│   ├── __init__.py
│   ├── config/
│   │   ├── settings.py                  # Pydantic Settings (.env, defaults)
│   │   └── model_paths.py               # Model weight path resolution
│   ├── core/
│   │   ├── db.py                        # SQLAlchemy engine, session, Base
│   │   ├── lifespan.py                  # Startup/shutdown lifecycle manager
│   │   └── redis_client.py              # Redis singleton client
│   ├── domain/
│   │   └── category_specs.py            # SSOT: 12 categories, specs, canonicalize_label()
│   ├── models/                          # Local model weights & configs
│   │   ├── DINOv2/                      # Meta DINOv2 (dinov2-base)
│   │   ├── florence2-base-ft/           # Microsoft Florence-2 Base (fine-tuned)
│   │   ├── florence2-large-ft/          # Microsoft Florence-2 Large (fine-tuned)
│   │   ├── LightGlue/                   # SuperPoint + LightGlue weights
│   │   ├── SwinIR/                      # SwinIR restoration model
│   │   ├── YoloV8n/                     # Fine-tuned YOLOv8 (final_master_model.pt)
│   │   └── item_models.py              # SQLAlchemy ORM models
│   ├── routers/
│   │   └── pp2_router.py               # PP2 endpoints (analyze_multiview, verify_pair)
│   ├── schemas/
│   │   └── pp2_schemas.py              # Pydantic models for PP2 request/response
│   └── services/
│       ├── unified_pipeline.py          # PP1 orchestrator (YOLO → Florence → Gemini → DINOv2)
│       ├── pp2_multiview_pipeline.py    # PP2 orchestrator (per-view → verify → fuse → store)
│       ├── pp2_multiview_verifier.py    # Multi-view verification (cosine + FAISS + geometric)
│       ├── pp2_geometric_verifier.py    # Geometric verification (ORB + RANSAC)
│       ├── pp2_fusion_service.py        # Multi-view fusion (majority vote, merge, fused embedding)
│       ├── yolo_service.py              # YOLOv8 wrapper
│       ├── florence_service.py          # Florence-2 wrapper (caption, OCR, VQA, grounding)
│       ├── gemini_reasoner.py           # Gemini 3 Flash wrapper (evidence-locked reasoning)
│       ├── dino_embedder.py             # DINOv2 wrapper (768d + 128d projection)
│       ├── faiss_service.py             # FAISS vector index (IndexFlatIP, 128d)
│       ├── storage_service.py           # DB + Redis persistence
│       ├── swinir_enhancer.py           # SwinIR wrapper (currently: PIL placeholder)
│       ├── qwen_vl_service.py           # Qwen 2.5-VL wrapper (experimental, not active)
│       └── pp2_services.py              # Legacy stub implementations (superseded)
├── data/
│   ├── faiss.index                      # Persisted FAISS index
│   └── faiss_mapping.json               # FAISS ID → item metadata mapping
├── groundingdino/
│   ├── config/                          # GroundingDINO configuration
│   └── weights/                         # GroundingDINO weights
├── tests/
│   ├── test_pp2_api.py                  # Integration test (mocked services)
│   ├── test_pp2_geometric.py            # Geometric verifier unit tests
│   └── test_pp2_verifier.py             # Multi-view verifier + FAISS unit tests
├── temp_uploads/                        # Temporary file storage (auto-cleanup)
├── weights/                             # Additional weight files
├── siamese_network.py                   # Siamese Network architecture (ResNet-18, not integrated)
├── run_server.py                        # Uvicorn launcher (host=0.0.0.0, port=8000)
├── requirements.txt                     # Python dependencies
└── OVERVIEW.md                          # Brief PP1 overview
```

---

## ⚡ Setup & Installation

### Prerequisites

| Requirement | Details |
|-------------|---------|
| **Python** | 3.10 or higher |
| **GPU** | NVIDIA GPU with CUDA 11.8+ (recommended for model inference) |
| **Redis** | Running Redis server (for caching; pipeline works without it but logs warnings) |
| **PostgreSQL** | Optional (default: SQLite at `data/app.db`) |
| **Gemini API Key** | Required for PP1 reasoning via Google GenAI SDK |

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Image-Processing-&-Object-Recognition-Pipeline
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   # Linux/macOS
   source venv/bin/activate
   # Windows
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download model weights:**
   Ensure all model weights are placed in their respective directories under `app/models/`:
   - `app/models/DINOv2/` — DINOv2 base (`model.safetensors`, `config.json`, `preprocessor_config.json`)
   - `app/models/florence2-base-ft/` — Florence-2 base fine-tuned (all model files)
   - `app/models/YoloV8n/final_master_model.pt` — Fine-tuned YOLOv8 weights
   - `app/models/SwinIR/` — SwinIR weights (optional)
   - `app/models/LightGlue/` — SuperPoint + LightGlue weights (optional, not currently integrated)

5. **Configure environment:**
   Create a `.env` file in the project root:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   REDIS_URL=redis://localhost:6379/0
   DATABASE_URL=sqlite:///./data/app.db
   ```

6. **Start the server:**
   ```bash
   python run_server.py
   ```

   The API will be available at:
   - **Base URL:** `http://0.0.0.0:8000`
   - **Swagger UI:** `http://0.0.0.0:8000/docs`
   - **ReDoc:** `http://0.0.0.0:8000/redoc`

---

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | **Yes** | — | Google Gemini API key (also accepts `GEMINI_API_KEY`) |
| `REDIS_URL` | No | `redis://localhost:6379/0` | Redis connection URL |
| `DATABASE_URL` | No | `sqlite:///./data/app.db` | SQLAlchemy database URL (PostgreSQL or SQLite) |
| `FAISS_INDEX_PATH` | No | `./data/faiss.index` | Path to persist FAISS index |
| `FAISS_MAPPING_PATH` | No | `./data/faiss_mapping.json` | Path to persist FAISS metadata mapping |
| `PP2_SIM_THRESHOLD` | No | `0.85` | Cosine/FAISS similarity threshold for PP2 verification |
| `VERIFY_THRESHOLD` | No | `0.85` | Similarity threshold for `/pp2/verify_pair` |
| `BASE_MODELS_DIR` | No | `app/models/` | Root directory for model weights |
| `QWEN_VL_MODEL_PATH` | No | `{BASE_MODELS_DIR}/Qwen2.5-VL-3B-Instruct` | Qwen-VL model path (if using experimental service) |

---

## 🧪 Testing

The test suite covers the PP2 pipeline components:

| Test File | Type | Coverage |
|-----------|------|----------|
| `tests/test_pp2_api.py` | Integration | Mocks all ML services, tests `POST /pp2/analyze_multiview` with 3 fake images, verifies 200 response and correct `item_id` |
| `tests/test_pp2_geometric.py` | Unit | Tests `GeometricVerifier.verify_pair()` with identical images (should pass) and noise images (should fail) |
| `tests/test_pp2_verifier.py` | Unit | Tests cosine matrix computation, verification pass/fail logic with mocked geometric service, `FaissService.pair_similarity` for identical and orthogonal vectors |

### Running Tests

```bash
# Run all tests
pytest tests/ -v

# Run a specific test file
pytest tests/test_pp2_geometric.py -v

# Run with output
pytest tests/ -v -s
```

---

## 📄 License

This project is part of the **FindAssure Lost & Found System** research project.
