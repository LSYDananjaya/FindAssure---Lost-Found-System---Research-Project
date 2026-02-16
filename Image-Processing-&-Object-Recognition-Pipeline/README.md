# Vision Core Backend - FindAssure

This repository contains the **Image Processing & Object Recognition Pipeline** for the FindAssure Lost & Found System. It is a high-performance, multi-model hybrid AI system designed to detect, analyze, reasoned about, and re-identify lost items.

## 🚀 Overview

The Vision Core Backend is a **FastAPI** service that orchestrates a sophisticated pipeline combining local real-time detection with large-scale vision-language models (VLMs) and cloud-based reasoning.

### Key Capabilities
- **Object Detection:** Accurately localizes items using fine-tuned **YOLOv8** models.
- **Visual Understanding:** Leverages **Florence-2** for detailed captioning, OCR, and visual question answering (VQA).
- **Sematic Reasoning:** Uses **Google Gemini 3 Flash** to synthesize visual evidence into structured, searchable metadata.
- **Deep Feature Extraction:** Generates high-dimensional semantic embeddings using **DINOv2** for precise visual similarity search (ReID).
- **Image Enhancement:** (Available) Includes **SwinIR** for restoring low-quality user uploads.

---

## 🛠 Tech Stack

### Frameworks & Languages
- **Python 3.10+**
- **FastAPI** (Web Server)
- **Uvicorn** (ASGI Server)

### Machine Learning & AI
- **PyTorch** & **Torchvision** (Deep Learning Backend)
- **Ultralytics YOLO** (Object Detection)
- **Hugging Face Transformers** (Model Inference)
- **Google GenAI SDK** (Gemini 1.5/3 Interface)
- **FAISS** (Vector Similarity Search)
- **OpenCV** & **Pillow** (Image Processing)

### Key Models
| Model | Role | Implementation |
|-------|------|----------------|
| **YOLOv8** (Fine-tuned) | Object Detection & Localization | `app/services/yolo_service.py` |
| **Florence-2** (Base-FT) | Captioning, OCR, VQA, Grounding | `app/services/florence_service.py` |
| **DINOv2** | Semantic Embedding (768d + 128d) | `app/services/dino_embedder.py` |
| **Gemini 3 Flash** | Reasoning & Data Synthesis | `app/services/gemini_reasoner.py` |
| **SwinIR** | Image Super-Resolution/Restoration | `app/services/swinir_enhancer.py` |
| **Qwen 2.5 VL** | (Experimental) Advanced VQA | `app/services/qwen_vl_service.py` |

---

## 🔄 Process Flow (PP1 Pipeline)

The primary entry point is the **PP1 Analysis Pipeline**, processed via the `/pp1/analyze` endpoint.

```mermaid
graph TD
    A[Client Upload] -->|POST /pp1/analyze| B(FastAPI Router)
    B --> C{Validation}
    C -->|Success| D[YOLOv8 Detection]
    D --> E{Object Selection}
    E -->|Best Match| F[Crop Object]
    
    subgraph Analysis Phase
    F --> G[Florence-2]
    G -->|Generate| G1[Detailed Caption]
    G -->|Extract| G2[OCR Text]
    G -->|Analyze| G3[VQA (Color, Count)]
    G -->|Locate| G4[Feature Grounding]
    end
    
    subgraph Reasoning Phase
    G1 & G2 & G3 & G4 --> H[Gemini 3 Flash]
    H -->|Synthesize| I[Structured JSON Metadata]
    end
    
    subgraph Feature Extraction
    F --> J[DINOv2]
    J -->|Embedding| K[768d + 128d Vectors]
    end
    
    I & K --> L[Final Response Construct]
    L --> M[Client Response]
```

### Detailed Steps:
1.  **Input Validation**: Ensures a single valid image file is uploaded.
2.  **Detection (YOLO)**: Scans the entire image to find potential lost items. Matches results against a canonical list (e.g., Wallet, Phone, Keys).
3.  **Cropping**: Extracts the region of interest (ROI) for the highest-confidence object.
4.  **Visual Processing (Florence-2)**:
    - **Captioning**: "A black leather wallet..."
    - **OCR**: Reads text like "VISA" or ID numbers.
    - **Grounding**: Physically locates defects (scratches) or features (zippers) defined in `category_specs.py`.
5.  **Reasoning (Gemini)**: Takes the raw visual signals and strictly formats them into a schema (Validation, Color mapping, Brand extraction).
6.  **Embedding (DINOv2)**: Converts the visual appearance into a mathematical vector for future similarity searching.

---

## 📂 Project Structure

```
├── app/
│   ├── main.py                 # FastAPI Entry Point
│   ├── config/                 # Configuration & Model Paths
│   ├── core/                   # Core utilities
│   ├── domain/                 # Domain logic (Category Specifications)
│   ├── models/                 # Local Model Weights & Configs
│   │   ├── florence2-base-ft/  # Microsoft Florence-2 Weights
│   │   ├── DINOv2/             # Meta DINOv2 Weights
│   │   ├── YoloV8n/            # YOLO Weights
│   │   └── ...                 # Other models (SwinIR, Qwen, etc.)
│   ├── routers/                # API Route Definitions
│   ├── schemas/                # Pydantic Data Schemas
│   └── services/               # Business Logic & Model Wrappers
│       ├── unified_pipeline.py # Main Orchestrator
│       ├── florence_service.py # Florence-2 Wrapper
│       ├── gemini_reasoner.py  # Google Gemini Wrapper
│       ├── yolo_service.py     # YOLO Wrapper
│       └── ...
├── run_server.py               # Server Startup Script
├── requirements.txt            # Python Dependencies
└── OVERVIEW.md                 # Brief System Overview
```

---

## ⚡ Setup & Installation

### Prerequisites
- Python 3.10 or higher
- NVIDIA GPU (CUDA 11.8+ recommended) for inference performance.
- Google Cloud API Key (for Gemini).

### Installation
1.  **Clone the repository**.
2.  **Create a Virtual Environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```
3.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

### Configuration
1.  **Environment Variables**:
    Create a `.env` file or set the following in your environment:
    ```bash
    export GOOGLE_API_KEY="your_gemini_api_key_here"
    ```
2.  **Model Weights**:
    Ensure all model weights (safetensors/pt files) are downloaded to their respective folders in `app/models/`.

### Running the Server
Start the application using the runner script:
```bash
python run_server.py
```
*   The API will be available at `http://0.0.0.0:8000`.
*   Swagger documentation available at `http://0.0.0.0:8000/docs`.

---

## 🔌 API Endpoints

### `POST /pp1/analyze`
**Description**: Primary endpoint for analyzing an image of a lost item.
- **Input**: `multipart/form-data` with a single file field named `files`.
- **Output**: JSON object containing:
    - **Item Details**: Category, color, specific features.
    - **Visual Data**: Generated embeddings.
    - **Validation**: Confidence scores and reasoning status.

### `GET /`
**Description**: Health check endpoint.
- **Output**: `{"message": "Vision Core Backend is running."}`
