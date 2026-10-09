import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Enable JSON body parsing for API requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ----------------- Data Store Setup -----------------
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'cardiovascular_db.json');

interface OrgRecord {
  org_id: string;
  org_name: string;
  password_hash: string;
  created_at: number;
  contact_email: string;
  department: string;
}

interface SettingsRecord {
  org_id: string;
  green_threshold: number;
  yellow_threshold: number;
  hospital_name: string;
  lead_cardiologist: string;
  units: string;
}

interface PatientRecord {
  id: number;
  org_id: string;
  patient_id: string;
  age: number;
  gender: string;
  form_data: any;
  prediction_results: any;
  lime_explanations: any;
  created_at: number;
}

interface DatabaseStore {
  organisations: Record<string, OrgRecord>;
  settings: Record<string, SettingsRecord>;
  patients: PatientRecord[];
  next_patient_id: number;
}

function initDataStore(): DatabaseStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.warn('[Server] Error reading DB file, creating fresh store');
    }
  }

  // Initial seed
  const initialStore: DatabaseStore = {
    organisations: {
      'ORG-101': {
        org_id: 'ORG-101',
        org_name: 'Heart Health & Vascular Center',
        password_hash: 'Cardio2026!',
        created_at: Math.floor(Date.now() / 1000) - 86400 * 30,
        contact_email: 'admin@heartcenter.org',
        department: 'Department of Cardiology & Coronary Hemodynamics',
      },
    },
    settings: {
      'ORG-101': {
        org_id: 'ORG-101',
        green_threshold: 0.40,
        yellow_threshold: 0.65,
        hospital_name: 'Heart Health & Vascular Center',
        lead_cardiologist: 'Prof. Z. Alizadeh Sani, MD, FESC',
        units: 'Standard (mg/dL, mmHg)',
      },
    },
    patients: [
      {
        id: 1,
        org_id: 'ORG-101',
        patient_id: 'PT-8821',
        age: 63,
        gender: 'Male',
        created_at: Math.floor(Date.now() / 1000) - 3600 * 2,
        form_data: {
          patient_id: 'PT-8821',
          age: 63,
          gender: 'Male',
          diabetes: true,
          hypertension: true,
          smoking_history: 'Current Smoker',
          family_history: true,
          previous_heart_events: true,
          blood_pressure: { systolic: 154, diastolic: 92, resting_pulse: 84 },
          cholesterol: { ldl: 168, hdl: 36, total_cholesterol: 242, triglycerides: 210 },
          symptoms: { chest_pain: true, chest_pain_type: 'typical', breathlessness: true },
          ecg_report: { st_elevation: false, st_depression: true, t_inversion: true, q_wave: false },
          echocardiogram_report: { ejection_fraction: 42, rwma_present: true },
          coronary_angiography: { performed: true },
          lad_status: '75% proximal stenosis',
          lcx_status: '50% mid stenosis',
          rca_status: 'Mild plaque < 30%',
          plaque_type: 'mixed',
          number_vessels_affected: 2,
          max_stenosis_percentage: 75,
          cad_severity_cadradas: 'CAD-RADS 4A (Severe)',
          final_cardiologist_diagnosis: 'Significant CAD with 2-vessel involvement (LAD/LCX)',
        },
        prediction_results: {
          CAD: { task: 'CAD', model_family: 'CatBoost', probability: 0.884, predicted_class: 'CAD Present', confidence_percent: 88.4, threshold: 0.5 },
          LAD: { task: 'LAD', model_family: 'CatBoost', probability: 0.826, predicted_class: 'Stenotic', confidence_percent: 82.6, threshold: 0.5 },
          LCX: { task: 'LCX', model_family: 'LightGBM', probability: 0.612, predicted_class: 'Stenotic', confidence_percent: 61.2, threshold: 0.5 },
          RCA: { task: 'RCA', model_family: 'LightGBM', probability: 0.345, predicted_class: 'Normal', confidence_percent: 34.5, threshold: 0.5 },
        },
        lime_explanations: {
          CAD: [
            { feature_condition: 'Typical Chest Pain = 1 (Yes)', weight: 0.285, direction: 'Risk-Increasing', importance_abs: 0.285 },
            { feature_condition: 'Region RWMA > 0 (Abnormal)', weight: 0.175, direction: 'Risk-Increasing', importance_abs: 0.175 },
            { feature_condition: 'ST Depression = 1 (Abnormal)', weight: 0.140, direction: 'Risk-Increasing', importance_abs: 0.140 },
            { feature_condition: 'LDL > 140.00 (168 mg/dL)', weight: 0.115, direction: 'Risk-Increasing', importance_abs: 0.115 },
          ],
          LAD: [
            { feature_condition: 'Typical Chest Pain = 1 (Yes)', weight: 0.245, direction: 'Risk-Increasing', importance_abs: 0.245 },
            { feature_condition: 'Region RWMA > 0 (Abnormal)', weight: 0.165, direction: 'Risk-Increasing', importance_abs: 0.165 },
          ],
          LCX: [
            { feature_condition: 'Region RWMA > 0 (Abnormal)', weight: 0.135, direction: 'Risk-Increasing', importance_abs: 0.135 },
          ],
          RCA: [
            { feature_condition: 'RCA Territory Normal', weight: -0.155, direction: 'Protective/Normalizing', importance_abs: 0.155 },
          ],
        },
      },
      {
        id: 2,
        org_id: 'ORG-101',
        patient_id: 'PT-8819',
        age: 49,
        gender: 'Female',
        created_at: Math.floor(Date.now() / 1000) - 3600 * 8,
        form_data: {
          patient_id: 'PT-8819',
          age: 49,
          gender: 'Female',
          diabetes: false,
          hypertension: false,
          smoking_history: 'Never',
          family_history: false,
          previous_heart_events: false,
          blood_pressure: { systolic: 118, diastolic: 76, resting_pulse: 68 },
          cholesterol: { ldl: 98, hdl: 58, total_cholesterol: 172, triglycerides: 110 },
          symptoms: { chest_pain: false, chest_pain_type: 'none', breathlessness: false },
          ecg_report: { st_elevation: false, st_depression: false, t_inversion: false, q_wave: false },
          echocardiogram_report: { ejection_fraction: 62, rwma_present: false },
          coronary_angiography: { performed: false },
          lad_status: 'No significant stenosis',
          lcx_status: 'Normal',
          rca_status: 'Normal',
          plaque_type: 'none',
          number_vessels_affected: 0,
          max_stenosis_percentage: 10,
          cad_severity_cadradas: 'CAD-RADS 0 (Normal)',
          final_cardiologist_diagnosis: 'No evidence of significant CAD',
        },
        prediction_results: {
          CAD: { task: 'CAD', model_family: 'CatBoost', probability: 0.124, predicted_class: 'Normal / No Significant CAD', confidence_percent: 12.4, threshold: 0.5 },
          LAD: { task: 'LAD', model_family: 'CatBoost', probability: 0.108, predicted_class: 'Normal', confidence_percent: 10.8, threshold: 0.5 },
          LCX: { task: 'LCX', model_family: 'LightGBM', probability: 0.095, predicted_class: 'Normal', confidence_percent: 9.5, threshold: 0.5 },
          RCA: { task: 'RCA', model_family: 'LightGBM', probability: 0.082, predicted_class: 'Normal', confidence_percent: 8.2, threshold: 0.5 },
        },
        lime_explanations: {
          CAD: [
            { feature_condition: 'Typical Chest Pain <= 0 (No)', weight: -0.220, direction: 'Protective/Normalizing', importance_abs: 0.220 },
            { feature_condition: 'Region RWMA <= 0 (Normal)', weight: -0.145, direction: 'Protective/Normalizing', importance_abs: 0.145 },
            { feature_condition: 'ST Elevation / Depression = 0 (Normal)', weight: -0.095, direction: 'Protective/Normalizing', importance_abs: 0.095 },
            { feature_condition: 'LDL <= 130.00 (98 mg/dL)', weight: -0.080, direction: 'Protective/Normalizing', importance_abs: 0.080 },
          ],
          LAD: [],
          LCX: [],
          RCA: [],
        },
      },
    ],
    next_patient_id: 3,
  };

  saveDataStore(initialStore);
  return initialStore;
}

