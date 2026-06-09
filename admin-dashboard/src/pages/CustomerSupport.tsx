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
    ChevronDown, 
     
    Plus,
    Search,
    Shield,
    MessageSquare,
    X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface ThreadMessage {
    id: string;
    sender: 'user' | 'admin';
    sender_email: string;
    text: string;
    image_url?: string | null;
    log_url?: string | null;
    created_at: string;
}

export const CustomerSupport = () => {
    const { user, email: verifiedEmail, role, refreshRole } = useAuth();
    const loggedInEmail = verifiedEmail || localStorage.getItem('user_email') || user?.email || '';
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
    const [editingReplyText, setEditingReplyText] = useState<string>('');

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    
    const [contactEmail, setContactEmail] = useState(loggedInEmail);

    React.useEffect(() => {
        if (loggedInEmail) {
            setContactEmail(loggedInEmail);
        }
    }, [loggedInEmail]);
    const [issueType, setIssueType] = useState('bug');
    const [kmongNickname, setKmongNickname] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [logFile, setLogFile] = useState<File | null>(null);

    const [tickets, setTickets] = useState<any[]>([]);
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('PlaceDB');

    const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Reply/Thread states
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState<File | null>(null);
    const [replyLog, setReplyLog] = useState<File | null>(null);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    React.useEffect(() => {
        setReplyText('');
        setReplyImage(null);
        setReplyLog(null);
    }, [expandedTicketId]);
    
    // License Verification States
    const [purchasedLicenses, setPurchasedLicenses] = useState<any[]>([]);
    const [selectedLicenseId, setSelectedLicenseId] = useState('');
    const [isCheckingLicenses, setIsCheckingLicenses] = useState(false);

    // Read URL params for auto-filling
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.hash.split('?')[1]);
        const urlEmail = params.get('email');
        const urlLog = params.get('log');
        const urlType = params.get('type');

        if (urlEmail) setContactEmail(urlEmail);
        if (urlLog) setDescription(`[자동 복사된 로그]\n${urlLog}\n\n[증상 상세]\n`);
        if (urlType) setIssueType(urlType);
    }, []);

    // Check license whenever email or nickname changes
    React.useEffect(() => {
        const checkLicenses = async () => {
            if (!contactEmail || !contactEmail.includes('@')) {
                setPurchasedLicenses([]);
                return;
            }

            setIsCheckingLicenses(true);
            try {
                // 1. Try matching via email first
                const { data: emailData, error: emailError } = await supabase
                    .from('licenses')
                    .select('id, product_id, serial_key, buyer_name, contact')
                    .eq('contact', contactEmail.toLowerCase());

                if (emailError) throw emailError;

                if (emailData && emailData.length > 0) {
                    setPurchasedLicenses(emailData);
                    if (emailData.length === 1) {
                        setSelectedLicenseId(emailData[0].id);
                    }
                    setIsCheckingLicenses(false);
                    return;
                }

                // 2. Try matching via Kmong nickname if provided
                if (kmongNickname.trim()) {
                    const { data: nameData, error: nameError } = await supabase
                        .from('licenses')
                        .select('id, product_id, serial_key, buyer_name, contact')
                        .eq('buyer_name', kmongNickname.trim());

                    if (nameError) throw nameError;

                    if (nameData && nameData.length > 0) {
                        setPurchasedLicenses(nameData);
                        if (nameData.length === 1) {
                            setSelectedLicenseId(nameData[0].id);
                        }
                    } else {
                        setPurchasedLicenses([]);
                    }
                } else {
                    setPurchasedLicenses([]);
                }
            } catch (e) {
                console.error("Error verifying licenses:", e);
                setPurchasedLicenses([]);
            } finally {
                setIsCheckingLicenses(false);
            }
        };

        const timer = setTimeout(checkLicenses, 500);
        return () => clearTimeout(timer);
    }, [contactEmail, kmongNickname]);
    


    const fetchTickets = async () => {
        const userEmail = verifiedEmail || localStorage.getItem('user_email') || user?.email;
        if (!user && !userEmail) return;
        
        let query = supabase
            .from('support_tickets')
            .select('*');
        
        if (role !== 'admin') {
            if (userEmail) {
                const uidFilter = user?.id ? `uid.eq.${user.id},` : '';
                query = query.or(`${uidFilter}email.eq.${userEmail.toLowerCase()}`);
            } else if (user?.id) {
                query = query.eq('uid', user.id);
            }
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
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
    }, [user, verifiedEmail, role]);

    // Keep the selected ticket detail view in sync when tickets list updates (e.g. on new reply)
    React.useEffect(() => {
        if (selectedTicketForDetail) {
            const updated = tickets.find(t => t.id === selectedTicketForDetail.id);
            if (updated) {
                setSelectedTicketForDetail(updated);
            }
        }
    }, [tickets]);

    const handleUploadFile = async (file: File, folder: string): Promise<string> => {
        const userId = user?.id || 'guest';
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('support')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('support')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicketForDetail) return;
        
        setIsSavingEdit(true);
        setError('');
        
        try {
            const selectedLic = purchasedLicenses.find(l => l.id === selectedLicenseId);
            let finalDescription = description;

            if (selectedLic) {
                finalDescription = `[문의 제품: ${selectedLic.product_id} (시리얼: ${selectedLic.serial_key})]\n${finalDescription}`;
            } else {
                finalDescription = `[문의 제품: ${selectedProduct}]\n${finalDescription}`;
            }

            if (kmongNickname.trim()) {
                finalDescription = `[수동 구매 인증 요청: 크몽 ID - ${kmongNickname.trim()}]\n${finalDescription}`;
            }

            const { error: updateError } = await supabase
                .from('support_tickets')
                .update({
                    issue_type: issueType,
                    description: finalDescription
                })
                .eq('id', selectedTicketForDetail.id);

            if (updateError) throw updateError;

            // Update local state ticket info
            const updatedTicket = {
                ...selectedTicketForDetail,
                issue_type: issueType,
                description: finalDescription
            };
            setSelectedTicketForDetail(updatedTicket);
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
            
            setIsEditing(false);
            showToast("문의가 수정되었습니다.");
        } catch (err: any) {
            console.error("Error saving edit:", err);
            setError(`수정 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!contactEmail.trim()) {
            setError('답변받을 이메일을 입력해주세요.');
            return;
        }
        
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            let imageUrl = null;
            let logUrl = null;

            if (imageFile) imageUrl = await handleUploadFile(imageFile, 'images');
            if (logFile) logUrl = await handleUploadFile(logFile, 'logs');

            const selectedLic = purchasedLicenses.find(l => l.id === selectedLicenseId);
            let finalDescription = description;

            if (selectedLic) {
                finalDescription = `[문의 제품: ${selectedLic.product_id} (시리얼: ${selectedLic.serial_key})]\n${finalDescription}`;
            } else {
                finalDescription = `[문의 제품: ${selectedProduct}]\n${finalDescription}`;
            }

            if (kmongNickname.trim()) {
                finalDescription = `[수동 구매 인증 요청: 크몽 ID - ${kmongNickname.trim()}]\n${finalDescription}`;
            }

            const { data, error: insertError } = await supabase
                .from('support_tickets')
                .insert([{
                    uid: user?.id || null,
                    email: contactEmail.toLowerCase(),
                    issue_type: issueType,
                    description: finalDescription,
                    image_url: imageUrl,
                    log_url: logUrl,
                    status: 'open'
                }])
                .select();

            if (insertError) throw insertError;

            // 비로그인 사용자도 본인 목록 조회가 되도록 localStorage 갱신
            localStorage.setItem('user_email', contactEmail.toLowerCase());

            // 즉시 목록 갱신
            await fetchTickets();

            // Handle automatic matching / binding
            if (selectedLic) {
                const isKmongMatched = !selectedLic.contact || selectedLic.contact.toLowerCase() !== contactEmail.toLowerCase();
                
                if (isKmongMatched) {
                    await supabase
                        .from('licenses')
                        .update({ contact: contactEmail.toLowerCase() })
                        .eq('id', selectedLic.id);
                }

                // Register standard buyer (instantly approved)
                const buyerName = selectedLic.buyer_name || kmongNickname.trim() || verifiedEmail?.split('@')[0] || 'Unknown';
                await supabase
                    .from('users')
                    .upsert({
                        email: contactEmail.toLowerCase(),
                        role: 'buyer',
                        name: buyerName,
                        channel: 'Kmong',
                        created_at: new Date().toISOString()
                    }, { onConflict: 'email' });
            } else if (kmongNickname.trim()) {
                // Register as pending for manual verification
                await supabase
                    .from('users')
                    .upsert({
                        email: contactEmail.toLowerCase(),
                        role: 'user',
                        name: kmongNickname.trim(),
                        channel: 'Kmong (Pending)',
                        created_at: new Date().toISOString()
                    }, { onConflict: 'email' });
            }

            setSuccess(true);
            showToast("문의가 정상적으로 등록되었습니다.");

            if (refreshRole) {
                await refreshRole();
            }

            if (data && data[0]) {
                setSelectedTicketForDetail(data[0]);
                setIsEditing(false);
            }

            setTimeout(() => {
                setSuccess(false);
                setDescription('');
                setKmongNickname('');
                setSelectedLicenseId('');
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

    const parseThread = (ticket: any): ThreadMessage[] => {
        if (!ticket.reply) return [];
        try {
            const parsed = JSON.parse(ticket.reply);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        } catch (e) {
            // Fail silent
        }
        
        return [{
            id: 'legacy',
            sender: 'admin',
            sender_email: 'admin@3monster.net',
            text: ticket.reply,
            image_url: null,
            log_url: null,
            created_at: ticket.replied_at || ticket.created_at
        }];
    };

    React.useEffect(() => {
        if (selectedTicketForDetail && role !== 'admin') {
            const thread = parseThread(selectedTicketForDetail);
            if (thread.length > 0) {
                const lastMsg = thread[thread.length - 1];
                if (lastMsg && lastMsg.sender === 'admin') {
                    const readId = localStorage.getItem(`read_ticket_${selectedTicketForDetail.id}`);
                    if (readId !== lastMsg.id) {
                        localStorage.setItem(`read_ticket_${selectedTicketForDetail.id}`, lastMsg.id);
                        window.dispatchEvent(new Event('qna-ticket-read'));
                    }
                }
            }
        }
    }, [selectedTicketForDetail, role]);

    const handleSubmitReply = async (ticket: any, nextStatus: 'open' | 'closed') => {
        if (!replyText.trim() && !replyImage && !replyLog) {
            showToast("내용을 입력하거나 파일을 첨부해주세요.", "error");
            return;
        }

        setIsSubmittingReply(true);
        try {
            let imageUrl = null;
            let logUrl = null;

            if (replyImage) imageUrl = await handleUploadFile(replyImage, 'replies/images');
            if (replyLog) logUrl = await handleUploadFile(replyLog, 'replies/logs');

            const currentThread = parseThread(ticket);

            const newMessage: ThreadMessage = {
                id: Date.now().toString(),
                sender: isAdmin ? 'admin' : 'user',
                sender_email: verifiedEmail || user?.email || 'unknown@3monster.net',
                text: replyText,
                image_url: imageUrl,
                log_url: logUrl,
                created_at: new Date().toISOString()
            };

            const updatedThread = [...currentThread, newMessage];
            
            const { data, error: updateError } = await supabase
                .from('support_tickets')
                .update({
                    reply: JSON.stringify(updatedThread),
                    status: nextStatus,
                    replied_at: new Date().toISOString()
                })
                .eq('id', ticket.id)
                .select();

            if (updateError) throw updateError;
            if (!data || data.length === 0) {
                throw new Error("데이터베이스 저장 권한이 없습니다. (RLS 제한)");
            }

            setReplyText('');
            setReplyImage(null);
            setReplyLog(null);
            if (data && data[0]) {
                setSelectedTicketForDetail(data[0]);
            }
            await fetchTickets();
            showToast("댓글이 등록되었습니다.");
        } catch (err: any) {
            console.error("Error submitting reply:", err);
            showToast(`댓글 등록 중 오류가 발생했습니다: ${err.message}`, "error");
        } finally {
            setIsSubmittingReply(false);
        }
    };

        const handleEditReply = async (ticket: any, replyId: string, newText: string) => {
        if (!newText.trim()) {
            showToast("수정할 내용을 입력해주세요.", "error");
            return;
        }

        try {
            const currentThread = parseThread(ticket);
            const updatedThread = currentThread.map(msg => 
                msg.id === replyId ? { ...msg, text: newText } : msg
            );

            const { data, error: updateError } = await supabase
                .from('support_tickets')
                .update({
                    reply: JSON.stringify(updatedThread)
                })
                .eq('id', ticket.id)
                .select();

            if (updateError) throw updateError;
            if (!data || data.length === 0) {
                throw new Error("데이터베이스 저장 권한이 없습니다. (RLS 제한)");
            }

            if (data && data[0]) {
                setSelectedTicketForDetail(data[0]);
            }
            await fetchTickets();
            showToast("댓글이 수정되었습니다.");
            setEditingReplyId(null);
            setEditingReplyText('');
        } catch (err: any) {
            console.error('Error editing reply:', err);
            showToast(`댓글 수정 중 오류가 발생했습니다: ${err.message}`, "error");
        }
    };

    const handleDeleteReply = async (ticket: any, msgId: string) => {
        if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) return;
        
        try {
            const currentThread = parseThread(ticket);
            const updatedThread = currentThread.filter(msg => msg.id !== msgId);
            
            const { data, error: updateError } = await supabase
                .from('support_tickets')
                .update({
                    reply: JSON.stringify(updatedThread),
                    replied_at: new Date().toISOString()
                })
                .eq('id', ticket.id)
                .select();

            if (updateError) throw updateError;
            if (!data || data.length === 0) {
                throw new Error("데이터베이스 저장 권한이 없습니다. (RLS 제한)");
            }
            
            if (data && data[0]) {
                setSelectedTicketForDetail(data[0]);
            }
            await fetchTickets();
            
            showToast("댓글이 삭제되었습니다.");
        } catch (err: any) {
            console.error("Error deleting reply:", err);
            showToast(`댓글 삭제 중 오류가 발생했습니다: ${err.message}`, "error");
        }
    };

    const handleDeleteTicket = async (ticketId: string) => {
        if (!confirm("정말 이 문의를 삭제하시겠습니까?")) return;
        
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', ticketId)
                .select();
                
            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error("삭제 권한이 없거나 이미 삭제된 문의입니다. (RLS 제한)");
            }
            
            showToast("문의가 삭제되었습니다.");
            
            setSelectedTicketForDetail(null);
            setExpandedTicketId(null);
            setIssueType('bug');
            setDescription('');
            setKmongNickname('');
            setSelectedLicenseId('');
            setIsEditing(false);
            
            await fetchTickets();
        } catch (err: any) {
            console.error("Error deleting ticket:", err);
            showToast(`문의 삭제 중 오류가 발생했습니다: ${err.message}`, "error");
        }
    };

    const maskEmail = (email: string) => {
        if (!email) return 'unknown';
        const [userPart, domain] = email.split('@');
        if (!domain) return email;
        const masked = userPart.length > 2 ? userPart.substring(0, 2) + '*'.repeat(userPart.length - 2) : userPart + '*';
        return `${masked}@${domain}`;
    };

    const parseTicketInfo = (ticket: any) => {
        const desc = ticket.description || '';
        const match = desc.match(/\[문의 제품:\s*([^\]\s\()]+)/);
        const product = match ? match[1] : '공통';
        
        let typeLabel = '';
        switch (ticket.issue_type) {
            case 'bug':
                typeLabel = '버그/오류';
                break;
            case 'feature':
                typeLabel = '기능제안';
                break;
            case 'license':
                typeLabel = '라이선스';
                break;
            case 'other':
                typeLabel = '일반문의';
                break;
            default:
                typeLabel = ticket.issue_type || '기타';
        }
        return { product, typeLabel };
    };

    const parseRawDescription = (desc: string) => {
        if (!desc) return '';
        return desc
            .split('\n')
            .filter(line => !line.startsWith('[문의 제품:') && !line.startsWith('[수동 구매 인증 요청:'))
            .join('\n')
            .trim();
    };


    const isAdmin = role === 'admin';
    const userEmail = verifiedEmail || localStorage.getItem('user_email') || user?.email;
    const filteredTickets = tickets.filter(t => {
        // 일반 유저라면 자신의 글만 보임 (이메일 매칭 혹은 UID 매칭)
        const isOwn = 
            (t.email && userEmail && t.email.toLowerCase() === userEmail.toLowerCase()) || 
            (t.uid === user?.id);
        
        // Q&A 형식의 상품 질문글은 고객센터 메인 목록에서 제외시킵니다. (이후 상품 전용 Q&A 섹션에 노출되도록 함)
        const isProductQna = t.issue_type && t.issue_type.startsWith('qna_');
        if (isProductQna) return false;

        if (!isAdmin && !isOwn) return false;

        return (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
               (t.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="w-full bg-transparent py-12 px-4 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-5 pb-10">

            {/* Main Content Layout - 관리자는 목록만 전체 너비, 일반 유저는 2열 (또는 관리자가 티켓을 선택했을 때) */}
            <div className={`grid grid-cols-1 gap-6 items-start ${(!isAdmin || selectedTicketForDetail) ? 'lg:grid-cols-2' : ''}`}>
                
                {/* Left side: 일반 유저는 항상 노출, 관리자는 문의 선택 시 노출 */}
                {(!isAdmin || selectedTicketForDetail) && (
                <div className="space-y-4">
                    <Card className="p-6 bg-white border-2 border-slate-300 shadow-md rounded-2xl transition-all duration-300">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-150">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                {selectedTicketForDetail ? (
                                    <>
                                        <FileText className="w-4 h-4 text-indigo-600" /> 등록된 문의 상세
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 text-indigo-600" /> 새 문의 등록
                                    </>
                                )}
                            </h3>
                            {selectedTicketForDetail && !isEditing && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedTicketForDetail(null);
                                        setExpandedTicketId(null);
                                        setIssueType('bug');
                                        setDescription('');
                                        setKmongNickname('');
                                        setSelectedLicenseId('');
                                        setIsEditing(false);
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                                    title="상세 닫기"
                                >
                                    <X className="w-4.5 h-4.5" />
                                </button>
                            )}
                            {(!selectedTicketForDetail || isEditing) && (
                                <div className="relative min-w-[130px]">
                                    <select
                                        disabled={!!selectedTicketForDetail && !isEditing}
                                        className="w-full h-8 rounded-lg bg-slate-100/70 border border-slate-300 hover:border-slate-400 focus:bg-white pl-2.5 pr-8 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed shadow-sm"
                                        value={issueType}
                                        onChange={e => setIssueType(e.target.value)}
                                    >
                                        <option value="bug">버그/오류 신고</option>
                                        <option value="feature">기능 제안/문의</option>
                                        <option value="license">라이선스 관련</option>
                                        <option value="other">기타</option>
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                                {success && (
                                    <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 p-4 rounded-xl animate-in fade-in zoom-in">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <p className="text-xs font-semibold">접수가 완료되었습니다! 목록에서 확인해 주세요.</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center gap-3 bg-rose-50 text-rose-600 p-4 rounded-xl">
                                        <AlertCircle className="w-5 h-5" />
                                        <p className="text-xs font-semibold">{error}</p>
                                    </div>
                                )}

                            {selectedTicketForDetail && !isEditing ? (
                                <div className="space-y-4 text-left">
                                    {/* Category & Status Headers */}
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">구분</span>
                                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100">
                                                {selectedTicketForDetail.issue_type === 'bug' ? '버그/오류 신고' :
                                                 selectedTicketForDetail.issue_type === 'feature' ? '기능 제안/문의' :
                                                 selectedTicketForDetail.issue_type === 'license' ? '라이선스 관련' : '기타'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">상태</span>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold border",
                                                selectedTicketForDetail.status === 'open' 
                                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            )}>
                                                {selectedTicketForDetail.status === 'open' ? '처리 대기중' : '진행 완료'}
                                            </span>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">등록자 이메일</span>
                                                <span className="text-xs font-bold text-slate-700">
                                                    {selectedTicketForDetail.email}
                                                </span>
                                            </div>
                                            {selectedTicketForDetail.uid && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">UID</span>
                                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        {selectedTicketForDetail.uid}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Raw content viewer preserving newlines */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between pl-0.5 pr-0.5">
                                            <label className="text-[11px] font-bold text-slate-500">문의 내용 (원문)</label>
                                            {(isAdmin || !selectedTicketForDetail.reply || parseThread(selectedTicketForDetail).length === 0) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteTicket(selectedTicketForDetail.id)}
                                                    className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer transition-colors"
                                                    title="문의글 삭제"
                                                >
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                        <div className="w-full bg-slate-100/70 rounded-xl border border-slate-300 p-4 text-xs font-semibold text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[150px] shadow-inner">
                                            {selectedTicketForDetail.description}
                                        </div>
                                    </div>

                                    {/* Attached files */}
                                    {(selectedTicketForDetail.image_url || selectedTicketForDetail.log_url) && (
                                        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-2">
                                            {selectedTicketForDetail.image_url && (
                                                <a href={selectedTicketForDetail.image_url} target="_blank" rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded border border-slate-200 text-[10px] font-semibold transition-all">
                                                    <ImageIcon className="w-3.5 h-3.5" /> 첨부 이미지 보기
                                                </a>
                                            )}
                                            {selectedTicketForDetail.log_url && (
                                                <a href={selectedTicketForDetail.log_url} target="_blank" rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-150 text-slate-600 rounded border border-slate-200 text-[10px] font-semibold transition-all">
                                                    <FileText className="w-3.5 h-3.5" /> 첨부 로그 다운로드
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {/* Buttons for Read-Only mode */}
                                    {!isAdmin && (
                                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                                            <Button 
                                                type="button" 
                                                onClick={() => {
                                                    setSelectedTicketForDetail(null);
                                                    setExpandedTicketId(null);
                                                    setIssueType('bug');
                                                    setDescription('');
                                                    setKmongNickname('');
                                                    setSelectedLicenseId('');
                                                    setIsEditing(false);
                                                }}
                                                className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold text-xs rounded-lg transition-all border border-slate-200 shadow-sm"
                                            >
                                                <Plus className="mr-1 w-3.5 h-3.5" /> 새 문의 작성하기
                                            </Button>
                                            
                                            <Button 
                                                type="button"
                                                onClick={() => setIsEditing(true)}
                                                className="flex-1 h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-sm transition-all duration-200"
                                            >
                                                ✏️ 문의 수정하기
                                            </Button>
                                        </div>
                                    )}

                                    {/* Thread History & Reply Form in left panel */}
                                    <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
                                        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <MessageSquare className="w-4 h-4 text-indigo-500" /> 답변 및 댓글 기록
                                        </h4>
                                        
                                        {/* Thread History */}
                                        {parseThread(selectedTicketForDetail).length > 0 ? (
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-1.5">
                                                {parseThread(selectedTicketForDetail).map((msg) => {
                                                    const isMsgAdmin = msg.sender === 'admin';
                                                    const currentUserEmail = verifiedEmail || user?.email;
                                                    const isMsgOwner = (msg.sender_email && currentUserEmail && msg.sender_email.toLowerCase() === currentUserEmail.toLowerCase()) || (msg.sender === 'admin' && isAdmin);
                                                    return (
                                                        <div 
                                                            key={msg.id} 
                                                            className={cn(
                                                                "flex flex-col max-w-[85%] py-1.5 px-2.5 rounded-lg border transition-all duration-200 text-left",
                                                                isMsgAdmin 
                                                                    ? "bg-emerald-50/40 border-emerald-100/50 ml-auto rounded-tr-none" 
                                                                    : "bg-slate-100/60 border-slate-200/50 mr-auto rounded-tl-none"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2 mb-0.5 justify-between">
                                                                <span className={cn(
                                                                    "text-[10px] font-semibold",
                                                                    isMsgAdmin ? "text-emerald-700" : "text-slate-655"
                                                                )}>
                                                                    {isMsgAdmin ? "🛡️ 관리자" : `👤 ${maskEmail(msg.sender_email)}`}
                                                                </span>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] text-slate-400">
                                                                        {new Date(msg.created_at).toLocaleString()}
                                                                    </span>
                                                                    {isMsgOwner && (
                                                                        editingReplyId === msg.id ? (
                                                                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 ml-1 select-none">
                                                                                수정 중
                                                                            </span>
                                                                        ) : (
                                                                            <div className="flex items-center gap-1.5 ml-1">
                                                                                <button 
                                                                                    onClick={() => {
                                                                                        setEditingReplyId(msg.id);
                                                                                        setEditingReplyText(msg.text);
                                                                                    }}
                                                                                    className="text-[9px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer outline-none focus:outline-none"
                                                                                >
                                                                                    수정
                                                                                </button>
                                                                                <span className="text-[8px] text-slate-350 select-none">|</span>
                                                                                <button 
                                                                                    onClick={() => handleDeleteReply(selectedTicketForDetail, msg.id)}
                                                                                    className="text-[9px] font-bold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer outline-none focus:outline-none"
                                                                                >
                                                                                    삭제
                                                                                </button>
                                                                            </div>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                            
                                                            {editingReplyId === msg.id ? (
                                                                 <div className="mt-2 space-y-2 w-full min-w-[280px]">
                                                                     <textarea
                                                                         value={editingReplyText}
                                                                         onChange={e => setEditingReplyText(e.target.value)}
                                                                         className="w-full min-h-[100px] p-2.5 text-xs rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 bg-white text-slate-800 resize-y font-medium shadow-inner transition-all leading-relaxed"
                                                                         placeholder="답변 내용을 수정하세요..."
                                                                     />
                                                                     <div className="flex justify-end gap-1.5">
                                                                         <button
                                                                             onClick={() => {
                                                                                 setEditingReplyId(null);
                                                                                 setEditingReplyText('');
                                                                             }}
                                                                             className="h-7 px-3 bg-slate-100 hover:bg-slate-200 text-slate-655 rounded-lg text-[10px] font-bold border border-slate-200 transition-all cursor-pointer"
                                                                         >
                                                                             취소
                                                                         </button>
                                                                         <button
                                                                             onClick={() => handleEditReply(selectedTicketForDetail, msg.id, editingReplyText)}
                                                                             className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                                                         >
                                                                             저장
                                                                         </button>
                                                                     </div>
                                                                 </div>
                                                             ) : (
                                                                 <p className={cn(
                                                                     "text-xs font-normal leading-relaxed whitespace-pre-wrap",
                                                                     isMsgAdmin ? "text-emerald-950" : "text-slate-700"
                                                                 )}>
                                                                     {msg.text}
                                                                 </p>
                                                             )}
                                    
                                                            {(msg.image_url || msg.log_url) && (
                                                                <div className="mt-1 pt-1 border-t border-slate-200/30 flex flex-wrap gap-1.5">
                                                                    {msg.image_url && (
                                                                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" 
                                                                           className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-[10px] font-medium transition-all">
                                                                            <ImageIcon className="w-3 h-3 text-slate-400" /> 스크린샷 보기
                                                                        </a>
                                                                    )}
                                                                    {msg.log_url && (
                                                                        <a href={msg.log_url} target="_blank" rel="noopener noreferrer" 
                                                                           className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded text-[10px] font-medium transition-all">
                                                                            <FileText className="w-3 h-3 text-slate-400" /> 로그 보기
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null}

                                        {/* Comment / Reply Form */}
                                        {(() => {
                                            const adminReplies = parseThread(selectedTicketForDetail).filter(msg => msg.sender === 'admin');
                                            const isDisabledReply = !isAdmin && adminReplies.length === 0;

                                            return (
                                                <div className="space-y-1.5 pt-2.5 border-t border-slate-150">
                                                    <div className="relative">
                                                        <textarea
                                                            disabled={isDisabledReply}
                                                            placeholder={isDisabledReply ? "답변 대기 중에는 추가 문의(댓글)를 작성할 수 없습니다." : "추가 문의사항이나 답변을 입력해주세요..."}
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            className="w-full min-h-[70px] rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white p-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-400 text-slate-800 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                                                        />
                                                    </div>

                                                    {/* Attachment status inside input form */}
                                                    {!isDisabledReply && (
                                                        <div className="flex flex-wrap gap-2">
                                                            <div className="relative group">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={e => setReplyImage(e.target.files?.[0] || null)}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                />
                                                                <div className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-indigo-50/20 border border-slate-300 hover:border-indigo-300 flex items-center transition-all cursor-pointer shadow-sm">
                                                                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 mr-1.5 group-hover:text-indigo-500 transition-colors" />
                                                                    <span className="text-[10px] font-medium text-slate-500 group-hover:text-indigo-700 transition-colors truncate max-w-[120px]">
                                                                        {replyImage ? replyImage.name : '사진 첨부'}
                                                                    </span>
                                                                    {replyImage && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyImage(null); }}
                                                                            className="ml-1.5 text-slate-400 hover:text-rose-500 font-semibold text-[10px] z-20"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="relative group">
                                                                <input
                                                                    type="file"
                                                                    accept=".log,.txt"
                                                                    onChange={e => setReplyLog(e.target.files?.[0] || null)}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                />
                                                                <div className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-indigo-50/20 border border-slate-300 hover:border-indigo-300 flex items-center transition-all cursor-pointer shadow-sm">
                                                                    <FileText className="w-3.5 h-3.5 text-slate-400 mr-1.5 group-hover:text-indigo-500 transition-colors" />
                                                                    <span className="text-[10px] font-semibold text-slate-500 group-hover:text-indigo-700 transition-colors truncate max-w-[120px]">
                                                                        {replyLog ? replyLog.name : '로그 첨부'}
                                                                    </span>
                                                                    {replyLog && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyLog(null); }}
                                                                            className="ml-1.5 text-slate-400 hover:text-rose-500 font-semibold text-[10px] z-20"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-end gap-2 pt-1.5">
                                                        {isAdmin ? (
                                                            <Button 
                                                                onClick={() => handleSubmitReply(selectedTicketForDetail, 'closed')}
                                                                isLoading={isSubmittingReply}
                                                                disabled={!replyText.trim() && !replyImage && !replyLog}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-5 h-8 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                등록
                                                            </Button>
                                                        ) : (
                                                            <Button 
                                                                onClick={() => handleSubmitReply(selectedTicketForDetail, 'open')}
                                                                isLoading={isSubmittingReply}
                                                                disabled={isDisabledReply || (!replyText.trim() && !replyImage && !replyLog)}
                                                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 border border-indigo-200 rounded-lg px-5 h-8 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                댓글 등록하기
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={isEditing ? handleSaveEdit : handleSubmit} className="space-y-3.5 text-left">
                                    
                                    {/* 이메일 기반 라이선스 인증 상태 헤더 표시 */}
                                    <div className="flex items-center justify-between bg-slate-50 border border-slate-150 rounded-lg px-3 py-1.5 text-[11px]">
                                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                            인증 ID: <span className="text-slate-800 font-bold">{contactEmail}</span>
                                        </div>
                                        {!isCheckingLicenses && purchasedLicenses.length > 0 && (
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                                구매 고객 (제품 {purchasedLicenses.length}개)
                                            </span>
                                        )}
                                        {!isCheckingLicenses && purchasedLicenses.length === 0 && (
                                            <span className="text-[10px] font-medium text-slate-400 italic">
                                                일반/체험판 사용자
                                            </span>
                                        )}
                                        {isCheckingLicenses && (
                                            <span className="text-[10px] font-medium text-slate-400 animate-pulse">
                                                라이선스 조회중...
                                            </span>
                                        )}
                                    </div>

                                    {/* 라이선스 보유 여부에 따른 2단 배치 분기 */}
                                    {purchasedLicenses.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-slate-500 pl-0.5">
                                                문의 대상 제품 (보유 라이선스) <span className="text-indigo-500 font-semibold">*필수</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    disabled={!!selectedTicketForDetail && !isEditing}
                                                    required
                                                    className="w-full h-9 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white px-3 pr-8 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                                    value={selectedLicenseId}
                                                    onChange={e => {
                                                        setSelectedLicenseId(e.target.value);
                                                        const lic = purchasedLicenses.find(l => l.id === e.target.value);
                                                        if (lic) setSelectedProduct(lic.product_id);
                                                    }}
                                                >
                                                    <option value="">-- 문의할 보유 라이선스 선택 --</option>
                                                    {purchasedLicenses.map((lic) => (
                                                        <option key={lic.id} value={lic.id}>
                                                            {lic.product_id} ({lic.serial_key ? lic.serial_key.substring(0, 8) + '...' : '시리얼 없음'}) - {lic.buyer_name || '이름 없음'}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-slate-500 pl-0.5">
                                                    크몽 ID (크몽 계정) <span className="text-indigo-500 font-semibold">*2차 매칭용</span>
                                                </label>
                                                <Input
                                                    disabled={!!selectedTicketForDetail && !isEditing}
                                                    placeholder="수동 구매인증용 크몽 ID"
                                                    value={kmongNickname}
                                                    onChange={e => setKmongNickname(e.target.value)}
                                                    className="h-9 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-slate-500 pl-0.5">
                                                    문의 대상 제품 <span className="text-indigo-500 font-semibold">*필수</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        disabled={!!selectedTicketForDetail && !isEditing}
                                                        required
                                                        className="w-full h-9 rounded-lg bg-slate-100/70 border border-slate-300 hover:border-slate-400 focus:bg-white px-3 pr-8 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-150 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                                        value={selectedProduct}
                                                        onChange={e => setSelectedProduct(e.target.value)}
                                                    >
                                                        <option value="PlaceDB">PlaceDB (플레이스디비)</option>
                                                        <option value="CafeMonster">Cafe Monster (카페몬스터)</option>
                                                        <option value="AppMonster">App Monster (앱몬스터)</option>
                                                        <option value="MarketingMonster">Marketing Monster (마케팅몬스터)</option>
                                                        <option value="Other">기타 / 공통 문의</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 크몽 닉네임 입력했으나 라이선스 미매칭 시의 경고 메시지 */}
                                    {purchasedLicenses.length === 0 && kmongNickname.trim() && !isCheckingLicenses && (
                                        <p className="text-[10px] text-amber-600 font-medium mt-1 ml-0.5 leading-relaxed bg-amber-50/50 border border-amber-100 px-2 py-1 rounded animate-in fade-in duration-200">
                                            ⚠️ 수동 연동 신청: 관리자가 확인 후 구매 정보와 이메일을 매칭해 드립니다.
                                        </p>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between px-0.5">
                                            <label className="text-[11px] font-bold text-slate-500 pl-0.5">상세 증상 및 내용</label>
                                        </div>
                                        <textarea
                                            disabled={!!selectedTicketForDetail && !isEditing}
                                            required
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="문제 상황이나 증상을 최대한 자세히 적어주세요."
                                            className="w-full min-h-[130px] rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-350 focus:bg-white p-3 text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all resize-none shadow-sm disabled:opacity-85 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* 상세조회 모드 시 첨부파일 다운로드 영역 */}
                                    {selectedTicketForDetail && (selectedTicketForDetail.image_url || selectedTicketForDetail.log_url) && (
                                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2 animate-in fade-in duration-200">
                                            {selectedTicketForDetail.image_url && (
                                                <a href={selectedTicketForDetail.image_url} target="_blank" rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded border border-slate-200 text-[10px] font-semibold transition-all">
                                                    <ImageIcon className="w-3 h-3" /> 첨부 이미지 보기
                                                </a>
                                            )}
                                            {selectedTicketForDetail.log_url && (
                                                <a href={selectedTicketForDetail.log_url} target="_blank" rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-150 text-slate-600 rounded border border-slate-200 text-[10px] font-semibold transition-all">
                                                    <FileText className="w-3 h-3" /> 첨부 로그 다운로드
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {!selectedTicketForDetail ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-2.5">
                                                <div className="relative group">
                                                    {imageFile ? (
                                                        <div className="h-9 w-full rounded-lg bg-indigo-50/20 border border-indigo-200 flex items-center justify-between px-2.5 transition-all">
                                                            <div className="flex items-center min-w-0 flex-1 mr-1">
                                                                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 mr-1.5 flex-shrink-0" />
                                                                <span className="text-[10px] font-semibold text-indigo-700 truncate">
                                                                    {imageFile.name}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageFile(null); }}
                                                                className="text-slate-400 hover:text-rose-500 font-bold text-[10px] p-1 z-20 relative"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e => setImageFile(e.target.files?.[0] || null)}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            <div className="h-9 w-full rounded-lg bg-slate-50 flex items-center px-2.5 border border-dashed border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/10 transition-all cursor-pointer">
                                                                <ImageIcon className="w-3.5 h-3.5 text-slate-400 mr-1.5 group-hover:text-indigo-500 transition-colors" />
                                                                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-indigo-700 transition-colors truncate">
                                                                    이미지 첨부 (스샷 권장)
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="relative group">
                                                    {logFile ? (
                                                        <div className="h-9 w-full rounded-lg bg-indigo-50/20 border border-indigo-200 flex items-center justify-between px-2.5 transition-all">
                                                            <div className="flex items-center min-w-0 flex-1 mr-1">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-600 mr-1.5 flex-shrink-0" />
                                                                <span className="text-[10px] font-semibold text-indigo-700 truncate">
                                                                    {logFile.name}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogFile(null); }}
                                                                className="text-slate-400 hover:text-rose-500 font-bold text-[10px] p-1 z-20 relative"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input
                                                                type="file"
                                                                accept=".log,.txt"
                                                                onChange={e => setLogFile(e.target.files?.[0] || null)}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            />
                                                            <div className="h-9 w-full rounded-lg bg-slate-50 flex items-center px-2.5 border border-dashed border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/10 transition-all cursor-pointer">
                                                                <FileText className="w-3.5 h-3.5 text-slate-400 mr-1.5 group-hover:text-indigo-500 transition-colors" />
                                                                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-indigo-700 transition-colors truncate">
                                                                    로그 파일 첨부
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <Button 
                                                type="submit" 
                                                className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all duration-200" 
                                                isLoading={loading}
                                            >
                                                <UploadCloud className="mr-1 w-4 h-4" /> 문의 등록하기
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button 
                                                type="button"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    if (selectedTicketForDetail) {
                                                        setIssueType(selectedTicketForDetail.issue_type || 'bug');
                                                        const rawDesc = selectedTicketForDetail.description ? parseRawDescription(selectedTicketForDetail.description) : '';
                                                        setDescription(rawDesc);
                                                    }
                                                }}
                                                className="flex-1 h-9 bg-slate-100 hover:bg-slate-200 text-slate-650 border border-slate-200 rounded-lg px-4 text-xs font-semibold"
                                            >
                                                취소
                                            </Button>
                                            <Button 
                                                type="submit"
                                                isLoading={isSavingEdit}
                                                className="flex-1 h-9 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold shadow-sm transition-all duration-200"
                                            >
                                                수정 완료
                                            </Button>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </Card>
                </div>
                )}

                {/* Right side: Ticket List */}
                <div className="space-y-4">

                    {/* 관리자 전용 요약 배너 */}
                    {isAdmin && (
                        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                                        <Shield className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-indigo-800">관리자 모드</p>
                                        <p className="text-[10px] text-indigo-500 font-medium">전체 고객 문의를 관리하고 있습니다.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-right">
                                    <div>
                                        <p className="text-lg font-black text-indigo-700">{tickets.filter(t => !t.issue_type?.startsWith('qna_')).length}</p>
                                        <p className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide">전체</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-black text-rose-600">
                                            {tickets.filter(t => !t.issue_type?.startsWith('qna_') && t.status !== 'closed').length}
                                        </p>
                                        <p className="text-[9px] font-semibold text-rose-400 uppercase tracking-wide">미처리</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* List View Main */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="이메일이나 내용으로 검색..."
                                className="h-9 pl-9 bg-slate-55 border border-slate-200 hover:border-slate-300 focus:bg-white shadow-sm rounded-lg text-xs font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid gap-3">
                        {filteredTickets.length === 0 ? (
                            <Card className="p-8 text-center bg-white border border-slate-200 shadow-sm rounded-xl">
                                <p className="text-slate-400 font-semibold text-xs">등록된 문의 내역이 없습니다.</p>
                            </Card>
                        ) : (
                            filteredTickets.map((ticket, index) => {
                                // Check ownership by verified email first, fallback to UID
                                const isOwn = 
                                    (ticket.email && verifiedEmail && ticket.email.toLowerCase() === verifiedEmail.toLowerCase()) || 
                                    (ticket.uid === user?.id);
                                    
                                const isExpanded = expandedTicketId === ticket.id;
                                const canViewDetail = isAdmin || isOwn;

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={ticket.id}
                                    >
                                        <Card className={cn(
                                            "relative overflow-hidden bg-white border border-slate-200 shadow-sm hover:shadow transition-all duration-200 rounded-lg",
                                            isExpanded && "border-slate-300 ring-1 ring-slate-100"
                                        )}>
                                            {/* Left Status Bar Indicator */}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-0.5",
                                                ticket.status === 'open' ? "bg-rose-500" : "bg-emerald-500"
                                            )} />
                                            <div 
                                                className={cn(
                                                    "flex items-center justify-between p-1.5 px-3 cursor-pointer group select-none transition-colors",
                                                    isExpanded ? "bg-slate-50/60" : "bg-white hover:bg-slate-50/30"
                                                )}
                                                onClick={() => {
                                                    if (canViewDetail) {
                                                        const nextExpanded = !isExpanded;
                                                        setExpandedTicketId(nextExpanded ? ticket.id : null);
                                                        setSelectedTicketForDetail(nextExpanded ? ticket : null);
                                                        if (nextExpanded) {
                                                            setIsEditing(false);
                                                            setIssueType(ticket.issue_type || 'bug');
                                                            
                                                            const rawDesc = ticket.description ? parseRawDescription(ticket.description) : '';
                                                            setDescription(rawDesc);
                                                            
                                                            const matchProd = ticket.description?.match(/\[문의 제품:\s*([^\]\s\()]+)/);
                                                            if (matchProd && matchProd[1]) {
                                                                setSelectedProduct(matchProd[1]);
                                                            } else {
                                                                setSelectedProduct('PlaceDB');
                                                            }

                                                            const matchKmong = ticket.description?.match(/\[수동 구매 인증 요청: 크몽 (?:닉네임|ID) - (.*?)\]/);
                                                            if (matchKmong && matchKmong[1]) {
                                                                setKmongNickname(matchKmong[1]);
                                                            } else {
                                                                setKmongNickname('');
                                                            }

                                                            const matchSerial = ticket.description?.match(/\(시리얼:\s*([^\)]+)\)/);
                                                            if (matchSerial && matchSerial[1]) {
                                                                const lic = purchasedLicenses.find(l => l.serial_key === matchSerial[1]);
                                                                if (lic) {
                                                                    setSelectedLicenseId(lic.id);
                                                                }
                                                            } else {
                                                                setSelectedLicenseId('');
                                                            }

                                                            
                                                        } else {
                                                            setIsEditing(false);
                                                            setIssueType('bug');
                                                            setDescription('');
                                                            setKmongNickname('');
                                                            setSelectedLicenseId('');
                                                        }
                                                    }
                                                }}
                                            >
                                                 <div className="flex items-center gap-2">
                                                     <span className={cn(
                                                         "w-1.5 h-1.5 rounded-full",
                                                         ticket.status === 'open' ? "bg-rose-500" : "bg-emerald-500"
                                                     )} title={ticket.status === 'open' ? '처리 대기중' : '진행 완료'} />
                                                     
                                                     <span className="text-slate-800 font-bold text-xs flex items-center gap-1.5">
                                                         <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-indigo-100/40">
                                                             {parseTicketInfo(ticket).product}
                                                         </span>
                                                         <span className="text-slate-700 font-bold">
                                                             {parseTicketInfo(ticket).typeLabel}
                                                         </span>
                                                     </span>
                                                 </div>
                                                 
                                                 <div className="flex items-center gap-2.5">
                                                     <span className="text-[11px] text-slate-700 font-bold">
                                                         {ticket.created_at 
                                                             ? (() => {
                                                                 const d = new Date(ticket.created_at);
                                                                 const pad = (n: number) => String(n).padStart(2, '0');
                                                                 return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                                                               })()
                                                             : 'N/A'
                                                         }
                                                     </span>
                                                 </div>
                                            </div>
                                            
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    
            {toast && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-300">
                    {toast.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                    )}
                    {toast.message}
                </div>
            )}
</div>
                </div>
            </div>
        </div>
    </div>
    );
};
