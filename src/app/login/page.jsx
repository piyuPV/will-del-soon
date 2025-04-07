"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BicepsFlexed } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import googleIcon from '../../../public/google-icon.svg';

const LoginPage = () => {
  // Google OAuth2 configuration
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URL;

  const options = {
    redirect_uri: redirectUri,
    client_id: googleClientId,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(" ")
  };

  const qs = new URLSearchParams(options);
  const googleAuthUrl = `${rootUrl}?${qs.toString()}`;

  // Handle OAuth callback
  // useEffect(() => {
  //   // Check if we have a code from Google OAuth
  //   const code = searchParams.get('code');

  //   if (code) {
  //     console.log("Google OAuth code received:", code);
  //     handleGoogleCallback(code);
  //   }
  // }, [searchParams]);

  // const handleGoogleCallback = async (code) => {
  //   try {
  //     // Exchange code for tokens
  //     console.log("Exchanging code for tokens...");
  //     window.history.replaceState({}, document.title, window.location.pathname);

  //     const response = await fetch('/api/auth/google-callback', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ code }),
  //     });

  //     const data = await response.json();
  //     console.log("Google OAuth response:", data);

  //     if (!response.ok) {
  //       throw new Error(data.message || 'Failed to authenticate');
  //     }

  //     // Handle successful login
  //     toast.success("Successfully logged in!");

  //     // Store user info/token in localStorage or state management
  //     localStorage.setItem('userToken', data.accessToken);
  //     localStorage.setItem('userInfo', JSON.stringify(data.userInfo));

  //     // Redirect to dashboard
  //     router.push('/dashboard');

  //   } catch (error) {
  //     console.error("Google login error:", error);
  //     toast.error("Authentication failed. Please try again.");
  //   }
  // };

  const handleGoogleLogin = () => {
    try {
      console.log("Redirecting to Google OAuth...");
      console.log("Auth URL:", googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error) {
      console.error("Google redirect error:", error);
      toast.error("Failed to authenticate with Google. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <BicepsFlexed className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">DevineFit</span>
          </Link>
        </div>
      </nav>

      {/* Main Content - Background with Overlay */}
      <div className="pt-16 min-h-screen flex items-center justify-center relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[url('/assets/fitness-background.jpg')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/60 to-green-600/30" />
        </div>

        {/* Centered Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 w-full max-w-md px-4"
        >
          <div className="w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="mt-2 text-gray-600">
                Sign in to access your fitness dashboard
              </p>
            </div>

            <div className="mt-10 space-y-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Sign in with</span>
                </div>
              </div>

              <div className="mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  <Image src={googleIcon} className='w-5 h-5' alt="DevFit" />
                  Continue with Google
                </motion.button>
              </div>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-green-600 hover:text-green-700">
                  Register here
                </Link>
              </div>
            </div>
          </div>

          {/* Tagline below login form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center text-white"
          >
            <h3 className="text-xl font-bold mb-2">Your Fitness Journey Starts Here</h3>
            <p>Personalized workout plans, diet recommendations, and fitness tracking all in one place</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;