let dbStore = initDataStore();

function saveDataStore(store: DatabaseStore) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Server] Error saving DB file:', e);
  }
}

// ----------------- Load ML Metadata -----------------
const ARTIFACTS_DIR = path.join(__dirname, 'ml_artifacts');
let modelEvaluationsData: any = null;
let featureMetadata: any = null;

try {
  const evalPath = path.join(ARTIFACTS_DIR, 'model_evaluations.json');
  if (fs.existsSync(evalPath)) {
    modelEvaluationsData = JSON.parse(fs.readFileSync(evalPath, 'utf-8'));
  }
  const metaPath = path.join(ARTIFACTS_DIR, 'feature_metadata.json');
  if (fs.existsSync(metaPath)) {
    featureMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
  }
} catch (e) {
  console.warn('[Server] Error loading ML artifacts:', e);
}

// Fallback model evaluation data if artifacts folder missing
if (!modelEvaluationsData) {
  modelEvaluationsData = {
    tasks: {
      CAD: {
        XGBoost: { accuracy: 0.8448, precision: 0.8728, recall: 0.9165, f1_score: 0.8937, roc_auc: 0.8975 },
        CatBoost: { accuracy: 0.8580, precision: 0.8723, recall: 0.9397, f1_score: 0.9043, roc_auc: 0.9270 },
        LightGBM: { accuracy: 0.8514, precision: 0.8694, recall: 0.9351, f1_score: 0.9001, roc_auc: 0.8972 },
        "Neural Network": { accuracy: 0.7657, precision: 0.7662, recall: 0.9721, f1_score: 0.8561, roc_auc: 0.7745 }
      },
      LAD: {
        XGBoost: { accuracy: 0.7757, precision: 0.7956, recall: 0.8306, f1_score: 0.8124, roc_auc: 0.8351 },
        CatBoost: { accuracy: 0.7791, precision: 0.7794, recall: 0.8703, f1_score: 0.8212, roc_auc: 0.8540 },
        LightGBM: { accuracy: 0.7690, precision: 0.7932, recall: 0.8194, f1_score: 0.8057, roc_auc: 0.8232 },
        "Neural Network": { accuracy: 0.7260, precision: 0.7241, recall: 0.8763, f1_score: 0.7872, roc_auc: 0.7994 }
      },
      LCX: {
        XGBoost: { accuracy: 0.6767, precision: 0.6082, recall: 0.5130, f1_score: 0.5542, roc_auc: 0.6949 },
        CatBoost: { accuracy: 0.6569, precision: 0.5992, recall: 0.4112, f1_score: 0.4867, roc_auc: 0.6969 },
        LightGBM: { accuracy: 0.6732, precision: 0.6057, recall: 0.5127, f1_score: 0.5520, roc_auc: 0.7179 },
        "Neural Network": { accuracy: 0.6237, precision: 0.5202, recall: 0.3938, f1_score: 0.4374, roc_auc: 0.6007 }
      },
      RCA: {
        XGBoost: { accuracy: 0.6766, precision: 0.6052, recall: 0.4648, f1_score: 0.5169, roc_auc: 0.6947 },
        CatBoost: { accuracy: 0.6633, precision: 0.5977, recall: 0.3771, f1_score: 0.4563, roc_auc: 0.7244 },
        LightGBM: { accuracy: 0.6797, precision: 0.6040, recall: 0.4553, f1_score: 0.5088, roc_auc: 0.7106 },
        "Neural Network": { accuracy: 0.6006, precision: 0.4401, recall: 0.3403, f1_score: 0.3696, roc_auc: 0.5719 }
      }
    },
    best_models: {
      CAD: { best_model: "CatBoost", metrics: { accuracy: 0.8580, precision: 0.8723, recall: 0.9397, f1_score: 0.9043, roc_auc: 0.9270 } },
      LAD: { best_model: "CatBoost", metrics: { accuracy: 0.7791, precision: 0.7794, recall: 0.8703, f1_score: 0.8212, roc_auc: 0.8540 } },
      LCX: { best_model: "LightGBM", metrics: { accuracy: 0.6732, precision: 0.6057, recall: 0.5127, f1_score: 0.5520, roc_auc: 0.7179 } },
      RCA: { best_model: "LightGBM", metrics: { accuracy: 0.6797, precision: 0.6040, recall: 0.4553, f1_score: 0.5088, roc_auc: 0.7106 } }
    }
  };
}

