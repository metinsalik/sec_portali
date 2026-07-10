import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-900 border border-red-300 rounded z-[1000] fixed top-0 left-0 w-full h-full">
          <h1 className="text-xl font-bold">Uygulama Çöktü</h1>
          <pre className="text-sm mt-4">{this.state.error?.toString()}</pre>
          <pre className="text-xs mt-2 overflow-auto max-h-96">{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
