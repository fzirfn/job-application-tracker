import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-6 text-xs text-[#0a0a0a]">
          <div className="max-w-md w-full p-6 rounded-[8px] bg-[#ffffff] border border-[#e6e6e6] space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#ffedea] text-[#831c1e] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-[#0a0a0a]">
                An unexpected interface error occurred
              </h1>
              <p className="text-[#6b6b6b] mt-1 text-xs">
                {this.state.error?.message || 'Something went wrong while rendering this view.'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-[6px] bg-[#141414] hover:bg-[#2a2a2a] text-[#ffffff] text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