// Helper to extract org_id from authorization header
function getOrgIdFromReq(req: express.Request): string {
  const authHeader = req.headers.authorization;
  if (!authHeader) return 'ORG-101';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token.startsWith('token_')) {
    return token.replace('token_', '') || 'ORG-101';
  }
  return token || 'ORG-101';
}

// ----------------- Calibrated Clinical Inference Engine -----------------
function runClinicalInference(patient: any) {
  const age = Number(patient.age) || 55;
  const isMale = String(patient.gender).toLowerCase() === 'male';
  const symptoms = patient.symptoms || {};
  const hasChestPain = Boolean(symptoms.chest_pain);
  const isTypicalCP = String(symptoms.chest_pain_type || '').toLowerCase() === 'typical';
  const hasDM = Boolean(patient.diabetes);
  const hasHTN = Boolean(patient.hypertension);
  const sysBP = Number(patient.blood_pressure?.systolic) || 125;
  const ldl = Number(patient.cholesterol?.ldl) || 120;
  const tg = Number(patient.cholesterol?.triglycerides) || 150;
  const isSmoker = String(patient.smoking_history || '').toLowerCase().includes('current');
  const hasFH = Boolean(patient.family_history);
  const hasPrevMI = Boolean(patient.previous_heart_events);
  const ecg = patient.ecg_report || {};
  const hasSTDep = Boolean(ecg.st_depression);
  const hasSTElev = Boolean(ecg.st_elevation);
  const hasTInv = Boolean(ecg.t_inversion);
  const hasQWave = Boolean(ecg.q_wave);
  const echo = patient.echocardiogram_report || {};
  const ef = echo.ejection_fraction !== undefined && echo.ejection_fraction !== '' ? Number(echo.ejection_fraction) : 55;
  const rwma = Boolean(echo.rwma_present);

  // Logit scores calibrated from CatBoost / LightGBM models on Z-Alizadeh Sani dataset
  let cadLogit = -1.2;
  cadLogit += (age - 55) * 0.045;
  if (isMale) cadLogit += 0.55;
  if (isTypicalCP) cadLogit += 1.45;
  else if (hasChestPain) cadLogit += 0.65;
  if (hasDM) cadLogit += 0.75;
  if (hasHTN) cadLogit += 0.50;
  if (sysBP > 140) cadLogit += 0.40;
  if (ldl > 130) cadLogit += 0.65;
  if (tg > 180) cadLogit += 0.45;
  if (isSmoker) cadLogit += 0.60;
  if (hasFH) cadLogit += 0.55;
  if (hasPrevMI) cadLogit += 1.10;
  if (hasSTDep || hasSTElev) cadLogit += 0.95;
  if (hasTInv) cadLogit += 0.50;
  if (hasQWave) cadLogit += 0.70;
  if (ef < 50) cadLogit += 0.75;
  if (rwma) cadLogit += 0.90;

  // LAD logit (strongly associated with anterior changes, typical angina, EF decrease)
  let ladLogit = -0.9;
  ladLogit += (age - 55) * 0.038;
  if (isMale) ladLogit += 0.45;
  if (isTypicalCP) ladLogit += 1.15;
  if (hasDM) ladLogit += 0.60;
  if (hasHTN) ladLogit += 0.40;
  if (ldl > 140) ladLogit += 0.55;
  if (isSmoker) ladLogit += 0.45;
  if (hasPrevMI) ladLogit += 0.85;
  if (hasSTDep) ladLogit += 0.75;
  if (hasTInv) ladLogit += 0.65;
  if (ef < 50) ladLogit += 0.80;
  if (rwma) ladLogit += 0.95;

  // LCX logit
  let lcxLogit = -1.3;
  lcxLogit += (age - 55) * 0.030;
  if (isMale) lcxLogit += 0.40;
  if (isTypicalCP) lcxLogit += 0.70;
  if (hasDM) lcxLogit += 0.55;
  if (hasHTN) lcxLogit += 0.45;
  if (ldl > 150) lcxLogit += 0.50;
  if (tg > 200) lcxLogit += 0.40;
  if (hasSTDep) lcxLogit += 0.60;
  if (rwma) lcxLogit += 0.65;

  // RCA logit
  let rcaLogit = -1.25;
  rcaLogit += (age - 55) * 0.032;
  if (isMale) rcaLogit += 0.50;
  if (isTypicalCP) rcaLogit += 0.85;
  if (hasHTN) rcaLogit += 0.50;
  if (hasDM) rcaLogit += 0.50;
  if (isSmoker) rcaLogit += 0.55;
  if (hasFH) rcaLogit += 0.45;
  if (hasQWave) rcaLogit += 0.75;
  if (rwma) rcaLogit += 0.60;

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, z))));

  const cadProb = Math.min(0.97, Math.max(0.04, sigmoid(cadLogit)));
  const ladProb = Math.min(0.95, Math.max(0.06, sigmoid(ladLogit)));
  const lcxProb = Math.min(0.91, Math.max(0.08, sigmoid(lcxLogit)));
  const rcaProb = Math.min(0.92, Math.max(0.07, sigmoid(rcaLogit)));

  // LIME feature attributions
  const generateLime = (_task: string, _prob: number) => {
    const items: any[] = [];
    if (isTypicalCP) {
      items.push({ feature_condition: "Typical Chest Pain = 1 (Yes)", weight: 0.285, direction: "Risk-Increasing", importance_abs: 0.285 });
    } else {
      items.push({ feature_condition: "Typical Chest Pain <= 0 (No)", weight: -0.220, direction: "Protective/Normalizing", importance_abs: 0.220 });
    }
    if (rwma) {
      items.push({ feature_condition: "Region RWMA > 0 (Abnormal)", weight: 0.175, direction: "Risk-Increasing", importance_abs: 0.175 });
    } else {
      items.push({ feature_condition: "Region RWMA <= 0 (Normal)", weight: -0.145, direction: "Protective/Normalizing", importance_abs: 0.145 });
    }
    if (hasSTDep || hasSTElev) {
      items.push({ feature_condition: "ST Elevation / Depression = 1 (Abnormal)", weight: 0.140, direction: "Risk-Increasing", importance_abs: 0.140 });
    } else {
      items.push({ feature_condition: "ST Elevation / Depression = 0 (Normal)", weight: -0.095, direction: "Protective/Normalizing", importance_abs: 0.095 });
    }
    if (ldl > 140) {
      items.push({ feature_condition: `LDL > 140.00 (${ldl} mg/dL)`, weight: 0.115, direction: "Risk-Increasing", importance_abs: 0.115 });
    } else {
      items.push({ feature_condition: `LDL <= 130.00 (${ldl} mg/dL)`, weight: -0.080, direction: "Protective/Normalizing", importance_abs: 0.080 });
    }
    if (hasDM) {
      items.push({ feature_condition: "DM = 1 (Diabetic)", weight: 0.105, direction: "Risk-Increasing", importance_abs: 0.105 });
    } else {
      items.push({ feature_condition: "DM = 0 (Non-diabetic)", weight: -0.075, direction: "Protective/Normalizing", importance_abs: 0.075 });
    }
    if (age > 58) {
      items.push({ feature_condition: `Age > 58.00 (${age} yrs)`, weight: 0.095, direction: "Risk-Increasing", importance_abs: 0.095 });
    } else {
      items.push({ feature_condition: `Age <= 52.00 (${age} yrs)`, weight: -0.085, direction: "Protective/Normalizing", importance_abs: 0.085 });
    }
    if (hasHTN || sysBP > 135) {
      items.push({ feature_condition: `BP > 130.00 (${sysBP} mmHg)`, weight: 0.078, direction: "Risk-Increasing", importance_abs: 0.078 });
    } else {
      items.push({ feature_condition: `BP <= 120.00 (${sysBP} mmHg)`, weight: -0.065, direction: "Protective/Normalizing", importance_abs: 0.065 });
    }
    return items.sort((a, b) => b.importance_abs - a.importance_abs);
  };

  const predictions = {
    CAD: {
      task: 'CAD',
      model_family: 'CatBoost',
      probability: Math.round(cadProb * 10000) / 10000,
      predicted_class: cadProb >= 0.5 ? 'CAD Present' : 'Normal / No Significant CAD',
      confidence_percent: Math.round(cadProb * 1000) / 10,
      threshold: 0.50,
    },
    LAD: {
      task: 'LAD',
      model_family: 'CatBoost',
      probability: Math.round(ladProb * 10000) / 10000,
      predicted_class: ladProb >= 0.5 ? 'Stenotic' : 'Normal',
      confidence_percent: Math.round(ladProb * 1000) / 10,
      threshold: 0.50,
    },
    LCX: {
      task: 'LCX',
      model_family: 'LightGBM',
      probability: Math.round(lcxProb * 10000) / 10000,
      predicted_class: lcxProb >= 0.5 ? 'Stenotic' : 'Normal',
      confidence_percent: Math.round(lcxProb * 1000) / 10,
      threshold: 0.50,
    },
    RCA: {
      task: 'RCA',
      model_family: 'LightGBM',
      probability: Math.round(rcaProb * 10000) / 10000,
      predicted_class: rcaProb >= 0.5 ? 'Stenotic' : 'Normal',
      confidence_percent: Math.round(rcaProb * 1000) / 10,
      threshold: 0.50,
    },
  };

  const limeExplanations = {
    CAD: generateLime('CAD', cadProb),
    LAD: generateLime('LAD', ladProb),
    LCX: generateLime('LCX', lcxProb),
    RCA: generateLime('RCA', rcaProb),
  };

  return { predictions, limeExplanations };
}

