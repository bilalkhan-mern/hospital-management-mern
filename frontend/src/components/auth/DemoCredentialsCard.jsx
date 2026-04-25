import { useMemo, useState } from 'react';

const safeCopy = async (text) => {
  try {
    if (!navigator?.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const DemoCredentialsCard = ({ onPick }) => {
  const [copiedKey, setCopiedKey] = useState('');

  const accounts = useMemo(() => ([
    { key: 'super', label: 'Super Admin', email: 'admin@hospital.com', password: 'Admin@123' },
    { key: 'admin', label: 'Admin', email: 'admin2@hospital.com', password: 'Admin@123' },
    { key: 'doctor', label: 'Doctor', email: 'neha@hospital.com', password: 'Doctor@123' },
    { key: 'patient', label: 'Patient', email: 'asha@example.com', password: 'Patient@123' },
  ]), []);

  const handleCopy = async (account) => {
    const ok = await safeCopy(`Email: ${account.email}\nPassword: ${account.password}`);
    if (ok) {
      setCopiedKey(account.key);
      window.setTimeout(() => setCopiedKey(''), 900);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Demo Accounts</h3>
          <p className="mt-1 text-xs text-slate-500">For live demo/testing only. Use these to sign in quickly.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Password is case-sensitive</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {accounts.map((account) => (
          <div key={account.key} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{account.label}</p>
                <p className="mt-1 truncate text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Email:</span> {account.email}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Pass:</span> {account.password}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onPick?.({ email: account.email, password: account.password })}
                >
                  Use
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => handleCopy(account)}
                >
                  {copiedKey === account.key ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Note: Demo data exists only if you have seeded the database (local or production).
      </p>
    </div>
  );
};

export default DemoCredentialsCard;

