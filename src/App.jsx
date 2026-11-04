import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownUp, BriefcaseBusiness, CalendarDays, Check, ChevronDown,
  CircleHelp, Download, ExternalLink, FileUp, Filter, LayoutDashboard, MapPin,
  Menu, MoreHorizontal, Pencil, Plus, Search, Trash2, TrendingUp, X
} from 'lucide-react';

const STORAGE_KEY = 'applyflow_applications_v1';
const STATUSES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
const EMPTY_FORM = {
  company: '', role: '', location: '', type: 'Full-time', status: 'Applied',
  appliedDate: new Date().toISOString().slice(0, 10), followUpDate: '',
  salary: '', jobUrl: '', notes: ''
};

function loadApplications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value + 'T00:00:00');
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function App() {
  const [applications, setApplications] = useState(loadApplications);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const importRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch {
      notify('Could not save. Browser storage may be full.');
    }
  }, [applications]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  function notify(message) { setToast(message); }

  const stats = useMemo(() => ({
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    progress: applications.filter(a => ['Shortlisted', 'Interview'].includes(a.status)).length,
    selected: applications.filter(a => a.status === 'Selected').length
  }), [applications]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return applications
      .filter(a => statusFilter === 'All' || a.status === statusFilter)
      .filter(a => !term || [a.company, a.role, a.location].some(v => (v || '').toLowerCase().includes(term)))
      .sort((a, b) => sortOrder === 'newest'
        ? (b.appliedDate || '').localeCompare(a.appliedDate || '')
        : (a.appliedDate || '').localeCompare(b.appliedDate || ''));
  }, [applications, query, statusFilter, sortOrder]);

  function openAdd() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, appliedDate: new Date().toISOString().slice(0, 10) });
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({ ...EMPTY_FORM, ...item });
    setModalOpen(true);
  }

  function saveApplication(event) {
    event.preventDefault();
    const company = form.company.trim();
    const role = form.role.trim();
    if (!company || !role) {
      notify('Please enter the company and job role.');
      return;
    }
    const record = {
      ...form,
      company,
      role,
      notes: form.notes.trim(),
      id: editingId || (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
      updatedAt: new Date().toISOString()
    };
    setApplications(current => editingId
      ? current.map(item => item.id === editingId ? record : item)
      : [record, ...current]);
    setModalOpen(false);
    notify(editingId ? 'Application updated.' : 'Application added.');
  }

  function deleteApplication(id) {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    setApplications(current => current.filter(item => item.id !== id));
    notify('Application deleted.');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(applications, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'applyflow-applications.json';
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Your backup is ready.');
  }

  function importData(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data) || data.some(item => !item || typeof item !== 'object' || !item.company || !item.role)) {
          throw new Error('Invalid format');
        }
        if (!window.confirm('Import these records and replace your current applications?')) return;
        setApplications(data.map(item => ({ ...EMPTY_FORM, ...item, id: item.id || String(Date.now() + Math.random()) })));
        notify('Applications imported.');
      } catch {
        notify('Could not import. Choose a valid ApplyFlow JSON backup.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  const statCards = [
    { label: 'Total applications', value: stats.total, icon: BriefcaseBusiness, tone: 'violet' },
    { label: 'Applied', value: stats.applied, icon: Activity, tone: 'blue' },
    { label: 'In progress', value: stats.progress, icon: TrendingUp, tone: 'amber' },
    { label: 'Selected', value: stats.selected, icon: Check, tone: 'green' }
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark">A</span><span>applyflow</span></div>
        <div className="nav-caption">WORKSPACE</div>
        <button className="nav-item active" onClick={() => setMobileNavOpen(false)}><LayoutDashboard size={18} /> Dashboard</button>
        <div className="sidebar-bottom">
          <div className="tip-card">
            <span className="tip-icon"><CircleHelp size={17} /></span>
            <strong>Keep moving forward</strong>
            <p>Small steps every day bring you closer to the right opportunity.</p>
          </div>
          <div className="local-note"><span className="live-dot" /> Your data stays on this device</div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open menu" onClick={() => setMobileNavOpen(v => !v)}><Menu size={20} /></button>
          <div className="breadcrumb">Workspace <span>/</span> <b>Dashboard</b></div>
          <div className="topbar-right"><span className="today-label"><CalendarDays size={15} /> {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span><span className="avatar">H</span></div>
        </header>

        <section className="page-wrap">
          <div className="welcome-row">
            <div><div className="eyebrow">YOUR CAREER OVERVIEW</div><h1>Job applications</h1><p className="subtitle">Stay organised and keep track of every opportunity.</p></div>
            <button className="primary-button" onClick={openAdd}><Plus size={18} /> Add application</button>
          </div>

          <div className="stats-grid">
            {statCards.map(({ label, value, icon: Icon, tone }) => (
              <article className="stat-card" key={label}>
                <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
                <div className="stat-label">{label}</div><div className="stat-value">{value}</div>
                <div className="stat-foot">{label === 'In progress' ? 'Shortlisted + interview' : label === 'Selected' ? 'Offers received' : label === 'Applied' ? 'Waiting for a response' : 'Across all statuses'}</div>
              </article>
            ))}
          </div>

          <section className="table-panel">
            <div className="panel-heading"><div><h2>Application tracker</h2><p>Manage and review your job search activity.</p></div><div className="data-actions"><button className="soft-button" onClick={exportData}><Download size={16} /> Export</button><button className="soft-button" onClick={() => importRef.current?.click()}><FileUp size={16} /> Import</button><input ref={importRef} type="file" accept="application/json,.json" hidden onChange={importData} /></div></div>
            <div className="toolbar">
              <label className="search-box"><Search size={17} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search company, role or location..." /></label>
              <label className="select-wrap"><Filter size={15} /><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14} /></label>
              <button className="soft-button sort-button" onClick={() => setSortOrder(v => v === 'newest' ? 'oldest' : 'newest')}><ArrowDownUp size={15} /> {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}</button>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><BriefcaseBusiness size={25} /></div><h3>{applications.length ? 'No matching applications' : 'Start tracking your journey'}</h3><p>{applications.length ? 'Try another search or status filter.' : 'Add your first application to keep all your job search details in one place.'}</p>{!applications.length && <button className="primary-button" onClick={openAdd}><Plus size={17} /> Add your first application</button>}</div>
            ) : (
              <div className="table-scroll"><table><thead><tr><th>COMPANY & ROLE</th><th>LOCATION</th><th>APPLIED DATE</th><th>STATUS</th><th>FOLLOW-UP</th><th></th></tr></thead><tbody>
                {filtered.map(item => <tr key={item.id}>
                  <td><div className="company-cell"><span className="company-logo">{(item.company || '?').slice(0, 1).toUpperCase()}</span><span><strong>{item.company}</strong><small>{item.role} · {item.type}</small></span></div></td>
                  <td><span className="location-cell"><MapPin size={13} />{item.location || '—'}</span></td>
                  <td>{formatDate(item.appliedDate)}</td>
                  <td><span className={`status-pill status-${item.status.toLowerCase()}`}><i />{item.status}</span></td>
                  <td>{formatDate(item.followUpDate)}</td>
                  <td><div className="row-actions"><button className="icon-button" aria-label={`Edit ${item.company}`} onClick={() => openEdit(item)}><Pencil size={15} /></button><button className="icon-button danger-hover" aria-label={`Delete ${item.company}`} onClick={() => deleteApplication(item.id)}><Trash2 size={15} /></button>{item.jobUrl && <a className="icon-button" href={item.jobUrl} target="_blank" rel="noreferrer" aria-label="Open job link"><ExternalLink size={15} /></a>}</div></td>
                </tr>)}
              </tbody></table></div>
            )}
            <div className="table-footer"><span>Showing <b>{filtered.length}</b> of <b>{applications.length}</b> applications</span><span>Saved automatically <span className="saved-check"><Check size={12} /></span></span></div>
          </section>
          <footer className="page-footer">ApplyFlow <span>·</span> A simple space for your next opportunity.</footer>
        </section>
      </main>

      {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-header"><div><div className="eyebrow">APPLICATION DETAILS</div><h2 id="modal-title">{editingId ? 'Edit application' : 'Add application'}</h2></div><button className="icon-button" aria-label="Close" onClick={() => setModalOpen(false)}><X size={20} /></button></div>
          <form onSubmit={saveApplication}>
            <div className="form-grid">
              <label>Company name *<input autoFocus required maxLength="80" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Acme Technologies" /></label>
              <label>Job role *<input required maxLength="100" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Frontend Developer" /></label>
              <label>Location<input maxLength="100" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Chennai / Remote" /></label>
              <label>Employment type<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{['Full-time', 'Internship', 'Part-time', 'Contract', 'Remote'].map(v => <option key={v}>{v}</option>)}</select></label>
              <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{STATUSES.map(v => <option key={v}>{v}</option>)}</select></label>
              <label>Applied date<input type="date" value={form.appliedDate} onChange={e => setForm({ ...form, appliedDate: e.target.value })} /></label>
              <label>Follow-up / interview date<input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} /></label>
              <label>Salary (optional)<input maxLength="50" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="e.g. ₹3–5 LPA" /></label>
              <label className="full-span">Job posting URL<input type="url" value={form.jobUrl} onChange={e => setForm({ ...form, jobUrl: e.target.value })} placeholder="https://..." /></label>
              <label className="full-span">Notes<textarea rows="3" maxLength="1000" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Recruiter contact, interview details, next steps..." /></label>
            </div>
            <div className="modal-actions"><button type="button" className="soft-button" onClick={() => setModalOpen(false)}>Cancel</button><button type="submit" className="primary-button"><Check size={17} /> {editingId ? 'Save changes' : 'Save application'}</button></div>
          </form>
        </section>
      </div>}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

export default App;
