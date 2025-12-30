import spacy
import numpy as np
import re
from sentence_transformers import SentenceTransformer, util
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer

class LocalNLP:

    def __init__(self):
        self.nlp = spacy.load("en_core_web_lg")
        self.sbert = SentenceTransformer("all-mpnet-base-v2")
        self.tfidf = TfidfVectorizer()
        self.char_vec = CountVectorizer(analyzer="char", ngram_range=(3,6))
        self.cache_emb = {}

    def normalize(self, text):
        if not text: 
            return ""
        t = text.lower()
        t = re.sub(r"[^a-z0-9\s]", " ", t)
        t = re.sub(r"\s+", " ", t).strip()
        return t

    def tokenize(self, text):
        text = self.normalize(text)
        return self.nlp(text)

    def lemmas(self, tokens):
        out = []
        pos_keep = {"NOUN","VERB","ADJ","PROPN"}
        dep_keep = {"ROOT","nsubj","dobj","attr","acomp","pobj","compound","amod"}
        for t in tokens:
            if t.is_stop or t.is_punct or t.like_num:
                continue
            if t.pos_ not in pos_keep and t.dep_ not in dep_keep:
                continue
            lemma = re.sub(r"[^a-z0-9_-]", "", t.lemma_.strip())
            if lemma:
                out.append(lemma)
        return out

    def _cosine_sparse(self, X):
        # X is result of vectorizer.fit_transform([a,b])
        a = X[0].toarray().ravel()
        b = X[1].toarray().ravel()
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)

    def tfidf_sim(self, A, B):
        s1, s2 = " ".join(A), " ".join(B)
        if not s1 or not s2:
            return 0.0
        X = self.tfidf.fit_transform([s1, s2])
        return max(0.0, min(self._cosine_sparse(X), 1.0))

    def char_ngram_sim(self, a, b):
        if not a or not b:
            return 0.0
        X = self.char_vec.fit_transform([a, b])
        return max(0.0, min(self._cosine_sparse(X), 1.0))

    def jaccard(self, A, B):
        Aset, Bset = set(A), set(B)
        if not Aset or not Bset:
            return 0.0
        return float(len(Aset & Bset) / len(Aset | Bset))

    def embed(self, text):
        if text in self.cache_emb:
            return self.cache_emb[text]
        emb = self.sbert.encode(text, convert_to_numpy=True)
        self.cache_emb[text] = emb
        return emb

    def sbert_sim(self, a, b):
        if not a or not b:
            return 0.0
        ea, eb = self.embed(a), self.embed(b)
        s = float(util.cos_sim(ea, eb).item())
        return max(0.0, min((s + 1.0) / 2.0, 1.0))

    def spacy_sim(self, a, b):
        if not a or not b:
            return 0.0
        va = self.nlp(a).vector
        vb = self.nlp(b).vector
        denom = np.linalg.norm(va) * np.linalg.norm(vb)
        if denom == 0:
            return 0.0
        return max(0.0, min(float(np.dot(va, vb) / denom), 1.0))

    def relaxed_wmd(self, A, B):
        if not A or not B:
            return 0.0
        sims = []
        for wa in A:
            ea = self.embed(wa)
            best = 0.0
            for wb in B:
                eb = self.embed(wb)
                sim = float(util.cos_sim(ea, eb).item())
                best = max(best, sim)
            sims.append(best)
        if not sims:
            return 0.0
        # convert average best-match similarity from [-1,1] to [0,1] if needed
        avg = np.mean(sims)
        # embeddings sims are in [-1,1], convert then clamp
        avg = (avg + 1.0) / 2.0
        return max(0.0, min(avg, 1.0))

    def compute_features(self, founder, owner):
        tok_f = self.tokenize(founder)
        tok_o = self.tokenize(owner)
        lem_f = self.lemmas(tok_f)
        lem_o = self.lemmas(tok_o)
        text_f = " ".join(lem_f)
        text_o = " ".join(lem_o)

        f = {}
        f["tfidf"] = self.tfidf_sim(lem_f, lem_o)
        f["char_ngram"] = self.char_ngram_sim(text_f, text_o)
        f["jaccard"] = self.jaccard(lem_f, lem_o)
        f["sbert"] = self.sbert_sim(text_f, text_o)
        f["spacy"] = self.spacy_sim(text_f, text_o)
        f["wmd"] = self.relaxed_wmd(lem_f, lem_o)

        # ensure all features are in 0..1
        for k in list(f.keys()):
            v = f[k]
            if not isinstance(v, (int, float)) or np.isnan(v):
                v = 0.0
            f[k] = float(max(0.0, min(v, 1.0)))
        return f

    def fuse_score(self, f):
        s = (
            f["sbert"]*0.40 +
            f["spacy"]*0.20 +
            f["tfidf"]*0.15 +
            f["jaccard"]*0.10 +
            f["char_ngram"]*0.10 +
            f["wmd"]*0.05
        )
        return float(max(0.0, min(s, 1.0)))


    def score_pair(self, founder, owner):
        feats = self.compute_features(founder, owner)
        fused = self.fuse_score(feats)
        return {"features": feats, "fused": fused}
