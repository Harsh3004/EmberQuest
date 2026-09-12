import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EmberQuest ErrorBoundary caught an exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: 'linear-gradient(135deg, #04050d 0%, #150a04 100%)', color: '#f8fafc' }}
        >
          <div
            className="glass rounded-3xl p-8 max-w-md text-center border border-amber-500/30"
            style={{ boxShadow: '0 0 60px rgba(245,158,11,0.15)' }}
          >
            <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
              <AlertTriangle size={36} />
            </div>
            <h2 className="font-cinzel font-black text-2xl text-amber-400 mb-2">
              Anomaly in the Ether
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              A temporal tear disrupted the realm. Don't worry, your hero data and progress are safe in the scroll archives.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Restore Realm State
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
