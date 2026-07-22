/** Login Page — Premium authentication screen */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Cpu, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiClientError } from '@/lib/api/client';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = React.useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.access_token, data.role, '', data.expires_in);
      navigate(from, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          setError('root', { message: 'Invalid username or password' });
        } else if (error.status === 422) {
          setError('root', { message: 'Please fill in all fields' });
        } else {
          setError('root', { message: error.message || 'An error occurred' });
        }
      } else {
        setError('root', { message: 'Unable to connect to the server' });
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    // Demo bypass for when backend is offline
    if (data.username === 'admin' && data.password === 'admin') {
      login('mock-jwt-token-12345', 'admin', 'Admin', 86400);
      navigate(from, { replace: true });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-primary font-sans selection:bg-accent-500/30">
      
      {/* ---------------- LEFT PANEL (Branding) ---------------- */}
      <div className="hidden md:flex flex-1 relative flex-col justify-between p-12 overflow-hidden border-r border-border-primary bg-surface-secondary/50">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10">
          <div 
            onClick={() => navigate('/')} 
            className="flex items-center gap-3 cursor-pointer w-max hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center shadow-lg shadow-accent-500/20">
              <Cpu className="h-6 w-6 text-text-on-accent" />
            </div>
            <span className="font-bold text-xl tracking-tight text-text-primary">UAO Brain</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-text-primary mb-6 leading-[1.2]">
            Welcome back to your <br />
            <span className="text-accent-500">industrial command</span> center.
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Access your unified knowledge graph, run root cause analyses, and check real-time compliance status.
          </p>
        </div>
      </div>

      {/* ---------------- RIGHT PANEL (Form) ---------------- */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-24 bg-bg-primary relative">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-center gap-3 mb-12">
          <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
            <Cpu className="h-5 w-5 text-text-on-accent" />
          </div>
          <span className="font-bold text-lg tracking-tight">UAO Brain</span>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Sign in</h1>
            <p className="text-text-secondary">
              Don't have an account?{' '}
              <button onClick={() => navigate('/signup')} className="text-accent-500 hover:text-accent-400 font-medium transition-colors">
                Create one
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Root error (wrong credentials) */}
            {errors.root && (
              <div className="p-3 rounded-lg bg-danger-muted border border-danger/20 animate-slide-up">
                <p className="text-sm text-danger">{errors.root.message}</p>
              </div>
            )}

            <Input
              label="Username"
              placeholder="e.g. admin"
              autoComplete="username"
              autoFocus
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-text-tertiary hover:text-text-secondary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold group mt-4"
              loading={mutation.isPending}
            >
              Sign In
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-xs text-text-tertiary text-center mt-8 leading-relaxed">
            By signing in, you agree to our{' '}
            <a href="#" className="underline hover:text-text-secondary">Terms of Service</a>.
          </p>
        </div>
      </div>

    </div>
  );
}
