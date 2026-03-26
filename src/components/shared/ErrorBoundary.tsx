'use client';
 
import React, { ErrorInfo, ReactNode } from 'react';
 
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
 
interface State {
  hasError: boolean;
  error?: Error;
}
 
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
      super(props);
      this.state = { hasError: false };
  }
 
  static getDerivedStateFromError(error: Error): State {
      return { hasError: true, error };
  }
 
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
 
  render() {
      if (this.state.hasError) {
          return (
              <div className="fixed inset-0 z-[9999] p-8 flex flex-col items-center justify-center bg-black/95 text-white font-mono text-center">
                  <h2 className="text-red-500 text-2xl mb-6 font-bold tracking-tighter uppercase italic">FE Crash Detected</h2>
                  <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md overflow-hidden text-left shadow-2xl backdrop-blur-3xl">
                      <p className="font-bold underline mb-3 italic text-red-500 text-lg">{this.state.error?.name || 'Unknown Error'}</p>
                      <div className="text-sm text-foreground/80 break-words font-sans bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                          {this.state.error?.message || 'No error message available.'}
                      </div>
                  </div>
                  <button 
                      onClick={() => window.location.reload()}
                      className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/10"
                  >
                      RELOAD WEBSITE
                  </button>
                  <p className="mt-4 text-xs text-foreground/40 font-sans tracking-widest uppercase">Take a screenshot of this and send it back</p>
              </div>
          );
      }
 
      return this.props.children;
  }
}
