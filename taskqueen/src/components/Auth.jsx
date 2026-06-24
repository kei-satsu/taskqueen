import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase'; // 👈 googleProvider ကိုပါ တွဲယူလိုက်ပါတယ်
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

export default function Auth() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Email / Password ဖြင့် ဝင်ခြင်း
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  // 🌐 Google Account ဖြင့် Popup ဝင်ခြင်း (Function အသစ်)
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-white">
      <div className="w-full max-w-md rounded-2xl bg-gray-800 p-8 shadow-xl border border-gray-750">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-400">
          {isRegister ? 'Create Account' : 'Welcome to TaskQueen'}
        </h2>
        
        {error && <p className="mb-4 text-sm text-red-400 bg-red-900/30 p-3 rounded-lg text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-400">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="example@gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-400">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-gray-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="w-full rounded-xl bg-purple-600 py-3 font-semibold hover:bg-purple-700 transition duration-200">
            {isRegister ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        {/* ─── သို့မဟုတ် မျဉ်းတားခွဲထုတ်ခြင်း ─── */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        {/* 🌐 Google Sign-In Button */}
        <button 
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-gray-900 py-3 font-semibold hover:bg-gray-100 transition duration-200 shadow-md active:scale-[0.99]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.65-5.17 3.65-8.58z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.32-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"/>
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-purple-400 hover:underline font-medium">
            {isRegister ? 'Log In' : 'Sign Up Free'}
          </button>
        </p>
      </div>
    </div>
  );
}