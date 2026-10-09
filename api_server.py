import os
import json
import sqlite3
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import lime
import lime.lime_tabular
import hashlib
import time

DB_PATH = 'cardiovascular.db'
ARTIFACTS_DIR = 'ml_artifacts'

app = FastAPI(title="Cardiovascular Risk Visualization & Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- SQLite Database Setup -----------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()
    # Organisations
    c.execute('''
        CREATE TABLE IF NOT EXISTS organisations (
            org_id TEXT PRIMARY KEY,
            org_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at REAL NOT NULL,
            contact_email TEXT,
            department TEXT
        )
    ''')
    # Settings
    c.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            org_id TEXT PRIMARY KEY,
            green_threshold REAL DEFAULT 0.40,
            yellow_threshold REAL DEFAULT 0.65,
            hospital_name TEXT DEFAULT 'Cardiovascular Specialty Institute',
            lead_cardiologist TEXT DEFAULT 'Dr. Zahra Sani, MD, FESC',
            units TEXT DEFAULT 'Standard (mg/dL, mmHg)',
            FOREIGN KEY (org_id) REFERENCES organisations(org_id)
        )
    ''')
    # Patients and Prediction Records
    c.execute('''
        CREATE TABLE IF NOT EXISTS patient_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            org_id TEXT NOT NULL,
            patient_id TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL,
            form_data TEXT NOT NULL,
            prediction_results TEXT NOT NULL,
            lime_explanations TEXT NOT NULL,
            created_at REAL NOT NULL,
            FOREIGN KEY (org_id) REFERENCES organisations(org_id)
        )
    ''')
    # Seed default organisation if empty
    c.execute('SELECT COUNT(*) FROM organisations')
    if c.fetchone()[0] == 0:
        default_pwd = hashlib.sha256("Cardio2026!".encode()).hexdigest()
        c.execute('''
            INSERT INTO organisations (org_id, org_name, password_hash, created_at, contact_email, department)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('ORG-101', 'Heart Health & Vascular Center', default_pwd, time.time(), 'admin@heartcenter.org', 'Department of Cardiology & Coronary Hemodynamics'))
        c.execute('''
            INSERT INTO settings (org_id, green_threshold, yellow_threshold, hospital_name, lead_cardiologist)
            VALUES (?, ?, ?, ?, ?)
        ''', ('ORG-101', 0.40, 0.65, 'Heart Health & Vascular Center', 'Prof. Z. Alizadeh Sani, MD'))
    conn.commit()
    conn.close()

init_db()

# ----------------- Load ML Models and Data -----------------
pipelines = {}
training_matrix = None
feature_metadata = {}
model_evaluations = {}
lime_explainer = None

def load_ml_resources():
    global pipelines, training_matrix, feature_metadata, model_evaluations, lime_explainer
    for task in ['CAD', 'LAD', 'LCX', 'RCA']:
        model_path = os.path.join(ARTIFACTS_DIR, f'model_{task}.joblib')
        if os.path.exists(model_path):
            pipelines[task] = joblib.load(model_path)
            
    meta_path = os.path.join(ARTIFACTS_DIR, 'feature_metadata.json')
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            feature_metadata = json.load(f)
            
    eval_path = os.path.join(ARTIFACTS_DIR, 'model_evaluations.json')
    if os.path.exists(eval_path):
        with open(eval_path) as f:
            model_evaluations = json.load(f)
            
    mat_path = os.path.join(ARTIFACTS_DIR, 'training_matrix.npy')
    if os.path.exists(mat_path):
        training_matrix = np.load(mat_path)
        feature_names = feature_metadata.get('feature_names', [])
        if feature_names:
            lime_explainer = lime.lime_tabular.LimeTabularExplainer(
                training_data=training_matrix,
                feature_names=feature_names,
                class_names=['Normal', 'Risk/Stenosis'],
                mode='classification',
                random_state=42
            )

load_ml_resources()

# ----------------- Schemas -----------------
class AuthRequest(BaseModel):
    org_id: str
    password: str
    org_name: Optional[str] = None