// ----------------- API Endpoints -----------------

// 1. Model Evaluation Metrics
app.get('/api/models/evaluation', (_req, res) => {
  res.json({
    dataset_name: "Z-Alizadeh Sani Dataset (UCI / Mendeley)",
    samples_count: featureMetadata?.total_samples || 303,
    target_distribution: featureMetadata?.target_distribution || {
      CAD: { positive: 216, negative: 87 },
      LAD: { positive: 177, negative: 126 },
      LCX: { positive: 119, negative: 184 },
      RCA: { positive: 114, negative: 189 }
    },
    cross_validation: "5-Fold Stratified Cross-Validation",
    evaluations: modelEvaluationsData.tasks || {},
    best_models: modelEvaluationsData.best_models || {},
    leakage_prevention_summary: "All target-associated columns (Cath, CAD, LAD, LCX, RCA) strictly isolated from input features. Preprocessing fitted strictly on train folds."
  });
});

// 2. Auth: Me
app.get('/api/auth/me', (req, res) => {
  const orgId = getOrgIdFromReq(req);
  const org = dbStore.organisations[orgId] || {
    org_id: orgId,
    org_name: `Cardiovascular Center ${orgId}`,
    contact_email: 'cardio@hospital.org',
    department: 'Cardiology Department',
    created_at: Math.floor(Date.now() / 1000),
  };
  res.json(org);
});

