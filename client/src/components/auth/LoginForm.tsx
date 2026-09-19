import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material';
import { useState, type FormEvent } from 'react';
import type { Credentials } from '../../api/auth';

// Only catches obvious typos before a round trip; the server does the real validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormProps {
  onSubmit: (credentials: Credentials) => void;
  isSubmitting: boolean;
}

export function LoginForm({ onSubmit, isSubmitting }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Field errors appear only after the first submit, not while the user is still typing.
  const [attempted, setAttempted] = useState(false);

  const emailError = attempted && !EMAIL_PATTERN.test(email.trim());
  const passwordError = attempted && password.length === 0;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!EMAIL_PATTERN.test(email.trim()) || password.length === 0) return;
    onSubmit({ email: email.trim(), password });
  };

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          fullWidth
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          helperText={emailError ? 'Enter a valid email address' : undefined}
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          fullWidth
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
          helperText={passwordError ? 'Enter your password' : undefined}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    edge="end"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button type="submit" variant="contained" size="large" fullWidth loading={isSubmitting}>
          Sign in
        </Button>
      </Stack>
    </Box>
  );
}