class PatientDetailsInput(BaseModel):
    patient_id: str
    age: int
    gender: str  # "Male" or "Female"
    symptoms: Dict[str, Any] = Field(default_factory=dict)
    diabetes: bool = False
    hypertension: bool = False
    blood_pressure: Dict[str, Optional[float]] = Field(default_factory=dict) # systolic, diastolic, resting_pulse
    cholesterol: Dict[str, Optional[float]] = Field(default_factory=dict) # ldl, hdl, total_cholesterol, triglycerides
    smoking_history: str = "Never" # "Current Smoker", "Ex-Smoker", "Never"
    family_history: bool = False
    previous_heart_events: bool = False # heart attack, angioplasty, stent, bypass
    ecg_report: Dict[str, Any] = Field(default_factory=dict)
    echocardiogram_report: Dict[str, Any] = Field(default_factory=dict)
    coronary_angiography: Dict[str, Any] = Field(default_factory=dict)
    # Optional clinical findings (fields 14-21)
    lad_status: Optional[str] = None # e.g. "70% stenosis" or null
    lcx_status: Optional[str] = None
    rca_status: Optional[str] = None
    plaque_type: Optional[str] = None # "calcified", "non-calcified", "mixed"
    number_vessels_affected: Optional[int] = None # 1, 2, 3
    max_stenosis_percentage: Optional[float] = None
    cad_severity_cadradas: Optional[str] = None
    final_cardiologist_diagnosis: Optional[str] = None
    notes: Optional[str] = None

