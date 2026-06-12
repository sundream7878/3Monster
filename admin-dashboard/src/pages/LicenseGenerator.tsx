import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Copy, Key, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const generateSerial = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segment = () => Array(4).fill(0).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    return `CM-${segment()}-${segment()}-${segment()}`;
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
    '1M': 30000,
    '3M': 90000,
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
                // Ensure only TRIAL, 6M, LIFETIME exist in pricing table (legacy filter check)
                if (Array.isArray(parsed) && parsed.every(p => ['TRIAL', '6M', 'LIFETIME'].includes(p.pkg))) {
                    return parsed;
                }
            } catch (e) {}
        }
        return [
            // 마케팅 몬스터
            { id: 1, product: 'NPlace-DB', pkg: 'TRIAL', label: 'DELUXE (5일 체험판)', price: 5000, status: '확정' },
            { id: 2, product: 'NPlace-DB', pkg: '6M', label: 'STANDARD (6개월 이용권)', price: 99000, status: '확정' },
            { id: 3, product: 'NPlace-DB', pkg: 'LIFETIME', label: 'PREMIUM (영구 소장본)', price: 198000, status: '확정' },
            { id: 4, product: 'ContentCrawler', pkg: 'TRIAL', label: 'DELUXE (5일 체험판)', price: 5000, status: '안' },
            { id: 5, product: 'ContentCrawler', pkg: '6M', label: 'STANDARD (6개월 이용권)', price: 99000, status: '안' },
            { id: 6, product: 'ContentCrawler', pkg: 'LIFETIME', label: 'PREMIUM (영구 소장본)', price: 198000, status: '안' },
            { id: 7, product: 'UserManager', pkg: 'TRIAL', label: 'DELUXE (5일 체험판)', price: 5000, status: '안' },
            { id: 8, product: 'UserManager', pkg: '6M', label: 'STANDARD (6개월 이용권)', price: 99000, status: '안' },
            { id: 9, product: 'UserManager', pkg: 'LIFETIME', label: 'PREMIUM (영구 소장본)', price: 198000, status: '안' },
            // 카페 몬스터
            { id: 10, product: 'CafeCrawler', pkg: 'TRIAL', label: 'DELUXE (5일 체험판)', price: 5000, status: '안' },
            { id: 11, product: 'CafeCrawler', pkg: '6M', label: 'STANDARD (6개월 이용권)', price: 99000, status: '안' },
            { id: 12, product: 'CafeCrawler', pkg: 'LIFETIME', label: 'PREMIUM (영구 소장본)', price: 198000, status: '안' },
            { id: 13, product: 'CommentStats', pkg: 'TRIAL', label: 'DELUXE (5일 체험판)', price: 5000, status: '안' },
            { id: 14, product: 'CommentStats', pkg: '6M', label: 'STANDARD (6개월 이용권)', price: 99000, status: '안' },
            { id: 15, product: 'CommentStats', pkg: 'LIFETIME', label: 'PREMIUM (영구 소장본)', price: 198000, status: '안' },
            { id: 16, product: 'EventStats', pkg: 'TRIAL', label: 'DELUXE (5일 체험판)', price: 5000, status: '안' },
            { id: 17, product: 'EventStats', pkg: '6M', label: 'STANDARD (6개월 이용권)', price: 99000, status: '안' },
            { id: 18, product: 'EventStats', pkg: 'LIFETIME', label: 'PREMIUM (영구 소장본)', price: 198000, status: '안' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('3monster_pricing_policies', JSON.stringify(pricing));
    }, [pricing]);

    // Accordion and Tab States
    const [activeTab, setActiveTab] = useState<'marketing' | 'cafe'>('marketing');
    const [expandedProductId, setExpandedProductId] = useState<string>('NPlace-DB');

    // Automatically expand the first product of the tab when it changes
    useEffect(() => {
        if (activeTab === 'marketing') {
            setExpandedProductId('NPlace-DB');
        } else {
            setExpandedProductId('CafeCrawler');
        }
    }, [activeTab]);

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
                    price_sold: Number(formData.price_sold) || 0
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
        <div className="max-w-[1200px] mx-auto space-y-6">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">신규 라이선스 생성</h1>
                <p className="text-xs text-slate-400 font-bold">구매자 정보를 입력하고 제품 인증키를 즉시 발행합니다.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-12 items-start">
                {/* Left Form Column */}
                <Card className="lg:col-span-7 p-0 overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
                    <CardHeader className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="text-lg font-black text-slate-900 tracking-tighter">라이선스 정보 입력</CardTitle>
                        <p className="text-xs text-slate-400 font-bold mt-1">각 항목을 정확히 입력해 주세요. 크몽 가격 정책과 연동됩니다.</p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-0.5">대상 제품 선택</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-12 rounded-xl bg-white px-4 text-sm font-bold border-2 border-slate-350 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer text-slate-900"
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
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-0.5">이용 기간 선택</label>
                                    <div className="relative">
                                        <select
                                            className="w-full h-12 rounded-xl bg-white px-4 text-sm font-bold border-2 border-slate-350 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer text-indigo-700"
                                            value={formData.license_type}
                                            onChange={(e) => handleLicenseTypeChange(e.target.value)}
                                        >
                                            <optgroup label="크몽 공식 3대 패키지">
                                                <option value="TRIAL">DELUXE (5일 체험판)</option>
                                                <option value="6M">STANDARD (6개월 이용권)</option>
                                                <option value="LIFETIME">PREMIUM (영구 소장본)</option>
                                            </optgroup>
                                            <optgroup label="어드민 전용 패키지">
                                                <option value="TEST">임시 테스트 (1일)</option>
                                                <option value="1M">1개월권</option>
                                                <option value="3M">3개월권</option>
                                                <option value="1Y">1년권</option>
                                            </optgroup>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronRight className="w-4 h-4 text-indigo-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-0.5">구매자 상세 정보 (성함/업체명)</label>
                                <Input
                                    required
                                    placeholder="구매자 정보를 입력하세요 (체험판/테스트 키인 경우 뒤에 접미사가 붙습니다)"
                                    className="h-12 bg-white border-2 border-slate-350 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 text-sm font-bold px-4 rounded-xl text-slate-900 placeholder:text-slate-300"
                                    value={formData.buyer_name}
                                    onChange={e => setFormData({ ...formData, buyer_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-0.5">연락처 / 채널</label>
                                    <div className="flex gap-2">
                                        <Input placeholder="연락처 (이메일 등)" className="h-12 bg-white border-2 border-slate-350 text-sm font-bold px-4 text-slate-900 rounded-xl flex-1" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                                        <select
                                            className="w-28 h-12 rounded-xl bg-white px-3 text-xs font-bold border-2 border-slate-350 outline-none text-slate-700"
                                            value={formData.channel}
                                            onChange={e => setFormData({ ...formData, channel: e.target.value })}
                                        >
                                            <option value="크몽">크몽</option>
                                            <option value="블로그">블로그</option>
                                            <option value="지인">지인</option>
                                            <option value="기타">기타</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-0.5">판매 가격 (KRW)</label>
                                    <Input placeholder="금액 입력" className="h-12 bg-white border-2 border-slate-350 text-sm font-bold px-4 text-slate-900 rounded-xl" value={formData.price_sold} onChange={e => setFormData({ ...formData, price_sold: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest ml-0.5">메모 (특이사항)</label>
                                <Input placeholder="관리용 메모 입력" className="h-12 bg-white border-2 border-slate-350 text-sm font-bold px-4 text-slate-900 rounded-xl" value={formData.memo} onChange={e => setFormData({ ...formData, memo: e.target.value })} />
                            </div>

                            <Button type="submit" className="w-full h-16 text-white font-black text-lg shadow-md hover:bg-indigo-700 active:scale-[0.99] transition-all bg-indigo-600 rounded-xl border-b-4 border-indigo-900" isLoading={loading}>
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
                                    <Card className="bg-emerald-600 text-white p-6 space-y-4 shadow-soft rounded-2xl border-none">
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
                                    <Card className={`${generatedKey.startsWith('TEST-') ? 'bg-emerald-600' : 'bg-indigo-600'} text-white p-6 space-y-4 shadow-soft rounded-2xl border-none`}>
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
                    {!generatedKey && (
                        <Card className="bg-slate-100/50 border-dashed border-2 border-slate-200 shadow-none flex flex-col items-center justify-center p-6 text-center gap-3 min-h-[120px] rounded-2xl">
                            <Key className="w-8 h-8 text-slate-350" />
                            <p className="text-slate-400 font-bold text-xs">정보를 입력하고 이용 기간을 선택하면<br />인증키가 생성됩니다.</p>
                        </Card>
                    )}

                    {/* Interactive Pricing Policy Table with Tabs and Accordions */}
                    <Card className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                                📋 3Monster 제품별 가격표
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold mt-1">
                                크몽 패키지 판매 스펙에 따라 가격을 관리합니다.
                            </p>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-150">
                            <button
                                type="button"
                                onClick={() => setActiveTab('marketing')}
                                className={cn(
                                    "flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer border-none",
                                    activeTab === 'marketing'
                                        ? "bg-white text-indigo-650 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                마케팅몬스터
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('cafe')}
                                className={cn(
                                    "flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer border-none",
                                    activeTab === 'cafe'
                                        ? "bg-white text-indigo-650 shadow-sm"
                                        : "text-slate-500 hover:text-slate-800"
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
                                    <div key={prod.id} className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-[0_2px_6px_rgba(0,0,0,0.015)]">
                                        {/* Accordion Trigger Header */}
                                        <button
                                            type="button"
                                            onClick={() => setExpandedProductId(isExpanded ? '' : prod.id)}
                                            className="w-full px-4 py-3 text-left font-black text-xs text-slate-800 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between border-none border-b border-slate-100"
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-black text-slate-850 text-xs">{prod.name}</span>
                                                <span className="text-[9px] text-slate-400 font-bold">{prod.desc}</span>
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black px-1.5 py-0.5 rounded shrink-0",
                                                prodPricing.some(p => p.status === '확정')
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-550"
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
                                                                    type="number"
                                                                    className="w-20 h-7 text-right pr-4 pl-1 font-bold border border-slate-250 rounded text-slate-850 focus:border-indigo-500 focus:outline-none text-[11px]"
                                                                    value={item.price}
                                                                    onChange={(e) => handleUpdatePrice(item.id, Number(e.target.value))}
                                                                />
                                                                <span className="absolute right-1 text-[9px] text-slate-400 font-bold pointer-events-none">원</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(item.id)}
                                                                className={cn(
                                                                    "px-2 py-0.5 rounded text-[10px] font-black border transition-all cursor-pointer",
                                                                    item.status === '확정'
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100/50"
                                                                        : "bg-amber-50 text-amber-600 border-amber-250 hover:bg-amber-100/50"
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
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-500 font-semibold space-y-1">
                            <p className="font-black text-slate-700 flex items-center gap-1">🛡️ 크몽 판매 패키지 가이드</p>
                            <p>• <b>DELUXE (5일 체험판)</b>: 5,000원 결제 유도 (리뷰 및 판매 건수 극대화)</p>
                            <p>• <b>STANDARD (6개월)</b>: 99,000원 결제 (월 1.6만 원 대체의 가성비)</p>
                            <p>• <b>PREMIUM (영구 소장)</b>: 198,000원 결제 (평생 무제한 사용 팩)</p>
                            <p>• 모든 스탠다드 이상 상품에는 <b>무상 엔진 업데이트 및 A/S</b>가 포함됩니다.</p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
