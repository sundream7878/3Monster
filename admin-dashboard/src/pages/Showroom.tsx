import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
    Layers, 
    Smartphone, 
    Monitor, 
    MessageSquare, 
    ArrowRight,
    ShieldCheck,
    Zap,
    MapPin,
    MessageCircle,
    BellRing,
    ChevronDown,
    ChevronUp,
    FileText,
    Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ThreadMessage {
    id: string;
    sender: 'user' | 'admin';
    sender_email: string;
    text: string;
    image_url?: string | null;
    log_url?: string | null;
    created_at: string;
}

const productCategories = [
    {
        id: 'marketing-monster',
        name: '마케팅 몬스터',
        subtitle: '최고 품질의 타겟 고객 DB를 무제한으로 정밀 추출하는 데이터 수집 라인업',
        products: [
            {
                id: 'nplace-db',
                title: "NPlace-DB Pro",
                subtitle: "네이버 플레이스 정밀 수집기",
                description: "국내 유일의 Apollo State 파싱 엔진 탑재. 이메일, 인스타그램, 블로그 등 마케팅에 필수적인 실시간 플레이스 DB를 광속으로 수집합니다.",
                icon: Layers,
                color: "from-blue-600 to-indigo-700",
                badge: "Best Seller",
                features: ["이메일/인스타 자동 추출", "실시간 중복 필터링", "무제한 Excel/CSV 저장"]
            },
            {
                id: 'place-finder',
                title: "지도 수집기 (Place Finder)",
                subtitle: "지역/업종별 매칭 검색기",
                description: "원하는 지역 and 키워드만 입력하면 네이버 지도의 위치 정보와 업체 정보를 한눈에 분석 가능한 깔끔한 형태로 재가공해 줍니다.",
                icon: MapPin,
                color: "from-blue-400 to-cyan-600",
                badge: "Lightweight",
                features: ["구역별 분할 수집", "영업 시간 및 예약 여부 집계", "초보자용 원버튼 구동"]
            }
        ]
    },
    {
        id: 'cafe-monster',
        name: '카페 몬스터',
        subtitle: '네이버 카페 마케팅 채널 침투 및 소통을 자동화하는 고효율 에이전트',
        products: [
            {
                id: 'cafe-crawler',
                title: "카페 크롤러 Pro",
                subtitle: "전방위 카페 타겟 수집기",
                description: "특정 네이버 카페 내 게시글과 작성자 목록, 실시간 새글 키워드를 추적하여 마케팅 효율을 비약적으로 증가시키는 최강의 파이프라인.",
                icon: Smartphone,
                color: "from-orange-500 to-rose-600",
                badge: "AI Powered",
                features: ["신규 게시글 실시간 알림", "작성자 활동 패턴 통계", "타겟팅 DB 대량 수집"]
            },
            {
                id: 'stealth-comment',
                title: "스텔스 댓글러 (Stealth Commenter)",
                subtitle: "스마트 자동 소통 솔루션",
                description: "봇 탐지 시스템을 우회하는 인간 행동 시뮬레이션 알고리즘을 탑재하여 타겟 글에 자연스러운 상호작용 댓글을 자동 작성합니다.",
                icon: MessageCircle,
                color: "from-pink-500 to-purple-600",
                badge: "Hot",
                features: ["랜덤 휴식 딜레이 시스템", "멀티 계정 순환 구동", "스마트 답변 키워드 룰"]
            }
        ]
    },
    {
        id: 'app-monster',
        name: '앱 몬스터',
        subtitle: '비즈니스의 안정성과 생산성을 향상시키는 고성능 유틸리티 솔루션',
        products: [
            {
                id: 'paper-crawler',
                title: "페이퍼 크롤러 (Paper Crawler)",
                subtitle: "학술 및 전문 데이터 수집기",
                description: "학술지, RISS, DBpia 등 지식 기반 전문 마케팅용 고난도 텍스트 데이터를 정교하게 크롤링하여 요약 파일로 자동 빌드합니다.",
                icon: Monitor,
                color: "from-emerald-500 to-teal-600",
                badge: "Professional",
                features: ["학술 포털 최적화 스크래핑", "핵심 초록 AI 문맥 요약", "구조화된 데이터 추출"]
            },
            {
                id: 'mobile-notifier',
                title: "모바일 알림 몬스터",
                subtitle: "작업 진행 상황 실시간 모니터링",
                description: "구동 중인 모든 수집/발송 엔진의 예외 에러 및 일일 성과 통계를 사용자의 스마트폰 푸시 알림으로 24시간 실시간 전달하는 스마트 앱.",
                icon: BellRing,
                color: "from-amber-500 to-orange-600",
                badge: "New Release",
                features: ["텔레그램/슬랙 알림 동기화", "엔진 원격 중단 신호 감지", "일일 보고서 자동 발송"]
            }
        ]
    }
];

