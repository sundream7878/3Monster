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
        subtitle: '잠자는 가망 고객 DB를 깨워 즉각적인 영업망을 구축합니다.',
        actionCopy: '1,000원으로 가망 고객 100명 정보 직접 뽑아보기',
        products: [
            {
                id: 'nplace-db',
                title: "N플레이스 DB 추출기",
                subtitle: "원하는 지역/업종별 실시간 타겟 DB 수집",
                description: "네이버 플레이스 상의 업체 연락처, 이메일, 홈페이지 주소를 포함한 고퀄리티 가망 고객 정보를 실시간 정밀 파싱하여 즉각 영업 가능한 DB로 변환합니다.",
                icon: MapPin,
                color: "from-blue-600 to-indigo-700",
                badge: "26년 6월 출시",
                features: ["실시간 지도 데이터 수집", "영업 시간/연락처 자동 분류", "원클릭 Excel 내보내기"]
            },
            {
                id: 'content-crawler',
                title: "사이트 컨텐츠 크롤러",
                subtitle: "유용한 웹 데이터 스크래핑 및 자산화",
                description: "원하는 커뮤니티, 전문 블로그, 타겟 웹페이지의 주요 텍스트와 이미지 데이터를 정확히 긁어와 AI 및 마케팅용 핵심 데이터셋으로 가공해 줍니다.",
                icon: Layers,
                color: "from-indigo-500 to-purple-600",
                badge: "26년 7월 출시예정",
                features: ["구조화된 웹 스크래핑 엔진", "게시글 및 댓글 본문 파싱", "CSV / JSON 포맷 저장"]
            },
            {
                id: 'user-manager-plus',
                title: "회원관리프로그램 확장팩",
                subtitle: "AI 자연어 검색 & 무료 메시지 전송 시스템",
                description: "AI 자연어로 회원 성향과 구매 내역을 정밀 검색하고, 필터링된 가망 고객들을 대상으로 SMS/이메일 자동 발송을 무료로 연동해 주는 통합 매니저입니다.",
                icon: Monitor,
                color: "from-blue-400 to-cyan-600",
                badge: "26년 7월 출시예정",
                features: ["AI 대화형 고객 검색 필터", "무료 SMS/Email 발송 연동", "가망 고객 타겟 그룹 관리"]
            }
        ]
    },
    {
        id: 'cafe-monster',
        name: '카페 몬스터',
        subtitle: '11년의 세월이 담긴 카페 데이터를 완벽한 매출 무기로 전환합니다.',
        actionCopy: '1,000원으로 내 카페의 진짜 활력지수 검증하기',
        products: [
            {
                id: 'cafe-crawler',
                title: "카페 게시글/댓글 크롤러",
                subtitle: "카페 내 숨어있는 진성 회원 서사 수집",
                description: "마케터가 타겟으로 삼은 카페의 전체 게시글, 실시간 새글, 작성자의 댓글 활동 내역까지 완벽 분석하여 핵심 유저층의 데이터셋을 빌드합니다.",
                icon: Smartphone,
                color: "from-orange-500 to-rose-600",
                badge: "26년 7월 출시예정",
                features: ["전체 히스토리 분석 수집", "진성 회원 식별 및 패턴 추적", "실시간 신규 알림 연동"]
            },
            {
                id: 'comment-stats',
                title: "카페 댓글 수집 통계",
                subtitle: "여론 흐름과 회원들의 실시간 반응 집계",
                description: "작성되는 실시간 댓글을 분석하여 여론의 긍/부정 지수, 주요 키워드 트렌드, 커뮤니티 전반의 상호작용 피드백을 대시보드로 시각화해 줍니다.",
                icon: FileText,
                color: "from-pink-500 to-purple-600",
                badge: "26년 7월 출시예정",
                features: ["여론 감정선 시각 분석", "핵심 반응 키워드 분석", "실시간 대시보드 리포팅"]
            },
            {
                id: 'event-activity-stats',
                title: "이벤트 활동 통계 집계",
                subtitle: "활동 지수 펌핑 및 카페 정밀 지표 분석",
                description: "카페 활성화를 위한 이벤트 기여도, 회원별 참여 지수 등 정교한 지표 분석을 제공하여 실질적인 회원 행동량 성장을 유도할 수 있는 솔루션입니다.",
                icon: BellRing,
                color: "from-amber-500 to-orange-600",
                badge: "26년 7월 출시예정",
                features: ["활동 활력 지표 진단", "이벤트 참여율 랭킹 산출", "맞춤형 활성화 솔루션 추천"]
            }
        ]
    },
    {
        id: 'app-monster',
        name: '앱 몬스터',
        subtitle: '일상의 소소한 불편함을 클릭 한 번으로 해결하는 편의 앱 팩토리',
        actionCopy: '조건 없이 100% 무료로 일상의 가려운 곳 긁어보기',
        products: [
            {
                id: 'photo-organizer',
                title: "사진 정리",
                subtitle: "기기 내 흩어진 사진들을 일괄 정리 및 최적화",
                description: "스마트폰이나 PC에 쌓인 수천 장의 사진들을 원하는 기준에 따라 자동 분류하고, 중복 및 흔들린 사진을 정리하여 기기 용량을 획기적으로 늘려줍니다.",
                icon: ImageIcon,
                color: "from-emerald-500 to-teal-600",
                badge: "26년 7월 출시예정",
                features: ["중복/유사 사진 탐지 및 삭제", "촬영 날짜/위치별 폴더 분류", "원클릭 고효율 이미지 리사이징"]
            },
            {
                id: 'food-picker',
                title: "오늘 뭐 먹지?",
                subtitle: "결정 장애 해결을 위한 스마트 메뉴 추천",
                description: "식사 시간마다 찾아오는 결정 장애를 단번에 날려줍니다. 오늘 날씨, 사용자의 기호, 최근 먹은 메뉴 데이터 등을 반영하여 최적의 식사 메뉴를 제안합니다.",
                icon: MessageCircle,
                color: "from-teal-500 to-emerald-600",
                badge: "26년 7월 출시예정",
                features: ["빅데이터 기반 룰렛 추천", "사용자 식사 취향 맞춤 학습", "주변 인기 식당 위치 탐색"]
            },
            {
                id: 'youtube-filter',
                title: "유튜브 어그로 필터",
                subtitle: "자극적이고 허위 사실이 가득한 영상 필터링",
                description: "조회수만을 유도하는 허위/과장 광고성 썸네일과 스팸성 댓글, 알맹이 없는 영상을 필터링하여 쾌적하고 낭비 없는 유튜브 시청 환경을 구축해 줍니다.",
                icon: Monitor,
                color: "from-cyan-500 to-blue-600",
                badge: "26년 7월 출시예정",
                features: ["어그로 키워드 감지 시스템", "스팸/도배성 댓글 완전 필터", "사용자 맞춤형 블랙리스트 지정"]
            },
            {
                id: 'finance-assistant',
                title: "AI 가계부 비서",
                subtitle: "영수증 사진만으로 자동 완성되는 소비 리포트",
                description: "수기 입력의 번거로움 없이, 소비 영수증이나 지출 승인 문자를 캡처해 올리면 AI 비서가 카테고리 분류부터 자산 리포트까지 자동으로 완성해 줍니다.",
                icon: FileText,
                color: "from-purple-500 to-indigo-650",
                badge: "26년 7월 출시예정",
                features: ["초정밀 OCR 영수증 파싱", "소비 행태 자동 분류 및 분석", "스마트 예산 경고 비서 알림"]
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
            <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl bg-slate-950">
                <img 
                    src="/hero-banner.png" 
                    alt="3Monster Hero Banner" 
                    className="w-full h-auto object-cover block" 
                />
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

                                    <div className="pt-6 mt-auto flex flex-col gap-3">
                                        <Link 
                                            to="/support" 
                                            className="w-full"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button className="w-full h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm px-4">
                                                {category.actionCopy} <ArrowRight className="w-4 h-4 shrink-0" />
                                            </Button>
                                        </Link>
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
                                                "w-full h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border-slate-200 text-xs sm:text-sm",
                                                activeQnaProductId === product.id ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-black" : "hover:bg-slate-50 text-slate-700"
                                            )}
                                        >
                                            <MessageSquare className="w-4 h-4" /> 질문/답변보기
                                        </Button>
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
