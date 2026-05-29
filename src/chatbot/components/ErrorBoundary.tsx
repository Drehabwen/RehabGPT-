/**
 * ErrorBoundary — 全局错误捕获
 *
 * 捕获 React 渲染树中的未处理异常，防止白屏。
 * 显示回退 UI 并提供重试按钮。
 */
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          background: '#f8f9fa',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#333' }}>
            页面出现异常
          </h1>
          <p style={{ color: '#666', marginBottom: '0.5rem', maxWidth: '400px' }}>
            {this.state.error?.message || '未知错误'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              borderRadius: '8px',
              border: 'none',
              background: '#4f46e5',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