# Helper to verify auth
def get_current_org(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        # Default org fallback if token not yet saved
        return 'ORG-101'
    token = authorization.replace('Bearer ', '').strip()
    # Simple org session: org_id encoded or token
    if token.startswith('token_'):
        return token.replace('token_', '')
    return token or 'ORG-101'

# ----------------- Auth Endpoints -----------------
@app.post("/api/auth/signup")
def signup(req: AuthRequest):
    org_id = req.org_id.strip()
    if not org_id or not req.password:
        raise HTTPException(status_code=400, detail="Organisation ID and Password are required.")
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT org_id FROM organisations WHERE org_id = ?', (org_id,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail=f"Organisation ID '{org_id}' is already registered. Please login.")
    
    pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()
    org_name = req.org_name.strip() if req.org_name else f"Organisation {org_id}"
    
    c.execute('''
        INSERT INTO organisations (org_id, org_name, password_hash, created_at, contact_email, department)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (org_id, org_name, pwd_hash, time.time(), f"{org_id.lower()}@cardio.med", "Cardiology Division"))
    
    c.execute('''
        INSERT INTO settings (org_id, green_threshold, yellow_threshold, hospital_name, lead_cardiologist)
        VALUES (?, ?, ?, ?, ?)
    ''', (org_id, 0.40, 0.65, org_name, 'Staff Cardiologist'))
    
    conn.commit()
    conn.close()
    
    token = f"token_{org_id}"
    return {
        "success": True,
        "token": token,
        "org_id": org_id,
        "org_name": org_name,
        "message": "Account created successfully."
    }

@app.post("/api/auth/login")
def login(req: AuthRequest):
    org_id = req.org_id.strip()
    if not org_id or not req.password:
        raise HTTPException(status_code=400, detail="Please enter both Organisation ID and Password.")
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT org_id, org_name, password_hash, department FROM organisations WHERE org_id = ?', (org_id,))
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=401, detail="Invalid Organisation ID or Password.")
    
    pwd_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if row['password_hash'] != pwd_hash:
        raise HTTPException(status_code=401, detail="Invalid Organisation ID or Password.")
    
    token = f"token_{row['org_id']}"
    return {
        "success": True,
        "token": token,
        "org_id": row['org_id'],
        "org_name": row['org_name'],
        "department": row['department']
    }

@app.get("/api/auth/me")
def get_profile(org_id: str = Depends(get_current_org)):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT org_id, org_name, created_at, contact_email, department FROM organisations WHERE org_id = ?', (org_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return {
            "org_id": org_id,
            "org_name": f"Organisation {org_id}",
            "contact_email": "cardio@hospital.org",
            "department": "Cardiology Department",
            "created_at": time.time()
        }
    return dict(row)

# ----------------- Settings Endpoints -----------------
@app.get("/api/settings")
def get_settings(org_id: str = Depends(get_current_org)):
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT * FROM settings WHERE org_id = ?', (org_id,))
    row = c.fetchone()
    conn.close()
    if not row:
        return {
            "org_id": org_id,
            "green_threshold": 0.40,
            "yellow_threshold": 0.65,
            "hospital_name": "Cardiovascular Specialty Institute",
            "lead_cardiologist": "Dr. Zahra Sani, MD, FESC",
            "units": "Standard (mg/dL, mmHg)"
        }
    return dict(row)

class SettingsUpdate(BaseModel):
    green_threshold: Optional[float] = 0.40
    yellow_threshold: Optional[float] = 0.65
    hospital_name: Optional[str] = None
    lead_cardiologist: Optional[str] = None

@app.post("/api/settings")
def update_settings(update: SettingsUpdate, org_id: str = Depends(get_current_org)):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO settings (org_id, green_threshold, yellow_threshold, hospital_name, lead_cardiologist)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(org_id) DO UPDATE SET
            green_threshold = COALESCE(excluded.green_threshold, settings.green_threshold),
            yellow_threshold = COALESCE(excluded.yellow_threshold, settings.yellow_threshold),
            hospital_name = COALESCE(excluded.hospital_name, settings.hospital_name),
            lead_cardiologist = COALESCE(excluded.lead_cardiologist, settings.lead_cardiologist)
    ''', (org_id, update.green_threshold, update.yellow_threshold, update.hospital_name, update.lead_cardiologist))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Settings updated."}

# ----------------- Model Evaluations & Dataset Metadata -----------------
@app.get("/api/models/evaluation")
def get_evaluation():
    if not model_evaluations:
        raise HTTPException(status_code=503, detail="Model evaluation records not available. Run ml_pipeline.py.")
    return {
        "dataset_name": "Z-Alizadeh Sani Dataset (UCI / Mendeley)",
        "samples_count": feature_metadata.get('total_samples', 303),
        "target_distribution": feature_metadata.get('target_distribution', {}),
        "cross_validation": "5-Fold Stratified Cross-Validation",
        "evaluations": model_evaluations.get('tasks', {}),
        "best_models": model_evaluations.get('best_models', {}),
        "leakage_prevention_summary": "All target-associated columns (Cath, CAD, LAD, LCX, RCA) strictly isolated from input features. Preprocessing fitted strictly on train folds."
    }

# ----------------- Prediction Feature Mapper -----------------
def construct_feature_vector(patient: PatientDetailsInput) -> np.ndarray:
    feature_names = feature_metadata.get('feature_names', [])
    feature_stats = feature_metadata.get('feature_stats', {})
    if not feature_names:
        raise HTTPException(status_code=500, detail="Feature metadata missing.")
    
    vec = np.zeros(len(feature_names), dtype=float)
    
    # Defaults from dataset means
    for idx, f in enumerate(feature_names):
        vec[idx] = feature_stats.get(f, {}).get('mean', 0.0)
        
    f_map = {name: i for i, name in enumerate(feature_names)}
    
    # Map Demographics
    if 'Age' in f_map:
        vec[f_map['Age']] = float(patient.age)
    if 'Sex_Male' in f_map:
        vec[f_map['Sex_Male']] = 1.0 if patient.gender.lower() == 'male' else 0.0
        
    # Diabetes & HTN
    if 'DM' in f_map:
        vec[f_map['DM']] = 1.0 if patient.diabetes else 0.0
    if 'HTN' in f_map:
        vec[f_map['HTN']] = 1.0 if patient.hypertension else 0.0
        
    # Vitals: BP & Pulse
    sys_bp = patient.blood_pressure.get('systolic')
    if sys_bp is not None and 'BP' in f_map:
        vec[f_map['BP']] = float(sys_bp)
    pr = patient.blood_pressure.get('resting_pulse')
    if pr is not None and 'PR' in f_map:
        vec[f_map['PR']] = float(pr)
        
    # Cholesterol & Lipids
    chol = patient.cholesterol
    if chol.get('ldl') is not None and 'LDL' in f_map:
        vec[f_map['LDL']] = float(chol['ldl'])
    if chol.get('hdl') is not None and 'HDL' in f_map:
        vec[f_map['HDL']] = float(chol['hdl'])
    if chol.get('triglycerides') is not None and 'TG' in f_map:
        vec[f_map['TG']] = float(chol['triglycerides'])
        
    # Smoking History
    smk = patient.smoking_history.lower()
    if 'Current Smoker' in f_map:
        vec[f_map['Current Smoker']] = 1.0 if 'current' in smk else 0.0
    if 'EX-Smoker' in f_map:
        vec[f_map['EX-Smoker']] = 1.0 if 'ex' in smk or 'former' in smk else 0.0
        
    # Family History & Heart events
    if 'FH' in f_map:
        vec[f_map['FH']] = 1.0 if patient.family_history else 0.0
    if patient.previous_heart_events:
        if 'Typical Chest Pain' in f_map and 'typical' in str(patient.symptoms.get('chest_pain_type', '')).lower():
            vec[f_map['Typical Chest Pain']] = 1.0
            
    # Symptoms
    sym = patient.symptoms
    cp_type = str(sym.get('chest_pain_type', '')).lower()
    if 'Typical Chest Pain' in f_map:
        vec[f_map['Typical Chest Pain']] = 1.0 if 'typical' in cp_type else 0.0
    if 'Atypical' in f_map:
        vec[f_map['Atypical']] = 1.0 if 'atypical' in cp_type else 0.0
    if 'Nonanginal' in f_map:
        vec[f_map['Nonanginal']] = 1.0 if 'non' in cp_type else 0.0
    if 'Dyspnea' in f_map:
        vec[f_map['Dyspnea']] = 1.0 if (sym.get('breathlessness') or sym.get('dyspnea')) else 0.0
        
    # ECG findings
    ecg = patient.ecg_report
    if 'St Elevation' in f_map:
        vec[f_map['St Elevation']] = 1.0 if ecg.get('st_elevation') else 0.0
    if 'St Depression' in f_map:
        vec[f_map['St Depression']] = 1.0 if ecg.get('st_depression') else 0.0
    if 'Tinversion' in f_map:
        vec[f_map['Tinversion']] = 1.0 if ecg.get('t_inversion') else 0.0
    if 'Q Wave' in f_map:
        vec[f_map['Q Wave']] = 1.0 if ecg.get('q_wave') else 0.0
    if 'LVH' in f_map:
        vec[f_map['LVH']] = 1.0 if ecg.get('lvh') else 0.0
    if 'Poor R Progression' in f_map:
        vec[f_map['Poor R Progression']] = 1.0 if ecg.get('poor_r_progression') else 0.0
        
    # Echo findings
    echo = patient.echocardiogram_report
    if 'EF-TTE' in f_map and echo.get('ejection_fraction') is not None:
        vec[f_map['EF-TTE']] = float(echo['ejection_fraction'])
    if 'Region RWMA' in f_map:
        vec[f_map['Region RWMA']] = float(echo.get('rwma_segments', 0.0))
        
    return vec

# ----------------- Inference & Prediction Endpoint -----------------
@app.post("/api/predict")
def predict_cardiovascular_risk(patient: PatientDetailsInput, org_id: str = Depends(get_current_org)):
    if not pipelines or 'CAD' not in pipelines:
        raise HTTPException(status_code=503, detail="Trained ML models unavailable. Run ml_pipeline.py.")
    
    # 1. Feature Vector Construction
    x_vec = construct_feature_vector(patient)
    x_2d = x_vec.reshape(1, -1)
    
    task_results = {}
    lime_results = {}
    
    # 2. Run Inference for all 4 Tasks
    for task_name in ['CAD', 'LAD', 'LCX', 'RCA']:
        pipe = pipelines[task_name]
        model = pipe['model']
        is_scaled = pipe['is_scaled']
        scaler = pipe['scaler']
        
        inp = scaler.transform(x_2d) if is_scaled else x_2d
        
        proba = float(model.predict_proba(inp)[0][1])
        prediction_class = "Stenotic" if (proba >= 0.5) else "Normal"
        if task_name == 'CAD':
            prediction_class = "CAD Present" if (proba >= 0.5) else "Normal / No Significant CAD"
            
        task_results[task_name] = {
            "task": task_name,
            "model_family": pipe['model_name'],
            "probability": round(proba, 4),
            "predicted_class": prediction_class,
            "confidence_percent": round(proba * 100, 1),
            "threshold": 0.50
        }
        
        # 3. Real LIME Explanation for each prediction
        if lime_explainer is not None:
            def predict_for_lime(arr):
                if is_scaled:
                    arr_scaled = scaler.transform(arr)
                    return model.predict_proba(arr_scaled)
                return model.predict_proba(arr)
            
            try:
                exp = lime_explainer.explain_instance(
                    x_vec,
                    predict_for_lime,
                    num_features=7
                )
                features_exp = []
                for feat_desc, weight in exp.as_list():
                    features_exp.append({
                        "feature_condition": feat_desc,
                        "weight": round(weight, 4),
                        "direction": "Risk-Increasing" if weight > 0 else "Protective/Normalizing",
                        "importance_abs": round(abs(weight), 4)
                    })
                lime_results[task_name] = features_exp
            except Exception as e:
                lime_results[task_name] = []
        else:
            lime_results[task_name] = []

    # 4. Save to Database
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        INSERT INTO patient_predictions (
            org_id, patient_id, age, gender, form_data, prediction_results, lime_explanations, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        org_id,
        patient.patient_id,
        patient.age,
        patient.gender,
        json.dumps(patient.dict()),
        json.dumps(task_results),
        json.dumps(lime_results),
        time.time()
    ))
    record_id = c.lastrowid
    conn.commit()
    conn.close()

    # 5. Extract reported measured clinical findings
    reported_findings = {
        "lad_status": patient.lad_status or "Unavailable / Not measured",
        "lcx_status": patient.lcx_status or "Unavailable / Not measured",
        "rca_status": patient.rca_status or "Unavailable / Not measured",
        "plaque_type": patient.plaque_type or "Unavailable",
        "number_vessels_affected": patient.number_vessels_affected or "Unavailable",
        "max_stenosis_percentage": f"{patient.max_stenosis_percentage}%" if patient.max_stenosis_percentage is not None else "Unavailable",
        "cad_severity_cadradas": patient.cad_severity_cadradas or "Unavailable",
        "final_cardiologist_diagnosis": patient.final_cardiologist_diagnosis or "Pending clinical review"
    }

    return {
        "record_id": record_id,
        "patient_id": patient.patient_id,
        "timestamp": time.time(),
        "predictions": task_results,
        "lime_explanations": lime_results,
        "reported_findings": reported_findings,
        "clinical_safety_disclaimer": "Clinical decision-support and educational tool only. Predictions are based on available input data and trained machine learning models. They are not a substitute for professional medical assessment, ECG interpretation, coronary imaging, angiography, or a cardiologist's diagnosis. Predicted vessel risk does not establish the exact anatomical location or severity of a blockage. All results must be interpreted by a qualified healthcare professional."
    }