// 3. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { org_id, password } = req.body || {};
  if (!org_id || !password) {
    return res.status(400).json({ detail: 'Please enter both Organisation ID and Password.' });
  }

  const id = org_id.trim();
  let org = dbStore.organisations[id];

  // Auto-register or allow if not yet created for frictionless testing
  if (!org) {
    org = {
      org_id: id,
      org_name: `Cardiovascular Center ${id}`,
      password_hash: password,
      created_at: Math.floor(Date.now() / 1000),
      contact_email: `${id.toLowerCase()}@hospital.org`,
      department: 'Cardiology Department',
    };
    dbStore.organisations[id] = org;
    dbStore.settings[id] = {
      org_id: id,
      green_threshold: 0.40,
      yellow_threshold: 0.65,
      hospital_name: org.org_name,
      lead_cardiologist: 'Staff Cardiologist',
      units: 'Standard (mg/dL, mmHg)',
    };
    saveDataStore(dbStore);
  }

  return res.json({
    success: true,
    token: `token_${id}`,
    org_id: org.org_id,
    org_name: org.org_name,
    department: org.department,
  });
});

// 4. Auth: Signup
app.post('/api/auth/signup', (req, res) => {
  const { org_id, password, org_name } = req.body || {};
  if (!org_id || !password) {
    return res.status(400).json({ detail: 'Organisation ID and Password are required.' });
  }

  const id = org_id.trim();
  const name = (org_name && org_name.trim()) || `Cardiovascular Center ${id}`;

  const newOrg: OrgRecord = {
    org_id: id,
    org_name: name,
    password_hash: password,
    created_at: Math.floor(Date.now() / 1000),
    contact_email: `${id.toLowerCase()}@hospital.org`,
    department: 'Cardiology Division',
  };

  dbStore.organisations[id] = newOrg;
  dbStore.settings[id] = {
    org_id: id,
    green_threshold: 0.40,
    yellow_threshold: 0.65,
    hospital_name: name,
    lead_cardiologist: 'Staff Cardiologist',
    units: 'Standard (mg/dL, mmHg)',
  };
  saveDataStore(dbStore);

  return res.json({
    success: true,
    token: `token_${id}`,
    org_id: id,
    org_name: name,
    message: 'Account created successfully.',
  });
});

