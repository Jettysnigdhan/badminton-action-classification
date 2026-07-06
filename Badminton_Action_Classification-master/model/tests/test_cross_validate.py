import numpy as np

from badminton.data.dataset import ClipRecord
from badminton.training.cross_validate import carve_val, make_folds

LABELS = ["a", "b", "c"]


def _records(n_groups=15, per_group=2):
    recs = []
    for g in range(n_groups):
        label = LABELS[g % len(LABELS)]
        for v in range(per_group):
            recs.append(
                ClipRecord(video_id=f"v{g}_{v}", player_id=f"p{g}", label=label, keypoints_path="x")
            )
    return recs


def test_folds_are_group_disjoint():
    recs = _records()
    key = lambda r: r.video_id  # noqa: E731
    folds = make_folds(recs, n_folds=5, key=key, labels=LABELS, seed=0)
    groups = np.array([key(r) for r in recs])
    # every record assigned to exactly one test fold
    assigned = np.concatenate(folds)
    assert sorted(assigned.tolist()) == list(range(len(recs)))
    # no group spans two folds
    for fa in range(len(folds)):
        for fb in range(fa + 1, len(folds)):
            ga = set(groups[folds[fa]])
            gb = set(groups[folds[fb]])
            assert ga.isdisjoint(gb)


def test_carve_val_holds_out_whole_groups():
    recs = _records()
    key = lambda r: r.player_id  # noqa: E731
    groups = np.array([key(r) for r in recs])
    train_pool = np.arange(len(recs))
    tr, val = carve_val(train_pool, groups, frac=0.2, seed=1)
    assert set(groups[tr]).isdisjoint(set(groups[val]))
    assert len(tr) + len(val) == len(train_pool)
