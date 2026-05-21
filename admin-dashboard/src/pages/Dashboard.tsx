import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronRight, Layers, Activity, Key, Smartphone, Monitor, Settings, Check, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const categories = [
    { label: "PlaceDB 수집", count: 5, icon: Layers, color: "bg-blue-100 text-blue-600" },
    { label: "카페 크롤러", count: 10, icon: Smartphone, color: "bg-orange-100 text-orange-600" },
    { label: "스텔스 댓글", count: 3, icon: Activity, color: "bg-pink-100 text-pink-600" },
    { label: "페이퍼 크롤러", count: 12, icon: Monitor, color: "bg-emerald-100 text-emerald-600" },
    { label: "기타 도구", count: 8, icon: Key, color: "bg-purple-100 text-purple-600" },
];

interface RecentLicense {
    name: string;
    type: string;
    status: string;
    statusColor: string;
}

interface RecentBuyer {
    name: string;
    email: string;
    channel: string;
}

export const Dashboard = () => {
    const [recentLicenses, setRecentLicenses] = useState<RecentLicense[]>([]);
    const [recentBuyers, setRecentBuyers] = useState<RecentBuyer[]>([]);

    // Approve Modal states
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedBuyer, setSelectedBuyer] = useState<RecentBuyer | null>(null);
    const [availableLicenses, setAvailableLicenses] = useState<any[]>([]);
    const [selectedLicenseId, setSelectedLicenseId] = useState('');
    const [licenseSearchTerm, setLicenseSearchTerm] = useState('');
    const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);

    const fetchDashboardData = async () => {
        // Fetch Recent Licenses
        const { data: licenses } = await supabase
            .from('licenses')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (licenses) {
            const mappedLicenses = licenses.map(item => {
                const expireDate = item.expire_date ? new Date(item.expire_date) : null;
                const isExpired = expireDate && expireDate < new Date();

                let status = "사용 가능";
                let statusColor = "bg-blue-500";

                if (item.status === 'blocked') {
                    status = "정지";
                    statusColor = "bg-gray-400";
                } else if (isExpired) {
                    status = "만료";
                    statusColor = "bg-rose-500";
                } else if (item.status === 'unused') {
                    status = "대기중";
                    statusColor = "bg-indigo-400";
                } else if (expireDate) {
                    const daysLeft = Math.ceil((expireDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 7) {
                        status = "만료 예정";
                        statusColor = "bg-orange-400";
                    }
                }

                return {
                    name: item.buyer_name || "Unknown",
                    type: item.product_id || "PlaceDB",
                    status,
                    statusColor
                };
            });
            setRecentLicenses(mappedLicenses);
        }

        // Fetch Recent Buyers
        const { data: buyers } = await supabase
            .from('buyers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (buyers) {
            setRecentBuyers(buyers.map(b => ({
                name: b.name,
                email: b.email,
                channel: b.channel || "Direct"
            })));
        }
    };

    const handleOpenApproveModal = async (buyer: RecentBuyer) => {
        setSelectedBuyer(buyer);
        setIsApproveModalOpen(true);
        setIsLoadingLicenses(true);
        setLicenseSearchTerm('');
        setSelectedLicenseId('');
        
        try {
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            const filtered = (data || []).filter(lic => {
                const hasNoEmail = !lic.email || lic.email.trim() === '';
                const isSameEmail = lic.email?.toLowerCase() === buyer.email.toLowerCase();
                return hasNoEmail || isSameEmail;
            });

            setAvailableLicenses(filtered);
            
            // Auto-select exact matching buyer_name
            const exactMatch = filtered.find(lic => 
                lic.buyer_name?.toLowerCase() === buyer.name.toLowerCase() ||
                lic.email?.toLowerCase() === buyer.email.toLowerCase()
            );
            if (exactMatch) {
                setSelectedLicenseId(exactMatch.id);
            }
        } catch (err) {
            console.error("Error fetching available licenses:", err);
        } finally {
            setIsLoadingLicenses(false);
        }
    };

    const handleApproveAndMap = async () => {
        if (!selectedBuyer) return;
        if (!selectedLicenseId) {
            alert("매칭할 라이선스를 선택해주세요.");
            return;
        }

        try {
            // 1. Map license email and name
            const { error: licError } = await supabase
                .from('licenses')
                .update({ 
                    email: selectedBuyer.email.toLowerCase(),
                    buyer_name: selectedBuyer.name
                })
                .eq('id', selectedLicenseId);

            if (licError) throw licError;

            // 2. Update buyer channel to approve
            const nextChannel = selectedBuyer.channel.replace(/\s*\(Pending\)/g, '');
            const { error: buyerError } = await supabase
                .from('buyers')
                .update({ channel: nextChannel })
                .eq('email', selectedBuyer.email);

            if (buyerError) throw buyerError;

            alert("라이선스 매칭 및 구매자 승인이 완료되었습니다.");
            setIsApproveModalOpen(false);
            await fetchDashboardData();
        } catch (err: any) {
            console.error("Error approving and mapping:", err);
            alert(`승인 처리 중 오류 발생: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Realtime Subscriptions
        const licenseChannel = supabase
            .channel('dashboard-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'buyers' }, () => fetchDashboardData())
            .subscribe();

        return () => {
            supabase.removeChannel(licenseChannel);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Middle Content Column (8 Units) */}
            <div className="xl:col-span-8 space-y-10">
                {/* Welcome Banner */}
                <Card className="banner-gradient p-0 overflow-hidden text-white relative h-64 shadow-premium">
                    <div className="p-10 flex flex-col justify-center h-full max-w-md relative z-10">
                        <h2 className="text-3xl font-black mb-3">좋은 아침입니다, 관리자님!</h2>
                        <p className="text-white/80 font-medium mb-6 leading-relaxed">라이선스 현황과 신규 구매자 내역을 한눈에 확인하세요.</p>
                        <Button variant="secondary" className="w-fit px-8 h-12 bg-white text-indigo-600" onClick={() => window.location.hash = '#/licenses'}>요청 내역 보기</Button>
                    </div>
                    <img
                        src="/dashboard_banner_illustration.webp"
                        alt="Welcome"
                        className="absolute right-0 bottom-0 h-[110%] object-contain pointer-events-none opacity-90"
                    />
                </Card>

                {/* Categories Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800">제품군별 현황</h3>
                        <Button variant="ghost" className="text-indigo-600 font-bold p-0">모두 보기</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {categories.map((cat) => (
                            <Card key={cat.label} className="p-6 flex flex-col items-center text-center gap-3 group hover:scale-105 transition-transform cursor-pointer">
                                <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", cat.color)}>
                                    <cat.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-slate-800 leading-tight mb-1">{cat.label}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">({cat.count} Candidates)</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Recruitment Progress Table */}
                <div className="space-y-6 pb-10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800">최근 발행 현황</h3>
                        <Button variant="ghost" className="text-indigo-600 font-bold p-0">전체 보기</Button>
                    </div>
                    <Card className="overflow-hidden p-0 border-none">
                        <table className="w-full">
                            <thead className="bg-slate-50/50">
                                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                                    <th className="px-8 py-5">구매자 성함</th>
                                    <th className="px-8 py-5">제품군</th>
                                    <th className="px-8 py-5">진행 상태</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {recentLicenses.length > 0 ? (
                                    recentLicenses.map((row, idx) => (
                                        <tr key={idx} className="group transition-colors hover:bg-slate-50/30">
                                            <td className="px-8 py-5 font-bold text-slate-700 text-sm">{row.name}</td>
                                            <td className="px-8 py-5 font-bold text-slate-500 text-sm">{row.type}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("h-2 w-2 rounded-full", row.statusColor)} />
                                                    <span className="text-sm font-bold text-slate-600">{row.status}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-8 py-10 text-center text-slate-400 text-sm font-medium">발행된 라이선스가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>

            {/* Right Sidebar Column (4 Units) */}
            <div className="xl:col-span-4 space-y-8">
                {/* New Licenses Area */}
                <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-slate-800">신규 구매자</h4>
                        <Button variant="ghost" className="text-indigo-600 font-bold p-0 h-auto">모두 보기</Button>
                    </div>
                    <div className="space-y-4">
                        {recentBuyers.length > 0 ? (
                            recentBuyers.map((user, i) => (
                                <div key={i} className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-white transition-colors">
                                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=EEF2FF&color=6366F1`} className="h-12 w-12 rounded-2xl" alt={user.name} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-slate-800 truncate">{user.name}</p>
                                            {user.channel.includes('Pending') && (
                                                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap animate-pulse">
                                                    승인 대기
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 font-bold mt-0.5 truncate">{user.email}</p>
                                        <p className="text-[10px] text-indigo-500 font-bold">Contact via {user.channel}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {user.channel.includes('Pending') ? (
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleOpenApproveModal(user)}
                                                className="h-8 px-3 text-xs font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center gap-1 shadow-sm"
                                            >
                                                <Check className="h-3.5 w-3.5" /> 승인
                                            </Button>
                                        ) : (
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 bg-indigo-50"><Settings className="h-3 w-3" /></Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600 bg-indigo-50"><ChevronRight className="h-3 w-3" /></Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-slate-400 font-bold text-center py-4">신규 구매자가 없습니다.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Approve Modal */}
            <Modal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                title="구매자 수동 승인 및 라이선스 매칭"
                className="max-w-md bg-white border-none"
            >
                {selectedBuyer && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                            <p className="text-xs text-slate-400 font-bold">신청 구매자 정보</p>
                            <div className="flex items-center gap-3">
                                <img src={`https://ui-avatars.com/api/?name=${selectedBuyer.name}&background=EEF2FF&color=6366F1`} className="h-10 w-10 rounded-xl" alt={selectedBuyer.name} />
                                <div className="text-left">
                                    <p className="text-sm font-black text-slate-800">{selectedBuyer.name}</p>
                                    <p className="text-xs text-slate-400 font-semibold">{selectedBuyer.email}</p>
                                </div>
                            </div>
                            <div className="text-left mt-1">
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg font-bold">
                                    가입 채널: {selectedBuyer.channel}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 text-left">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                매칭할 라이선스 검색 및 선택
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                <Input
                                    placeholder="구매자명, 제품명, 시리얼로 검색..."
                                    value={licenseSearchTerm}
                                    onChange={e => setLicenseSearchTerm(e.target.value)}
                                    className="pl-11 h-12 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>

                            {isLoadingLicenses ? (
                                <p className="text-xs text-slate-400 animate-pulse py-2 text-center">라이선스 목록 불러오는 중...</p>
                            ) : availableLicenses.filter(lic => 
                                (lic.buyer_name || '').toLowerCase().includes(licenseSearchTerm.toLowerCase()) ||
                                (lic.product_id || '').toLowerCase().includes(licenseSearchTerm.toLowerCase()) ||
                                (lic.serial_key || '').toLowerCase().includes(licenseSearchTerm.toLowerCase())
                            ).length > 0 ? (
                                <select
                                    required
                                    className="w-full h-12 rounded-xl bg-slate-50 px-4 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
                                    value={selectedLicenseId}
                                    onChange={e => setSelectedLicenseId(e.target.value)}
                                >
                                    <option value="">-- 매칭할 라이선스를 선택하세요 --</option>
                                    {availableLicenses.filter(lic => 
                                        (lic.buyer_name || '').toLowerCase().includes(licenseSearchTerm.toLowerCase()) ||
                                        (lic.product_id || '').toLowerCase().includes(licenseSearchTerm.toLowerCase()) ||
                                        (lic.serial_key || '').toLowerCase().includes(licenseSearchTerm.toLowerCase())
                                    ).map((lic) => (
                                        <option key={lic.id} value={lic.id}>
                                            [{lic.product_id}] {lic.buyer_name || '이름 없음'} ({lic.serial_key ? lic.serial_key.substring(0, 8) + '...' : '시리얼 없음'})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-xs text-rose-500 font-bold py-2 text-center">
                                    매칭 가능한 미할당 라이선스가 없습니다.
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={() => setIsApproveModalOpen(false)}
                                variant="ghost"
                                className="flex-1 h-12 rounded-xl text-slate-500 font-bold"
                            >
                                취소
                            </Button>
                            <Button
                                onClick={handleApproveAndMap}
                                disabled={!selectedLicenseId}
                                className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-100"
                            >
                                승인 및 매칭 완료
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
