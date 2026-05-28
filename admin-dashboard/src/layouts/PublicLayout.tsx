import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, HelpCircle, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PublicLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { user, email, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        if (location.pathname !== '/') {
            navigate(`/#${id}`);
            return;
        }
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    React.useEffect(() => {
        if (location.hash && location.pathname === '/') {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [location]);

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
            {/* Top Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-filter backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <button 
                            onClick={() => scrollToSection('marketing-monster')}
                            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            마케팅 몬스터
                        </button>
                        <button 
                            onClick={() => scrollToSection('cafe-monster')}
                            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            카페 몬스터
                        </button>
                        <button 
                            onClick={() => scrollToSection('app-monster')}
                            className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            앱 몬스터
                        </button>
                    </nav>

                    {/* Right Side Controls */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/support">
                            <Button 
                                variant={location.pathname === '/support' ? 'default' : 'outline'}
                                className="h-10 px-5 rounded-xl font-bold flex items-center gap-2 border-slate-200"
                            >
                                <HelpCircle className="w-4 h-4" />
                                {role === 'admin' ? '고객센터 관리' : (user && email ? '내 문의/답변' : '고객센터/문의')}
                            </Button>
                        </Link>

                        {role === 'admin' && (
                            <Link to="/admin">
                                <Button 
                                    variant="secondary"
                                    className="h-10 px-5 rounded-xl font-bold flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    관리자 도구
                                </Button>
                            </Link>
                        )}

                        {user && email && (
                            <div className="flex items-center pl-2 border-l border-slate-200">
                                <Link 
                                    to="/profile" 
                                    className="text-sm text-slate-700 font-black hover:text-indigo-600 transition-colors"
                                    title="프로필 및 설정"
                                >
                                    {email.split('@')[0]}
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <button 
                        className="md:hidden p-2 text-slate-500 hover:text-slate-950 transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Panel */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-b border-slate-100 bg-white px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-5 duration-200">
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => scrollToSection('marketing-monster')}
                                className="text-left py-2 font-bold text-slate-600 hover:text-slate-950"
                            >
                                마케팅 몬스터
                            </button>
                            <button 
                                onClick={() => scrollToSection('cafe-monster')}
                                className="text-left py-2 font-bold text-slate-600 hover:text-slate-950"
                            >
                                카페 몬스터
                            </button>
                            <button 
                                onClick={() => scrollToSection('app-monster')}
                                className="text-left py-2 font-bold text-slate-600 hover:text-slate-950"
                            >
                                앱 몬스터
                            </button>
                        </div>
                        <hr className="border-slate-100" />
                        <div className="flex flex-col gap-3">
                            <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="w-full">
                                <Button variant="outline" className="w-full h-11 font-bold flex items-center justify-center gap-2 border-slate-200">
                                    <HelpCircle className="w-4 h-4" /> 
                                    {role === 'admin' ? '고객센터 관리' : (user && email ? '내 문의/답변' : '고객센터/문의')}
                                </Button>
                            </Link>
                            
                            {role === 'admin' && (
                                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="w-full">
                                    <Button variant="secondary" className="w-full h-11 font-bold flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600">
                                        <LayoutDashboard className="w-4 h-4" /> 관리자 도구
                                    </Button>
                                </Link>
                            )}

                            {user && email && (
                                <div className="space-y-3 pt-2">
                                    <Link 
                                        to="/profile" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block bg-slate-50 p-3 rounded-xl border border-slate-100 text-left hover:bg-slate-100 transition-colors"
                                    >
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">내 프로필 & 설정</p>
                                        <p className="text-sm text-slate-800 font-black mt-0.5">{email.split('@')[0]}</p>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Page Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Public Footer */}
            <footer className="bg-slate-900 text-slate-400 py-16 px-6 border-t border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain brightness-0 invert" />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                        © 2026 3Monster Series. All rights reserved. Secured by Cloud Shield.
                    </p>
                </div>
            </footer>
        </div>
    );
};
