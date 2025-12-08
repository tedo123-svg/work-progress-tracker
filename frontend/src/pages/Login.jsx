import { useState } from 'react';
import { authAPI } from '../services/api';
import { BarChart3, Lock, User, Sparkles, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function Login({ onLogin }) {
  const { language, toggleLanguage, t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({ username, password });
      onLogin(response.data.user, response.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'መግባት አልተሳካም');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-slide-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-2xl">
            <BarChart3 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('የስራ እድገት መከታተያ', 'Work Progress Tracker')}
          </h1>
          <p className="text-purple-200 flex items-center justify-center gap-2">
            <Sparkles size={16} />
            {t('ዘመናዊ የሪፖርት ስርዓት', 'Modern Reporting System')}
            <Sparkles size={16} />
          </p>
          
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="mt-4 flex items-center justify-center gap-2 mx-auto bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition backdrop-blur-sm border border-white/20"
          >
            <Languages size={18} />
            <span className="text-sm font-semibold">{language === 'am' ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="glass rounded-3xl shadow-2xl p-8 backdrop-blur-xl border border-white/20 animate-fade-in">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">{t('እንኳን ደህና መጡ', 'Welcome Back')}</h2>
            <p className="text-gray-300">{t('ወደ ዳሽቦርድዎ ለመድረስ ይግቡ', 'Sign in to access your dashboard')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl backdrop-blur-sm animate-slide-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                {t('የተጠቃሚ ስም', 'Username')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder={t('የተጠቃሚ ስምዎን ያስገቡ', 'Enter your username')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                {t('የይለፍ ቃል', 'Password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition backdrop-blur-sm"
                  placeholder={t('የይለፍ ቃልዎን ያስገቡ', 'Enter your password')}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('በመግባት ላይ...', 'Signing in...')}
                </span>
              ) : (
                t('ግባ', 'Sign In')
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-6">
          © 2025 {t('የስራ እድገት መከታተያ። ሁሉም መብቶች የተጠበቁ ናቸው።', 'Work Progress Tracker. All rights reserved.')}
        </p>
      </div>
    </div>
  );
}

export default Login;
