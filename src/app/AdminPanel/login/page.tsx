'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AuthService } from '@/services/auth.service';
import { setAdminSessionCookie } from '@/features/auth/auth.actions';

// Validation Schema using Zod
const loginSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setError(null);
    console.log('🔑 Login submission started for email:', data.email);

    try {
      // 1. Authenticate with Firebase Auth client SDK
      console.log('🔄 Calling Firebase Auth signInWithEmailAndPassword...');
      const firebaseUser = await AuthService.signIn(data.email, data.password);
      console.log('✅ Firebase Auth sign-in successful! User UID:', firebaseUser.uid);

      // 2. Set the secure HTTP-Only admin session cookie
      console.log('🔄 Requesting Server Action to set admin session cookie...');
      await setAdminSessionCookie();
      console.log('✅ Session cookie set!');

      // 3. Redirect to the main admin dashboard
      console.log('🔄 Navigating to dashboard /AdminPanel...');
      router.push('/AdminPanel');
    } catch (err: any) {
      console.error('❌ Login execution failed:', err);
      // Map common Firebase errors to user friendly messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. This account has been temporarily locked.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: Unable to reach Firebase Authentication servers. Please check your internet connection.');
      } else {
        setError(err.message || 'An unexpected authentication error occurred.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-950 overflow-hidden text-zinc-100">
      {/* Dynamic Glowing Neon Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Login Container */}
      <div className="relative w-full max-w-md px-6 py-12">
        {/* Logo/Brand Icon */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-4">
            <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Secure login for site administrators and affiliate managers.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {error && (
            <div className="flex items-start gap-3 bg-red-950/40 border border-red-900/50 rounded-2xl p-4 mb-6 text-sm text-red-400 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@easykart.com"
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-2xl pl-12 pr-4 py-3.5 text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(139,92,246,0.15)] disabled:opacity-50"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-2xl pl-12 pr-4 py-3.5 text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-300 focus:shadow-[0_0_15px_rgba(139,92,246,0.15)] disabled:opacity-50"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-12 flex items-center justify-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-[0_4px_20px_rgba(139,92,246,0.25)] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none block"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
          <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider font-semibold">
            &larr; Back to Main Website
          </a>
        </div>
      </div>
    </div>
  );
}
