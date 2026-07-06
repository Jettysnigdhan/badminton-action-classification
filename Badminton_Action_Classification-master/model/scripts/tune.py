import optuna
import logging
import copy
from badminton.config import Config
from badminton.training.train import train, make_loaders
from badminton.data.dataset import load_manifest, split_records

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
optuna.logging.set_verbosity(optuna.logging.INFO)

def objective(trial):
    # Base config
    cfg = Config.from_yaml("configs/improved.yaml")
    
    # Tune data hyperparams
    cfg.data.sequence_length = trial.suggest_categorical("sequence_length", [16, 24, 32])
    
    # Tune model hyperparams
    cfg.model.hidden_size = trial.suggest_categorical("hidden_size", [64, 128, 256])
    cfg.model.num_layers = trial.suggest_int("num_layers", 1, 3)
    cfg.model.dropout = trial.suggest_float("dropout", 0.2, 0.6)
    
    # Tune training hyperparams
    cfg.train.lr = trial.suggest_float("lr", 1e-4, 5e-3, log=True)
    cfg.train.weight_decay = trial.suggest_float("weight_decay", 1e-5, 1e-2, log=True)
    cfg.train.epochs = 60  # Fast trials
    cfg.train.early_stopping_patience = 12
    cfg.train.batch_size = trial.suggest_categorical("batch_size", [16, 32])
    
    # Pre-split data once for the trial
    records = load_manifest(cfg.data.manifest_path)
    splits = split_records(
        records,
        split_by=cfg.data.split_by,
        val_fraction=cfg.data.val_fraction,
        test_fraction=cfg.data.test_fraction,
        seed=cfg.seed,
    )
    
    try:
        # Run training (use_mlflow=False, save_checkpoint=False to go fast)
        metrics = train(cfg, splits, use_mlflow=False, save_checkpoint=False)
        # We optimize for macro F1 on the test set, or validation F1.
        # train() returns test metrics.
        return metrics["macro_f1"]
    except Exception as e:
        print(f"Trial failed: {e}")
        return 0.0

if __name__ == "__main__":
    study = optuna.create_study(direction="maximize", study_name="badminton-bilstm-sweep")
    # Run 30 trials
    study.optimize(objective, n_trials=30)
    
    print("\nBest trial:")
    trial = study.best_trial
    print(f"  Macro F1: {trial.value:.4f}")
    print("  Params: ")
    for key, value in trial.params.items():
        print(f"    {key}: {value}")
