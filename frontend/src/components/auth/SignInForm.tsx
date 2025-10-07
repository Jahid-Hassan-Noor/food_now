"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { loginAPI, checkAccess } from '@/utils/api';
import { useRouter } from 'next/navigation';
import ErrorModal from "@/components/modals/ErrorModal";
import { useSearchParams } from 'next/navigation';
// import WarningModal from "@/components/modals/WarningModal";


export default function SignInForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorMsg = searchParams.get('error');

    const handleCloseErrorModal = () => {
        setShowErrorModal(false);
      };
    // Check if the user is already logged in
    useEffect(() => {
        if (errorMsg) {
          setError(errorMsg);
          setShowErrorModal(true);
        }
        const validateTokens = async () => {
            const accessToken = localStorage.getItem('access');
            const refreshToken = localStorage.getItem('refresh');

              // Check if tokens are available  in localStorage
            if (!accessToken || !refreshToken) {
                return null;
            } else {
                try {
                    const isValid = await checkAccess();
                    if (isValid) {
                        router.push('/user'); // Redirect to user dashboard if valid
                    } else {
                        setError('Session expired. Please login again.');
                        setShowErrorModal(true);
                    }
                } catch (error) {
                    setError((error as any).message);
                    setShowErrorModal(true);
                }
            }
        };
    
        validateTokens();
    }, [router]);
    
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
  
      try {
        const data = await loginAPI('auth/login/', {
          method: 'POST',
          data: { username, password },
        });
        
        // Save tokens to local storage
        localStorage.setItem('access', data.access);
        localStorage.setItem('refresh', data.refresh);
        localStorage.setItem('username', data.user.username);
        localStorage.setItem('role', data.user.role);
  
        // Redirect to the dashboard
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else if (data.user.role === 'chef') {
          router.push('/chef');
        } else if (data.user.role === 'user') {
          router.push('/user');
        } else {
          setError('Invalid role. Please contact the administrator.');
          setShowErrorModal(true);
        }
      } catch (err: any) {
        setError(err.message);
        setShowErrorModal(true);
      }
    };
  

  if (showErrorModal && error) return <ErrorModal message={error} onClose={handleCloseErrorModal} />;
  // if (showErrorModal && error) return <WarningModal message={error} onClose={handleCloseErrorModal} />;

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Log In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to log in!
            </p>
          </div>
          <div>
            <form onSubmit={handleLogin}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input          
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm">
                    Sign in
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  href="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
