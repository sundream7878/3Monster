import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Users, LogOut, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
    const { logout, role } = useAuth();

    const adminNavItems = [
        { icon: LayoutDashboard, label: '대시보드', href: '/' },
        { icon: Key, label: '발행 도구', href: '/generator' },
        { icon: Users, label: '전체 관리', href: '/licenses' },
        { icon: HelpCircle, label: '고객센터', href: '/support' },
    ];

    const buyerNavItems = [
        { icon: LayoutDashboard, label: '쇼룸 (홈)', href: '/' },
        { icon: HelpCircle, label: '고객센터', href: '/support' },
    ];

    const navItems = role === 'admin' ? adminNavItems : buyerNavItems;
    return (
        <aside className="fixed inset-y-0 left-0 z-40 w-72 transform bg-white transition-transform duration-300 lg:translate-x-0 border-r border-slate-100">
            {/* Logo Area */}
            <div className="flex h-24 items-center px-8">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                    <span className="text-xl font-black tracking-tight text-slate-800">3Monster</span>
                </div>
            </div>

            <div className="flex flex-col h-[calc(100%-6rem)] py-8 px-6">
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            className={({ isActive }) =>
                                cn(
                                    "group relative flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200",
                                    isActive
                                        ? "bg-slate-50 text-primary"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-300 group-hover:text-slate-500")} />
                                    {item.label}
                                    {isActive && (
                                        <div className="absolute right-0 h-6 w-1 bg-primary rounded-l-full" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="mt-auto">
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold text-slate-400 transition-all duration-200 hover:text-slate-900 group"
                    >
                        <LogOut className="h-5 w-5" />
                        로그아웃
                    </button>
                </div>
            </div>
        </aside>
    );
};
