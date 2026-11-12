import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Mascot } from './ui';

/** Last line of defence: a render crash shows a friendly screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="grid min-h-dvh place-content-center justify-items-center gap-3 p-6 text-center">
        <Mascot className="size-28" mood="sleepy" />
        <h1 className="text-3xl font-bold">Oops, the story tripped</h1>
        <p className="text-ink-soft">Something went wrong on our side. Reloading usually fixes it.</p>
        <button className="btn btn-primary" onClick={() => window.location.assign('/')}>
          Back to the library
        </button>
      </div>
    );
  }
}
