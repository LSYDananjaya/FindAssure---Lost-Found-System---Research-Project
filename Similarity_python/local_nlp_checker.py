"""Local text-similarity checker used when scoring owner answers.

Module overview:
- Normalizes founder and owner answer text before comparison.
- Combines semantic embeddings, lexical overlap, keyword coverage, and question-type rules.
- Provides a deterministic fallback/partner to Gemini so verification still works offline.
"""

import os
# Force transformers/sentence-transformers to avoid TensorFlow in this service.
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")
os.environ.setdefault("USE_FLAX", "0")

import spacy
import numpy as np
import re
from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer

# Constants for text processing
NEGATIONS = {
    "no", "not", "never", "dont", "don't", "didnt", "didn't",
    "cannot", "can't", "wont", "won't"
}

GENERIC_WORDS = {
    "it", "is", "a", "the", "with", "this", "that",
    "thing", "object", "something", "someone"
}

BOOLEAN_TRUE = {"yes", "yeah", "yep", "true", "correct", "right"}
BOOLEAN_FALSE = {"no", "nope", "false", "incorrect", "wrong"}
NUMBER_WORDS = {
    "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4",
    "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
    "ten": "10", "first": "1", "second": "2", "third": "3"
}
COLOR_WORDS = {
    "black", "white", "red", "blue", "green", "yellow", "pink", "purple",
    "orange", "brown", "gray", "grey", "silver", "gold", "beige", "maroon",
    "navy", "cyan", "teal"
}

QUESTION_TYPE_CONFIG = {
    "boolean": {"weight": 1.15, "match_floor": 0.95, "mismatch_cap": 0.05},
    "numeric": {"weight": 1.20, "match_floor": 0.95, "mismatch_cap": 0.12},
    "color": {"weight": 1.10, "match_floor": 0.92, "mismatch_cap": 0.18},
    "brand_identifier": {"weight": 1.35, "match_floor": 0.94, "mismatch_cap": 0.20},
    "location": {"weight": 1.05, "match_floor": 0.88, "mismatch_cap": 0.22},
    "descriptive": {"weight": 1.00, "match_floor": None, "mismatch_cap": None},
}

def py(v):
    """Convert numpy / scalar types to native Python types."""
    try:
        # numpy scalars (.item()) and other objects
        if hasattr(v, "item"):
            return v.item()
        # numpy arrays -> list
        if isinstance(v, (np.ndarray,)):
            return v.tolist()
    except Exception:
        pass
    # fallback for builtin numerics/bools/None/str
    return v

