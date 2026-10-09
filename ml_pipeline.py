import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.neural_network import MLPClassifier
import xgboost as xgb
import lightgbm as lgb
from catboost import CatBoostClassifier
import lime
import lime.lime_tabular
import warnings
warnings.filterwarnings('ignore')

DATASET_FILE = 'extention of Z-Alizadeh sani dataset.xlsx'
OUTPUT_DIR = 'ml_artifacts'
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("--- Step 1: Loading Dataset ---")
df = pd.read_excel(DATASET_FILE)
print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

# Target columns
TARGET_COLS = ['Cath', 'LAD', 'LCX', 'RCA']

# Normalize binary targets
# Cath: CAD -> 1, Normal -> 0
# LAD, LCX, RCA: Stenotic -> 1, Normal -> 0
y_cad = (df['Cath'].astype(str).str.strip().str.upper() == 'CAD').astype(int).values
y_lad = (df['LAD'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values
y_lcx = (df['LCX'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values
y_rca = (df['RCA'].astype(str).str.strip().str.capitalize() == 'Stenotic').astype(int).values

targets = {
    'CAD': y_cad,
    'LAD': y_lad,
    'LCX': y_lcx,
    'RCA': y_rca
}

# Feature selection & leakage prevention
# Explicitly drop all target columns and any target leakage
feature_df = df.drop(columns=[col for col in TARGET_COLS if col in df.columns]).copy()

# Clean categoricals and string encodings
def clean_and_encode(df_in):
    clean_df = pd.DataFrame()
    for col in df_in.columns:
        s = df_in[col]
        if s.dtype == 'object':
            s_str = s.astype(str).str.strip().str.lower()
            if col.lower() == 'sex':
                # male -> 1, female/fmale -> 0
                clean_df['Sex_Male'] = (s_str == 'male').astype(float)
            elif set(s_str.unique()).issubset({'y', 'n', 'yes', 'no'}):
                clean_df[col] = s_str.map({'y': 1.0, 'yes': 1.0, 'n': 0.0, 'no': 0.0}).fillna(0.0)
            elif col == 'BBB':
                # Bundle branch block: N, LBBB, RBBB
                clean_df['BBB_LBBB'] = (s_str == 'lbbb').astype(float)
                clean_df['BBB_RBBB'] = (s_str == 'rbbb').astype(float)
            elif col == 'VHD':
                # Valvular heart disease: N, mild, moderate, severe
                vhd_map = {'n': 0.0, 'mild': 1.0, 'moderate': 2.0, 'severe': 3.0}
                clean_df['VHD_Severity'] = s_str.map(vhd_map).fillna(0.0)
            else:
                # General categorical dummy / label mapping
                dummies = pd.get_dummies(s_str, prefix=col, drop_first=True)
                for d_col in dummies.columns:
                    clean_df[d_col] = dummies[d_col].astype(float)
        else:
            # Numeric: fill na with median
            clean_df[col] = pd.to_numeric(s, errors='coerce').fillna(s.median())
    return clean_df

X_encoded = clean_and_encode(feature_df)
feature_names = X_encoded.columns.tolist()
print(f"Engineered {len(feature_names)} features after leakage prevention and preprocessing.")

# Store feature metadata for schema validation
feature_meta = {}
for col in feature_names:
    feature_meta[col] = {
        'mean': float(X_encoded[col].mean()),
        'std': float(X_encoded[col].std()) if X_encoded[col].std() > 0 else 1.0,
        'min': float(X_encoded[col].min()),
        'max': float(X_encoded[col].max())
    }

with open(os.path.join(OUTPUT_DIR, 'feature_metadata.json'), 'w') as f:
    json.dump({
        'feature_names': feature_names,
        'feature_stats': feature_meta,
        'total_samples': int(len(X_encoded)),
        'target_distribution': {
            'CAD': {'positive': int(sum(y_cad)), 'negative': int(len(y_cad) - sum(y_cad))},
            'LAD': {'positive': int(sum(y_lad)), 'negative': int(len(y_lad) - sum(y_lad))},
            'LCX': {'positive': int(sum(y_lcx)), 'negative': int(len(y_lcx) - sum(y_lcx))},
            'RCA': {'positive': int(sum(y_rca)), 'negative': int(len(y_rca) - sum(y_rca))}
        }
    }, f, indent=2)

print("\n--- Step 2: Cross-Validation & Model Evaluation (4 Families x 4 Tasks) ---")

def get_models(random_state=42):
    return {
        'XGBoost': xgb.XGBClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            eval_metric='logloss',
            random_state=random_state
        ),
        'CatBoost': CatBoostClassifier(
            iterations=120,
            depth=4,
            learning_rate=0.05,
            verbose=0,
            random_seed=random_state
        ),
        'LightGBM': lgb.LGBMClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            verbose=-1,
            random_state=random_state
        ),
        'Neural Network': MLPClassifier(
            hidden_layer_sizes=(64, 32),
            activation='relu',
            max_iter=300,
            early_stopping=True,
            random_state=random_state
        )
    }

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
all_evaluations = {}
best_models_info = {}
best_trained_pipelines = {}

X_arr = X_encoded.values

for task_name, y_arr in targets.items():
    print(f"\nEvaluating Task: {task_name}...")
    task_eval = {}
    
    for model_name in ['XGBoost', 'CatBoost', 'LightGBM', 'Neural Network']:
        accuracies = []
        precisions = []
        recalls = []
        f1s = []
        roc_aucs = []
        
        for train_idx, test_idx in cv.split(X_arr, y_arr):
            X_train, X_test = X_arr[train_idx], X_arr[test_idx]
            y_train, y_test = y_arr[train_idx], y_arr[test_idx]
            
            # Preprocessing fitted ONLY on train fold to prevent leakage
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            model = get_models()[model_name]
            
            # Train model
            if model_name in ['Neural Network']:
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                y_proba = model.predict_proba(X_test_scaled)[:, 1]
            else:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                y_proba = model.predict_proba(X_test)[:, 1]
            
            accuracies.append(accuracy_score(y_test, y_pred))
            precisions.append(precision_score(y_test, y_pred, zero_division=0))
            recalls.append(recall_score(y_test, y_pred, zero_division=0))
            f1s.append(f1_score(y_test, y_pred, zero_division=0))
            try:
                roc_aucs.append(roc_auc_score(y_test, y_proba))
            except Exception:
                roc_aucs.append(0.5)
        
        metrics = {
            'accuracy': float(np.mean(accuracies)),
            'precision': float(np.mean(precisions)),
            'recall': float(np.mean(recalls)),
            'f1_score': float(np.mean(f1s)),
            'roc_auc': float(np.mean(roc_aucs)),
            'std_f1': float(np.std(f1s))
        }
        task_eval[model_name] = metrics
        print(f"  {model_name:<16} Acc: {metrics['accuracy']:.4f} | F1: {metrics['f1_score']:.4f} | ROC-AUC: {metrics['roc_auc']:.4f}")
    
    # Select best validated model by F1-score (or ROC-AUC)
    best_model_name = max(task_eval.keys(), key=lambda m: task_eval[m]['f1_score'] + task_eval[m]['roc_auc'])
    best_models_info[task_name] = {
        'best_model': best_model_name,
        'metrics': task_eval[best_model_name]
    }
    all_evaluations[task_name] = task_eval
    print(f"==> Selected Best Model for {task_name}: {best_model_name}")
    
    # Train best model on full dataset for inference
    full_scaler = StandardScaler()
    X_full_scaled = full_scaler.fit_transform(X_arr)
    
    final_model = get_models()[best_model_name]
    if best_model_name in ['Neural Network']:
        final_model.fit(X_full_scaled, y_arr)
    else:
        final_model.fit(X_arr, y_arr)
        
    pipeline_obj = {
        'model_name': best_model_name,
        'model': final_model,
        'scaler': full_scaler,
        'is_scaled': (best_model_name == 'Neural Network'),
        'feature_names': feature_names
    }
    best_trained_pipelines[task_name] = pipeline_obj
    joblib.dump(pipeline_obj, os.path.join(OUTPUT_DIR, f'model_{task_name}.joblib'))

# Save evaluation results
with open(os.path.join(OUTPUT_DIR, 'model_evaluations.json'), 'w') as f:
    json.dump({
        'tasks': all_evaluations,
        'best_models': best_models_info
    }, f, indent=2)

print("\n--- Step 3: Saving Training Matrix & Feature Metadata for Inference & LIME ---")
np.save(os.path.join(OUTPUT_DIR, 'training_matrix.npy'), X_arr)
print("Saved training matrix and pipelines successfully.")

print("\n--- Pipeline Completed Successfully! ---")
