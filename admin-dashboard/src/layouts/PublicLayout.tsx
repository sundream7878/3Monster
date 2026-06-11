import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, HelpCircle, Menu, X, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

const parseThread = (reply: any): any[] => {
    if (!reply) return [];
    if (Array.isArray(reply)) return reply;
    try {
        const parsed = JSON.parse(reply);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [];
};

export const PublicLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { user, email, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
    const [activeSection, setActiveSection] = React.useState<string>('');
    const [notifications, setNotifications] = React.useState<any[]>([]);
    const [bellDropdownOpen, setBellDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const unreadCount = React.useMemo(() => {
        if (role === 'admin') {
            return notifications.filter(notif => notif.status === 'open').length;
        }
        return notifications.filter(notif => {
            const thread = parseThread(notif.reply);
            if (thread.length === 0) return false;
            const lastMsg = thread[thread.length - 1];
            if (lastMsg && lastMsg.sender === 'admin') {
                const readId = localStorage.getItem(`read_ticket_${notif.id}`);
                return readId !== lastMsg.id;
            }
            return false;
        }).length;
    }, [notifications, role]);

    const fetchQnaNotifications = React.useCallback(async () => {
        const userEmail = email || localStorage.getItem('user_email');
        if (!user && !userEmail) {
            setNotifications([]);
            return;
        }

        let query = supabase
            .from('support_tickets')
            .select('id, email, uid, issue_type, description, status, created_at, reply');

        if (role !== 'admin') {
            const userEmail = email || localStorage.getItem('user_email');
            if (userEmail) {
                const uidFilter = user?.id ? `uid.eq.${user.id},` : '';
                query = query.or(`${uidFilter}email.eq.${userEmail.toLowerCase()}`);
            } else if (user?.id) {
                query = query.eq('uid', user.id);
            } else {
                setNotifications([]);
                return;
            }
        }
            //
        //

        const { data, error } = await query.order('created_at', { ascending: false }).limit(20);
        if (!error && data) {
            setNotifications(data);
        }
    }, [user, email, role]);

    React.useEffect(() => {
        fetchQnaNotifications();

        const channel = supabase
            .channel('qna-notifications-sync')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'support_tickets'
            }, () => {
                fetchQnaNotifications();
            })
            .subscribe();

        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setBellDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);

        const handleTicketRead = () => {
            fetchQnaNotifications();
        };
        window.addEventListener('qna-ticket-read', handleTicketRead);

        return () => {
            supabase.removeChannel(channel);
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('qna-ticket-read', handleTicketRead);
        };
    }, [fetchQnaNotifications]);

    const scrollToSection = (id: string) => {
        setMobileMenuOpen(false);
        setActiveSection(id);
        if (location.pathname !== '/') {
            navigate(`/#${id}`);
            return;
        }
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const isFirstRender = React.useRef(true);

    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            if (location.hash) {
                window.history.replaceState(null, '', window.location.pathname);
            }
            window.scrollTo(0, 0);
            return;
        }

        if (location.hash && location.pathname === '/') {
            const id = location.hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        } else if (!location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    React.useEffect(() => {
        if (location.pathname !== '/') {
            setActiveSection('');
            return;
        }

        const handleScroll = () => {
            if (window.scrollY < 450) {
                setActiveSection('');
                return;
            }

            const sections = ['marketing-monster', 'cafe-monster', 'app-monster'];
            let currentSection = '';
            const triggerPoint = window.scrollY + window.innerHeight * 0.35;

            for (const id of sections) {
                const el = document.getElementById(id);
                if (el) {
                    const top = el.offsetTop;
                    if (triggerPoint >= top) {
                        currentSection = id;
                    }
                }
            }

            setActiveSection(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100/80 via-slate-200/90 to-purple-100/70 flex flex-col font-sans">
            {/* Top Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-filter backdrop-blur-xl border-b border-slate-100/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link 
                        to="/" 
                        onClick={(e) => {
                            if (location.pathname === '/') {
                                e.preventDefault();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className="flex items-center gap-3 group"
                    >
                        <img src="/logo.png" alt="Logo" className="h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-12">
                        <button 
                            onClick={() => scrollToSection('marketing-monster')}
                            className={cn(
                                "text-lg font-black transition-all duration-300 relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-indigo-600 after:transition-all after:duration-300",
                                activeSection === 'marketing-monster' 
                                    ? "text-indigo-600 after:w-full" 
                                    : "text-slate-600 hover:text-indigo-600 after:w-0 hover:after:w-full"
                            )}
                        >
                            마케팅 몬스터
                        </button>
                        <button 
                            onClick={() => scrollToSection('cafe-monster')}
                            className={cn(
                                "text-lg font-black transition-all duration-300 relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-indigo-600 after:transition-all after:duration-300",
                                activeSection === 'cafe-monster' 
                                    ? "text-indigo-600 after:w-full" 
                                    : "text-slate-600 hover:text-indigo-600 after:w-0 hover:after:w-full"
                            )}
                        >
                            카페 몬스터
                        </button>
                        <button 
                            onClick={() => scrollToSection('app-monster')}
                            className={cn(
                                "text-lg font-black transition-all duration-300 relative py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-indigo-600 after:transition-all after:duration-300",
                                activeSection === 'app-monster' 
                                    ? "text-indigo-600 after:w-full" 
                                    : "text-slate-600 hover:text-indigo-600 after:w-0 hover:after:w-full"
                            )}
                        >
                            앱 몬스터
                        </button>
                    </nav>

                    {/* Right Side Controls */}
                    <div className="hidden md:flex items-center gap-6">
                        {/* Q&A Notifications Bell */}
                        {(user || localStorage.getItem('user_email')) && (
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={() => setBellDropdownOpen(!bellDropdownOpen)}
                                    className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 hover:text-indigo-600 transition-all flex items-center justify-center relative shadow-sm hover:shadow"
                                    title="질문 알림"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                
                                {bellDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-800">
                                                {role === 'admin' ? '🛡️ 미답변 질문 목록' : '🙋‍♂️ 내 질문 목록'}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {role === 'admin' ? `최근 ${notifications.length}개` : `미읽음 ${unreadCount}개`}
                                            </span>
                                        </div>
                                        
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-xs font-bold text-slate-400">
                                                알림이 없습니다.
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                                                {notifications.map((notif) => {
                                                    const isQna = notif.issue_type && notif.issue_type.startsWith('qna_');
                                                    const prodId = isQna ? notif.issue_type.replace('qna_', '') : null;
                                                    
                                                    // Parse URL search params to find selected ticket
                                                    const searchParams = new URLSearchParams(location.search);
                                                    const activeTicketId = searchParams.get('ticket_id');
                                                    const isActive = String(notif.id) === String(activeTicketId);

                                                    let categoryBadge = null;
                                                    let subBadge = null;

                                                    if (isQna) {
                                                        categoryBadge = (
                                                            <span className="bg-blue-50/80 text-blue-600 border border-blue-100/30 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide">
                                                                제품 문의
                                                            </span>
                                                        );
                                                        subBadge = (
                                                            <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                                                {prodId?.toUpperCase() || '공통'}
                                                            </span>
                                                        );
                                                    } else {
                                                        categoryBadge = (
                                                            <span className="bg-violet-50 text-violet-700 border border-violet-150 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide">
                                                                AS 기술지원
                                                            </span>
                                                        );
                                                        
                                                        let issueLabel = '';
                                                        switch (notif.issue_type) {
                                                            case 'bug': issueLabel = '버그/오류'; break;
                                                            case 'feature': issueLabel = '기능제안'; break;
                                                            case 'license': issueLabel = '라이선스'; break;
                                                            case 'custom': issueLabel = '커스텀의뢰'; break;
                                                            case 'other': issueLabel = '일반문의'; break;
                                                            default: issueLabel = notif.issue_type || '기타';
                                                        }
                                                        subBadge = (
                                                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide">
                                                                {issueLabel}
                                                            </span>
                                                        );
                                                    }

                                                    const title = notif.description ? notif.description.split('\n')[0] : '내용 없음';
                                                    
                                                    const thread = parseThread(notif.reply);
                                                    const isUnread = role === 'admin'
                                                        ? notif.status === 'open'
                                                        : thread.length > 0 && (() => {
                                                        const lastMsg = thread[thread.length - 1];
                                                        if (lastMsg && lastMsg.sender === 'admin') {
                                                            const readId = localStorage.getItem(`read_ticket_${notif.id}`);
                                                            return readId !== lastMsg.id;
                                                        }
                                                        return false;
                                                    })();

                                                    return (
                                                        <button
                                                            key={notif.id}
                                                            onClick={() => {
                                                                if (isUnread && role !== 'admin') {
                                                                    const lastMsg = thread[thread.length - 1];
                                                                    if (lastMsg) {
                                                                        localStorage.setItem(`read_ticket_${notif.id}`, lastMsg.id);
                                                                        window.dispatchEvent(new Event('qna-ticket-read'));
                                                                    }
                                                                }
                                                                setBellDropdownOpen(false);
                                                                if (isQna && role !== "admin") {
                                                                    { const targetSearch = `?qna_product=${prodId}&ticket_id=${notif.id}`; if (location.pathname === '/' && location.search === targetSearch) { window.dispatchEvent(new CustomEvent('force-qna-jump', { detail: { qnaProduct: prodId, ticketId: String(notif.id) } })); } else { navigate(`/${targetSearch}`); } }
                                                                } else {
                                                                    { const targetSearch = `?ticket_id=${notif.id}`; if (location.pathname === '/support' && location.search === targetSearch) { window.dispatchEvent(new CustomEvent('force-support-jump', { detail: { ticketId: String(notif.id) } })); } else { navigate(`/support${targetSearch}`); } }
                                                                }
                                                            }}
                                                            className={cn(
                                                                "w-full text-left p-2 rounded-xl transition-all border flex flex-col gap-1.5 cursor-pointer relative pl-3.5",
                                                                isActive
                                                                    ? "bg-indigo-50/45 border-indigo-200 shadow-sm ring-1 ring-indigo-100/40"
                                                                    : isUnread
                                                                        ? "bg-rose-50/25 border-rose-100/50 hover:border-rose-200 hover:bg-slate-50/50"
                                                                        : "border-transparent hover:border-slate-100 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {isActive && (
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-xl" />
                                                            )}
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    {categoryBadge}
                                                                    {subBadge}
                                                                    {isUnread && (
                                                                        <span className="bg-rose-50 text-rose-600 border border-rose-200/60 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0 select-none animate-pulse">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                            {role === 'admin' ? '미답변' : '새답변'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-[9px] text-slate-400 font-bold">
                                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-700 truncate w-full">
                                                                {title}
                                                            </p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <Link to="/support">
                            <Button 
                                variant={location.pathname === '/support' ? 'default' : 'outline'}
                                className="h-14 px-8 rounded-2xl font-black text-sm flex items-center gap-2.5 border-slate-200 shadow-sm hover:shadow transition-all"
                            >
                                <HelpCircle className="w-5 h-5" />
                                {role === 'admin' ? '고객센터 관리' : (user && email ? '내 문의/답변' : '고객센터/문의')}
                            </Button>
                        </Link>

                        {role === 'admin' && (
                            <Link to="/admin">
                                <Button 
                                    variant="secondary"
                                    className="h-14 px-8 rounded-2xl font-black text-sm flex items-center gap-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm hover:shadow transition-all"
                                >
                                    <LayoutDashboard className="w-5 h-5" />
                                    관리자 도구
                                </Button>
                            </Link>
                        )}

                        {user && email ? (
                            <div className="flex items-center pl-4 border-l-2 border-slate-200">
                                <Link 
                                    to="/profile" 
                                    className="text-base text-slate-700 font-black hover:text-indigo-600 transition-all duration-200 bg-slate-50 hover:bg-indigo-50 px-4 py-2.5 rounded-xl border border-slate-100 hover:border-indigo-100"
                                    title="프로필 및 설정"
                                >
                                    {email.split('@')[0]}
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center pl-4 border-l-2 border-slate-200">
                                <Link 
                                    to="/login" 
                                    className="text-base text-indigo-650 font-black hover:text-indigo-800 transition-all duration-200 bg-indigo-55/10 hover:bg-indigo-55/20 px-5 py-2.5 rounded-xl border border-indigo-100/50"
                                    title="로그인"
                                >
                                    로그인
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

                            {user && email ? (
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
                            ) : (
                                <div className="space-y-3 pt-2">
                                    <Link 
                                        to="/login" 
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block bg-indigo-50 p-3 rounded-xl border border-indigo-100/50 text-left hover:bg-indigo-100/20 transition-colors"
                                    >
                                        <p className="text-[10px] text-indigo-500 font-bold uppercase">회원 서비스</p>
                                        <p className="text-sm text-indigo-750 font-black mt-0.5">간편 로그인하기</p>
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
