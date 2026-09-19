import { Box, Paper, Typography } from '@mui/material';
import { Navigate, useLocation, type Location } from 'react-router';
import { LoginForm } from '../components/auth/LoginForm';
import { Logo } from '../components/common/Logo';
import { useAuth } from '../hooks/useAuth';

/** Where to go after signing in: the page that sent the user here, or the dashboard. */
function redirectTarget(location: Location): string {
  const from = (location.state as { from?: Location } | null)?.from;
  return from ? `${from.pathname}${from.search}` : '/';
}

// Not in the design: built in the same visual language (dark surfaces, one panel, green action).
export function LoginPage() {
  const { status, login, isLoggingIn } = useAuth();
  const location = useLocation();

  if (status === 'authenticated') return <Navigate to={redirectTarget(location)} replace />;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.deep',
        p: 2,
      }}
    >
      <Paper sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 5 } }}>
        <Box sx={{ mb: 4 }}>
          <Logo />
        </Box>
        <Typography component="h1" variant="h5" sx={{ mb: 0.5 }}>
          Welcome back
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          Sign in to your financial dashboard.
        </Typography>
        <LoginForm onSubmit={login} isSubmitting={isLoggingIn} />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 3, textAlign: 'center' }}
        >
          Demo login: the DEMO_USER_EMAIL and DEMO_USER_PASSWORD from server/.env
        </Typography>
      </Paper>
    </Box>
  );
}
