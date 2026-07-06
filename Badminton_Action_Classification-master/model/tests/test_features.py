import numpy as np

from badminton.features.keypoints import FeatureExtractor, clean_keypoints, mirror


def _fake_kp(t=16, seed=0):
    rng = np.random.default_rng(seed)
    xy = rng.uniform(100, 500, size=(t, 17, 2)).astype(np.float32)
    conf = rng.uniform(0.4, 1.0, size=(t, 17, 1)).astype(np.float32)
    return np.concatenate([xy, conf], axis=2)


def test_clean_interpolates_low_confidence():
    kp = _fake_kp()
    kp[5, 9, 2] = 0.0  # drop right wrist at t=5
    kp[5, 9, :2] = -999  # garbage coords
    cleaned = clean_keypoints(kp, min_confidence=0.3)
    # interpolated value should sit between neighbors, not the garbage -999
    assert cleaned[5, 9, 0] > 0
    assert np.isfinite(cleaned).all()


def test_feature_dim_matches_output():
    fe = FeatureExtractor()
    feats = fe(_fake_kp())
    assert feats.shape[1] == fe.feature_dim()
    assert feats.shape[0] == 16


def test_translation_invariance():
    fe = FeatureExtractor(use_velocity=False, use_bone_angles=False, emit_validity_flag=False)
    kp = _fake_kp()
    shifted = kp.copy()
    shifted[..., :2] += 250.0  # translate whole skeleton
    f1, f2 = fe(kp), fe(shifted)
    # pelvis-centering => identical features after translation
    assert np.allclose(f1, f2, atol=1e-4)


def test_scale_invariance():
    fe = FeatureExtractor(use_velocity=False, use_bone_angles=False, emit_validity_flag=False)
    kp = _fake_kp()
    scaled = kp.copy()
    scaled[..., :2] *= 2.0
    assert np.allclose(fe(kp), fe(scaled), atol=1e-3)


def test_mirror_swaps_left_right():
    kp = _fake_kp()
    m = mirror(kp, image_width=600.0)
    # left shoulder (idx 5) of mirrored == reflected right shoulder (idx 6) of original
    assert np.allclose(m[:, 5, 0], 600.0 - kp[:, 6, 0])
