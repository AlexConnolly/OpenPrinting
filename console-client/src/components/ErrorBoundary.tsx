import { Component, type ErrorInfo, type ReactNode } from 'react';
import { IconAlert, SurfacePanel } from './ui';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <SurfacePanel className="px-8 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] border border-rose-100 bg-rose-50 text-rose-500 shadow-[0_18px_35px_rgba(244,63,94,0.12)]">
            <IconAlert className="h-7 w-7" />
          </div>
          <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight text-slate-950">
            Something slipped
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-8 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-700"
          >
            Try again
          </button>
        </SurfacePanel>
      );
    }

    return this.props.children;
  }
}
