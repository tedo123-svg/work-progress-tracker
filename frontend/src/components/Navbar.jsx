import { Link } from 'react-router-dom';
import { LogOut, BarChart3, User, Sparkles, Languages, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { transformBranchName } from '../utils/branchNameTransform';
import NavbarCountdown from './NavbarCountdown';

function Navbar({ user, onLogout }) {
  const { language, toggleLanguage, t } = useLanguage();
  
  return (
    <nav className="glass border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border-2 border-white/20">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white block">{t('ዘመናዊ እቅድ እና ሪፖርት', 'Modern Plan and Report')}</span>
              <span className="text-xs text-purple-300">{t('መላኪያ ስርዓት', 'Sender System')}</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-white flex items-center gap-1">
                  {user.role === 'admin' ? 'System Administrator' : 
                   user.role === 'main_branch' ? t('ክፍለ ከተማ', 'Sub-city') :
                   transformBranchName(user.branchName, language) || user.branchName}
                  {user.role === 'main_branch' && <Sparkles size={14} className="text-yellow-400" />}
                  {user.role === 'admin' && <Sparkles size={14} className="text-red-400" />}
                </div>
                <div className="text-purple-300 text-xs">{user.username}</div>
              </div>
            </div>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-xl transition transform hover:scale-105 shadow-lg"
              title={language === 'am' ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
            >
              <Languages size={18} />
              <span className="hidden sm:inline font-semibold">{language === 'am' ? 'EN' : 'አማ'}</span>
            </button>
            
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl transition transform hover:scale-105 shadow-lg"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">{t('ውጣ', 'Logout')}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
