import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
    UploadCloud, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    Image as ImageIcon, 
    Lock, 
    ChevronDown, 
    ChevronUp, 
    ExternalLink,
    Plus,
    Search
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { motion } from 'framer-motion';

export const CustomerSupport = () => {
    const { user, email: verifiedEmail, role } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const [contactEmail, setContactEmail] = useState(localStorage.getItem('user_email') || localStorage.getItem('buyer_email') || '');
    const [issueType, setIssueType] = useState('bug');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [logFile, setLogFile] = useState<File | null>(null);

    const [tickets, setTickets] = useState<any[]>([]);
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Admin features state
    const [adminReply, setAdminReply] = useState('');
    const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

    const fetchTickets = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error fetching tickets:', error);
        } else {
            setTickets(data || []);
        }
    };

    // Fetch tickets
    React.useEffect(() => {
        fetchTickets();

        const channel = supabase
            .channel('support-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
                fetchTickets();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const handleUploadFile = async (file: File, folder: string): Promise<string> => {
        if (!user) throw new Error('Not authenticated');
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('support')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('support')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            let imageUrl = null;
            let logUrl = null;

            if (imageFile) imageUrl = await handleUploadFile(imageFile, 'images');
            if (logFile) logUrl = await handleUploadFile(logFile, 'logs');

            const { error: insertError } = await supabase
                .from('support_tickets')
                .insert([{
                    uid: user.id,
                    email: contactEmail.toLowerCase(),
                    issue_type: issueType,
                    description,
                    image_url: imageUrl,
                    log_url: logUrl,
                    status: 'open'
                }]);

            if (insertError) throw insertError;

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsModalOpen(false);
                setDescription('');
                setImageFile(null);
                setLogFile(null);
            }, 2000);
        } catch (err: any) {
            console.error("Error submitting ticket:", err);
            setError(`문의 접수 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId: string) => {
        if (!isAdmin || !adminReply.trim()) return;
        
        setUpdatingTicketId(ticketId);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({
                    reply: adminReply,
                    status: 'closed',
                    replied_at: new Date().toISOString()
                })
                .eq('id', ticketId);

            if (error) throw error;
            
            setAdminReply('');
            setExpandedTicketId(null);
        } catch (err) {
            console.error("Error updating ticket:", err);
            alert("상태 업데이트 중 오류가 발생했습니다.");
        } finally {
            setUpdatingTicketId(null);
        }
    };

    const maskEmail = (email: string) => {
        if (!email) return 'unknown';
        const [userPart, domain] = email.split('@');
        if (!domain) return email;
        const masked = userPart.length > 2 ? userPart.substring(0, 2) + '*'.repeat(userPart.length - 2) : userPart + '*';
        return `${masked}@${domain}`;
    };

    const isAdmin = role === 'admin';
    const filteredTickets = tickets.filter(t => 
        (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">고객센터</h1>
                    <p className="text-slate-400 font-bold">3Monster 서비스 이용 문의 및 버그 제보 게시판입니다.</p>
                </div>
                {!isAdmin && (
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-indigo-100 shadow-xl transition-all"
                    >
                        <Plus className="mr-2 w-6 h-6" /> 문의 등록하기
                    </Button>
                )}
            </div>

            {/* List View Main */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <Input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="이메일이나 내용으로 검색..."
                            className="h-14 pl-14 bg-white border-none shadow-sm rounded-2xl font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredTickets.map((ticket, index) => {
                        // Check ownership by verified email first, fallback to UID
                        const isOwn = 
                            (ticket.email && verifiedEmail && ticket.email.toLowerCase() === verifiedEmail.toLowerCase()) || 
                            (ticket.uid === user?.uid);
                            
                        const isExpanded = expandedTicketId === ticket.id;
                        const canViewDetail = isAdmin || isOwn;

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={ticket.id}
                            >
                                <Card className={cn(
                                    "overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-3xl",
                                    isExpanded && "ring-2 ring-indigo-50"
                                )}>
                                    <div 
                                        className={cn(
                                            "flex items-center justify-between p-6 cursor-pointer group",
                                            isExpanded ? "bg-indigo-50/30" : "bg-white"
                                        )}
                                        onClick={() => canViewDetail && setExpandedTicketId(isExpanded ? null : ticket.id)}
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                                canViewDetail ? "bg-indigo-100 text-indigo-600 scale-100" : "bg-slate-50 text-slate-300 scale-90"
                                            )}>
                                                {canViewDetail ? <FileText className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                        ticket.issue_type === 'bug' ? "bg-rose-50 text-rose-500" :
                                                        ticket.issue_type === 'feature' ? "bg-indigo-50 text-indigo-500" :
                                                        ticket.issue_type === 'license' ? "bg-amber-50 text-amber-500" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {ticket.issue_type === 'bug' ? '버그/오류' : 
                                                         ticket.issue_type === 'feature' ? '기능제안' :
                                                         ticket.issue_type === 'license' ? '라이선스' : '기타'}
                                                    </span>
                                                    <span className="text-slate-400 font-bold text-xs">
                                                        {canViewDetail ? ticket.email : maskEmail(ticket.email)}
                                                    </span>
                                                </div>
                                                <h4 className={cn(
                                                    "text-base font-black truncate max-w-[200px] sm:max-w-md",
                                                    canViewDetail ? "text-slate-800" : "text-slate-300 italic"
                                                )}>
                                                    {canViewDetail ? ticket.description : "비밀글입니다."}
                                                </h4>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="hidden sm:flex flex-col items-end">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                                                    ticket.status === 'open' ? "bg-indigo-50 text-indigo-500" : "bg-emerald-50 text-emerald-500"
                                                )}>
                                                    {ticket.status === 'open' ? '처리 대기중' : '진행 완료'}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase">
                                                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </div>
                                            {canViewDetail && (
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isExpanded && canViewDetail && (
                                        <div className="px-8 pb-8 pt-2 bg-indigo-50/30">
                                            <div className="p-8 bg-white rounded-[2rem] shadow-sm border border-indigo-50/50 space-y-8">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-6 text-indigo-600">
                                                        <FileText className="w-5 h-5" />
                                                        <h3 className="font-black text-lg">상세 내용</h3>
                                                    </div>
                                                    <p className="text-slate-600 font-bold leading-relaxed whitespace-pre-wrap text-base">
                                                        {ticket.description}
                                                    </p>
                                                    
                                                    {(ticket.image_url || ticket.log_url) && (
                                                        <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap gap-4">
                                                            {ticket.image_url && (
                                                                <a href={ticket.image_url} target="_blank" rel="noopener noreferrer" 
                                                                className="flex items-center gap-3 px-6 py-4 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-2xl text-sm font-black transition-all group/link">
                                                                    <ImageIcon className="w-5 h-5" /> 스크린샷 보기 <ExternalLink className="w-4 h-4 opacity-30 group-hover/link:opacity-100" />
                                                                </a>
                                                            )}
                                                            {ticket.log_url && (
                                                                <a href={ticket.log_url} target="_blank" rel="noopener noreferrer" 
                                                                className="flex items-center gap-3 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-sm font-black transition-all">
                                                                    <FileText className="w-5 h-5" /> 로그 파일 다운로드 <ExternalLink className="w-4 h-4 opacity-30" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Admin Reply Section */}
                                                {(isAdmin || ticket.reply) && (
                                                    <div className="pt-8 border-t border-slate-50">
                                                        <div className="flex items-center gap-2 mb-6 text-emerald-600">
                                                            <CheckCircle2 className="w-5 h-5" />
                                                            <h3 className="font-black text-lg">관리자 답변</h3>
                                                        </div>
                                                        
                                                        {ticket.reply ? (
                                                            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                                                <p className="text-emerald-900 font-bold leading-relaxed whitespace-pre-wrap">
                                                                    {ticket.reply}
                                                                </p>
                                                                <span className="text-[10px] font-black text-emerald-400 mt-4 block uppercase tracking-wider">
                                                                    Replied at: {ticket.replied_at ? new Date(ticket.replied_at).toLocaleString() : 'N/A'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <textarea
                                                                    placeholder="문의에 대한 답변을 입력해주세요..."
                                                                    value={adminReply}
                                                                    onChange={(e) => setAdminReply(e.target.value)}
                                                                    className="w-full min-h-[140px] rounded-2xl bg-slate-50 p-5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                                                                />
                                                                <div className="flex justify-end">
                                                                    <Button 
                                                                        onClick={() => handleUpdateStatus(ticket.id)}
                                                                        isLoading={updatingTicketId === ticket.id}
                                                                        disabled={!adminReply.trim()}
                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 text-sm font-black shadow-lg shadow-emerald-100"
                                                                    >
                                                                        답변 완료 및 해결완료 처리
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Inquiry Registration Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="문의 접수하기"
                className="max-w-2xl bg-white border-none"
            >
                <div className="space-y-6">
                    {success && (
                        <div className="flex items-center gap-4 bg-emerald-50 text-emerald-600 p-5 rounded-2xl animate-in fade-in zoom-in">
                            <CheckCircle2 className="w-7 h-7" />
                            <p className="font-black">접수가 완료되었습니다! 목록에서 확인 가능합니다.</p>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-4 bg-rose-50 text-rose-600 p-5 rounded-2xl">
                            <AlertCircle className="w-7 h-7" />
                            <p className="font-black">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">답변받을 이메일</label>
                                <Input
                                    required
                                    type="email"
                                    value={contactEmail}
                                    onChange={e => setContactEmail(e.target.value)}
                                    className="h-14 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">문의 유형</label>
                                <select
                                    className="w-full h-14 rounded-2xl bg-slate-50 px-5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                                    value={issueType}
                                    onChange={e => setIssueType(e.target.value)}
                                >
                                    <option value="bug">버그/오류 신고</option>
                                    <option value="feature">기능 제안/문의</option>
                                    <option value="license">라이선스 관련</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">상세 증상 및 내용</label>
                            <textarea
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="문제 상황이나 증상을 최대한 자세히 적어주세요."
                                className="w-full min-h-[160px] rounded-2xl bg-slate-50 p-5 text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="h-14 w-full rounded-2xl bg-slate-50 flex items-center px-4 border-2 border-dashed border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-all">
                                    <ImageIcon className="w-5 h-5 text-slate-400 mr-3" />
                                    <span className="text-xs font-black text-slate-500 truncate">
                                        {imageFile ? imageFile.name : '이미지 첨부'}
                                    </span>
                                </div>
                            </div>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".log,.txt"
                                    onChange={e => setLogFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="h-14 w-full rounded-2xl bg-slate-50 flex items-center px-4 border-2 border-dashed border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-all">
                                    <FileText className="w-5 h-5 text-slate-400 mr-3" />
                                    <span className="text-xs font-black text-slate-500 truncate">
                                        {logFile ? logFile.name : '로그 파일 첨부'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-2xl shadow-indigo-100 shadow-xl transition-all" 
                            isLoading={loading}
                        >
                            <UploadCloud className="mr-2 w-5 h-5" /> 문의 내용 전송하기
                        </Button>
                    </form>
                </div>
            </Modal>
        </div>
    );
};
