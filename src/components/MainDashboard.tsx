import React, { useEffect, useState } from 'react';
import { 
  UserPlus, HeartPulse, ArrowRight, Clock, ChevronRight 
} from 'lucide-react';
import { OrgProfile } from '../types/cardio';

interface MainDashboardProps {
  orgProfile: OrgProfile | null;
  onOpenPatientForm: () => void;
  onOpenRecentPatient?: (recordId: number) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  orgProfile,
  onOpenPatientForm,
  onOpenRecentPatient,
}) => {
  const [recentPatients, setRecentPatients] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const patientsRes = await fetch('/api/patients', {
          headers: {
            'Authorization': `Bearer token_${orgProfile?.org_id || 'ORG-101'}`,
          },
        });
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          setRecentPatients(patientsData);
        }
      } catch (e) {
        // Fallback
      }
    }
    loadDashboardData();
  }, [orgProfile?.org_id]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200 relative">
      
      {/* Subtle, low-opacity abstract heart and coronary X-ray background behind the words */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-[0.055] pointer-events-none mix-blend-multiply z-0"
        style={{ backgroundImage: `url('/images/heart_xray_angiogram.jpg')` }}
        aria-hidden="true"
      />

      {/* Clinical Department Header Banner */}
      <section className="relative bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-sm overflow-hidden z-10">
        
        {/* Soft X-ray radiographic texture behind header text */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none mix-blend-screen"
          style={{ backgroundImage: `url('/images/cardiac_angiography_tree.jpg')` }}
          aria-hidden="true"
        />

        <div className="relative z-10 p-6 sm:p-8 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-2.5">
            <HeartPulse className="w-4 h-4 text-teal-400" />
            <span className="tracking-wide uppercase font-bold">WE PROVIDE BEST CARDIOVASCULAR HEALTHCARE PREDICTION</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
            Welcome to {orgProfile?.org_name || 'Heart Health & Vascular Center'}
          </h1>
        </div>
      </section>

      {/* EXACT REQUIREMENT:
          In the centre of the dashboard, create one prominent shaded card labelled "Patient Details".
          Clicking it must open the third page.
      */}
      <section className="flex justify-center py-2 relative z-10">
        <div 
          onClick={onOpenPatientForm}
          className="w-full max-w-xl group cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpenPatientForm(); }}
          aria-label="Open Patient Details Form"
        >
          {/* Prominent Shaded Card with subtle coronary X-ray behind words */}
          <div className="relative p-7 sm:p-8 rounded-2xl bg-white border border-slate-300 hover:border-teal-600 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
            
            {/* Subtle, low-opacity coronary artery X-ray background behind card text */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.035] pointer-events-none mix-blend-multiply"
              style={{ backgroundImage: `url('/images/heart_xray_angiogram.jpg')` }}
              aria-hidden="true"
            />

            {/* Arrow Button */}
            <div className="absolute top-6 right-6 w-11 h-11 rounded-lg bg-slate-50 group-hover:bg-teal-700 group-hover:text-white border border-slate-200 flex items-center justify-center transition-colors">
              <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-white transition-colors" />
            </div>

            <div className="relative z-10 space-y-3.5">
              <div className="w-12 h-12 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center">
                <UserPlus className="w-6 h-6" />
              </div>

              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-teal-700 block mb-0.5">
                  Clinical Intake Workflow
                </span>
                {/* EXACT LABEL: Patient Details */}
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Patient Details
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pr-10">
                Click here to launch the 21-parameter clinical intake form. Enter patient demographics, symptoms, cholesterol panel, ECG &amp; echocardiogram metrics, or optional confirmed imaging findings to run cardiovascular ML prediction.
              </p>

              <div className="pt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 group-hover:bg-teal-800 text-white font-medium text-xs tracking-wide transition-colors">
                  <span>Open Intake Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs text-slate-500">21 clinical parameters supported</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Patient Inferences in SQLite */}
      {recentPatients.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm relative z-10 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-700" />
                Recent Clinical Inferences for {orgProfile?.org_name || 'This Organisation'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Previously predicted patient profiles stored in persistent database.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Patient ID</th>
                  <th className="py-2 px-3">Age / Gender</th>
                  <th className="py-2 px-3">Predicted CAD Status</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPatients.slice(0, 5).map((pt) => (
                  <tr key={pt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{pt.patient_id}</td>
                    <td className="py-2.5 px-3 text-slate-600">{pt.age} yrs / {pt.gender}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        pt.cad_status?.includes('CAD') 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {pt.cad_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 font-mono font-semibold tabular-nums">{pt.cad_prob}%</td>
                    <td className="py-2.5 px-3 text-right">
                      {onOpenRecentPatient && (
                        <button
                          onClick={() => onOpenRecentPatient(pt.id)}
                          className="text-teal-700 hover:text-teal-900 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          View Results <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
};
