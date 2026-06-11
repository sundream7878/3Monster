import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Key, Users, LogOut, HelpCircle, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
    const { logout, role } = useAuth();

    const adminNavItems = [
        { icon: LayoutDashboard, label: '대시보드', href: '/admin' },
        { icon: Key, label: '발행 도구', href: '/admin/generator' },
        { icon: Users, label: '구매자 관리', href: '/admin/licenses' },
        { icon: Bell, label: '알림 관리', href: '/admin/notifications' },
        { icon: HelpCircle, label: '고객센터', href: '/support' },
    ];

    const buyerNavItems = [
        { icon: LayoutDashboard, label: '쇼룸 (홈)', href: '/' },
        { icon: HelpCircle, label: '고객센터', href: '/support' },
    ];

    const navItems = role === 'admin' ? adminNavItems : buyerNavItems;
    return (
        <aside className="fixed top-20 bottom-0 left-0 z-40 w-72 transform bg-white transition-transform duration-300 lg:translate-x-0 border-r border-slate-100">
            <div className="flex flex-col h-full py-6 px-6">
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

                {role !== 'admin' && (
                    <div className="mt-auto">
                        <button
                            onClick={() => logout()}
                            className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-sm font-bold text-slate-400 transition-all duration-200 hover:text-slate-900 group"
                        >
                            <LogOut className="h-5 w-5" />
                            로그아웃
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
};
