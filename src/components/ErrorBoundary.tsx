import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Typography, Box, Button } from '@mui/material';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode; // Optional fallback UI
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="50vh"
          textAlign="center"
          p={3}
        >
          <Typography variant="h4" color="error" gutterBottom>
            حدث خطأ ما!
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            نعتذر عن الإزعاج. يرجى المحاولة مرة أخرى لاحقًا.
          </Typography>
          {this.state.error && (
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo?.componentStack}
            </Typography>
          )}
          <Button variant="contained" color="primary" onClick={() => window.location.reload()} sx={{ mt: 3 }}>
            تحديث الصفحة
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
