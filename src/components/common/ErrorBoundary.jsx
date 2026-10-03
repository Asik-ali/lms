import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, details) {
    console.error('Application error:', error, details);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="min-h-dvh flex items-center justify-center bg-navy-950 p-6 text-navy-100">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold">Unable to open this screen</h1>
          <p className="mt-3 text-navy-200">Please reload and try again.</p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Reload</button>
        </div>
      </div>
    );
  }
}
