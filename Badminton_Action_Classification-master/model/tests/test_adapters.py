import numpy as np

from badminton import COCO17_KEYPOINTS
from badminton.data.adapters import LAYOUTS, remap_by_layout, remap_keypoints


def test_coco17_identity():
    kp = np.random.rand(10, 17, 3).astype(np.float32)
    out = remap_by_layout(kp, "coco17")
    assert out.shape == (10, 17, 3)
    assert np.allclose(out, kp)


def test_halpe26_keeps_first_17_in_order():
    kp = np.random.rand(8, 26, 3).astype(np.float32)
    out = remap_by_layout(kp, "halpe26")
    assert out.shape == (8, 17, 3)
    # Halpe-26's first 17 are COCO-17 in order
    assert np.allclose(out, kp[:, :17, :3])


def test_missing_joints_zero_filled():
    # source has only 3 named joints; the rest of COCO-17 must be zeros
    names = ["nose", "left_shoulder", "right_shoulder"]
    kp = np.random.rand(5, 3, 3).astype(np.float32) + 1.0  # nonzero
    out = remap_keypoints(kp, names)
    assert out.shape == (5, 17, 3)
    assert np.allclose(out[:, COCO17_KEYPOINTS.index("nose")], kp[:, 0])
    assert np.allclose(out[:, COCO17_KEYPOINTS.index("left_ankle")], 0.0)


def test_all_layouts_cover_coco17_or_more():
    for name, joints in LAYOUTS.items():
        assert len(joints) >= 17, name
