import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Input, Button, Card } from '../ui';

interface RegisterFormProps {
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function RegisterForm({ onSubmit, loading, error }: RegisterFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(name, email, password);
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="page-title mb-2">Create Account</h1>
        <p className="text-muted">Join Opportunity Exchange today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setValidationErrors((prev) => ({ ...prev, name: '' }));
          }}
          error={validationErrors.name}
          placeholder="John Doe"
          autoComplete="name"
        />

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
          placeholder="At least 8 characters"
          autoComplete="new-password"
          helpText="Must be at least 8 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
          }}
          error={validationErrors.confirmPassword}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />

        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        <Button type="submit" className="w-full" loading={loading}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="link">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