class LocalNLP:
    """Local NLP scorer for comparing one expected answer with one spoken answer."""

    def __init__(self):
        """Load local NLP models and vectorizers once for repeated scoring."""
        # Load spaCy model for tokenization, POS tagging, and vector similarity
        self.nlp = spacy.load("en_core_web_lg")
        # Load SentenceTransformer model for semantic embeddings
        self.sbert = SentenceTransformer("all-mpnet-base-v2")
        # Initialize TF-IDF vectorizer for keyword-based similarity
        self.tfidf = TfidfVectorizer()
        # Initialize character n-gram vectorizer for spelling/phrase similarity
        self.char_vec = CountVectorizer(analyzer="char", ngram_range=(3, 6))
        # Cache for embeddings to avoid recomputation
        self.cache_emb = {}

    # -----------------------------
    # BASIC TEXT UTILS
    # -----------------------------

    def normalize(self, text):
        """Lowercase text and remove noisy characters before comparison."""
        if not text:
            return ""
        t = text.lower()
        t = re.sub(r"[^a-z0-9\s']", " ", t)
        t = re.sub(r"\s+", " ", t).strip()
        return t

    def tokenize(self, text):
        """Run spaCy tokenization on normalized text."""
        return self.nlp(self.normalize(text))

    def extract_keywords(self, text):
        """
        Dynamically extract meaningful keywords from text
        (nouns, verbs, adjectives, proper nouns + negations)
        """
        doc = self.tokenize(text)
        keywords = set()

        for t in doc:
            # Skip punctuation and numbers
            if t.is_punct or t.like_num:
                continue

            # Skip stop words unless they are negations
            if t.is_stop and t.text.lower() not in NEGATIONS:
                continue

            # Skip generic words
            if t.lemma_.lower() in GENERIC_WORDS:
                continue

            # Keep nouns, verbs, adjectives, proper nouns
            if t.pos_ in {"NOUN", "VERB", "ADJ", "PROPN"}:
                kw = re.sub(r"[^a-z0-9_-]", "", t.lemma_.lower())
                if kw:
                    keywords.add(kw)

        return keywords

    # -----------------------------
    # KEYWORD COVERAGE CHECK
    # -----------------------------

    def keyword_coverage(self, founder_kw, owner_kw):
        """
        Measures how much of the founder keywords
        are covered by owner answer (0..1)
        """
        if not founder_kw:
            return 0.0
        covered = founder_kw & owner_kw
        return float(len(covered) / len(founder_kw))

    def is_generic_answer(self, keywords):
        """
        Generic answers contain almost no meaningful keywords
        """
        return len(keywords) <= 2

    def extract_numbers(self, text):
        """Extract numeric answers from digits and number words."""
        normalized = self.normalize(text)
        values = set(re.findall(r"\b\d+\b", normalized))
        for token in normalized.split():
            mapped = NUMBER_WORDS.get(token)
            if mapped:
                values.add(mapped)
        return values

    def extract_colors(self, text):
        """Extract known color words from the answer."""
        normalized = self.normalize(text)
        return {token for token in normalized.split() if token in COLOR_WORDS}

    def extract_identifier_tokens(self, text):
        """Extract brand/model/label style tokens for identifier questions."""
        normalized = self.normalize(text)
        return {
            token for token in normalized.split()
            if len(token) >= 3 and not token.isdigit() and token not in GENERIC_WORDS
        }

    def extract_boolean_label(self, text):
        """Map yes/no style text to a simple boolean label."""
        normalized_tokens = set(self.normalize(text).split())
        if normalized_tokens & BOOLEAN_TRUE:
            return "yes"
        if normalized_tokens & BOOLEAN_FALSE:
            return "no"
        return None

    def infer_question_type(self, question_text, founder_answer=""):
        """Classify the question so strict fields like colors and numbers can be checked directly."""
        q = self.normalize(question_text)
        founder_norm = self.normalize(founder_answer)

        # Check for boolean questions (yes/no)
        if any(phrase in q for phrase in {
            "is there", "does it", "did it", "was it", "were there", "do you",
            "has it", "have you", "is it", "are there"
        }):
            return "boolean"
        # Check for numeric questions
        if any(word in q for word in {"number", "serial", "digit", "code", "year", "size", "count", "many"}):
            return "numeric"
        # Check for color questions
        if "color" in q or self.extract_colors(founder_norm):
            return "color"
        # Check for brand/identifier questions
        if any(word in q for word in {"brand", "logo", "model", "name", "label", "text", "written", "identifier", "institute"}):
            return "brand_identifier"
        # Check for location questions
        if any(word in q for word in {"where", "location", "place", "building", "floor", "hall", "room", "area"}):
            return "location"
        # Default to descriptive
        return "descriptive"

    def apply_question_type_rules(self, base_score, question_type, founder, owner):
        """Apply exact-match guards where semantic similarity alone would be too forgiving."""
        config = QUESTION_TYPE_CONFIG.get(question_type, QUESTION_TYPE_CONFIG["descriptive"])

        # Handle boolean questions: strict match required
        if question_type == "boolean":
            founder_bool = self.extract_boolean_label(founder)
            owner_bool = self.extract_boolean_label(owner)
            if founder_bool and owner_bool:
                if founder_bool == owner_bool:
                    return max(base_score, config["match_floor"]), "boolean_exact_match"
                return min(base_score, config["mismatch_cap"]), "boolean_mismatch"

        # Handle numeric questions: exact number match required
        elif question_type == "numeric":
            founder_nums = self.extract_numbers(founder)
            owner_nums = self.extract_numbers(owner)
            if founder_nums and owner_nums:
                if founder_nums & owner_nums:
                    return max(base_score, config["match_floor"]), "numeric_exact_match"
                return min(base_score, config["mismatch_cap"]), "numeric_mismatch"

        # Handle color questions: exact color match required
        elif question_type == "color":
            founder_colors = self.extract_colors(founder)
            owner_colors = self.extract_colors(owner)
            if founder_colors and owner_colors:
                if founder_colors & owner_colors:
                    return max(base_score, config["match_floor"]), "color_exact_match"
                return min(base_score, config["mismatch_cap"]), "color_mismatch"

        # Handle brand/identifier questions: token overlap required
        elif question_type == "brand_identifier":
            founder_ids = self.extract_identifier_tokens(founder)
            owner_ids = self.extract_identifier_tokens(owner)
            if founder_ids and owner_ids:
                if founder_ids & owner_ids:
                    return max(base_score, config["match_floor"]), "identifier_overlap"
                return min(base_score, config["mismatch_cap"]), "identifier_mismatch"

        # Handle location questions: keyword overlap required
        elif question_type == "location":
            founder_kw = self.extract_keywords(founder)
            owner_kw = self.extract_keywords(owner)
            if founder_kw and owner_kw:
                if founder_kw & owner_kw:
                    return max(base_score, config["match_floor"]), "location_overlap"
                return min(base_score, config["mismatch_cap"]), "location_mismatch"

        return base_score, None

    # -----------------------------
    # SIMILARITY METHODS
    # -----------------------------

    def _cosine_sparse(self, X):
        """Calculate cosine similarity for two sparse vector rows."""
        a = X[0].toarray().ravel()
        b = X[1].toarray().ravel()
        denom = np.linalg.norm(a) * np.linalg.norm(b)
        return 0.0 if denom == 0 else float(np.dot(a, b) / denom)

    def tfidf_sim(self, A, B):
        """Compare keyword sets using TF-IDF cosine similarity."""
        if not A or not B:
            return 0.0
        X = self.tfidf.fit_transform([" ".join(A), " ".join(B)])
        return float(np.clip(self._cosine_sparse(X), 0, 1))

    def char_ngram_sim(self, a, b):
        """Compare text using character n-grams to catch spelling/phrase similarity."""
        if not a or not b:
            return 0.0
        X = self.char_vec.fit_transform([a, b])
        return float(np.clip(self._cosine_sparse(X), 0, 1))

    def jaccard(self, A, B):
        """Calculate set-overlap similarity between founder and owner keywords."""
        return 0.0 if not A or not B else float(len(A & B) / len(A | B))

    def embed(self, text):
        """Return a cached SentenceTransformer embedding for the text."""
        # Check if embedding is already cached
        if text in self.cache_emb:
            return self.cache_emb[text]
        # Compute embedding using SentenceTransformer
        emb = self.sbert.encode(text, convert_to_numpy=True)
        # Cache the embedding for future use
        self.cache_emb[text] = emb
        return emb

    def sbert_sim(self, a, b):
        """Compare answer meaning using SentenceTransformer embeddings."""
        if not a or not b:
            return 0.0
        sim = float(util.cos_sim(self.embed(a), self.embed(b)))
        return float(np.clip((sim + 1) / 2, 0, 1))

    def spacy_sim(self, a, b):
        """Compare answer meaning using spaCy vector similarity."""
        if not a or not b:
            return 0.0
        va, vb = self.nlp(a).vector, self.nlp(b).vector
        denom = np.linalg.norm(va) * np.linalg.norm(vb)
        return 0.0 if denom == 0 else float(np.clip(np.dot(va, vb) / denom, 0, 1))

    # -----------------------------
    # FEATURE + FUSION
    # -----------------------------

    def compute_features(self, founder, owner, fk, ok):
        """Calculate all local similarity features for one answer pair."""
        sf = " ".join(sorted(fk))
        so = " ".join(sorted(ok))

        return {
            "tfidf": float(self.tfidf_sim(fk, ok)),
            "char_ngram": float(self.char_ngram_sim(sf, so)),
            "jaccard": float(self.jaccard(fk, ok)),
            "sbert": float(self.sbert_sim(sf, so)),
            "spacy": float(self.spacy_sim(sf, so)),
        }

    def fuse_score(self, f, coverage):
        """Fuse local similarity features and apply founder-keyword coverage."""
        # Compute weighted sum of similarity features
        base = (
            f["tfidf"] * 0.25 +
            f["jaccard"] * 0.25 +
            f["char_ngram"] * 0.15 +
            f["sbert"] * 0.20 +
            f["spacy"] * 0.15
        )
        # Apply coverage as multiplier and ensure result is in [0,1]
        return float(np.clip(base * float(coverage), 0, 1))

    # -----------------------------
    # MAIN ENTRY
    # -----------------------------

    def score_pair(self, founder, owner, question_text="", question_type=None, question_weight=None):
        """Return the final local similarity score and reasoning for one question."""
        resolved_question_type = question_type or self.infer_question_type(question_text, founder)
        config = QUESTION_TYPE_CONFIG.get(resolved_question_type, QUESTION_TYPE_CONFIG["descriptive"])
        resolved_question_weight = float(question_weight) if question_weight is not None else float(config["weight"])

        # Handle empty owner answers
        if not owner or len(owner.strip()) < 3:
            return {
                "fused": 0.0,
                "reason": "empty_answer",
                "question_type": resolved_question_type,
                "question_weight": resolved_question_weight,
                "type_adjustment_reason": None,
            }

        # Normalize for comparison
        founder_norm = self.normalize(founder)
        owner_norm = self.normalize(owner)

        # Check for exact match first
        if founder_norm == owner_norm:
            return {
                "fused": 1.0,
                "coverage": 1.0,
                "reason": "exact_match",
                "question_type": resolved_question_type,
                "question_weight": resolved_question_weight,
                "type_adjustment_reason": "exact_match",
                "features": {
                    "tfidf": 1.0,
                    "char_ngram": 1.0,
                    "jaccard": 1.0,
                    "sbert": 1.0,
                    "spacy": 1.0
                }
            }

        # Check for opposite/negation answers
        opposite_pairs = [
            ("yes", "no"), ("no", "yes"),
            ("true", "false"), ("false", "true"),
            ("correct", "incorrect"), ("incorrect", "correct"),
            ("right", "wrong"), ("wrong", "right"),
            ("positive", "negative"), ("negative", "positive"),
            ("have", "dont have"), ("have", "do not have"),
            ("has", "doesnt have"), ("has", "does not have"),
            ("is", "isnt"), ("is", "is not"),
            ("are", "arent"), ("are", "are not"),
            ("was", "wasnt"), ("was", "was not"),
            ("were", "werent"), ("were", "were not")
        ]
        
        for pair1, pair2 in opposite_pairs:
            if (pair1 in founder_norm and pair2 in owner_norm) or \
               (pair2 in founder_norm and pair1 in owner_norm):
                return {
                    "fused": 0.0,
                    "coverage": 0.0,
                    "reason": "opposite_answer",
                    "question_type": resolved_question_type,
                    "question_weight": resolved_question_weight,
                    "type_adjustment_reason": "opposite_answer",
                    "features": {
                        "tfidf": 0.0,
                        "char_ngram": 0.0,
                        "jaccard": 0.0,
                        "sbert": 0.0,
                        "spacy": 0.0
                    }
                }

        # Check for substring/word subset matches
        founder_words = set(founder_norm.split())
        owner_words = set(owner_norm.split())
        
        if founder_words and owner_words and len(founder_words) > 0 and len(owner_words) > 0:
            if founder_words.issubset(owner_words) or owner_words.issubset(founder_words):
                substring_score = 0.85
                return {
                    "fused": substring_score,
                    "coverage": 0.9,
                    "reason": "word_subset_match",
                    "question_type": resolved_question_type,
                    "question_weight": resolved_question_weight,
                    "type_adjustment_reason": "word_subset_match",
                    "features": {
                        "tfidf": substring_score,
                        "char_ngram": substring_score,
                        "jaccard": substring_score,
                        "sbert": substring_score,
                        "spacy": substring_score
                    }
                }
            
            common_words = founder_words & owner_words
            if common_words:
                overlap_ratio = len(common_words) / max(len(founder_words), len(owner_words))
                if overlap_ratio >= 0.6:
                    word_overlap_score = 0.70 + (overlap_ratio * 0.2)
                    return {
                        "fused": word_overlap_score,
                        "coverage": overlap_ratio,
                        "reason": "high_word_overlap",
                        "question_type": resolved_question_type,
                        "question_weight": resolved_question_weight,
                        "type_adjustment_reason": "high_word_overlap",
                        "features": {
                            "tfidf": word_overlap_score,
                            "char_ngram": word_overlap_score,
                            "jaccard": word_overlap_score,
                            "sbert": word_overlap_score,
                            "spacy": word_overlap_score
                        }
                    }

        # Extract keywords
        founder_kw = self.extract_keywords(founder)
        owner_kw = self.extract_keywords(owner)

        # Handle generic answers
        if self.is_generic_answer(owner_kw):
            return {
                "fused": 0.05,
                "reason": "generic_answer",
                "question_type": resolved_question_type,
                "question_weight": resolved_question_weight,
                "type_adjustment_reason": None,
            }

        # Check keyword coverage
        coverage = self.keyword_coverage(founder_kw, owner_kw)

        # Hard fail if insufficient coverage
        if coverage < 0.5:
            return {
                "fused": float(0.05),
                "coverage": float(coverage),
                "reason": "insufficient_detail_match",
                "question_type": resolved_question_type,
                "question_weight": resolved_question_weight,
                "type_adjustment_reason": None,
            }

        # Compute similarity features
        feats = self.compute_features(founder, owner, founder_kw, owner_kw)
        fused = self.fuse_score(feats, coverage)
        fused, type_reason = self.apply_question_type_rules(
            float(py(fused)),
            resolved_question_type,
            founder,
            owner,
        )

        # Return final result
        return {
            "features": {k: py(v) for k, v in feats.items()},
            "fused": float(py(fused)),
            "coverage": float(py(coverage)),
            "reason": "ok",
            "question_type": resolved_question_type,
            "question_weight": resolved_question_weight,
            "type_adjustment_reason": type_reason,
        }