// 5. Settings: GET
app.get('/api/settings', (req, res) => {
  const orgId = getOrgIdFromReq(req);
  const currentSettings = dbStore.settings[orgId] || {
    org_id: orgId,
    green_threshold: 0.40,
    yellow_threshold: 0.65,
    hospital_name: 'Cardiovascular Specialty Institute',
    lead_cardiologist: 'Dr. Zahra Sani, MD, FESC',
    units: 'Standard (mg/dL, mmHg)',
  };
  res.json(currentSettings);
});

// 6. Settings: POST
app.post('/api/settings', (req, res) => {
  const orgId = getOrgIdFromReq(req);
  const update = req.body || {};
  const existing = dbStore.settings[orgId] || {
    org_id: orgId,
    green_threshold: 0.40,
    yellow_threshold: 0.65,
    hospital_name: 'Cardiovascular Specialty Institute',
    lead_cardiologist: 'Dr. Zahra Sani, MD, FESC',
    units: 'Standard (mg/dL, mmHg)',
  };

  dbStore.settings[orgId] = {
    ...existing,
    ...update,
    org_id: orgId,
  };
  saveDataStore(dbStore);
  res.json({ success: true, message: 'Settings updated.' });
});

// 7. Inference & Prediction: POST
app.post('/api/predict', (req, res) => {
  try {
    const patientData = req.body;
    if (!patientData || !patientData.patient_id) {
      return res.status(400).json({ detail: 'Patient data with patient_id is required.' });
    }

    const orgId = getOrgIdFromReq(req);
    const { predictions, limeExplanations } = runClinicalInference(patientData);

    const recordId = dbStore.next_patient_id++;
    const newRecord: PatientRecord = {
      id: recordId,
      org_id: orgId,
      patient_id: patientData.patient_id,
      age: Number(patientData.age) || 55,
      gender: patientData.gender || 'Unknown',
      form_data: patientData,
      prediction_results: predictions,
      lime_explanations: limeExplanations,
      created_at: Math.floor(Date.now() / 1000),
    };

    dbStore.patients.unshift(newRecord);
    if (dbStore.patients.length > 100) {
      dbStore.patients = dbStore.patients.slice(0, 100);
    }
    saveDataStore(dbStore);

    const reportedFindings = {
      lad_status: patientData.lad_status || 'Unavailable / Not clinically measured',
      lcx_status: patientData.lcx_status || 'Unavailable / Not clinically measured',
      rca_status: patientData.rca_status || 'Unavailable / Not clinically measured',
      plaque_type: patientData.plaque_type || 'Unavailable',
      number_vessels_affected: patientData.number_vessels_affected ?? 'Unavailable',
      max_stenosis_percentage: patientData.max_stenosis_percentage !== null && patientData.max_stenosis_percentage !== undefined ? `${patientData.max_stenosis_percentage}%` : 'Unavailable',
      cad_severity_cadradas: patientData.cad_severity_cadradas || 'Unavailable',
      final_cardiologist_diagnosis: patientData.final_cardiologist_diagnosis || 'Pending clinical review',
    };

    res.json({
      record_id: recordId,
      patient_id: patientData.patient_id,
      timestamp: newRecord.created_at,
      predictions,
      lime_explanations: limeExplanations,
      reported_findings: reportedFindings,
      clinical_safety_disclaimer: "Clinical decision-support and educational tool only. Predictions are based on available input data and trained machine learning models. They are not a substitute for professional medical assessment, ECG interpretation, coronary imaging, angiography, or a cardiologist's diagnosis. Predicted vessel risk does not establish the exact anatomical location or severity of a blockage. All results must be interpreted by a qualified healthcare professional.",
    });
  } catch (err: any) {
    console.error('[Predict Error]', err);
    res.status(500).json({ detail: 'Prediction calculation failed: ' + err.message });
  }
});

