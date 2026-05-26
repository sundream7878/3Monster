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
    Plus,
    Search
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
    const [answerExpandedMap, setAnswerExpandedMap] = useState<Record<string, boolean>>({});

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
                finalDescription = `[수동 구매 인증 요청: 크몽 닉네임 - ${kmongNickname.trim()}]\n${finalDescription}`;
            }

            const { error: insertError } = await supabase
                .from('support_tickets')
                .insert([{
                    uid: user?.id || null,
                    email: contactEmail.toLowerCase(),
                    issue_type: issueType,
                    description: finalDescription,
                    image_url: imageUrl,
                    log_url: logUrl,
                    status: 'open'
                }]);

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
                    .from('buyers')
                    .upsert({
                        email: contactEmail.toLowerCase(),
                        name: buyerName,
                        channel: 'Kmong',
                        created_at: new Date().toISOString()
                    }, { onConflict: 'email' });
            } else if (kmongNickname.trim()) {
                // Register as pending for manual verification
                await supabase
                    .from('buyers')
                    .upsert({
                        email: contactEmail.toLowerCase(),
                        name: kmongNickname.trim(),
                        channel: 'Kmong (Pending)',
                        created_at: new Date().toISOString()
                    }, { onConflict: 'email' });
            }

            setSuccess(true);

            if (refreshRole) {
                await refreshRole();
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

    const handleSubmitReply = async (ticket: any, nextStatus: 'open' | 'closed') => {
        if (!replyText.trim() && !replyImage && !replyLog) {
            alert("내용을 입력하거나 파일을 첨부해주세요.");
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
            
            const { error: updateError } = await supabase
                .from('support_tickets')
                .update({
                    reply: JSON.stringify(updatedThread),
                    status: nextStatus,
                    replied_at: new Date().toISOString()
                })
                .eq('id', ticket.id);

            if (updateError) throw updateError;

            setReplyText('');
            setReplyImage(null);
            setReplyLog(null);
            await fetchTickets();
            
            alert("댓글이 등록되었습니다.");
        } catch (err: any) {
            console.error("Error submitting reply:", err);
            alert(`댓글 등록 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setIsSubmittingReply(false);
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
        <div className="w-full bg-gradient-to-br from-indigo-100/80 via-slate-200/90 to-purple-100/70 py-12 px-4 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header Section */}
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    {role === 'admin' ? '고객센터 관리' : (user && verifiedEmail ? '내 문의/답변' : '고객센터/문의')}
                </h1>
                <p className="text-slate-400 font-bold">
                    {role === 'admin' ? '전체 고객 문의 리스트 및 관리 화면입니다.' : '3Monster 서비스 이용 문의 및 버그 제보 게시판입니다.'}
                </p>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Left side: Inquiry Form */}
                <div className="space-y-6">
                    <Card className="p-6 bg-white border border-slate-300 shadow-[0_20px_50px_rgba(15,23,42,0.08)] hover:shadow-[0_25px_60px_rgba(15,23,42,0.12)] rounded-[2rem] transition-all duration-300">
                        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200">
                            <h3 className="text-lg font-black bg-gradient-to-r from-slate-900 to-indigo-950 bg-clip-text text-transparent flex items-center gap-1.5">
                                {selectedTicketForDetail ? (
                                    <>
                                        <FileText className="w-4.5 h-4.5 text-indigo-600" /> 등록된 문의 상세
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4.5 h-4.5 text-indigo-600" /> 새 문의 등록
                                    </>
                                )}
                            </h3>
                            <div className="relative min-w-[130px]">
                                <select
                                    disabled={!!selectedTicketForDetail}
                                    className="w-full h-8.5 rounded-xl bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white pl-3 pr-8 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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
                        </div>

                        <div className="space-y-4">
                                {success && (
                                    <div className="flex items-center gap-4 bg-emerald-50 text-emerald-600 p-5 rounded-2xl animate-in fade-in zoom-in">
                                        <CheckCircle2 className="w-7 h-7" />
                                        <p className="font-black">접수가 완료되었습니다! 목록에서 확인해 주세요.</p>
                                    </div>
                                )}
                                {error && (
                                    <div className="flex items-center gap-4 bg-rose-50 text-rose-600 p-5 rounded-2xl">
                                        <AlertCircle className="w-7 h-7" />
                                        <p className="font-black">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                    
                                    {/* 이메일 기반 라이선스 인증 상태 헤더 표시 */}
                                    <div className="flex items-center justify-between bg-slate-100/70 border border-slate-200 rounded-xl px-4 py-2.5 text-xs">
                                        <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                            인증 ID: <span className="text-slate-800 font-black">{contactEmail}</span>
                                        </div>
                                        {!isCheckingLicenses && purchasedLicenses.length > 0 && (
                                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                구매 고객 (제품 {purchasedLicenses.length}개)
                                            </span>
                                        )}
                                        {!isCheckingLicenses && purchasedLicenses.length === 0 && (
                                            <span className="text-[10px] font-bold text-slate-500 italic">
                                                일반/체험판 사용자
                                            </span>
                                        )}
                                        {isCheckingLicenses && (
                                            <span className="text-[10px] font-bold text-slate-400 animate-pulse">
                                                라이선스 조회중...
                                            </span>
                                        )}
                                    </div>

                                    {/* 라이선스 보유 여부에 따른 2단 배치 분기 */}
                                    {purchasedLicenses.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider pl-1">
                                                문의 대상 제품 (보유 라이선스) <span className="text-indigo-500 font-bold">*필수</span>
                                            </label>
                                            <div className="relative">
                                                <select
                                                    disabled={!!selectedTicketForDetail}
                                                    required
                                                    className="w-full h-11 rounded-xl bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white px-4 pr-10 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-100/50 focus:border-emerald-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
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
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider pl-1">
                                                    크몽 닉네임 <span className="text-indigo-500 font-bold">*2차 매칭용</span>
                                                </label>
                                                <Input
                                                    disabled={!!selectedTicketForDetail}
                                                    placeholder="수동 구매인증용 닉네임"
                                                    value={kmongNickname}
                                                    onChange={e => setKmongNickname(e.target.value)}
                                                    className="h-11 bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all shadow-inner disabled:opacity-75 disabled:cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-black text-slate-600 uppercase tracking-wider pl-1">
                                                    문의 대상 제품 <span className="text-indigo-500 font-bold">*필수</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        disabled={!!selectedTicketForDetail}
                                                        required
                                                        className="w-full h-11 rounded-xl bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white px-4 pr-10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                                        value={selectedProduct}
                                                        onChange={e => setSelectedProduct(e.target.value)}
                                                    >
                                                        <option value="PlaceDB">PlaceDB (플레이스디비)</option>
                                                        <option value="CafeMonster">Cafe Monster (카페몬스터)</option>
                                                        <option value="AppMonster">App Monster (앱몬스터)</option>
                                                        <option value="MarketingMonster">Marketing Monster (마케팅몬스터)</option>
                                                        <option value="Other">기타 / 공통 문의</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 크몽 닉네임 입력했으나 라이선스 미매칭 시의 경고 메시지 */}
                                    {purchasedLicenses.length === 0 && kmongNickname.trim() && !isCheckingLicenses && (
                                        <p className="text-[10px] text-amber-600 font-bold mt-1 ml-1 leading-relaxed bg-amber-50/50 border border-amber-100 px-2 py-1.5 rounded-lg animate-in fade-in duration-200">
                                            ⚠️ 수동 연동 신청: 관리자가 확인 후 구매 정보와 이메일을 매칭해 드립니다.
                                        </p>
                                    )}

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between px-1">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-wider pl-1">상세 증상 및 내용</label>
                                        </div>
                                        <textarea
                                            disabled={!!selectedTicketForDetail}
                                            required
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="문제 상황이나 증상을 최대한 자세히 적어주세요."
                                            className="w-full min-h-[160px] rounded-xl bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white p-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all resize-none shadow-inner disabled:opacity-85 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    {/* 상세조회 모드 시 첨부파일 다운로드 영역 */}
                                    {selectedTicketForDetail && (selectedTicketForDetail.image_url || selectedTicketForDetail.log_url) && (
                                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 flex flex-wrap gap-2 animate-in fade-in duration-200">
                                            {selectedTicketForDetail.image_url && (
                                                <a href={selectedTicketForDetail.image_url} target="_blank" rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg text-[11px] font-black transition-all border border-slate-300 shadow-sm">
                                                    <ImageIcon className="w-3.5 h-3.5" /> 첨부 이미지 보기
                                                </a>
                                            )}
                                            {selectedTicketForDetail.log_url && (
                                                <a href={selectedTicketForDetail.log_url} target="_blank" rel="noopener noreferrer" 
                                                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-black transition-all border border-slate-300 shadow-sm">
                                                    <FileText className="w-3.5 h-3.5" /> 첨부 로그 다운로드
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    {!selectedTicketForDetail ? (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative group">
                                                    {imageFile ? (
                                                        <div className="h-11 w-full rounded-xl bg-indigo-50/30 border border-indigo-200 flex items-center justify-between px-3 transition-all">
                                                            <div className="flex items-center min-w-0 flex-1 mr-1.5">
                                                                <ImageIcon className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                                                                <span className="text-[11px] font-black text-indigo-700 truncate">
                                                                    {imageFile.name}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageFile(null); }}
                                                                className="text-slate-400 hover:text-rose-500 font-black text-xs p-1 z-20 relative"
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
                                                            <div className="h-11 w-full rounded-xl bg-slate-100/90 flex items-center px-3 border border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/20 transition-all shadow-sm cursor-pointer">
                                                                <ImageIcon className="w-4 h-4 text-slate-400 mr-2 group-hover:text-indigo-500 transition-colors" />
                                                                <span className="text-[11px] font-black text-slate-500 group-hover:text-indigo-700 transition-colors truncate">
                                                                    이미지 첨부 (스샷 권장)
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="relative group">
                                                    {logFile ? (
                                                        <div className="h-11 w-full rounded-xl bg-indigo-50/30 border border-indigo-200 flex items-center justify-between px-3 transition-all">
                                                            <div className="flex items-center min-w-0 flex-1 mr-1.5">
                                                                <FileText className="w-4 h-4 text-indigo-600 mr-2 flex-shrink-0" />
                                                                <span className="text-[11px] font-black text-indigo-700 truncate">
                                                                    {logFile.name}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLogFile(null); }}
                                                                className="text-slate-400 hover:text-rose-500 font-black text-xs p-1 z-20 relative"
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
                                                            <div className="h-11 w-full rounded-xl bg-slate-100/90 flex items-center px-3 border border-dashed border-slate-300 group-hover:border-indigo-400 group-hover:bg-indigo-50/20 transition-all shadow-sm cursor-pointer">
                                                                <FileText className="w-4 h-4 text-slate-400 mr-2 group-hover:text-indigo-500 transition-colors" />
                                                                <span className="text-[11px] font-black text-slate-500 group-hover:text-indigo-700 transition-colors truncate">
                                                                    로그 파일 첨부
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <Button 
                                                type="submit" 
                                                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-sm rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.2)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300" 
                                                isLoading={loading}
                                            >
                                                <UploadCloud className="mr-1.5 w-4.5 h-4.5" /> 문의 등록하기
                                            </Button>
                                        </>
                                    ) : (
                                        <Button 
                                            type="button" 
                                            onClick={() => {
                                                setSelectedTicketForDetail(null);
                                                setExpandedTicketId(null);
                                                setIssueType('bug');
                                                setDescription('');
                                                setKmongNickname('');
                                                setSelectedLicenseId('');
                                            }}
                                            className="w-full h-11 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-sm rounded-xl transition-all border border-slate-300 hover:shadow-sm"
                                        >
                                            <Plus className="mr-1.5 w-4 h-4" /> 새 문의 작성하기
                                        </Button>
                                    )}
                                </form>
                            </div>
                        </Card>
                    </div>

                {/* Right side: Ticket List */}
                <div className="space-y-6">
                    {/* List View Main */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="이메일이나 내용으로 검색..."
                                className="h-14 pl-14 bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-2xl font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {filteredTickets.length === 0 ? (
                            <Card className="p-12 text-center bg-white border border-slate-300 shadow-[0_20px_50px_rgba(15,23,42,0.08)] rounded-3xl">
                                <p className="text-slate-400 font-bold">등록된 문의 내역이 없습니다.</p>
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
                                            "relative overflow-hidden bg-white border border-slate-300 shadow-[0_12px_40px_rgba(15,23,42,0.04)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 rounded-[2rem]",
                                            isExpanded && "ring-2 ring-indigo-500/10 border-indigo-200"
                                        )}>
                                            {/* Left Status Bar Indicator */}
                                            <div className={cn(
                                                "absolute left-0 top-0 bottom-0 w-1.5",
                                                ticket.status === 'open' ? "bg-indigo-500" : "bg-emerald-500"
                                            )} />
                                            <div 
                                                className={cn(
                                                    "flex items-center justify-between p-6 pl-8 cursor-pointer group",
                                                    isExpanded ? "bg-indigo-50/20" : "bg-white"
                                                )}
                                                onClick={() => {
                                                    if (canViewDetail) {
                                                        const nextExpanded = !isExpanded;
                                                        setExpandedTicketId(nextExpanded ? ticket.id : null);
                                                        setSelectedTicketForDetail(nextExpanded ? ticket : null);
                                                        if (nextExpanded) {
                                                            setIssueType(ticket.issue_type || 'bug');
                                                            setDescription(ticket.description || '');
                                                            
                                                            const matchKmong = ticket.description?.match(/\[수동 구매 인증 요청: 크몽 닉네임 - (.*?)\]/);
                                                            if (matchKmong && matchKmong[1]) {
                                                                setKmongNickname(matchKmong[1]);
                                                            } else {
                                                                setKmongNickname('');
                                                            }
                                                        } else {
                                                            setIssueType('bug');
                                                            setDescription('');
                                                            setKmongNickname('');
                                                        }
                                                    }
                                                }}
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
                                                <div className="px-6 pb-6 pt-2 bg-indigo-50/30">
                                                    <div className="p-6 bg-white rounded-[2rem] shadow-sm border border-indigo-50/55 space-y-6">
                                                        
                                                        {/* 고객센터 답변 (접기/펼치기 가능) */}
                                                        {(() => {
                                                            const adminReplies = parseThread(ticket).filter(msg => msg.sender === 'admin');
                                                            const isAnsExpanded = answerExpandedMap[ticket.id] !== false;
                                                            return (
                                                                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setAnswerExpandedMap(prev => ({
                                                                                ...prev,
                                                                                [ticket.id]: !isAnsExpanded
                                                                            }));
                                                                        }}
                                                                        className="w-full px-5 py-4 flex items-center justify-between bg-white border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                                                                            <CheckCircle2 className="w-4.5 h-4.5" />
                                                                            고객센터 답변 ({adminReplies.length}개)
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {adminReplies.length > 0 && (
                                                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                                                                    답변 완료
                                                                                </span>
                                                                            )}
                                                                            {isAnsExpanded ? (
                                                                                <ChevronUp className="w-4 h-4 text-slate-500" />
                                                                            ) : (
                                                                                <ChevronDown className="w-4 h-4 text-slate-500" />
                                                                            )}
                                                                        </div>
                                                                    </button>

                                                                    {isAnsExpanded && (
                                                                        <div className="p-5 space-y-4 bg-white border-t border-slate-100">
                                                                            {adminReplies.length === 0 ? (
                                                                                <p className="text-slate-450 font-bold text-xs text-center py-4">
                                                                                    아직 등록된 답변이 없습니다. 답변 등록을 기다려 주세요.
                                                                                </p>
                                                                            ) : (
                                                                                adminReplies.map((reply) => (
                                                                                    <div key={reply.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-150 relative space-y-2 text-left animate-in fade-in duration-200">
                                                                                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                                                                            <span className="text-indigo-600 font-black">🛡️ 관리자 답변</span>
                                                                                            <span>{new Date(reply.created_at).toLocaleString()}</span>
                                                                                        </div>
                                                                                        <p className="text-xs font-semibold text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                                                            {reply.text}
                                                                                        </p>
                                                                                        {(reply.image_url || reply.log_url) && (
                                                                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                                                                                                {reply.image_url && (
                                                                                                    <a href={reply.image_url} target="_blank" rel="noopener noreferrer" 
                                                                                                       className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black transition-all">
                                                                                                        <ImageIcon className="w-3 h-3 text-slate-400" /> 스크린샷 보기
                                                                                                    </a>
                                                                                                )}
                                                                                                {reply.log_url && (
                                                                                                    <a href={reply.log_url} target="_blank" rel="noopener noreferrer" 
                                                                                                       className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-black transition-all">
                                                                                                        <FileText className="w-3 h-3 text-slate-400" /> 로그 다운로드
                                                                                                    </a>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Thread & Reply Section */}
                                                        <div className="pt-6 border-t border-slate-100 space-y-5">
                                                            <div className="flex items-center gap-1.5 text-indigo-600">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                <h3 className="font-black text-sm">대화 기록 및 댓글</h3>
                                                            </div>

                                                            {/* Thread History */}
                                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 flex flex-col">
                                                                {parseThread(ticket).length === 0 ? (
                                                                    <p className="text-slate-500 font-bold text-sm text-center py-6 bg-slate-100/90 rounded-2xl border border-dashed border-slate-300">
                                                                        아직 등록된 댓글이 없습니다. 아래 폼에서 첫 대화를 시작해 보세요!
                                                                    </p>
                                                                ) : (
                                                                    parseThread(ticket).map((msg) => {
                                                                        const isMsgAdmin = msg.sender === 'admin';
                                                                        return (
                                                                            <div 
                                                                                key={msg.id} 
                                                                                className={cn(
                                                                                    "flex flex-col max-w-[85%] p-4 rounded-2xl shadow-sm border transition-all duration-300",
                                                                                    isMsgAdmin 
                                                                                        ? "bg-emerald-50/50 border-emerald-100/50 ml-auto rounded-tr-none" 
                                                                                        : "bg-indigo-50/40 border-indigo-100/30 mr-auto rounded-tl-none"
                                                                                )}
                                                                            >
                                                                                <div className="flex items-center gap-2 mb-2 justify-between">
                                                                                    <span className={cn(
                                                                                        "text-xs font-black",
                                                                                        isMsgAdmin ? "text-emerald-700" : "text-indigo-700"
                                                                                    )}>
                                                                                        {isMsgAdmin ? "🛡️ 관리자" : `👤 ${maskEmail(msg.sender_email)}`}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                                        {new Date(msg.created_at).toLocaleString()}
                                                                                    </span>
                                                                                </div>
                                                                                
                                                                                <p className={cn(
                                                                                    "text-sm font-semibold leading-relaxed whitespace-pre-wrap",
                                                                                    isMsgAdmin ? "text-emerald-900" : "text-slate-700"
                                                                                )}>
                                                                                    {msg.text}
                                                                                </p>

                                                                                {/* Uploaded attachments in reply */}
                                                                                {(msg.image_url || msg.log_url) && (
                                                                                    <div className="mt-3 pt-3 border-t border-slate-100/50 flex flex-wrap gap-2">
                                                                                        {msg.image_url && (
                                                                                            <a href={msg.image_url} target="_blank" rel="noopener noreferrer" 
                                                                                               className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 rounded-lg text-xs font-black transition-all">
                                                                                                <ImageIcon className="w-3.5 h-3.5 text-slate-500" /> 스크린샷 보기
                                                                                            </a>
                                                                                        )}
                                                                                        {msg.log_url && (
                                                                                            <a href={msg.log_url} target="_blank" rel="noopener noreferrer" 
                                                                                               className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 rounded-lg text-xs font-black transition-all">
                                                                                                <FileText className="w-3.5 h-3.5 text-slate-500" /> 로그 다운로드
                                                                                            </a>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>

                                                            {/* New Message Input Form */}
                                                            <div className="space-y-4 pt-4 border-t border-slate-100/80">
                                                                <div className="relative">
                                                                    <textarea
                                                                        placeholder="추가 문의사항이나 답변을 여기에 입력해주세요..."
                                                                        value={replyText}
                                                                        onChange={(e) => setReplyText(e.target.value)}
                                                                        className="w-full min-h-[100px] rounded-2xl bg-slate-100/90 border border-slate-300 hover:border-slate-400 focus:bg-white p-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100/50 focus:border-indigo-500 transition-all resize-none placeholder:text-slate-450 text-slate-800 shadow-inner"
                                                                    />
                                                                </div>

                                                                {/* Attachment status inside input form */}
                                                                <div className="flex flex-wrap gap-3">
                                                                    <div className="relative group">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={e => setReplyImage(e.target.files?.[0] || null)}
                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                        />
                                                                        <div className="h-10 px-4 rounded-xl bg-slate-100/90 hover:bg-indigo-50/10 border border-slate-300 hover:border-indigo-400 flex items-center transition-all shadow-sm cursor-pointer">
                                                                            <ImageIcon className="w-4 h-4 text-slate-400 mr-2 group-hover:text-indigo-500 transition-colors" />
                                                                            <span className="text-xs font-black text-slate-500 group-hover:text-indigo-700 transition-colors truncate max-w-[150px]">
                                                                                {replyImage ? replyImage.name : '사진 첨부'}
                                                                            </span>
                                                                            {replyImage && (
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyImage(null); }}
                                                                                    className="ml-2 text-slate-400 hover:text-rose-500 font-bold text-xs z-20"
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
                                                                        <div className="h-10 px-4 rounded-xl bg-slate-100/90 hover:bg-indigo-50/10 border border-slate-300 hover:border-indigo-400 flex items-center transition-all shadow-sm cursor-pointer">
                                                                            <FileText className="w-4 h-4 text-slate-400 mr-2 group-hover:text-indigo-500 transition-colors" />
                                                                            <span className="text-xs font-black text-slate-500 group-hover:text-indigo-700 transition-colors truncate max-w-[150px]">
                                                                                {replyLog ? replyLog.name : '로그 파일 첨부'}
                                                                            </span>
                                                                            {replyLog && (
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReplyLog(null); }}
                                                                                    className="ml-2 text-slate-400 hover:text-rose-500 font-bold text-xs z-20"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex justify-end gap-3 pt-2">
                                                                    {isAdmin ? (
                                                                        <>
                                                                            <Button 
                                                                                onClick={() => handleSubmitReply(ticket, 'open')}
                                                                                isLoading={isSubmittingReply}
                                                                                disabled={!replyText.trim() && !replyImage && !replyLog}
                                                                                className="bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-xl px-6 h-12 text-xs font-black transition-all"
                                                                            >
                                                                                댓글 등록 (대기유지)
                                                                            </Button>
                                                                            <Button 
                                                                                onClick={() => handleSubmitReply(ticket, 'closed')}
                                                                                isLoading={isSubmittingReply}
                                                                                disabled={!replyText.trim() && !replyImage && !replyLog}
                                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 h-12 text-xs font-black shadow-lg shadow-emerald-100 transition-all"
                                                                            >
                                                                                답변 완료 및 해결완료 처리
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <Button 
                                                                            onClick={() => handleSubmitReply(ticket, 'open')}
                                                                            isLoading={isSubmittingReply}
                                                                            disabled={!replyText.trim() && !replyImage && !replyLog}
                                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 text-sm font-black shadow-lg shadow-indigo-100 transition-all"
                                                                        >
                                                                            댓글 등록하기
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};
