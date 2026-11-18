import React from 'react';
import { useTranslation } from 'react-i18next';

export const StatusBadge = ({ status }) => {
  const { t } = useTranslation();
  const styles = {
    'New': 'bg-red-50 text-red-700 border-red-200',
    'Assigned': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Resolved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Closed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Completed': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    'Under Review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
    'Rejected': 'bg-rose-50 text-rose-700 border-rose-200',
    'Active': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Inactive': 'bg-slate-100 text-slate-600 border-slate-200',
    'Planned': 'bg-purple-50 text-purple-700 border-purple-200',
    'Ongoing': 'bg-sky-50 text-sky-700 border-sky-200',
  };

  const current = styles[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  const label = status ? t(`status.${status}`, status) : t('common.unknown', 'Unknown');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
