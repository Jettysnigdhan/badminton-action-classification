from badminton.data.dataset import ClipRecord, split_records


def _records():
    recs = []
    for p in range(10):  # 10 players
        for v in range(3):  # 3 clips each
            recs.append(
                ClipRecord(
                    video_id=f"v{p}_{v}",
                    player_id=f"p{p}",
                    label="forehand_clear",
                    keypoints_path="x.npy",
                )
            )
    return recs


def test_player_disjoint_no_leakage():
    splits = split_records(
        _records(), split_by="player", val_fraction=0.2, test_fraction=0.2, seed=1
    )
    players = {k: {r.player_id for r in v} for k, v in splits.items()}
    # no player appears in more than one split -> no leakage
    assert players["train"].isdisjoint(players["val"])
    assert players["train"].isdisjoint(players["test"])
    assert players["val"].isdisjoint(players["test"])
