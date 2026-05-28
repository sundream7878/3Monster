import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
    Bell, 
    Send, 
    Trash2, 
    Mail, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    Sparkles, 
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationItem {
    id: number;
    title: string;
    content: string;
    target_role: string;
    created_at: string;
    sent_by: string;
}

export const NotificationManager = () => {
    const { email: adminEmail } = useAuth();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    
    // Form fields
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [targetRole, setTargetRole] = useState('all');
    
    // UI Feedback
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
        } catch (err: any) {
            console.error("Error loading notifications:", err);
            setErrorMessage("알림 리스트를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Realtime updates
        const channel = supabase
            .channel('notifications-sync')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'notifications' 
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setErrorMessage("제목과 내용을 입력해 주세요.");
            return;
        }

        setSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const { error } = await supabase
                .from('notifications')
                .insert([{
                    title: title.trim(),
                    content: content.trim(),
                    target_role: targetRole,
                    sent_by: adminEmail || 'admin@3monster.net'
                }]);

            if (error) throw error;

            setTitle('');
            setContent('');
            setTargetRole('all');
            setSuccessMessage("알림이 성공적으로 전송되었습니다.");
            setTimeout(() => setSuccessMessage(''), 3000);
            await fetchNotifications();
        } catch (err: any) {
            console.error("Error inserting notification:", err);
            setErrorMessage(`알림 발송 오류: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteNotification = async (id: number) => {
        if (!confirm("정말 이 알림을 삭제하시겠습니까? 수신자의 알림 내역에서도 제거됩니다.")) return;
        
        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            setSuccessMessage("알림이 성공적으로 삭제되었습니다.");
            setTimeout(() => setSuccessMessage(''), 2500);
            await fetchNotifications();
        } catch (err: any) {
            console.error("Error deleting notification:", err);
            setErrorMessage(`삭제 오류: ${err.message}`);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="px-2.5 py-1 text-[10px] font-black text-rose-700 bg-rose-50 border border-rose-100 rounded-full">관리자 (Admin)</span>;
            case 'buyer':
                return <span className="px-2.5 py-1 text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">구매자 (Buyer)</span>;
            case 'user':
                return <span className="px-2.5 py-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 rounded-full">대기자 (User)</span>;
            case 'all':
            default:
                return <span className="px-2.5 py-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full">전체 사용자 (All)</span>;
        }
    };

    const filteredNotifications = notifications.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.sent_by.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full space-y-6">
            
            {/* Title Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                    <Bell className="w-6 h-6 animate-swing" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                        알림 발송 & 관리 <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                    </h1>
                    <p className="text-xs text-slate-400 font-bold">서비스 공지사항 및 특정 회원 대상 타겟 알림 전송/이력 관리</p>
                </div>
            </div>

            {/* Status alerts */}
            <AnimatePresence mode="wait">
                {successMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 bg-emerald-50 text-emerald-700 border border-emerald-100 p-4 rounded-2xl"
                    >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <p className="text-xs font-bold">{successMessage}</p>
                    </motion.div>
                )}
                {errorMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 bg-rose-50 text-rose-600 border border-rose-100 p-4 rounded-2xl"
                    >
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                        <p className="text-xs font-bold">{errorMessage}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Create notification (5/12) */}
                <div className="lg:col-span-5">
                    <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-6">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Send className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-sm font-black text-slate-800">새 알림 발송</h3>
                        </div>

                        <form onSubmit={handleSendNotification} className="space-y-4 text-left">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">수신 그룹 설정</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: '전체', value: 'all' },
                                        { label: '관리자', value: 'admin' },
                                        { label: '구매자', value: 'buyer' },
                                        { label: '대기자', value: 'user' },
                                    ].map((role) => (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setTargetRole(role.value)}
                                            className={`h-10 text-xs font-bold rounded-xl border transition-all ${
                                                targetRole === role.value 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                            }`}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">알림 제목</label>
                                <Input
                                    type="text"
                                    placeholder="예: [점검공지] 3Monster API 서버 긴급 패치"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="h-11 bg-slate-50 border-slate-200 focus-visible:bg-white rounded-xl text-xs font-bold focus-visible:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">알림 본문 내용</label>
                                <textarea
                                    placeholder="수신자가 확인할 핵심 내용을 작성해 주세요."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full min-h-[160px] rounded-xl bg-slate-50 p-4 text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-350 text-slate-800"
                                />
                            </div>

                            <Button 
                                type="submit"
                                isLoading={submitting}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl shadow-lg shadow-indigo-150 transition-all flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" /> 알림 즉시 발송하기
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Right Column: Sent List (7/12) */}
                <div className="lg:col-span-7">
                    <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                <h3 className="text-sm font-black text-slate-800">알림 발송 이력 ({filteredNotifications.length})</h3>
                            </div>
                            
                            {/* Search box */}
                            <div className="relative w-full sm:w-60">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <Input
                                    type="text"
                                    placeholder="알림 검색..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-9 h-9 bg-slate-50 border-slate-200 focus-visible:bg-white rounded-lg text-xs"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20">
                                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-xs text-slate-400 font-bold">발송 이력을 불러오는 중...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="text-center py-20 space-y-3">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                                    <Bell className="w-5 h-5" />
                                </div>
                                <p className="text-xs text-slate-400 font-bold">검색 결과 또는 발송 이력이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
                                {filteredNotifications.map((notif) => (
                                    <div 
                                        key={notif.id}
                                        className="p-4 bg-slate-50/50 border border-slate-150 hover:border-indigo-100 rounded-xl transition-all duration-200 text-left space-y-3 relative group"
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    {getRoleBadge(notif.target_role)}
                                                    <span className="text-[10px] text-slate-350 font-bold flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> {new Date(notif.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-black text-slate-800 break-all">{notif.title}</h4>
                                            </div>
                                            
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteNotification(notif.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all p-1.5 rounded-lg hover:bg-rose-50"
                                                title="알림 삭제"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-100 shadow-xs">
                                            {notif.content}
                                        </p>

                                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold pt-1">
                                            <span className="flex items-center gap-1">
                                                <Mail className="w-3 h-3 text-slate-300" /> 발송자: {notif.sent_by}
                                            </span>
                                            <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                                                ID: {notif.id}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
};
