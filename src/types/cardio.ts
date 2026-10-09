export interface OrgProfile {
  org_id: string;
  org_name: string;
  created_at?: number;
  contact_email?: string;
  department?: string;
}

export interface AppSettings {
  org_id: string;
  green_threshold: number;
  yellow_threshold: number;
  hospital_name: string;
  lead_cardiologist: string;
  units: string;
}

export interface PatientFormData {
  // 1. Patient ID
  patient_id: string;
  // 2. Age
  age: number | '';
  // 3. Gender
  gender: 'Male' | 'Female' | '';
  // 4. Symptoms
  symptoms: {
    chest_pain: boolean;
    chest_pain_type: 'typical' | 'atypical' | 'nonanginal' | 'none';
    breathlessness: boolean;
    sweating: boolean;
    palpitations: boolean;
    dizziness: boolean;
    fatigue: boolean;
    other_symptoms: string;
  };
  // 5. Diabetes
  diabetes: boolean;
  // 6. Blood Pressure / Hypertension
  hypertension: boolean;
  blood_pressure: {
    systolic: number | '';
    diastolic: number | '';
    resting_pulse: number | '';
  };
  // 7. Cholesterol
  cholesterol: {
    ldl: number | '';
    hdl: number | '';
    total_cholesterol: number | '';
    triglycerides: number | '';
  };
  // 8. Smoking History
  smoking_history: 'Current Smoker' | 'Ex-Smoker' | 'Never';
  // 9. Family History of Heart Disease
  family_history: boolean;
  // 10. Previous Heart Attack / Angioplasty / Stent / Bypass
  previous_heart_events: boolean;
  previous_heart_details: string;
  // 11. ECG Report
  ecg_report: {
    normal: boolean;
    st_elevation: boolean;
    st_depression: boolean;
    t_inversion: boolean;
    q_wave: boolean;
    lvh: boolean;
    poor_r_progression: boolean;
    rhythm: string;
    notes: string;
    file_name?: string;
  };
  // 12. Echocardiogram Report
  echocardiogram_report: {
    ejection_fraction: number | ''; // EF-TTE %
    rwma_present: boolean;
    rwma_segments: number;
    valvular_disease: 'N' | 'mild' | 'moderate' | 'severe';
    notes: string;
    file_name?: string;
  };
  // 13. CT Coronary Angiography / Coronary Angiogram
  coronary_angiography: {
    performed: boolean;
    summary: string;
    calcium_score?: number | '';
    file_name?: string;
  };
  // 14. LAD Status (blockage/stenosis percentage) - optional finding
  lad_status?: string;
  // 15. LCX Status (blockage/stenosis percentage) - optional finding
  lcx_status?: string;
  // 16. RCA Status (blockage/stenosis percentage) - optional finding
  rca_status?: string;
  // 17. Plaque Type (calcified / non-calcified / mixed)
  plaque_type?: 'calcified' | 'non-calcified' | 'mixed' | '';
  // 18. Number of Vessels Affected (1 / 2 / 3)
  number_vessels_affected?: number | '';
  // 19. Maximum Stenosis Percentage
  max_stenosis_percentage?: number | '';
  // 20. CAD Severity / CAD-RADS
  cad_severity_cadradas?: string;
  // 21. Final Cardiologist Diagnosis
  final_cardiologist_diagnosis?: string;
  notes?: string;
}

export interface TaskPrediction {
  task: 'CAD' | 'LAD' | 'LCX' | 'RCA';
  model_family: string;
  probability: number;
  predicted_class: string;
  confidence_percent: number;
  threshold: number;
}

export interface LimeFeatureItem {
  feature_condition: string;
  weight: number;
  direction: 'Risk-Increasing' | 'Protective/Normalizing';
  importance_abs: number;
}

export interface PredictionResponse {
  record_id: number;
  patient_id: string;
  timestamp: number;
  predictions: {
    CAD: TaskPrediction;
    LAD: TaskPrediction;
    LCX: TaskPrediction;
    RCA: TaskPrediction;
  };
  lime_explanations: {
    CAD: LimeFeatureItem[];
    LAD: LimeFeatureItem[];
    LCX: LimeFeatureItem[];
    RCA: LimeFeatureItem[];
  };
  reported_findings: {
    lad_status: string;
    lcx_status: string;
    rca_status: string;
    plaque_type: string;
    number_vessels_affected: string | number;
    max_stenosis_percentage: string;
    cad_severity_cadradas: string;
    final_cardiologist_diagnosis: string;
  };
  clinical_safety_disclaimer: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  std_f1?: number;
}

export interface ModelEvaluationsResponse {
  dataset_name: string;
  samples_count: number;
  target_distribution: Record<string, { positive: number; negative: number }>;
  cross_validation: string;
  evaluations: Record<string, Record<string, ModelMetrics>>;
  best_models: Record<string, { best_model: string; metrics: ModelMetrics }>;
  leakage_prevention_summary: string;
}
