import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Copy, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const generateSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `CM-${segment()}-${segment()}-${segment()}`;
};

const formatPrice = (value: string | number) => {
    if (value === undefined || value === null || value === '') return '';
    const num = String(value).replace(/[^0-9]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('ko-KR');
};

const parsePrice = (value: string) => {
    return value.replace(/,/g, '');
};

interface PricingItem {
    id: number;
    product: string;
    pkg: string;
    label: string;
    price: number;
    status: '안' | '확정';
}

const defaultLegacyPrices: { [key: string]: number } = {
    'TEST': 0,
    '1M': 19000,
    '3M': 45000,
    '1Y': 270000
};

export const LicenseGenerator = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState('');
    const [formData, setFormData] = useState({
        product_id: 'NPlace-DB',
        license_type: 'TRIAL',
        constraint_type: 'HWID',
        buyer_name: '',
        contact: '',
        channel: '크몽',
        price_sold: '',
        memo: ''
    });

    const [pricing, setPricing] = useState<PricingItem[]>(() => {
        const saved = localStorage.getItem('3monster_pricing_policies');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.every(p => ['TRIAL', '1M', '3M'].includes(p.pkg))) {
                    return parsed;
                }
            } catch (e) {}
        }
        return [
            // 마케팅 몬스터
            { id: 1, product: 'NPlace-DB', pkg: 'TRIAL', label: '[5일 체험판] NPlace_DB Pro (500건 제한)', price: 5000, status: '확정' },
            { id: 2, product: 'NPlace-DB', pkg: '1M', label: '[1개월 이용권] NPlace_DB Pro (무제한 수집)', price: 19000, status: '확정' },
            { id: 3, product: 'NPlace-DB', pkg: '3M', label: '[3개월 이용권] NPlace_DB Pro (무제한 수집, 1.5만원 할인)', price: 45000, status: '확정' },
            { id: 4, product: 'ContentCrawler', pkg: 'TRIAL', label: '[5일 체험판] ContentCrawler (500건 제한)', price: 5000, status: '안' },
            { id: 5, product: 'ContentCrawler', pkg: '1M', label: '[1개월 이용권] ContentCrawler (무제한 수집)', price: 19000, status: '안' },
            { id: 6, product: 'ContentCrawler', pkg: '3M', label: '[3개월 이용권] ContentCrawler (무제한 수집, 1.5만원 할인)', price: 45000, status: '안' },
            { id: 7, product: 'UserManager', pkg: 'TRIAL', label: '[5일 체험판] UserManager (500건 제한)', price: 5000, status: '안' },
            { id: 8, product: 'UserManager', pkg: '1M', label: '[1개월 이용권] UserManager (무제한 수집)', price: 19000, status: '안' },
            { id: 9, product: 'UserManager', pkg: '3M', label: '[3개월 이용권] UserManager (무제한 수집, 1.5만원 할인)', price: 45000, status: '안' },
            // 카페 몬스터
            { id: 10, product: 'CafeCrawler', pkg: 'TRIAL', label: '[5일 체험판] CafeCrawler (500건 제한)', price: 5000, status: '안' },
            { id: 11, product: 'CafeCrawler', pkg: '1M', label: '[1개월 이용권] CafeCrawler (무제한 수집)', price: 19000, status: '안' },
            { id: 12, product: 'CafeCrawler', pkg: '3M', label: '[3개월 이용권] CafeCrawler (무제한 수집, 1.5만원 할인)', price: 45000, status: '안' },
            { id: 13, product: 'CommentStats', pkg: 'TRIAL', label: '[5일 체험판] CommentStats (500건 제한)', price: 5000, status: '안' },
            { id: 14, product: 'CommentStats', pkg: '1M', label: '[1개월 이용권] CommentStats (무제한 수집)', price: 19000, status: '안' },
            { id: 15, product: 'CommentStats', pkg: '3M', label: '[3개월 이용권] CommentStats (무제한 수집, 1.5만원 할인)', price: 45000, status: '안' },
            { id: 16, product: 'EventStats', pkg: 'TRIAL', label: '[5일 체험판] EventStats (500건 제한)', price: 5000, status: '안' },
            { id: 17, product: 'EventStats', pkg: '1M', label: '[1개월 이용권] EventStats (무제한 수집)', price: 19000, status: '안' },
            { id: 18, product: 'EventStats', pkg: '3M', label: '[3개월 이용권] EventStats (무제한 수집, 1.5만원 할인)', price: 45000, status: '안' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('3monster_pricing_policies', JSON.stringify(pricing));
    }, [pricing]);

    // Accordion and Tab States
    const [activeTab, setActiveTab] = useState<'marketing' | 'cafe'>('marketing');
    const [expandedProductId, setExpandedProductId] = useState<string>('NPlace-DB');


    const pricingProducts = {
        marketing: [
            { id: 'NPlace-DB', name: '🏢 NPLace_DB', desc: '네이버 플레이스 DB 수집기' },
            { id: 'ContentCrawler', name: '💻 사이트 컨텐츠 크롤러', desc: '웹 데이터 스크래핑 엔진' },
            { id: 'UserManager', name: '👥 회원관리프로그램 확장팩', desc: 'AI 검색 및 메시지 전송' },
        ],
        cafe: [
            { id: 'CafeCrawler', name: '☕ 카페 크롤러', desc: '카페 게시글/댓글 크롤러' },
            { id: 'CommentStats', name: '📊 카페 댓글 수집 통계', desc: '실시간 여론 반응 분석' },
            { id: 'EventStats', name: '🔔 이벤트 활동 통계 집계', desc: '활동 기여 지표 분석' },
        ]
    };

    // Initial price auto-fill on mount
    useEffect(() => {
        const matched = pricing.find(
            p => p.product.toLowerCase() === formData.product_id.toLowerCase() && p.pkg === formData.license_type
        );
        if (matched) {
            setFormData(prev => ({ ...prev, price_sold: String(matched.price) }));
        } else if (defaultLegacyPrices[formData.license_type] !== undefined) {
            setFormData(prev => ({ ...prev, price_sold: String(defaultLegacyPrices[formData.license_type]) }));
        }
    }, []);

    const handleProductChange = (productId: string) => {
        const matched = pricing.find(
            p => p.product.toLowerCase() === productId.toLowerCase() && p.pkg === formData.license_type
        );
        let price = '';
        if (matched) {
            price = String(matched.price);
        } else if (defaultLegacyPrices[formData.license_type] !== undefined) {
            price = String(defaultLegacyPrices[formData.license_type]);
        }
        setFormData(prev => ({
            ...prev,
            product_id: productId,
            price_sold: price || prev.price_sold
        }));

        // Automatically switch Right Tabs and Expand Accordion
        const isMarketing = ['NPlace-DB', 'ContentCrawler', 'UserManager'].includes(productId);
        setActiveTab(isMarketing ? 'marketing' : 'cafe');
        setExpandedProductId(productId);
    };

    const handleLicenseTypeChange = (licenseType: string) => {
        const matched = pricing.find(
            p => p.product.toLowerCase() === formData.product_id.toLowerCase() && p.pkg === licenseType
        );
        let price = '';
        if (matched) {
            price = String(matched.price);
        } else if (defaultLegacyPrices[licenseType] !== undefined) {
            price = String(defaultLegacyPrices[licenseType]);
        }
        setFormData(prev => ({
            ...prev,
            license_type: licenseType,
            price_sold: price || prev.price_sold
        }));
    };

    const handleToggleStatus = (id: number) => {
        setPricing(prev =>
            prev.map(p => (p.id === id ? { ...p, status: p.status === '안' ? '확정' : '안' } : p))
        );
    };

    const handleUpdatePrice = (id: number, price: number) => {
        setPricing(prev =>
            prev.map(p => (p.id === id ? { ...p, price: price } : p))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const isTrial = formData.license_type === 'TRIAL';
        const isTest = formData.license_type === 'TEST';
        
        let serial = '';
        if (isTest) {
            serial = `TEST-${generateSerial().split('-').slice(1).join('-')}`;
        } else if (isTrial) {
            serial = `TRIAL-${generateSerial().split('-').slice(1).join('-')}`;
        } else {
            serial = generateSerial();
        }

        setGeneratedKey(serial);

        try {
            const now = new Date();
            const expireDate = new Date();
            let collectionLimit = null;

            if (formData.license_type === 'TRIAL') {
                expireDate.setDate(now.getDate() + 5);
                collectionLimit = 500;
            } else if (formData.license_type === 'TEST') {
                expireDate.setDate(now.getDate() + 1);
                collectionLimit = 100;
            } else if (formData.license_type === '1M') {
                expireDate.setMonth(now.getMonth() + 1);
            } else if (formData.license_type === '3M') {
                expireDate.setMonth(now.getMonth() + 3);
            } else if (formData.license_type === '6M') {
                expireDate.setMonth(now.getMonth() + 6);
            } else if (formData.license_type === '1Y') {
                expireDate.setFullYear(now.getFullYear() + 1);
            } else if (formData.license_type === 'LIFETIME') {
                expireDate.setFullYear(now.getFullYear() + 99);
            }

            const suffix = isTest ? ' (TEST)' : isTrial ? ' (TRIAL)' : '';
            const finalBuyerName = `${formData.buyer_name}${suffix}`;

            const { error } = await supabase
                .from('licenses')
                .insert([{
                    ...formData,
                    buyer_name: finalBuyerName,
                    serial_key: serial,
                    expire_date: expireDate.toISOString(),
                    collection_limit: collectionLimit,
                    status: 'unused',
                    bound_value: null,
                    price_sold: Number(parsePrice(formData.price_sold)) || 0
                }]);

            if (error) throw error;

        } catch (error: any) {
            console.error("Error creating license:", error);
            alert(`발행 중 오류가 발생했습니다: ${error.message}\n(UID: ${user?.id || 'Not Logged In'})\n관리자에게 문의하거나 Supabase 설정을 확인해주세요.`);
            setGeneratedKey('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-6 pt-0 pb-12 px-4">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">신규 라이선스 생성</h1>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Left Form Column */}
                <Card className="lg:col-span-7 p-0 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-[0_15px_45px_rgba(0,0,0,0.07)]">
                    <CardHeader className="px-6 py-2 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                        <CardTitle className="text-xl font-black text-white tracking-tighter">라이선스 정보 입력</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-950 uppercase tracking-wide ml-0.5">대상 제품 선택</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-14 rounded-xl bg-white px-4 text-base font-extrabold border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 outline-none transition-all appearance-none cursor-pointer text-slate-955"
                                            value={formData.product_id}
                                            onChange={(e) => handleProductChange(e.target.value)}
                                        >
                                            <optgroup label="마케팅몬스터 제품군">
                                                <option value="NPlace-DB">🏢 NPlace-DB (네이버 플레이스 DB)</option>
                                                <option value="ContentCrawler">💻 ContentCrawler (사이트 콘텐츠 크롤러)</option>
                                                <option value="UserManager">👥 UserManager (회원관리 확장팩)</option>
                                            </optgroup>
                                            <optgroup label="카페몬스터 제품군">
                                                <option value="CafeCrawler">☕ CafeCrawler (카페 크롤러)</option>
                                                <option value="CommentStats">📊 CommentStats (카페 댓글 수집 통계)</option>
                                                <option value="EventStats">🔔 EventStats (이벤트 활동 통계)</option>
                                            </optgroup>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-955 uppercase tracking-wide ml-0.5">이용 기간 선택</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-14 rounded-xl bg-white px-4 text-base font-extrabold border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 outline-none transition-all appearance-none cursor-pointer text-indigo-900"
                                            value={formData.license_type}
                                            onChange={(e) => handleLicenseTypeChange(e.target.value)}
                                        >
                                            <option value="TRIAL">DELUXE (5일 체험판)</option>
                                            <option value="1M">STANDARD (1개월 이용권)</option>
                                            <option value="3M">PREMIUM (3개월 이용권)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-955 uppercase tracking-wide ml-0.5">가입 / 판매 채널</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-14 rounded-xl bg-white px-4 text-base font-extrabold border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 outline-none transition-all appearance-none cursor-pointer text-slate-955"
                                            value={formData.channel}
                                            onChange={e => {
                                                const newChan = e.target.value;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    channel: newChan,
                                                    buyer_name: '',
                                                    contact: ''
                                                }));
                                            }}
                                        >
                                            <option value="크몽">크몽</option>
                                            <option value="썬드림 쇼핑몰">썬드림 쇼핑몰</option>
                                            <option value="블로그">블로그</option>
                                            <option value="지인">지인</option>
                                            <option value="기타">기타</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-955 uppercase tracking-wide ml-0.5">판매 가격 (KRW)</label>
                                    <Input placeholder="금액 입력" className="h-14 bg-white border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 text-base font-extrabold px-4 text-slate-955 rounded-xl shadow-sm" value={formatPrice(formData.price_sold)} onChange={e => setFormData({ ...formData, price_sold: parsePrice(e.target.value) })} />
                                </div>
                            </div>

                            {formData.channel === '크몽' ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-955 uppercase tracking-wide ml-0.5">크몽 ID</label>
                                    <Input
                                        required
                                        placeholder="구매자의 크몽 ID를 입력하세요"
                                        className="h-14 bg-white border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 text-base font-extrabold px-4 rounded-xl text-slate-955 placeholder:text-slate-400 shadow-sm"
                                        value={formData.buyer_name}
                                        onChange={e => setFormData({ ...formData, buyer_name: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-955 uppercase tracking-wide ml-0.5">이메일 주소</label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="구매자의 이메일 주소를 입력하세요"
                                        className="h-14 bg-white border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 text-base font-extrabold px-4 rounded-xl text-slate-955 placeholder:text-slate-400 shadow-sm"
                                        value={formData.contact}
                                        onChange={e => {
                                            const emailVal = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                contact: emailVal,
                                                buyer_name: emailVal
                                            }));
                                        }}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-955 uppercase tracking-wide ml-0.5">메모 (특이사항 / 연락처 등)</label>
                                <Input placeholder="기타 연락처나 특이사항이 있다면 입력하세요" className="h-14 bg-white border border-slate-400 focus:border-indigo-650 focus:ring-4 focus:ring-indigo-150 text-base font-extrabold px-4 text-slate-955 rounded-xl shadow-sm" value={formData.memo} onChange={e => setFormData({ ...formData, memo: e.target.value })} />
                            </div>

                            <Button type="submit" className="w-full h-16 text-white font-black text-lg shadow-md hover:bg-indigo-750 active:scale-[0.99] transition-all bg-indigo-600 rounded-xl border-b-4 border-indigo-900 border-none animate-none" isLoading={loading}>
                                라이선스 즉시 발행하기 <ChevronRight className="ml-1 w-5 h-5" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right Column: Key Output & Accordion Pricing Table */}
                <div className="lg:col-span-5 space-y-6">
                    <AnimatePresence>
                        {generatedKey && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                {generatedKey.startsWith('TRIAL-') ? (
                                    <Card className="bg-emerald-600 text-white p-6 space-y-4 shadow-lg rounded-2xl border-none">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <h4 className="font-black text-sm">체험판 구매자 등록 완료</h4>
                                        </div>
                                        <div className="rounded-xl bg-white/10 p-4 text-xs space-y-2">
                                            <p>• <b>구매자 (크몽 ID)</b>: {formData.buyer_name}</p>
                                            <p>• <b>등록 제품</b>: {formData.product_id}</p>
                                            <p>• <b>이용 유형</b>: DELUXE (5일 체험판)</p>
                                            <p className="mt-2 text-emerald-100 font-bold border-t border-white/10 pt-2 text-[10px] leading-relaxed">
                                                ※ 체험판은 프로그램 내에 기본 내장되어 작동하므로, 구매자에게 별도의 라이선스 키를 발급/전달할 필요가 없습니다. (Kmong ID 및 판매 대금 등록 완료)
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setGeneratedKey('')}
                                            fullWidth
                                            className="bg-white text-emerald-800 hover:bg-slate-50 h-10 font-bold text-xs rounded-xl"
                                        >
                                            확인
                                        </Button>
                                    </Card>
                                ) : (
                                    <Card className={`${generatedKey.startsWith('TEST-') ? 'bg-emerald-600' : 'bg-indigo-600'} text-white p-6 space-y-4 shadow-lg rounded-2xl border-none`}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                                                {generatedKey.startsWith('TEST-') ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                            </div>
                                            <h4 className="font-black text-sm">
                                                {generatedKey.startsWith('TEST-') ? '테스트 라이선스 키 발급 완료' : '정식 라이선스 발급 완료'}
                                            </h4>
                                        </div>
                                        <div className="rounded-xl bg-white/10 p-4 text-center">
                                            <p className="font-mono text-base font-black tracking-wider">{generatedKey}</p>
                                        </div>
                                        <Button
                                            onClick={() => { navigator.clipboard.writeText(generatedKey); alert('Copy Success!'); }}
                                            fullWidth
                                            className="bg-white text-slate-900 hover:bg-slate-50 h-12 font-bold text-xs rounded-xl"
                                        >
                                            <Copy className="mr-2 h-4 w-4" /> 키 복사하기
                                        </Button>
                                    </Card>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>


                    {/* Interactive Pricing Policy Table with Tabs and Accordions */}
                    <Card className="p-0 overflow-hidden bg-white border border-slate-200 shadow-[0_15px_45px_rgba(0,0,0,0.07)] rounded-2xl">
                        <CardHeader className="px-5 py-2 border-b-2 border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
                            <CardTitle className="text-sm font-black text-white flex items-center gap-1.5">
                                📋 3Monster 제품별 가격표
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            {/* Category Tabs */}
                            <div className="flex gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('marketing'); setExpandedProductId('NPlace-DB'); }}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer border-none outline-none focus:outline-none",
                                        activeTab === 'marketing'
                                            ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)] scale-[1.01]"
                                            : "text-slate-650 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    마케팅몬스터
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setActiveTab('cafe'); setExpandedProductId('CafeCrawler'); }}
                                    className={cn(
                                        "flex-1 py-2.5 text-xs font-black rounded-lg transition-all cursor-pointer border-none outline-none focus:outline-none",
                                        activeTab === 'cafe'
                                            ? "bg-indigo-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)] scale-[1.01]"
                                            : "text-slate-655 hover:text-slate-900 hover:bg-white/50"
                                    )}
                                >
                                    카페몬스터
                                </button>
                            </div>

                            {/* Product Accordion List */}
                            <div className="space-y-2.5">
                                {pricingProducts[activeTab].map((prod) => {
                                    const isExpanded = expandedProductId === prod.id;
                                    const prodPricing = pricing.filter(p => p.product === prod.id);

                                    return (
                                        <div key={prod.id} className={cn(
                                            "border rounded-xl overflow-hidden bg-white transition-all duration-200",
                                            isExpanded
                                                ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/10"
                                                : "border-slate-300 hover:border-slate-400 shadow-sm"
                                        )}>
                                            {/* Accordion Trigger Header */}
                                            <button
                                                type="button"
                                                onClick={() => setExpandedProductId(isExpanded ? '' : prod.id)}
                                                className={cn(
                                                    "w-full px-4 py-3 text-left font-black text-xs text-slate-800 transition-colors flex items-center justify-between border-none",
                                                    isExpanded ? "bg-indigo-50/50 border-b border-indigo-100" : "bg-slate-50 hover:bg-slate-100/70"
                                                )}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-slate-850 text-xs">{prod.name}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold">{prod.desc}</span>
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded shrink-0",
                                                    prodPricing.some(p => p.status === '확정')
                                                        ? "bg-emerald-600 text-white shadow-sm"
                                                        : "bg-slate-200 text-slate-700"
                                                )}>
                                                    {prodPricing.some(p => p.status === '확정') ? '출시 확정' : '준비 중'}
                                                </span>
                                            </button>

                                            {/* Accordion Content showing prices */}
                                            {isExpanded && (
                                                <div className="p-4 space-y-3 bg-white divide-y divide-slate-100 animate-in slide-in-from-top-1 duration-150">
                                                    {prodPricing.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between gap-2 text-xs pt-2.5 first:pt-0 border-none">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-700">{item.label}</span>
                                                                <span className="text-[9px] text-slate-450 font-mono uppercase">{item.pkg}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                <div className="relative flex items-center">
                                                                    <input
                                                                        type="text"
                                                                        className="w-20 h-7 text-right pr-4 pl-1 font-bold border border-slate-300 rounded text-slate-850 focus:border-indigo-500 focus:outline-none text-[11px]"
                                                                        value={formatPrice(item.price)}
                                                                        onChange={(e) => handleUpdatePrice(item.id, Number(parsePrice(e.target.value)) || 0)}
                                                                    />
                                                                    <span className="absolute right-1 text-[9px] text-slate-400 font-bold pointer-events-none">원</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleStatus(item.id)}
                                                                    className={cn(
                                                                        "px-2.5 py-1 rounded text-[10px] font-black transition-all cursor-pointer text-white shadow-sm border-none shrink-0",
                                                                        item.status === '확정'
                                                                            ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                                                                            : "bg-amber-500 hover:bg-amber-600 active:scale-95"
                                                                    )}
                                                                >
                                                                    {item.status}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