# ----------------- Patients Records Endpoints -----------------
@app.get("/api/patients")
def list_patients(org_id: str = Depends(get_current_org)):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT id, patient_id, age, gender, created_at, prediction_results
        FROM patient_predictions
        WHERE org_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ''', (org_id,))
    rows = c.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        pred_dict = {}
        try:
            pred_dict = json.loads(r['prediction_results'])
        except Exception:
            pass
        results.append({
            "id": r['id'],
            "patient_id": r['patient_id'],
            "age": r['age'],
            "gender": r['gender'],
            "created_at": r['created_at'],
            "cad_status": pred_dict.get('CAD', {}).get('predicted_class', 'N/A'),
            "cad_prob": pred_dict.get('CAD', {}).get('confidence_percent', 0.0)
        })
    return results

@app.get("/api/patients/{record_id}")
def get_patient_record(record_id: int, org_id: str = Depends(get_current_org)):
    conn = get_db()
    c = conn.cursor()
    c.execute('''
        SELECT * FROM patient_predictions
        WHERE id = ? AND org_id = ?
    ''', (record_id, org_id))
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Patient record not found.")
    
    return {
        "id": row['id'],
        "patient_id": row['patient_id'],
        "age": row['age'],
        "gender": row['gender'],
        "created_at": row['created_at'],
        "form_data": json.loads(row['form_data']),
        "prediction_results": json.loads(row['prediction_results']),
        "lime_explanations": json.loads(row['lime_explanations']),
        "disclaimer": "Clinical decision-support and educational tool only. Predictions are based on available input data and trained machine learning models. They are not a substitute for professional medical assessment, ECG interpretation, coronary imaging, angiography, or a cardiologist's diagnosis. Predicted vessel risk does not establish the exact anatomical location or severity of a blockage. All results must be interpreted by a qualified healthcare professional."
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "models_loaded": list(pipelines.keys()),
        "lime_ready": lime_explainer is not None,
        "dataset_samples": feature_metadata.get('total_samples', 303)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
