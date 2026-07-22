/** Signup Page — Premium registration screen */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Cpu, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    // Mock successful signup -> login -> dashboard
    login('mock-jwt-token-12345', 'admin', data.fullName, 86400);
    navigate('/dashboard', { replace: true });
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
            Start building your <br />
            <span className="text-accent-500">industrial knowledge</span> engine.
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Unify documents, maintenance logs, and compliance records in minutes. Ask questions and get instant insights powered by AI.
          </p>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-success">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              Zero Cloud Dependencies
            </div>
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-success">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              100% Local Execution
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-text-primary mb-2">Create an account</h1>
            <p className="text-text-secondary">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-accent-500 hover:text-accent-400 font-medium transition-colors">
                Sign in
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full Name"
              placeholder="e.g. Jane Doe"
              error={errors.fullName?.message}
              {...register('fullName')}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="jane@company.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
               <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-text-tertiary hover:text-text-secondary flex items-center gap-1.5 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showPassword ? 'Hide passwords' : 'Show passwords'}
                </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold group mt-2"
            >
              Create Account
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-xs text-text-tertiary text-center mt-8 leading-relaxed">
            By creating an account, you agree to our{' '}
            <a href="#" className="underline hover:text-text-secondary">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-text-secondary">Privacy Policy</a>.
          </p>
        </div>
      </div>

    </div>
  );
}
