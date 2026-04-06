"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Something went wrong",
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <p className="text-4xl">⚠️</p>
            <h2 className="text-xl font-headline font-bold text-slate-800">
              Something went wrong
            </h2>
            <p className="text-slate-500 text-sm">{this.state.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, message: "" })}
              className="px-6 py-2.5 rounded-full bg-indigo-600 text-white text-sm font-bold font-label hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