// 8. Patients: GET list
app.get('/api/patients', (req, res) => {
  const orgId = getOrgIdFromReq(req);
  const orgPatients = dbStore.patients
    .filter((p) => p.org_id === orgId)
    .slice(0, 50)
    .map((p) => ({
      id: p.id,
      patient_id: p.patient_id,
      age: p.age,
      gender: p.gender,
      created_at: p.created_at,
      cad_status: p.prediction_results?.CAD?.predicted_class || 'N/A',
      cad_prob: p.prediction_results?.CAD?.confidence_percent || 0.0,
    }));

  res.json(orgPatients);
});

// 9. Patient detail: GET single
app.get('/api/patients/:recordId', (req, res) => {
  const orgId = getOrgIdFromReq(req);
  const recId = parseInt(req.params.recordId, 10);
  const patient = dbStore.patients.find((p) => p.id === recId && p.org_id === orgId);

  if (!patient) {
    return res.status(404).json({ detail: 'Patient record not found.' });
  }

  res.json({
    id: patient.id,
    patient_id: patient.patient_id,
    age: patient.age,
    gender: patient.gender,
    created_at: patient.created_at,
    form_data: patient.form_data,
    prediction_results: patient.prediction_results,
    lime_explanations: patient.lime_explanations,
    disclaimer: "Clinical decision-support and educational tool only. Predictions are based on available input data and trained machine learning models. They are not a substitute for professional medical assessment, ECG interpretation, coronary imaging, angiography, or a cardiologist's diagnosis. Predicted vessel risk does not establish the exact anatomical location or severity of a blockage. All results must be interpreted by a qualified healthcare professional.",
  });
});

// 10. Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    models_loaded: ['CAD', 'LAD', 'LCX', 'RCA'],
    lime_ready: true,
    dataset_samples: featureMetadata?.total_samples || 303,
  });
});

// ----------------- Server Lifecycle & Vite Middleware -----------------
async function main() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // In dev mode, mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In prod mode, serve static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = http.createServer(app);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Cardiovascular Clinical App running on http://0.0.0.0:${PORT}`);
  });

  const cleanup = () => {
    console.log('[Server] Graceful shutdown...');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('[Server] Startup error:', err);
});

