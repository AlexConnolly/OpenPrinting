import {
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../lib/ui';

type IconProps = { className?: string };

export function IconPrinter({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 17.25V15a1.5 1.5 0 0 1 1.5-1.5h6A1.5 1.5 0 0 1 16.5 15v2.25m-9 0h9m-9 0H6a1.5 1.5 0 0 1-1.5-1.5v-4.5A2.25 2.25 0 0 1 6.75 9h10.5a2.25 2.25 0 0 1 2.25 2.25v4.5A1.5 1.5 0 0 1 18 17.25h-1.5m-9-9.75V6A1.5 1.5 0 0 1 9 4.5h6A1.5 1.5 0 0 1 16.5 6v1.5m-8.25 3h.008v.008H8.25V10.5Zm7.5 0h.008v.008h-.008V10.5Z"
      />
    </svg>
  );
}

export function IconJobs({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 4.5h10.5A1.5 1.5 0 0 1 18.75 6v12a1.5 1.5 0 0 1-1.5 1.5H6.75A1.5 1.5 0 0 1 5.25 18V6a1.5 1.5 0 0 1 1.5-1.5Zm2.25 4.5h6m-6 3h6m-6 3h3"
      />
    </svg>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V4.5m0 0-4.5 4.5M12 4.5 16.5 9M4.5 16.5v1.5A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5"
      />
    </svg>
  );
}

export function IconAlert({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8.25v4.5m0 3h.008v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m5.25 12.75 4.5 4.5 9-9" />
    </svg>
  );
}

export function IconSpark({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m11.25 3 1.327 4.082a1.5 1.5 0 0 0 .949.949L17.608 9.36l-4.082 1.327a1.5 1.5 0 0 0-.949.949L11.25 15.72l-1.327-4.082a1.5 1.5 0 0 0-.949-.949L4.892 9.36l4.082-1.327a1.5 1.5 0 0 0 .949-.949L11.25 3Zm6 10.5.664 2.043a.75.75 0 0 0 .474.474l2.043.664-2.043.664a.75.75 0 0 0-.474.474l-.664 2.043-.664-2.043a.75.75 0 0 0-.474-.474l-2.043-.664 2.043-.664a.75.75 0 0 0 .474-.474l.664-2.043Z"
      />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.75 5.25 6v5.34c0 4.067 2.594 7.68 6.45 8.985a.9.9 0 0 0 .6 0c3.856-1.305 6.45-4.918 6.45-8.985V6L12 3.75Zm-1.5 8.25 1.5 1.5 3-3"
      />
    </svg>
  );
}

export function IconArrowRight({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-5.25-5.25M19.5 12l-5.25 5.25" />
    </svg>
  );
}

export function IconServer({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5a2.25 2.25 0 0 1 2.25 2.25v1.5A2.25 2.25 0 0 1 17.25 10.5H6.75A2.25 2.25 0 0 1 4.5 8.25v-1.5Zm0 9A2.25 2.25 0 0 1 6.75 13.5h10.5a2.25 2.25 0 0 1 2.25 2.25v1.5A2.25 2.25 0 0 1 17.25 19.5H6.75a2.25 2.25 0 0 1-2.25-2.25v-1.5ZM8.25 7.5h.008v.008H8.25V7.5Zm0 9h.008v.008H8.25V16.5Z"
      />
    </svg>
  );
}

export function IconGlobe({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.3 0 4.5-4.03 4.5-9S14.3 3 12 3 7.5 7.03 7.5 12s2.2 9 4.5 9Zm-8.63-6h17.26M3.37 9h17.26"
      />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.75v5.25l3 1.5m6-1.5a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function AppLogo({
  showName = true,
  className,
  nameClassName,
}: {
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052ff] text-white paper-elevation">
        <IconPrinter className="h-4.5 w-4.5" />
      </div>
      {showName && (
        <div className={cn('min-w-0', nameClassName)}>
          <div className="font-display text-lg font-bold tracking-tight text-slate-900">
            OpenPrinting
          </div>
          <div className="text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase">
            Enterprise Console
          </div>
        </div>
      )}
    </div>
  );
}

export function AmbientBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(221,225,255,0.6),transparent_28%),linear-gradient(180deg,#f7f9fb_0%,#f4f7fb_100%)]" />
    </div>
  );
}

export function SurfacePanel({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white paper-elevation',
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({
  label = 'Loading',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 text-sm text-slate-500', className)}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white paper-elevation">
        <span className="h-4 w-4 rounded-full border-2 border-[#d0e1fb] border-t-[#003ec7] animate-spin" />
      </span>
      <span>{label}</span>
    </div>
  );
}

export function CenteredStatus({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <AmbientBackdrop />
      <SurfacePanel className="relative w-full max-w-xl px-8 py-10 text-center sm:px-12">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d0e1fb] text-[#003ec7] paper-elevation">
          {icon ?? <IconSpark className="h-7 w-7" />}
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
          {description}
        </p>
      </SurfacePanel>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  hint,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <SurfacePanel className={cn('px-8 py-16 text-center', className)}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d0e1fb] text-[#003ec7] paper-elevation">
        {icon}
      </div>
      <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
        {description}
      </p>
      {hint && <div className="mt-6 text-sm text-slate-400">{hint}</div>}
      {action && <div className="mt-8">{action}</div>}
    </SurfacePanel>
  );
}

export function InputField({
  label,
  hint,
  className,
  ...props
}: {
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<'input'>) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {hint && <span className="text-xs font-normal text-slate-400">{hint}</span>}
      </span>
      <input
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition duration-200 placeholder:text-slate-400 focus:border-[#004ced] focus:ring-4 focus:ring-[#dde1ff]',
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function AuthShell({
  badge,
  title,
  description,
  introTitle,
  introBody,
  introList,
  children,
  footer,
}: {
  badge: string;
  title: string;
  description: string;
  introTitle: string;
  introBody: string;
  introList: Array<{ icon: ReactNode; label: string }>;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <AmbientBackdrop />
      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1520px] gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <SurfacePanel className="relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9 lg:px-12 lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(221,225,255,0.7),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,249,251,0.9))]" />
          <div className="relative flex h-full flex-col">
            <AppLogo />
            <div className="mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <IconSpark className="h-3.5 w-3.5" />
              {badge}
            </div>
            <div className="mt-8 max-w-2xl">
              <h1 className="font-display text-4xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-5xl xl:text-[4.25rem]">
                {introTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                {introBody}
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {introList.map((item, index) => (
                <div
                  key={item.label}
                  className="fade-up rounded-xl border border-slate-200 bg-white px-5 py-5 paper-elevation"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0052ff] text-white">
                    {item.icon}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto hidden gap-4 pt-10 sm:grid sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-900 px-5 py-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
                  Live Ops
                </div>
                <div className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  Unified print fleet visibility
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Watch printer readiness, queue health, and delivery status in a single calm interface.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-[#f7f9fb] px-5 py-5">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#003ec7]">
                  Designed for speed
                </div>
                <div className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950">
                  Clean, focused, no clutter
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Modern surfaces, fast wayfinding, and subtle motion keep the product feeling sharp without getting noisy.
                </p>
              </div>
            </div>
          </div>
        </SurfacePanel>

        <SurfacePanel className="relative flex items-center overflow-hidden px-6 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,251,0.92))]" />
          <div className="relative mx-auto w-full max-w-md">
            <div className="mb-9 lg:hidden">
              <AppLogo />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              {badge}
            </div>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.35rem]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
              {description}
            </p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 border-t border-slate-200/80 pt-6">{footer}</div>}
          </div>
        </SurfacePanel>
      </div>
    </div>
  );
}
