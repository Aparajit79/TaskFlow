import React from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an uncaught rendering error:", error, errorInfo);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrapper">
          <div className="sidebar-section-card error-boundary-card">
            <div className="error-boundary-icon-container">
              <AlertOctagon size={28} strokeWidth={2} />
            </div>

            <div>
              <h2 className="error-boundary-title">
                Something went wrong
              </h2>
              <p className="error-boundary-subtitle">
                An unexpected JavaScript error occurred while rendering this view.
              </p>
            </div>

            {this.state.error && (
              <div className="error-boundary-console">
                {this.state.error.toString()}
              </div>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReset}
                className="primary-btn error-boundary-btn"
              >
                <RotateCw size={14} className="margin-right-6" /> Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="tabmatrix-toggle-btn error-boundary-btn"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
