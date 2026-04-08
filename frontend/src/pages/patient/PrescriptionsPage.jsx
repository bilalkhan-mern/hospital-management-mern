import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';
import { formatDate } from '../../lib/format';

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const response = await api.get('/patients/prescriptions');
        setPrescriptions(response.data.data);
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <DashboardLayout title="Prescriptions" description="Review treatment guidance, medicines, and consultation outcomes.">
      {!prescriptions.length ? (
        <EmptyState title="No prescriptions yet" description="Prescriptions appear here after your doctor adds them." />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((item) => (
            <article key={item._id} className="card">
              <p className="text-xs uppercase tracking-[0.25em] text-brand-500">{formatDate(item.createdAt)}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Dr. {item.doctor?.user?.name}</h3>
              <p className="mt-2 text-sm text-slate-700">Diagnosis: {item.diagnosis}</p>
              <p className="mt-2 text-sm text-slate-700">Medicines: {item.medicines.join(', ')}</p>
              <p className="mt-2 text-sm text-slate-500">Advice: {item.advice || 'Follow doctor instructions.'}</p>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PrescriptionsPage;
