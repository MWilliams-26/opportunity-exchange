import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Card } from '../ui';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(email, password);
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="page-title mb-2">Welcome Back</h1>
        <p className="text-muted">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setValidationErrors((prev) => ({ ...prev, email: '' }));
          }}
          error={validationErrors.email}
          placeholder="you@example.com"
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setValidationErrors((prev) => ({ ...prev, password: '' }));
          }}
          error={validationErrors.password}
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="link">
          Create one
        </Link>
      </p>
    </Card>
  );
}
