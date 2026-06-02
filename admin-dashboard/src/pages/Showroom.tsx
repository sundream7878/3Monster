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
                description: "네이버 N플레이스 상의 업체 연락처, 이메일, 홈페이지 주소를 포함한 고퀄리티 가망 고객 정보를 실시간 정밀 파싱하여 즉각 영업 가능한 DB로 변환합니다.",
                icon: MapPin,
                color: "from-blue-600 to-indigo-700",
                badge: "26년 6월 출시",
                features: [
                    "실시간 N플레이스 정보 추출",
                    "무료 인스타그램 DM발송",
                    "무료 이메일 발송 (네이버/구글 개인계정 연동)",
                    "원클릭 Excel 내보내기"
                ]
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
    const [selectedProductIdForDetail, setSelectedProductIdForDetail] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [qnaCounts, setQnaCounts] = useState<{[productId: string]: {questions: number, replies: number}}>({});
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    const fetchAllQnaCounts = async () => {
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('issue_type, reply');
            
            if (error) throw error;
            
            const counts: {[productId: string]: {questions: number, replies: number}} = {};
            
            // Initialize with 0s for all products
            productCategories.forEach(cat => {
                cat.products.forEach(p => {
                    counts[p.id] = { questions: 0, replies: 0 };
                });
            });
            
            data?.forEach((ticket: any) => {
                if (ticket.issue_type && ticket.issue_type.startsWith('qna_')) {
                    const productId = ticket.issue_type.replace('qna_', '');
                    if (counts[productId] === undefined) {
                        counts[productId] = { questions: 0, replies: 0 };
                    }
                    counts[productId].questions += 1;
                    
                    // Count replies
                    let replyCount = 0;
                    if (ticket.reply) {
                        try {
                            const parsed = JSON.parse(ticket.reply);
                            if (Array.isArray(parsed)) {
                                replyCount = parsed.length;
                            } else if (ticket.reply.trim() !== '') {
                                replyCount = 1;
                            }
                        } catch (e) {
                            if (ticket.reply.trim() !== '') {
                                replyCount = 1;
                            }
                        }
                    }
                    counts[productId].replies += replyCount;
                }
            });
            
            setQnaCounts(counts);
        } catch (err) {
            console.error("Error fetching QnA counts:", err);
        }
    };

    useEffect(() => {
        fetchAllQnaCounts();
        
        const channel = supabase
            .channel('qna-counts-sync')
            .on('postgres_changes', { 
                event: '*', 
                schema: 'public', 
                table: 'support_tickets'
            }, () => {
                fetchAllQnaCounts();
            })
            .subscribe();
            
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);
    
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
    const [activeReplyBoxQuestionId, setActiveReplyBoxQuestionId] = useState<string | null>(null);

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
            setActiveReplyBoxQuestionId(null);
            
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
            <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl bg-slate-950 group">
                <img 
                    src="/hero-banner.png" 
                    alt="3Monster Hero Banner" 
                    className="w-full h-auto object-cover block" 
                />
                {/* Clickable Overlay Regions */}
                <div className="absolute inset-0 flex">
                    <a 
                        href="#marketing-monster" 
                        className="w-1/3 h-full cursor-pointer hover:bg-white/5 transition-all duration-300"
                        title="마케팅 몬스터 바로가기"
                    />
                    <a 
                        href="#cafe-monster" 
                        className="w-1/3 h-full cursor-pointer hover:bg-white/5 transition-all duration-300 border-x border-white/5"
                        title="카페 몬스터 바로가기"
                    />
                    <a 
                        href="#app-monster" 
                        className="w-1/3 h-full cursor-pointer hover:bg-white/5 transition-all duration-300"
                        title="앱 몬스터 바로가기"
                    />
                </div>
            </div>
            {/* Product Category Groups */}
            {productCategories.map((category) => {
                const selectedProduct = category.products.find(p => p.id === selectedProductIdForDetail);
                const hasSelectedProductInCategory = !!selectedProduct;

                return (
                    <section 
                        key={category.id} 
                        id={category.id} 
                        className="space-y-8 scroll-mt-24"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pl-6 border-l-4 border-indigo-600">
                            <img 
                                src={`/${category.id}-logo.png`} 
                                alt={category.name} 
                                className="h-12 w-auto object-contain shrink-0" 
                            />
                            <span className="hidden sm:inline text-slate-300 text-lg">|</span>
                            <p className="text-slate-500 font-bold text-sm sm:text-base self-start sm:self-center">
                                {category.subtitle}
                            </p>
                        </div>

                        <div className={cn(
                            "grid gap-8 items-start",
                            hasSelectedProductInCategory ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 md:grid-cols-2"
                        )}>
                            {/* Cards Column */}
                            <div className={cn(
                                hasSelectedProductInCategory ? "lg:col-span-4 flex flex-col gap-6" : "contents"
                            )}>
                                {category.products.map((product) => (
                                    <Card 
                                        key={product.id} 
                                        className={cn(
                                            "group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] bg-white flex flex-col cursor-pointer",
                                            selectedProductIdForDetail === product.id ? "ring-2 ring-indigo-500 shadow-md" : ""
                                        )}
                                        onClick={() => {
                                            if (selectedProductIdForDetail === product.id) {
                                                setSelectedProductIdForDetail(null);
                                            } else {
                                                setSelectedProductIdForDetail(product.id);
                                            }
                                        }}
                                    >
                                        <div className={`h-2.5 p-0 w-full bg-gradient-to-r ${product.color}`} />
                                        <div className="p-6 space-y-5 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {product.badge && (
                                                            <span className={cn(
                                                                "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                                                                product.badge.includes('예정')
                                                                    ? "bg-amber-55/10 text-amber-600 border-amber-200/50"
                                                                    : "bg-emerald-55/10 text-emerald-650 border-emerald-200/50"
                                                            )}>
                                                                {product.badge}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-black text-slate-900 leading-tight">{product.title}</h3>
                                                    <p className="text-indigo-650 font-black text-xs">{product.subtitle}</p>
                                                </div>
                                                {product.icon && (
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-700 shrink-0 border border-slate-100"
                                                    )}>
                                                        <product.icon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-slate-500 font-medium text-xs leading-relaxed">
                                                {product.description}
                                            </p>

                                            <div className="grid grid-cols-1 gap-1.5 pt-1">
                                                {product.features.map(f => (
                                                    <div key={f} className="flex items-center gap-2 text-slate-400 text-[11px] font-bold">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" /> {f}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="pt-4 mt-auto flex gap-2.5">
                                                <Button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (selectedProductIdForDetail === product.id) {
                                                            setSelectedProductIdForDetail(null);
                                                        } else {
                                                            setSelectedProductIdForDetail(product.id);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "w-1/2 h-10 rounded-xl font-bold transition-all flex items-center justify-center gap-1 text-[11px] sm:text-xs px-2.5",
                                                        selectedProductIdForDetail === product.id 
                                                            ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                                                            : "bg-slate-900 hover:bg-indigo-600 text-white"
                                                    )}
                                                >
                                                    상세보기
                                                </Button>
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
                                                        "w-1/2 h-10 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 border-slate-200 text-[11px] sm:text-xs px-2.5",
                                                        activeQnaProductId === product.id ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-black" : "hover:bg-slate-50 text-slate-700"
                                                    )}
                                                >
                                                    <MessageSquare className="w-3.5 h-3.5" /> 질문({qnaCounts[product.id]?.questions || 0}) / 답변({qnaCounts[product.id]?.replies || 0})
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
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="overflow-hidden bg-slate-50/50 border-t border-slate-100 px-6 py-6 space-y-5"
                                                >
                                                    {/* 1. New Question Registration Form */}
                                                    {user ? (
                                                        <form onSubmit={(e) => handleSubmitQuestion(product.id, e)} className="space-y-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm text-left">
                                                            <div className="flex justify-between items-center pb-1">
                                                                <p className="text-[10px] font-black text-indigo-500 pl-1 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <span>🙋‍♂️</span> 새 질문하기
                                                                </p>
                                                                <Button 
                                                                    type="submit" 
                                                                    isLoading={isSubmittingQuestion}
                                                                    className="h-8 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-100 transition-all"
                                                                >
                                                                    등록
                                                                </Button>
                                                            </div>
                                                            <div className="relative">
                                                                <textarea
                                                                    placeholder="제품에 대해 궁금한 점을 적어주세요. 개발진이 직접 답변해 드립니다."
                                                                    value={newQuestionText}
                                                                    onChange={(e) => setNewQuestionText(e.target.value)}
                                                                    className="w-full min-h-[75px] rounded-xl bg-slate-50 p-3 text-xs font-bold border border-slate-350 focus:border-indigo-500 outline-none focus:ring-2 focus:ring-indigo-100/50 transition-all resize-none placeholder:text-slate-500 text-slate-900"
                                                                />
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-50 flex flex-col items-center justify-between gap-3 text-left">
                                                            <p className="text-xs text-indigo-900 font-bold">🙋‍♂️ 질문 확인 및 등록을 위해 로그인해 주세요.</p>
                                                            <Link to="/support" className="w-full">
                                                                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl h-9 px-4 shadow-lg shadow-indigo-100">
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
                                                            <p className="text-xs font-bold text-slate-400 text-center py-6 bg-white rounded-xl border border-slate-100">
                                                                등록된 질문이 없습니다. 첫 질문을 남겨보세요!
                                                            </p>
                                                        ) : (
                                                            questions.map((q) => {
                                                                const isQExpanded = expandedQuestionId === q.id;
                                                                const thread = parseThread(q);
                                                                const isQOwner = q.uid === user?.id || (q.email && verifiedEmail && q.email.toLowerCase() === verifiedEmail.toLowerCase());
                                                                const canReply = isQOwner || isAdmin;

                                                                return (
                                                                    <div key={q.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
                                                                        {/* Question Header (Click to expand) */}
                                                                        <div 
                                                                            onClick={() => setExpandedQuestionId(isQExpanded ? null : q.id)}
                                                                            className={cn(
                                                                                "p-4 cursor-pointer flex items-center justify-between gap-3 transition-all hover:bg-slate-50/50",
                                                                                isQExpanded && "bg-slate-50/30 border-b border-slate-100/50"
                                                                            )}
                                                                        >
                                                                            <div className="space-y-1 flex-1 min-w-0">
                                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                                        {maskEmail(q.email)}
                                                                                    </span>
                                                                                    <span className="text-[9px] font-bold text-slate-300">
                                                                                        {new Date(q.created_at).toLocaleString()}
                                                                                    </span>
                                                                                    {q.status === 'closed' ? (
                                                                                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-500 px-1.5 py-0.5 rounded">답변 완료</span>
                                                                                    ) : (
                                                                                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">답변 미등록</span>
                                                                                    )}
                                                                                </div>
                                                                                <p className="text-xs font-black text-slate-800 leading-relaxed truncate">
                                                                                    {q.description ? q.description.split('\n')[0] : ''}
                                                                                </p>
                                                                            </div>
                                                                            <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                                                                {isQExpanded ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-350" />}
                                                                            </div>
                                                                        </div>

                                                                        {/* Question Detail & Reply Thread */}
                                                                        {isQExpanded && (
                                                                            <div className="p-4 bg-slate-50/20 space-y-4">
                                                                                {/* Question Main Body */}
                                                                                {(() => {
                                                                                    const lines = q.description ? q.description.split('\n') : [];
                                                                                    const bodyText = lines.slice(1).join('\n').trim();
                                                                                    const hasFiles = !!(q.image_url || q.log_url);
                                                                                    if (!bodyText && !hasFiles) return null;
                                                                                    return (
                                                                                        <div className="space-y-2">
                                                                                            {bodyText && (
                                                                                                <p className="text-xs text-slate-600 font-bold leading-relaxed whitespace-pre-wrap">
                                                                                                    {bodyText}
                                                                                                </p>
                                                                                            )}
                                                                                            {hasFiles && (
                                                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                                                    {q.image_url && (
                                                                                                        <a href={q.image_url} target="_blank" rel="noopener noreferrer" 
                                                                                                           className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200/50 text-slate-700 rounded-lg text-[9px] font-black transition-all">
                                                                                                            <ImageIcon className="w-3 h-3 text-slate-400" /> 스크린샷 보기
                                                                                                        </a>
                                                                                                    )}
                                                                                                    {q.log_url && (
                                                                                                        <a href={q.log_url} target="_blank" rel="noopener noreferrer" 
                                                                                                           className="inline-flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200/50 text-slate-700 rounded-lg text-[9px] font-black transition-all">
                                                                                                            <FileText className="w-3 h-3 text-slate-400" /> 로그 다운로드
                                                                                                        </a>
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })()}

                                                                                {/* Thread Timeline Messages */}
                                                                                {thread.length > 0 && (
                                                                                    <div className="space-y-3 pt-2.5 border-t border-slate-100 flex flex-col">
                                                                                    {thread.map((msg) => {
                                                                                            const isMsgAdmin = msg.sender === 'admin';
                                                                                            return (
                                                                                                <div 
                                                                                                    key={msg.id} 
                                                                                                    className={cn(
                                                                                                        "flex flex-col max-w-[85%] p-3 rounded-lg shadow-xs border transition-all duration-300",
                                                                                                        isMsgAdmin 
                                                                                                            ? "bg-emerald-50/50 border-emerald-100/50 ml-auto rounded-tr-none" 
                                                                                                            : "bg-indigo-50/40 border-indigo-100/30 mr-auto rounded-tl-none"
                                                                                                    )}
                                                                                                >
                                                                                                    <div className="flex items-center gap-1.5 mb-1 justify-between">
                                                                                                        <span className={cn(
                                                                                                            "text-[9px] font-black",
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
                                                                                                        isMsgAdmin ? "text-emerald-900" : "text-slate-755"
                                                                                                    )}>
                                                                                                        {msg.text}
                                                                                                    </p>
                                                                                                    {(msg.image_url || msg.log_url) && (
                                                                                                        <div className="mt-1.5 pt-1.5 border-t border-slate-100/50 flex gap-1">
                                                                                                            {msg.image_url && (
                                                                                                                <a href={msg.image_url} target="_blank" rel="noopener noreferrer" 
                                                                                                                   className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white hover:bg-slate-50 border border-slate-100 rounded text-[9px] font-black">
                                                                                                                    스크린샷
                                                                                                                </a>
                                                                                                            )}
                                                                                                            {msg.log_url && (
                                                                                                                <a href={msg.log_url} target="_blank" rel="noopener noreferrer" 
                                                                                                                   className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white hover:bg-slate-50 border border-slate-100 rounded text-[9px] font-black">
                                                                                                                    로그
                                                                                                                </a>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                )}

                                                                                {/* Reply Form (Visible to Admin or Question Owner) */}
                                                                                {canReply ? (
                                                                                    activeReplyBoxQuestionId === q.id ? (
                                                                                        <div className="pt-3 border-t border-slate-100 space-y-2">
                                                                                            <textarea
                                                                                                placeholder="추가 문의사항이나 답변을 입력해주세요..."
                                                                                                value={replyTextMap[q.id] || ''}
                                                                                                onChange={(e) => setReplyTextMap(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                                                                className="w-full min-h-[60px] rounded-lg bg-white p-2.5 text-xs font-bold border border-slate-350 focus:border-indigo-500 outline-none focus:ring-2 focus:ring-indigo-100/50 transition-all resize-none text-slate-900 placeholder:text-slate-500"
                                                                                            />
                                                                                            
                                                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                                <div className="flex gap-1">
                                                                                                    {isAdmin ? (
                                                                                                        <>
                                                                                                            <div className="relative group">
                                                                                                                <input
                                                                                                                    type="file"
                                                                                                                    accept="image/*"
                                                                                                                    onChange={e => setReplyImageMap(prev => ({ ...prev, [q.id]: e.target.files?.[0] || null }))}
                                                                                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                                                                                />
                                                                                                                <div className="h-7 px-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 flex items-center transition-all">
                                                                                                                    <ImageIcon className="w-3 h-3 text-slate-400 mr-1" />
                                                                                                                    <span className="text-[9px] font-black text-slate-500 truncate max-w-[60px]">
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
                                                                                                                <div className="h-7 px-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 flex items-center transition-all">
                                                                                                                    <FileText className="w-3 h-3 text-slate-400 mr-1" />
                                                                                                                    <span className="text-[9px] font-black text-slate-500 truncate max-w-[60px]">
                                                                                                                        {replyLogMap[q.id] ? replyLogMap[q.id]?.name : '로그'}
                                                                                                                    </span>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </>
                                                                                                    ) : null}
                                                                                                </div>
                                                                                                
                                                                                                <div className="flex gap-2">
                                                                                                    {isAdmin ? (
                                                                                                        <>
                                                                                                            <Button 
                                                                                                                onClick={() => handleSubmitReply(q, 'open')}
                                                                                                                isLoading={submittingReplyId === q.id}
                                                                                                                disabled={!(replyTextMap[q.id] || '').trim() && !replyImageMap[q.id] && !replyLogMap[q.id]}
                                                                                                                className="h-7 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[9px] font-black transition-all"
                                                                                                            >
                                                                                                                대기등록
                                                                                                            </Button>
                                                                                                            <Button 
                                                                                                                onClick={() => handleSubmitReply(q, 'closed')}
                                                                                                                isLoading={submittingReplyId === q.id}
                                                                                                                disabled={!(replyTextMap[q.id] || '').trim() && !replyImageMap[q.id] && !replyLogMap[q.id]}
                                                                                                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black transition-all shadow-md shadow-emerald-100"
                                                                                                            >
                                                                                                                답변완료
                                                                                                            </Button>
                                                                                                        </>
                                                                                                    ) : (
                                                                                                        <Button 
                                                                                                            onClick={() => handleSubmitReply(q, 'open')}
                                                                                                            isLoading={submittingReplyId === q.id}
                                                                                                            disabled={!(replyTextMap[q.id] || '').trim()}
                                                                                                            className="h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black transition-all shadow-md shadow-indigo-100"
                                                                                                        >
                                                                                                            댓글 등록
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="pt-2 text-right">
                                                                                            <button 
                                                                                                onClick={() => setActiveReplyBoxQuestionId(q.id)}
                                                                                                className="text-[10px] font-black text-indigo-650 hover:text-indigo-800 px-3 py-1 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg border border-indigo-100/50 transition-all"
                                                                                            >
                                                                                                답변 달기
                                                                                            </button>
                                                                                        </div>
                                                                                    )
                                                                                ) : (
                                                                                    <p className="text-[9px] text-slate-400 text-center italic pt-3 border-t border-slate-100">
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

                            {/* Detail Panel Column */}
                            {hasSelectedProductInCategory && selectedProduct && (
                                <div className="lg:col-span-8 bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col relative h-fit sticky top-28">
                                    <button 
                                        onClick={() => setSelectedProductIdForDetail(null)}
                                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                        aria-label="닫기"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                                selectedProduct.badge.includes('예정')
                                                    ? "bg-amber-55/10 text-amber-600 border-amber-200/50"
                                                    : "bg-emerald-55/10 text-emerald-650 border-emerald-200/50"
                                            )}>
                                                {selectedProduct.badge}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
                                            <div>
                                                <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedProduct.title}</h2>
                                                <p className="text-indigo-650 font-bold text-base">{selectedProduct.subtitle}</p>
                                            </div>
                                            {selectedProduct.icon && (
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-800 shrink-0 border border-slate-100"
                                                )}>
                                                    <selectedProduct.icon className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">제품 개요</h4>
                                            <p className="text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedProduct.description}
                                            </p>
                                        </div>

                                        {selectedProduct.id === 'nplace-db' && (
                                            <>
                                                <div className="space-y-3 pt-3">
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">실제 구동 데모 영상</h4>
                                                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-inner">
                                                        <video 
                                                            src="/showroom/nplace/nplace-demo.mp4" 
                                                            controls 
                                                            className="w-full h-full object-contain"
                                                            poster="/showroom/nplace/nplace-ui-1.png"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-3">
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">프로그램 스크린샷</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div 
                                                            onClick={() => setPreviewImageUrl("/showroom/nplace/nplace-ui-1.png")} 
                                                            className="rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer"
                                                        >
                                                            <img src="/showroom/nplace/nplace-ui-1.png" alt="설정 화면" className="w-full h-24 object-cover" />
                                                            <p className="text-[10px] text-center py-1 font-black text-slate-500 bg-slate-50 border-t border-slate-100">키워드 입력</p>
                                                        </div>
                                                        <div 
                                                            onClick={() => setPreviewImageUrl("/showroom/nplace/nplace-ui-2.png")} 
                                                            className="rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer"
                                                        >
                                                            <img src="/showroom/nplace/nplace-ui-2.png" alt="수집 진행" className="w-full h-24 object-cover" />
                                                            <p className="text-[10px] text-center py-1 font-black text-slate-500 bg-slate-50 border-t border-slate-100">실시간 추출</p>
                                                        </div>
                                                        <div 
                                                            onClick={() => setPreviewImageUrl("/showroom/nplace/nplace-excel.png")} 
                                                            className="rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer"
                                                        >
                                                            <img src="/showroom/nplace/nplace-excel.png" alt="엑셀 출력" className="w-full h-24 object-cover" />
                                                            <p className="text-[10px] text-center py-1 font-black text-slate-500 bg-slate-50 border-t border-slate-100">최종 엑셀 결과</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="space-y-3 pt-3">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">주요 기능 및 스펙</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {selectedProduct.features.map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                                            <span className="text-xs font-bold text-slate-700">{feature}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {selectedProduct.id === 'nplace-db' && (
                                                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/50 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-indigo-650 bg-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">엑셀 데이터 실전 100% 활용처</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-bold text-slate-600">
                                                            <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
                                                                <span className="text-indigo-500">📞</span> 전화 TM 영업
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
                                                                <span className="text-indigo-500">✍️</span> 블로그 탐방 소통
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-100">
                                                                <span className="text-indigo-500">✉️</span> 주소지 우편 발송
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 pt-3 border-t border-slate-100">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">상세 안내사항</h4>
                                            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 font-semibold">
                                                {selectedProduct.id === 'nplace-db' ? (
                                                    <>
                                                        <li>네이버 N플레이스 차단 기준을 우회하기 위해 안전한 최적의 속도로 백그라운드 수집을 진행합니다. (퇴근하실 때 실행해 두시면 다음 날 아침 수천 건의 데이터 수집이 안전하게 완료됩니다.)</li>
                                                        <li>자세한 사용 조작법은 프로그램 다운로드 패키지 내 동봉된 설명서를 참고해 주십시오.</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>본 프로그램은 실시간 업데이트 및 모니터링을 지원합니다.</li>
                                                        <li>자세한 세팅 가이드 및 이용법은 다운로드 패키지 내 설명서를 참고해 주십시오.</li>
                                                    </>
                                                )}
                                                <li>기타 커스텀 기능 개발이 필요하신 분은 왼쪽 제품 카드 하단의 질문/답변 코너를 이용해 요청해 주시면 담당 개발진이 빠르게 확인하여 견적 및 상담을 진행해 드립니다.</li>
                                            </ul>
                                        </div>

                                        <div className="pt-6 space-y-3">
                                            {selectedProduct.id === 'nplace-db' && (
                                                <a 
                                                    href="/showroom/nplace/nplace-sample.csv" 
                                                    download="nplace-sample.csv"
                                                    className="w-full block"
                                                >
                                                    <Button variant="outline" className="w-full h-12 border-2 border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:bg-indigo-50/50 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-xs sm:text-sm">
                                                        📄 실제 수집 엑셀 데이터 샘플 받기 (.csv)
                                                    </Button>
                                                </a>
                                            )}
                                            <Link 
                                                to="/support" 
                                                className="w-full block"
                                            >
                                                <Button className="w-full h-14 bg-slate-950 hover:bg-indigo-650 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base px-6 shadow-xl shadow-slate-950/10">
                                                    {category.actionCopy} <ArrowRight className="w-5 h-5 shrink-0" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                );
            })}

            {/* Custom request section */}
            <div className="text-center py-12 border-t border-slate-100">
                <p className="text-slate-400 font-bold mb-4">비즈니스에 맞춤형 기능이 필요하신가요?</p>
                <Link to="/support">
                    <Button variant="ghost" className="text-indigo-600 font-black hover:bg-indigo-50 px-8 py-4 h-auto rounded-2xl">
                        커스텀 제작 의뢰하기 <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
            </div>

            {/* Image Preview Lightbox Modal */}
            <AnimatePresence>
                {previewImageUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 sm:p-8"
                        onClick={() => setPreviewImageUrl(null)}
                    >
                        {/* Close button at top-left, large */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewImageUrl(null);
                            }}
                            className="absolute top-6 left-6 text-white/70 hover:text-white hover:scale-110 transition-all p-3 rounded-full hover:bg-white/10"
                            aria-label="닫기"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={previewImageUrl}
                                alt="확대된 스크린샷"
                                className="w-full h-auto max-h-[85vh] object-contain rounded-2xl"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
