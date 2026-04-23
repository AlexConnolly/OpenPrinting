import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { type Agent, agentsApi } from '../api/agents';
import { jobsApi, type JobStatus, type PrintJob } from '../api/jobs';
import { IconAlert, IconArrowRight, IconCheck, IconUpload, IconX } from '../components/ui';
import { useAuth } from '../contexts/useAuth';
import { cn, formatRelativeTime } from '../lib/ui';

type Tab = 'dashboard' | 'files' | 'printers' | 'history';
type PrintMode = 'file' | 'url';

const REFRESH_INTERVAL_MS = 15_000;

const NAV_ITEMS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'files',     label: 'Files',     icon: 'description' },
  { id: 'printers',  label: 'Printers',  icon: 'print' },
  { id: 'history',   label: 'History',   icon: 'history' },
];

const TAB_TITLES: Record<Tab, string> = {
  dashboard: 'Print Queue',
  files:     'Files',
  printers:  'Printers',
  history:   'History',
};

const STATUS_META: Record<JobStatus, {
  label: string;
  dotClass: string;
  textClass: string;
  icon?: string;
}> = {
  Pending:   { label: 'Pending',   dotClass: 'bg-[#c2c6d6]', textClass: 'text-[#424754]' },
  Printing:  { label: 'Printing',  dotClass: 'bg-[#0058be]', textClass: 'text-[#0058be]' },
  Completed: { label: 'Completed', dotClass: 'bg-[#727785]', textClass: 'text-[#727785]', icon: 'check_circle' },
  Failed:    { label: 'Failed',    dotClass: 'bg-[#ba1a1a]', textClass: 'text-[#ba1a1a]', icon: 'error' },
};

function MaterialIcon({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined leading-none', className)} aria-hidden>
      {name}
    </span>
  );
}

