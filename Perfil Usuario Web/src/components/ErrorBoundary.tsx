import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                                Algo salió mal
                            </h3>
                            <p className="text-sm text-red-700 dark:text-red-300 max-w-md mt-1">
                                {this.state.error?.message || 'Ha ocurrido un error inesperado al renderizar este componente.'}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={this.handleReset}
                            className="border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Intentar de nuevo
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
