import { Component } from 'react';
import { isChunkLoadError, recoverChunkLoad } from '../../data/chunkRecovery';

export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError(error) {
    return { failed: true, chunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error, details) {
    console.error('Application error:', error, details);
    recoverChunkLoad(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className={`${this.props.compact ? 'min-h-[50vh]' : 'min-h-dvh'} flex items-center justify-center bg-navy-950 p-6 text-navy-100`}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold">Unable to open this screen</h1>
          <p className="mt-3 text-navy-200">{!navigator.onLine ? 'You are offline. Reconnect and reload this page.' : this.state.chunkError ? 'This page could not download the latest app files. Please reload to update.' : 'Please reload and try again.'}</p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>Reload</button>
          {this.props.compact && !this.state.chunkError && <button className="btn-secondary mt-3 ml-3" onClick={() => this.setState({ failed: false })}>Try again</button>}
        </div>
      </div>
    );
  }
}