function LogoMark() {
  return (
    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[#e7e8e9] text-[#0058be]">
      <MaterialIcon name="print" className="text-[16px]" />
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: {
  active: boolean; icon: string; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-white font-semibold text-[#0058be]' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
      )}
    >
      <MaterialIcon name={icon} className="text-[18px]" />
      {label}
    </button>
  );
}

function describeFile(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'insert_drive_file';
  if (['png','jpg','jpeg','gif','bmp','tif','tiff'].includes(ext)) return 'image';
  if (['doc','docx','txt'].includes(ext)) return 'description';
  if (['ppt','pptx'].includes(ext)) return 'slideshow';
  return 'insert_drive_file';
}

function sortJobs(jobs: PrintJob[]) {
  return [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function pickQuickTarget(agents: Agent[]) {
  const agent = agents.find((a) => a.isOnline && a.printers.length > 0);
  if (!agent) return null;
  const printerName = agent.printers.find((p) => p.isDefault)?.name ?? agent.printers[0]?.name;
  return printerName ? { agent, printerName } : null;
}

function QueueStatus({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status];
  if (meta.icon) {
    return (
      <div className="flex items-center gap-1.5">
        <MaterialIcon name={meta.icon} className={cn('text-[15px]', meta.textClass)} />
        <span className={cn('text-sm font-medium', meta.textClass)}>{meta.label}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-1.5 w-1.5 rounded-full', meta.dotClass)} />
      <span className={cn('text-sm font-medium', meta.textClass)}>{meta.label}</span>
    </div>
  );
}

function QueueTable({ jobs }: { jobs: PrintJob[] }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[#e1e3e4]">
          <th className="w-2/5 px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">File</th>
          <th className="w-1/4 px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Printer</th>
          <th className="w-1/5 px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Status</th>
          <th className="px-1 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[#727785]">Time</th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => {
          const completed = job.status === 'Completed';
          return (
            <tr
              key={job.id}
              className={cn(
                'group border-b border-[#f3f4f5] transition-colors hover:bg-white/60',
                completed && 'opacity-60',
              )}
            >
              <td className="px-1 py-2.5">
                <div className="flex items-center gap-2">
                  <MaterialIcon
                    name={describeFile(job.fileName)}
                    className={cn('text-[18px] text-[#c2c6d6] transition-colors', !completed && 'group-hover:text-[#0058be]')}
                  />
                  <span className={cn('font-medium text-[#191c1d]', completed && 'text-[#424754] line-through decoration-[#c2c6d6]/70')}>
                    {job.fileName}
                  </span>
                </div>
              </td>
              <td className="px-1 py-2.5 text-[#424754]">{job.printerName}</td>
              <td className="px-1 py-2.5"><QueueStatus status={job.status} /></td>
              <td className="px-1 py-2.5 text-right text-[#727785]">{formatRelativeTime(job.createdAt)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function FilesTable({ jobs }: { jobs: PrintJob[] }) {
  const rows = Object.values(
    jobs.reduce<Record<string, { fileName: string; status: JobStatus; updatedAt: string; printerName: string }>>((acc, job) => {
      const current = acc[job.fileName];
      if (!current || new Date(job.createdAt).getTime() > new Date(current.updatedAt).getTime()) {
        acc[job.fileName] = { fileName: job.fileName, status: job.status, updatedAt: job.createdAt, printerName: job.printerName };
      }
      return acc;
    }, {}),
  );

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[#e1e3e4]">
          <th className="px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">File</th>
          <th className="px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Printer</th>
          <th className="px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Status</th>
          <th className="px-1 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[#727785]">Updated</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.fileName} className="border-b border-[#f3f4f5] hover:bg-white/60">
            <td className="px-1 py-2.5">
              <div className="flex items-center gap-2">
                <MaterialIcon name={describeFile(row.fileName)} className="text-[18px] text-[#c2c6d6]" />
                <span className="font-medium text-[#191c1d]">{row.fileName}</span>
              </div>
            </td>
            <td className="px-1 py-2.5 text-[#424754]">{row.printerName}</td>
            <td className="px-1 py-2.5"><QueueStatus status={row.status} /></td>
            <td className="px-1 py-2.5 text-right text-[#727785]">{formatRelativeTime(row.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrintersTable({ agents }: { agents: Agent[] }) {
  const printers = agents.flatMap((agent) =>
    agent.printers.map((printer) => ({
      key: `${agent.id}-${printer.name}`,
      name: printer.name,
      machineName: agent.machineName,
      online: agent.isOnline,
      lastSeen: agent.lastSeen,
      isDefault: printer.isDefault,
    })),
  );

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-[#e1e3e4]">
          <th className="px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Printer</th>
          <th className="px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Service</th>
          <th className="px-1 py-2 text-[11px] font-medium uppercase tracking-wider text-[#727785]">Status</th>
          <th className="px-1 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-[#727785]">Last Seen</th>
        </tr>
      </thead>
      <tbody>
        {printers.map((printer) => (
          <tr key={printer.key} className="border-b border-[#f3f4f5] hover:bg-white/60">
            <td className="px-1 py-2.5">
              <div className="flex items-center gap-2">
                <MaterialIcon name="print" className="text-[18px] text-[#c2c6d6]" />
                <div>
                  <div className="font-medium text-[#191c1d]">{printer.name}</div>
                  {printer.isDefault && <div className="text-xs text-[#727785]">Default</div>}
                </div>
              </div>
            </td>
            <td className="px-1 py-2.5 text-[#424754]">{printer.machineName}</td>
            <td className="px-1 py-2.5">
              <div className="flex items-center gap-2">
                <div className={cn('h-1.5 w-1.5 rounded-full', printer.online ? 'bg-[#0058be]' : 'bg-[#c2c6d6]')} />
                <span className={cn('font-medium', printer.online ? 'text-[#0058be]' : 'text-[#424754]')}>
                  {printer.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </td>
            <td className="px-1 py-2.5 text-right text-[#727785]">{formatRelativeTime(printer.lastSeen)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrintDialog({ agent, printerName, onClose, onSubmitted }: {
  agent: Agent; printerName: string; onClose: () => void; onSubmitted: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<PrintMode>('file');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    setFile(f);
    setError('');
  }

  function handleDragOver(e: DragEvent) { e.preventDefault(); setDragging(true); }
  function handleDragLeave(e: DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
  }
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'file') {
        await jobsApi.submit(agent.id, printerName, file!);
      } else {
        await jobsApi.submitUrl(agent.id, printerName, url.trim());
      }
      onSubmitted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit job');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = mode === 'file' ? Boolean(file) : url.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-4 py-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[#e1e3e4] bg-white p-5 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#191c1d]">New Print Job</h3>
            <p className="mt-0.5 text-xs text-[#727785]">{agent.machineName} / {printerName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1.5 text-[#727785] transition-colors hover:bg-[#f3f4f5]">
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="inline-flex rounded-md bg-[#f3f4f5] p-0.5">
            {(['file', 'url'] as PrintMode[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-medium transition-colors',
                  mode === value ? 'bg-white text-[#191c1d] shadow-sm' : 'text-[#424754]',
                )}
              >
                {value === 'file' ? 'Upload File' : 'From URL'}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded border border-[#ffdad6] bg-[#fff6f4] px-3 py-2.5 text-sm text-[#93000a]">
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'file' ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'w-full rounded-lg border border-dashed px-6 py-8 text-center transition-colors',
                dragging ? 'border-[#0058be] bg-[#f5f8ff]' : 'border-[#c2c6d6] bg-[#f8f9fa]',
              )}
            >
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.bmp,.gif,.tif,.tiff,.txt,.zpl,.lbl"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0058be] shadow-sm">
                {file ? <IconCheck className="h-4 w-4" /> : <IconUpload className="h-4 w-4" />}
              </div>
              <p className="mt-3 text-sm font-medium text-[#191c1d]">
                {file ? file.name : 'Drop a file or click to browse'}
              </p>
              <p className="mt-1 text-xs text-[#727785]">
                {file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'PDF, images, plain text, ZPL · up to 50 MB'}
              </p>
            </button>
          ) : (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#191c1d]">Document URL</span>
              <input
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                placeholder="https://example.com/document.pdf"
                className="w-full rounded border border-[#c2c6d6] bg-white px-3 py-2 text-sm text-[#191c1d] outline-none transition focus:border-[#0058be] focus:ring-2 focus:ring-[#d8e2ff]"
                autoFocus
              />
              <p className="text-xs text-[#727785]">The printing service downloads the file directly from this URL.</p>
            </label>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#c2c6d6] px-3 py-2 text-sm font-medium text-[#424754] transition-colors hover:bg-[#f3f4f5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="inline-flex items-center gap-1.5 rounded bg-[#0058be] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#004395] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  Send Job
                  <IconArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agentsError, setAgentsError] = useState('');
  const [jobsError, setJobsError] = useState('');
  const [dialog, setDialog] = useState<{ agent: Agent; printerName: string } | null>(null);

  const applyResults = useCallback((
    agentsResult: PromiseSettledResult<Agent[]>,
    jobsResult: PromiseSettledResult<PrintJob[]>,
  ) => {
    if (agentsResult.status === 'fulfilled') { setAgents(agentsResult.value); setAgentsError(''); }
    else setAgentsError(agentsResult.reason instanceof Error ? agentsResult.reason.message : 'Unable to load printers');

    if (jobsResult.status === 'fulfilled') { setJobs(sortJobs(jobsResult.value)); setJobsError(''); }
    else setJobsError(jobsResult.reason instanceof Error ? jobsResult.reason.message : 'Unable to load queue');
  }, []);

  const refreshData = useCallback(async ({ background = false }: { background?: boolean } = {}) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    const [agentsResult, jobsResult] = await Promise.allSettled([agentsApi.getAgents(), jobsApi.list()]);
    applyResults(agentsResult, jobsResult);
    setLoading(false);
    setRefreshing(false);
  }, [applyResults]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [agentsResult, jobsResult] = await Promise.allSettled([agentsApi.getAgents(), jobsApi.list()]);
      if (cancelled) return;
      applyResults(agentsResult, jobsResult);
      setLoading(false);
    };
    void load();
    const interval = window.setInterval(() => void refreshData({ background: true }), REFRESH_INTERVAL_MS);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [applyResults, refreshData]);

  const activeJobs = useMemo(() => jobs.filter((j) => j.status === 'Pending' || j.status === 'Printing'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((j) => j.status === 'Completed'), [jobs]);

  const tableContent = (() => {
    if (loading) {
      return (
        <div className="py-12 text-center">
          <span className="mx-auto block h-4 w-4 rounded-full border-2 border-[#d8e2ff] border-t-[#0058be] animate-spin" />
          <p className="mt-3 text-sm text-[#727785]">Loading…</p>
        </div>
      );
    }

    if (jobsError || agentsError) {
      return (
        <div className="rounded border border-[#ffdad6] bg-[#fff6f4] px-3 py-2.5 text-sm text-[#93000a]">
          {[jobsError, agentsError].filter(Boolean).join(' ')}
        </div>
      );
    }

    if (tab === 'files') {
      return jobs.length === 0
        ? <p className="py-12 text-center text-sm text-[#727785]">No files submitted yet.</p>
        : <FilesTable jobs={jobs} />;
    }

    if (tab === 'printers') {
      return agents.length === 0
        ? <p className="py-12 text-center text-sm text-[#727785]">No printers connected.</p>
        : <PrintersTable agents={agents} />;
    }

    if (tab === 'history') {
      return completedJobs.length === 0
        ? <p className="py-12 text-center text-sm text-[#727785]">No completed jobs yet.</p>
        : <QueueTable jobs={completedJobs} />;
    }

    return activeJobs.length === 0 && jobs.length === 0
      ? <p className="py-12 text-center text-sm text-[#727785]">No active or pending jobs.</p>
      : <QueueTable jobs={jobs} />;
  })();

  function handlePrimaryAction() {
    const target = pickQuickTarget(agents);
    if (!target) { setTab('printers'); return; }
    setDialog(target);
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa] text-[#191c1d] antialiased">
      {/* Sidebar */}
      <nav className="hidden h-screen w-52 shrink-0 flex-col border-r border-gray-200 bg-gray-50 p-4 md:flex">
        <div className="mb-4 flex items-center gap-2">
          <LogoMark />
          <span className="font-semibold text-sm text-gray-900">OpenPrinting</span>
        </div>

        <button
          onClick={handlePrimaryAction}
          className="mb-3 w-full rounded bg-[#0058be] px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-[#004395]"
        >
          New Print Job
        </button>

        <div className="flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              active={tab === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => setTab(item.id)}
            />
          ))}
        </div>

        <div className="border-t border-gray-200 pt-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <MaterialIcon name="logout" className="text-[18px]" />
            Sign out
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="h-full flex-1 overflow-y-auto p-6 md:p-10">
        <div className="mx-auto max-w-4xl">
          {/* Mobile header */}
          <div className="mb-4 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <LogoMark />
              <span className="font-semibold text-sm text-gray-900">OpenPrinting</span>
            </div>
            <button
              onClick={handlePrimaryAction}
              className="rounded bg-[#0058be] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#004395]"
            >
              New Job
            </button>
          </div>

          <header className="mb-5 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[#191c1d]">{TAB_TITLES[tab]}</h1>
            <button
              onClick={() => void refreshData({ background: true })}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-[#495e8a] transition-colors hover:bg-[#f3f4f5]"
            >
              <MaterialIcon name="refresh" className={cn('text-[16px]', refreshing && 'animate-spin')} />
              Refresh
            </button>
          </header>

          {tableContent}
        </div>
      </main>

      {dialog && (
        <PrintDialog
          agent={dialog.agent}
          printerName={dialog.printerName}
          onClose={() => setDialog(null)}
          onSubmitted={() => {
            setTab('dashboard');
            void refreshData({ background: true });
          }}
        />
      )}
    </div>
  );
}
