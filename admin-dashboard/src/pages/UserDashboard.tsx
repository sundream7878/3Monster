import React from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    Layers, 
    Smartphone, 
    Monitor, 
    Activity, 
    MessageSquare, 
    Download, 
    ExternalLink,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

const products = [
    {
        id: 'nplace-db',
        title: "NPlace-DB Pro",
        subtitle: "네이버 플레이스 정밀 수집기",
        description: "국내 유일의 Apollo State 파싱 엔진 탑재. 가장 정확하고 풍부한 플레이스 DB를 광속으로 수집합니다.",
        icon: Layers,
        color: "from-blue-600 to-indigo-700",
        tag: "Best Seller",
        features: ["이메일/인스타 자동 추출", "실시간 중복 필터링", "무제한 엑셀 저장"]
    },
    {
        id: 'cafe-crawler',
        title: "카페 크롤러",
        subtitle: "전방위 카페 마케팅 자동화",
        description: "게시글 수집부터 댓글 집계까지. 카페 마케팅에 필요한 모든 기능을 하나에 담았습니다.",
        icon: Smartphone,
        color: "from-orange-500 to-rose-600",
        tag: "Powerful",
        features: ["키워드 실시간 모니터링", "댓글 작성기 연동", "타겟팅 DB 확보"]
    },
    {
        id: 'paper-crawler',
        title: "페이퍼 크롤러",
        subtitle: "학술/논문 데이터 수집 전문",
        description: "전문 지식 마케팅을 위한 필수 도구. 방대한 학술 데이터를 분석하기 쉬운 형태로 변환합니다.",
        icon: Monitor,
        color: "from-emerald-500 to-teal-600",
        tag: "Professional",
        features: ["RISS/DBpia 지원", "요약본 자동 생성", "논문 마케팅 타겟팅"]
    },
    {
        id: 'stealth-comment',
        title: "스텔스 댓글",
        subtitle: "스마트 자동 댓글 솔루션",
        description: "봇 탐지를 우회하는 정교한 알고리즘. 자연스러운 상호작용으로 도달률을 극대화합니다.",
        icon: Activity,
        color: "from-pink-500 to-purple-600",
        tag: "Hot",
        features: ["휴먼 시뮬레이션", "다중 계정 관리", "맞춤형 답변 엔진"]
    }
];

export const UserDashboard = () => {
    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 px-6">
            {/* Hero Section / Support Entrance */}
            <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-black tracking-widest uppercase">
                        <ShieldCheck className="w-4 h-4" /> Trusted by 1,000+ Marketers
                    </div>
                    <h1 className="text-5xl font-black tracking-tight leading-tight">
                        반갑습니다! <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">마케팅 몬스터</span> 쇼룸입니다.
                    </h1>
                    <p className="text-slate-400 font-bold text-lg leading-relaxed">
                        사용 중인 프로그램에 문제가 있으신가요? <br />
                        인증된 유저만을 위한 1:1 기술지원 센터에서 바로 도와드리겠습니다.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                        <Button 
                            onClick={() => window.location.hash = '#/support'}
                            className="h-16 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl rounded-2xl shadow-indigo-500/20 shadow-2xl transition-all group"
                        >
                            <MessageSquare className="mr-3 w-6 h-6 group-hover:animate-bounce" /> 기술지원 게시판 이동
                        </Button>
                        <Button 
                            variant="outline"
                            className="h-16 px-10 border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-black text-xl rounded-2xl transition-all"
                        >
                            매뉴얼 보기
                        </Button>
                    </div>
                </div>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                <Zap className="absolute -bottom-10 -right-10 w-64 h-64 text-indigo-500/5 rotate-12" />
            </div>

            {/* Products Grid */}
            <div className="space-y-8">
                <div className="flex items-end justify-between">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">몬스터 제품 라인업</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Explore our powerful automation tools</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white h-full flex flex-col">
                                <div className={cn("h-4 p-0 w-full bg-gradient-to-r", product.color)} />
                                <div className="p-10 space-y-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-white shadow-lg", product.color)}>
                                            <product.icon className="w-8 h-8" />
                                        </div>
                                        <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tighter">
                                            {product.tag}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-2xl font-black text-slate-900">{product.title}</h3>
                                        <p className="text-indigo-600 font-black text-sm">{product.subtitle}</p>
                                        <p className="text-slate-500 font-bold text-sm leading-relaxed">
                                            {product.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {product.features.map(f => (
                                            <div key={f} className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                                                <div className="w-1 h-1 rounded-full bg-indigo-400" /> {f}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-6 mt-auto flex gap-3">
                                        <Button className="flex-1 h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-black transition-all">
                                            자세히 보기
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-12 w-12 border-2 border-slate-100 rounded-xl hover:bg-slate-50">
                                            <Download className="w-5 h-5 text-slate-400" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer Upsell */}
            <div className="text-center py-12 border-t border-slate-100">
                <p className="text-slate-400 font-bold mb-4">원하는 기능이 없으신가요?</p>
                <Button variant="ghost" className="text-indigo-600 font-black hover:bg-indigo-50 px-8 py-4 h-auto rounded-2xl">
                    커스텀 제작 문의하기 <ExternalLink className="ml-2 w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