export const Showroom = () => {
    const { user, email: verifiedEmail, role } = useAuth();
    const isAdmin = role === 'admin';

    // Q&A state management
    const [activeQnaProductId, setActiveQnaProductId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    
    // New Question States
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionImage, setNewQuestionImage] = useState<File | null>(null);
    const [newQuestionLog, setNewQuestionLog] = useState<File | null>(null);
    const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);

    // Reply States (Mapped by ticket ID)
    const [replyTextMap, setReplyTextMap] = useState<{[ticketId: string]: string}>({});
    const [replyImageMap, setReplyImageMap] = useState<{[ticketId: string]: File | null}>({});
    const [replyLogMap, setReplyLogMap] = useState<{[ticketId: string]: File | null}>({});
    const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

    // Expanded Q&A thread inside product Q&A list
    const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

    const maskEmail = (email: string) => {
        if (!email) return 'unknown';
        const [userPart, domain] = email.split('@');
        if (!domain) return email;
        const masked = userPart.length > 2 ? userPart.substring(0, 2) + '*'.repeat(userPart.length - 2) : userPart + '*';
        return `${masked}@${domain}`;
    };

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

    const fetchQuestions = async (productId: string) => {
        setLoadingQuestions(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('issue_type', `qna_${productId}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setQuestions(data || []);
        } catch (e) {
            console.error("Error fetching product questions:", e);
        } finally {
            setLoadingQuestions(false);
        }
    };

    // Auto-fetch and real-time subscription when a product's Q&A is opened
    useEffect(() => {
        if (!activeQnaProductId) {
            setQuestions([]);
            return;
        }

        fetchQuestions(activeQnaProductId);

        const channel = supabase
            .channel(`qna-sync-${activeQnaProductId}`)
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'support_tickets',
                filter: `issue_type=eq.qna_${activeQnaProductId}`
            }, () => {
                fetchQuestions(activeQnaProductId);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeQnaProductId]);

    const handleSubmitQuestion = async (productId: string, e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert("로그인 혹은 이메일 인증이 필요합니다.");
            return;
        }
        if (!newQuestionText.trim() && !newQuestionImage && !newQuestionLog) {
            alert("내용을 입력하거나 파일을 첨부해주세요.");
            return;
        }

        setIsSubmittingQuestion(true);
        try {
            let imageUrl = null;
            let logUrl = null;

            if (newQuestionImage) imageUrl = await handleUploadFile(newQuestionImage, 'qna/images');
            if (newQuestionLog) logUrl = await handleUploadFile(newQuestionLog, 'qna/logs');

            const { error: insertError } = await supabase
                .from('support_tickets')
                .insert([{
                    uid: user.id,
                    email: verifiedEmail || user.email || 'unknown@3monster.net',
                    issue_type: `qna_${productId}`,
                    description: newQuestionText,
                    image_url: imageUrl,
                    log_url: logUrl,
                    status: 'open'
                }]);

            if (insertError) throw insertError;

            setNewQuestionText('');
            setNewQuestionImage(null);
            setNewQuestionLog(null);
            await fetchQuestions(productId);
            alert("질문이 등록되었습니다.");
        } catch (err: any) {
            console.error("Error submitting question:", err);
            alert(`질문 등록 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setIsSubmittingQuestion(false);
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
        const replyText = replyTextMap[ticket.id] || '';
        const replyImage = replyImageMap[ticket.id] || null;
        const replyLog = replyLogMap[ticket.id] || null;

        if (!replyText.trim() && !replyImage && !replyLog) {
            alert("댓글 내용을 입력하거나 파일을 첨부해주세요.");
            return;
        }

        setSubmittingReplyId(ticket.id);
        try {
            let imageUrl = null;
            let logUrl = null;

            if (replyImage) imageUrl = await handleUploadFile(replyImage, 'qna/replies/images');
            if (replyLog) logUrl = await handleUploadFile(replyLog, 'qna/replies/logs');

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

            // Clear map states
            setReplyTextMap(prev => ({ ...prev, [ticket.id]: '' }));
            setReplyImageMap(prev => ({ ...prev, [ticket.id]: null }));
            setReplyLogMap(prev => ({ ...prev, [ticket.id]: null }));
            
            if (activeQnaProductId) {
                await fetchQuestions(activeQnaProductId);
            }
            
            alert("댓글이 등록되었습니다.");
        } catch (err: any) {
            console.error("Error submitting reply:", err);
            alert(`댓글 등록 중 오류가 발생했습니다: ${err.message}`);
        } finally {
            setSubmittingReplyId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-20 py-12 px-6">
            {/* Hero Banner Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-12 lg:p-20 text-white shadow-2xl">
                <div className="relative z-10 max-w-3xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black tracking-widest uppercase">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Reliable Marketing Suite
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight">
                        압도적인 마케팅 자동화<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                            3Monster 솔루션
                        </span>
                    </h1>
                    <p className="text-slate-400 font-bold text-base lg:text-lg leading-relaxed max-w-2xl">
                        타겟 고객 DB 수집부터 채널 활성화, 원격 제어까지 비즈니스 성장을 위한 올인원 솔루션을 만나보세요. 3Monster 패밀리 앱은 최고의 성능과 보안성을 보장합니다.
                    </p>

                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                <Zap className="absolute -bottom-16 -right-16 w-80 h-80 text-indigo-500/5 rotate-12" />
            </div>

            {/* Product Category Groups */}
            {productCategories.map((category) => (
                <section 
                    key={category.id} 
                    id={category.id} 
                    className="space-y-8 scroll-mt-24"
                >
                    <div className="border-l-4 border-indigo-600 pl-6 space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{category.name}</h2>
                        <p className="text-slate-500 font-bold text-sm">{category.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {category.products.map((product) => (
                            <Card 
                                key={product.id} 
                                className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-white h-full flex flex-col cursor-pointer"
                                onClick={() => {
                                    if (activeQnaProductId === product.id) {
                                        setActiveQnaProductId(null);
                                        setExpandedQuestionId(null);
                                    } else {
                                        setActiveQnaProductId(product.id);
                                        setExpandedQuestionId(null);
                                    }
                                }}
                            >
                                <div className={`h-3 p-0 w-full bg-gradient-to-r ${product.color}`} />
                                <div className="p-10 space-y-8 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-2">
                                                {product.badge && (
                                                    <span className={cn(
                                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                        "bg-indigo-50 text-indigo-600"
                                                    )}>
                                                        {product.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900">{product.title}</h3>
                                            <p className="text-indigo-600 font-black text-sm">{product.subtitle}</p>
                                        </div>
                                        {product.icon && (
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-700 shrink-0"
                                            )}>
                                                <product.icon className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-slate-500 font-medium text-sm leading-relaxed">
                                        {product.description}
                                    </p>

                                    <div className="grid grid-cols-1 gap-2 pt-2">
                                        {product.features.map(f => (
                                            <div key={f} className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {f}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 mt-auto flex gap-3">
                                        <Button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeQnaProductId === product.id) {
                                                    setActiveQnaProductId(null);
                                                    setExpandedQuestionId(null);
                                                } else {
                                                    setActiveQnaProductId(product.id);
                                                    setExpandedQuestionId(null);
                                                }
                                            }}
                                            variant="outline"
                                            className={cn(
                                                "flex-1 h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-slate-200",
                                                activeQnaProductId === product.id ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-black" : "hover:bg-slate-50 text-slate-700"
                                            )}
                                        >
                                            <MessageSquare className="w-4 h-4" /> 질문/답변보기
                                        </Button>
                                        <Link 
                                            to="/support" 
                                            className="flex-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button className="w-full h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                                                이용 및 도입 문의 <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                
                                {/* Q&A Panel Section */}
                                <AnimatePresence>
                                    {activeQnaProductId === product.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden bg-slate-50/50 border-t border-slate-100 px-10 py-8 space-y-6"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                                                    <MessageSquare className="w-5 h-5 text-indigo-600" /> '{product.title}' 질문/답변 게시판
                                                </h4>
                                            </div>

                                            {/* 1. New Question Registration Form */}
                                            {user ? (
                                                <form onSubmit={(e) => handleSubmitQuestion(product.id, e)} className="space-y-4 bg-white p-5 rounded-2xl border border-indigo-50/50 shadow-sm text-left">
                                                    <p className="text-[10px] font-black text-indigo-500 pl-1 uppercase tracking-wider">🙋‍♂️ 새 질문 등록</p>
                                                    <div className="relative">
                                                        <textarea
                                                            placeholder="제품에 대해 궁금한 점을 적어주세요. 개발진이 직접 답변해 드립니다."
                                                            value={newQuestionText}
                                                            onChange={(e) => setNewQuestionText(e.target.value)}
                                                            className="w-full min-h-[90px] rounded-xl bg-slate-50 p-4 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none placeholder:text-slate-355 text-slate-800"
                                                        />
                                                    </div>

                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex gap-2">
                                                            <div className="relative group">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={e => setNewQuestionImage(e.target.files?.[0] || null)}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                />
                                                                <div className="h-9 px-3 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 flex items-center transition-all">
                                                                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                                                                    <span className="text-[11px] font-black text-slate-500 truncate max-w-[100px]">
                                                                        {newQuestionImage ? newQuestionImage.name : '사진 첨부'}
                                                                    </span>
                                                                    {newQuestionImage && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewQuestionImage(null); }}
                                                                            className="ml-1.5 text-slate-400 hover:text-rose-500 font-bold text-xs z-20"
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
                                                                    onChange={e => setNewQuestionLog(e.target.files?.[0] || null)}
                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                />
                                                                <div className="h-9 px-3 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/60 hover:border-indigo-300 flex items-center transition-all">
                                                                    <FileText className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                                                                    <span className="text-[11px] font-black text-slate-500 truncate max-w-[100px]">
                                                                        {newQuestionLog ? newQuestionLog.name : '로그 첨부'}
                                                                    </span>
                                                                    {newQuestionLog && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNewQuestionLog(null); }}
                                                                            className="ml-1.5 text-slate-400 hover:text-rose-500 font-bold text-xs z-20"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            type="submit" 
                                                            isLoading={isSubmittingQuestion}
                                                            className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-100 transition-all"
                                                        >
                                                            질문 등록하기
                                                        </Button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                                                    <p className="text-xs text-indigo-900 font-bold">🙋‍♂️ 이 제품에 대해 궁금한 점을 질문하고 답변을 확인해 보세요!</p>
                                                    <Link to="/support">
                                                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl h-10 px-5 shadow-lg shadow-indigo-100">
                                                            이메일 인증/로그인하기
                                                        </Button>
                                                    </Link>
                                                </div>
                                            )}

                                            {/* 2. Questions List & Threads */}
                                            <div className="space-y-3 text-left">
                                                {loadingQuestions ? (
                                                    <p className="text-xs font-bold text-slate-400 text-center py-6 animate-pulse">질문을 불러오는 중...</p>
                                                ) : questions.length === 0 ? (
                                                    <p className="text-xs font-bold text-slate-400 text-center py-8 bg-white rounded-2xl border border-slate-100">
                                                        등록된 질문이 없습니다. 첫 질문을 남겨보세요!
                                                    </p>
                                                ) : (
                                                    questions.map((q) => {
                                                        const isQExpanded = expandedQuestionId === q.id;
                                                        const thread = parseThread(q);
                                                        const isQOwner = q.uid === user?.id || (q.email && verifiedEmail && q.email.toLowerCase() === verifiedEmail.toLowerCase());
                                                        const canReply = isQOwner || isAdmin;

                                                        return (
                                                            <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                                                {/* Question Header (Click to expand) */}
                                                                <div 
                                                                    onClick={() => setExpandedQuestionId(isQExpanded ? null : q.id)}
                                                                    className={cn(
                                                                        "p-5 cursor-pointer flex items-center justify-between gap-4 transition-all hover:bg-slate-50/50",
                                                                        isQExpanded && "bg-slate-50/30 border-b border-slate-100/50"
                                                                    )}
                                                                >
                                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                                                                                {maskEmail(q.email)}
                                                                            </span>
                                                                            <span className="text-[9px] font-bold text-slate-300">
                                                                                {new Date(q.created_at).toLocaleString()}
                                                                            </span>
                                                                            {q.status === 'closed' ? (
                                                                                <span className="text-[9px] font-black bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded">답변 완료</span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded">대기중</span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs font-black text-slate-800 leading-relaxed truncate">
                                                                            {q.description}
                                                                        </p>
                                                                    </div>
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                                                        {isQExpanded ? <ChevronUp className="w-4 h-4 text-indigo-500" /> : <ChevronDown className="w-4 h-4 text-slate-350" />}
                                                                    </div>
                                                                </div>

                                                                {/* Question Detail & Reply Thread */}
                                                                {isQExpanded && (
                                                                    <div className="p-5 bg-slate-50/20 space-y-5">
                                                                        {/* Question Main Body */}
                                                                        <div className="space-y-3">
                                                                            <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                                                                                {q.description}
                                                                            </p>
                                                                            {(q.image_url || q.log_url) && (
                                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                                    {q.image_url && (
                                                                                        <a href={q.image_url} target="_blank" rel="noopener noreferrer" 
                                                                                           className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/50 text-slate-700 rounded-lg text-[10px] font-black transition-all">
                                                                                            <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> 스크린샷 보기
                                                                                        </a>
                                                                                    )}
                                                                                    {q.log_url && (
                                                                                        <a href={q.log_url} target="_blank" rel="noopener noreferrer" 
                                                                                           className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/50 text-slate-700 rounded-lg text-[10px] font-black transition-all">
                                                                                            <FileText className="w-3.5 h-3.5 text-slate-400" /> 로그 다운로드
                                                                                        </a>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Thread Timeline Messages */}
                                                                        <div className="space-y-3 pt-4 border-t border-slate-100 flex flex-col">
                                                                            {thread.length === 0 ? (
                                                                                <p className="text-[10px] font-bold text-slate-400 text-center py-2 italic">아직 달린 답변이 없습니다.</p>
                                                                            ) : (
                                                                                thread.map((msg) => {
                                                                                    const isMsgAdmin = msg.sender === 'admin';
                                                                                    return (
                                                                                        <div 
                                                                                            key={msg.id} 
                                                                                            className={cn(
                                                                                                "flex flex-col max-w-[85%] p-3.5 rounded-xl shadow-xs border transition-all duration-300",
                                                                                                isMsgAdmin 
                                                                                                    ? "bg-emerald-50/50 border-emerald-100/50 ml-auto rounded-tr-none" 
                                                                                                    : "bg-indigo-50/40 border-indigo-100/30 mr-auto rounded-tl-none"
                                                                                            )}
                                                                                        >
                                                                                            <div className="flex items-center gap-1.5 mb-1 justify-between">
                                                                                                <span className={cn(
                                                                                                    "text-[10px] font-black",
                                                                                                    isMsgAdmin ? "text-emerald-700" : "text-indigo-700"
                                                                                                )}>
                                                                                                    {isMsgAdmin ? "🛡️ 관리자" : `👤 ${maskEmail(msg.sender_email)}`}
                                                                                                </span>
                                                                                                <span className="text-[8px] font-bold text-slate-400">
                                                                                                    {new Date(msg.created_at).toLocaleString()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <p className={cn(
                                                                                                "text-xs font-semibold leading-relaxed whitespace-pre-wrap",
                                                                                                isMsgAdmin ? "text-emerald-900" : "text-slate-750"
                                                                                            )}>
                                                                                                {msg.text}
                                                                                            </p>
                                                                                            {(msg.image_url || msg.log_url) && (
                                                                                                <div className="mt-2 pt-2 border-t border-slate-100/50 flex gap-1.5">
                                                                                                    {msg.image_url && (
                                                                                                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" 
                                                                                                           className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 rounded text-[9px] font-black">
                                                                                                            스크린샷
                                                                                                        </a>
                                                                                                    )}
                                                                                                    {msg.log_url && (
                                                                                                        <a href={msg.log_url} target="_blank" rel="noopener noreferrer" 
                                                                                                           className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-100 rounded text-[9px] font-black">
                                                                                                            로그
                                                                                                        </a>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })
                                                                            )}
                                                                        </div>

                                                                        {/* Reply Form (Visible to Admin or Question Owner) */}
                                                                        {canReply ? (
                                                                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                                                                <textarea
                                                                                    placeholder="추가 문의사항이나 답변을 입력해주세요..."
                                                                                    value={replyTextMap[q.id] || ''}
                                                                                    onChange={(e) => setReplyTextMap(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                                                    className="w-full min-h-[70px] rounded-xl bg-white p-3 text-xs font-bold border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none text-slate-800 placeholder:text-slate-300"
                                                                                />
                                                                                
                                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                    <div className="flex gap-1.5">
                                                                                        <div className="relative group">
                                                                                            <input
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                onChange={e => setReplyImageMap(prev => ({ ...prev, [q.id]: e.target.files?.[0] || null }))}
                                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                            />
                                                                                            <div className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center transition-all">
                                                                                                <ImageIcon className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                                                                                <span className="text-[10px] font-black text-slate-500 truncate max-w-[80px]">
                                                                                                    {replyImageMap[q.id] ? replyImageMap[q.id]?.name : '사진'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="relative group">
                                                                                            <input
                                                                                                type="file"
                                                                                                accept=".log,.txt"
                                                                                                onChange={e => setReplyLogMap(prev => ({ ...prev, [q.id]: e.target.files?.[0] || null }))}
                                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                            />
                                                                                            <div className="h-8 px-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center transition-all">
                                                                                                <FileText className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                                                                                <span className="text-[10px] font-black text-slate-500 truncate max-w-[80px]">
                                                                                                    {replyLogMap[q.id] ? replyLogMap[q.id]?.name : '로그'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex gap-2">
                                                                                        {isAdmin ? (
                                                                                            <>
                                                                                                <Button 
                                                                                                    onClick={() => handleSubmitReply(q, 'open')}
                                                                                                    isLoading={submittingReplyId === q.id}
                                                                                                    disabled={!(replyTextMap[q.id] || '').trim() && !replyImageMap[q.id] && !replyLogMap[q.id]}
                                                                                                    className="h-8 px-3 bg-slate-200 hover:bg-slate-350 text-slate-700 rounded-lg text-[10px] font-black transition-all"
                                                                                                >
                                                                                                    대기등록
                                                                                                </Button>
                                                                                                <Button 
                                                                                                    onClick={() => handleSubmitReply(q, 'closed')}
                                                                                                    isLoading={submittingReplyId === q.id}
                                                                                                    disabled={!(replyTextMap[q.id] || '').trim() && !replyImageMap[q.id] && !replyLogMap[q.id]}
                                                                                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all shadow-md shadow-emerald-100"
                                                                                                >
                                                                                                    답변완료
                                                                                                </Button>
                                                                                            </>
                                                                                        ) : (
                                                                                            <Button 
                                                                                                onClick={() => handleSubmitReply(q, 'open')}
                                                                                                isLoading={submittingReplyId === q.id}
                                                                                                disabled={!(replyTextMap[q.id] || '').trim() && !replyImageMap[q.id] && !replyLogMap[q.id]}
                                                                                                className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all shadow-md shadow-indigo-100"
                                                                                            >
                                                                                                댓글 등록
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-slate-400 text-center italic pt-4 border-t border-slate-100">
                                                                                질문 작성자 및 관리자만 대댓글을 달 수 있습니다.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Card>
                        ))}
                    </div>
                </section>
            ))}

            {/* Custom request section */}
            <div className="text-center py-12 border-t border-slate-100">
                <p className="text-slate-400 font-bold mb-4">비즈니스에 맞춤형 기능이 필요하신가요?</p>
                <Link to="/support">
                    <Button variant="ghost" className="text-indigo-600 font-black hover:bg-indigo-50 px-8 py-4 h-auto rounded-2xl">
                        커스텀 제작 의뢰하기 <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};
