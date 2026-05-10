import logging
import time
import numpy as np
import joblib
from hmmlearn import hmm

from pipeline.preprocessor import CodeVocabulary

logger = logging.getLogger(__name__)


def _fmt_time(seconds: float) -> str:
    s = int(seconds)
    return f"{s // 60}m {s % 60}s" if s >= 60 else f"{s}s"


class TwoClassHMM:
    """
    Two-class generative HMM classifier.

    Trains a separate CategoricalHMM for each class. Classification uses
    the log-likelihood ratio: argmax(log P(seq | HMM_k)) over k in {0, 1}.

    Fixes over the old single-class approach:
    - Negative class is explicitly modelled, removing the need for an
      arbitrary state-1 presence threshold.
    - Vocabulary is built from training sequences only and saved with the
      model so inference never requires rebuilding it.
    - OOV codes are mapped to UNK (id=0) instead of raising KeyError.
    """

    def __init__(self, n_components: int = 2, n_iter: int = 100, verbose: bool = False):
        self.n_components = n_components
        self.n_iter = n_iter
        self.verbose = verbose
        self.vocab: CodeVocabulary = None
        self.hmm_pos = None
        self.hmm_neg = None

    def fit(self, sequences: list, labels: list) -> "TwoClassHMM":
        pos_seqs_raw = [s for s, l in zip(sequences, labels) if l == 1]
        neg_seqs_raw = [s for s, l in zip(sequences, labels) if l == 0]

        if not pos_seqs_raw:
            raise ValueError("No class-1 sequences in training data.")
        if not neg_seqs_raw:
            raise ValueError("No class-0 sequences in training data.")

        if self.verbose:
            logger.info(f"    Building vocabulary from {len(sequences)} sequences...")
        self.vocab = CodeVocabulary().fit(sequences)
        if self.verbose:
            logger.info(f"    Vocabulary: {self.vocab.vocab_size} codes (incl. UNK)")

        pos_seqs = [self.vocab.transform(s) for s in pos_seqs_raw]
        neg_seqs = [self.vocab.transform(s) for s in neg_seqs_raw]

        if self.verbose:
            logger.info(f"    HMM+  {len(pos_seqs)} class-1 sequences, {self.n_iter} iterations")
        self.hmm_pos = self._train_hmm(pos_seqs)

        if self.verbose:
            logger.info(f"    HMM-  {len(neg_seqs)} class-0 sequences, {self.n_iter} iterations")
        self.hmm_neg = self._train_hmm(neg_seqs)
        return self

    def _train_hmm(self, encoded_sequences: list):
        lengths = [len(seq) for seq in encoded_sequences]
        X = np.concatenate([np.array(seq) for seq in encoded_sequences]).reshape(-1, 1)

        # n_iter=1 + init_params='' lets us step one EM iteration at a time
        # without reinitializing parameters between calls.
        model = hmm.CategoricalHMM(
            n_components=self.n_components,
            n_iter=1,
            tol=0,
            verbose=False,
            init_params="",
            random_state=42,
        )
        # State 0 = background, State 1 = disease motif.
        # Transition matrix makes state 1 sticky: once entered, tends to persist.
        model.startprob_ = np.array([0.9, 0.1])
        model.transmat_ = np.array([[0.9, 0.1], [0.2, 0.8]])
        model.emissionprob_ = np.full(
            (self.n_components, self.vocab.vocab_size),
            1.0 / self.vocab.vocab_size,
        )

        log_interval = max(1, self.n_iter // 10)
        t0 = time.time()

        for i in range(self.n_iter):
            model.fit(X, lengths)

            if self.verbose and (i + 1) % log_interval == 0:
                ll = model.monitor_.history[-1]
                logger.info(
                    f"      iter {i + 1:>3}/{self.n_iter}"
                    f"  ll={ll:>15,.0f}"
                    f"  elapsed: {_fmt_time(time.time() - t0)}"
                )

        # UNK (ID=0) never appears in training sequences, so the EM M-step sets
        # emissionprob_[:, 0] = 0 after the first iteration. Any test sequence
        # containing OOV codes (all mapped to UNK) then gets log P = -inf from
        # both HMMs, causing -inf - (-inf) = nan during scoring.
        # A small floor prevents zero emission probability while keeping the
        # learned relative probabilities intact after renormalisation.
        eps = 1e-10
        model.emissionprob_ = np.maximum(model.emissionprob_, eps)
        model.emissionprob_ /= model.emissionprob_.sum(axis=1, keepdims=True)

        return model

    def predict_proba(self, sequences: list) -> np.ndarray:
        """Return shape (n, 2) probability array. Column 1 = P(class 1 | seq)."""
        results = []
        for seq in sequences:
            encoded = self.vocab.transform(seq)  # OOV → UNK_ID, no crash
            arr = np.array(encoded).reshape(-1, 1)
            ll_pos = self.hmm_pos.score(arr)
            ll_neg = self.hmm_neg.score(arr)
            log_lls = np.array([ll_neg, ll_pos], dtype=float)
            log_lls -= log_lls.max()
            probs = np.exp(log_lls)
            probs /= probs.sum()
            results.append(probs.tolist())
        return np.array(results)

    def predict(self, sequences: list) -> np.ndarray:
        return (self.predict_proba(sequences)[:, 1] >= 0.5).astype(int)

    def save(self, path: str) -> None:
        joblib.dump({"model": self, "vocab": self.vocab}, path)

    @classmethod
    def load(cls, path: str) -> "TwoClassHMM":
        return joblib.load(path)["model"]
