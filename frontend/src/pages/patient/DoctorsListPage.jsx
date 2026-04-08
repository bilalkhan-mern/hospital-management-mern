import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import api from '../../api/axios';

const DoctorsListPage = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], pagination: { page: 1, pages: 1 } });

  const loadDoctors = async (currentSearch = search, currentPage = page) => {
    try {
      const response = await api.get(`/patients/doctors?search=${encodeURIComponent(currentSearch)}&page=${currentPage}&limit=6`);
      setData(response.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const onSearch = (event) => {
    event.preventDefault();
    setPage(1);
    loadDoctors(search, 1);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  return (
    <DashboardLayout title="Doctors" description="Search by specialty, explore departments, and find the right clinician quickly.">
      <form className="card flex flex-col gap-3 md:flex-row" onSubmit={onSearch}>
        <input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by doctor name, department, or specialization" />
        <button className="btn-primary md:w-40">Search</button>
      </form>
      {!data.items.length ? (
        <EmptyState title="No doctors found" description="Try a broader search or add doctors from the admin panel." />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((doctor) => (
              <article key={doctor._id} className="card">
                <p className="text-xs uppercase tracking-[0.25em] text-brand-500">{doctor.department?.name}</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">{doctor.user?.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{doctor.specialization}</p>
                <p className="mt-2 text-sm text-slate-500">Slots: {doctor.availableSlots?.join(', ')}</p>
                <p className="mt-4 text-sm text-slate-700">{doctor.bio || 'Experienced healthcare professional available for consultation.'}</p>
              </article>
            ))}
          </section>
          <div className="flex items-center justify-end gap-3">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => { const next = page - 1; setPage(next); loadDoctors(search, next); }}>Previous</button>
            <span className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.pages || 1}</span>
            <button className="btn-secondary" disabled={page >= data.pagination.pages} onClick={() => { const next = page + 1; setPage(next); loadDoctors(search, next); }}>Next</button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default DoctorsListPage;
