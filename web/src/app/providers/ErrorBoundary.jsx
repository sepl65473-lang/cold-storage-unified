import { Component } from "react";
import { AlertCircle } from "lucide-react";

export class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center font-sans">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <h1 className="text-lg font-semibold text-slate-800">Something went wrong</h1>
          <p className="max-w-md text-sm text-slate-500">{String(this.state.error.message || this.state.error)}</p>
          <button onClick={() => location.reload()} className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}
