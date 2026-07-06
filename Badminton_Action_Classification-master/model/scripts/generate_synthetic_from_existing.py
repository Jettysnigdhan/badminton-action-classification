import json
import os
import numpy as np

manifest_path = '/Users/archdex/Desktop/Badminton_Action_Classification/data/manifest.jsonl'
kp_dir = '/Users/archdex/Desktop/Badminton_Action_Classification/data/kp'

def mirror(kp: np.ndarray, image_width: float) -> np.ndarray:
    kp = kp.copy()
    kp[..., 0] = image_width - kp[..., 0]
    return kp

def augment(kp: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    kp = kp.copy()
    # Mirroring
    if rng.random() < 0.5:
        kp = mirror(kp, image_width=float(kp[..., 0].max()) + 1e-6)
    
    # Joint dropout
    joint_dropout_p = 0.08
    if joint_dropout_p > 0:
        drop = rng.random(kp.shape[:2]) < joint_dropout_p
        kp[drop, 2] = 0.0
    
    # Joint noise
    joint_noise_std = 0.015
    if joint_noise_std > 0:
        scale = np.abs(kp[..., :2]).mean() + 1e-6
        kp[..., :2] += rng.normal(0, joint_noise_std * scale, kp[..., :2].shape)
        
    return kp

def main():
    records = []
    classes_counts = {}
    with open(manifest_path, 'r') as f:
        for line in f:
            if line.strip():
                r = json.loads(line)
                records.append(r)
                classes_counts[r['label']] = classes_counts.get(r['label'], 0) + 1

    target_count = 600  # 600 per class = 3000 total clips
    rng = np.random.default_rng(42)

    new_records = []
    for label, count in classes_counts.items():
        if count >= target_count:
            continue
        
        needed = target_count - count
        label_records = [r for r in records if r['label'] == label]
        print(f"Generating {needed} synthetic clips for {label}...")
        
        for i in range(needed):
            base_record = rng.choice(label_records)
            base_kp = np.load(base_record['keypoints_path'])
            
            aug_kp = augment(base_kp, rng)
            
            new_vid = f"{label}__synth_{i:04d}"
            new_kp_path = os.path.join(kp_dir, f"{new_vid}.npy")
            
            np.save(new_kp_path, aug_kp)
            
            new_records.append({
                "video_id": new_vid,
                "player_id": new_vid,
                "label": label,
                "keypoints_path": new_kp_path
            })

    with open(manifest_path, 'a') as f:
        for r in new_records:
            f.write(json.dumps(r) + '\n')

    print(f"Total synthetic clips generated: {len(new_records)}")
    
if __name__ == "__main__":
    main()
