import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
    Key, 
    Search,
    Users as UsersIcon,
    XCircle,
    Award,
    Calendar,
    BarChart3,
    Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { format } from 'date-fns';

interface License {
    id: string;
    serial_key: string;
    product_id: string;
    buyer_name: string;
    status: 'active' | 'used' | 'unused' | 'expired' | 'blocked';
    expire_date: string;
    created_at: string;
    contact?: string;
    license_type?: string;
    price_sold?: number;
}

interface AppUser {
    id: string;
    uid?: string;
    email: string;
    name?: string;
    role?: string;
    channel?: string;
    created_at?: string;
}

export const Dashboard = () => {
    const [allLicenses, setAllLicenses] = useState<License[]>([]);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter and Search states for User list
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'buyer' | 'non-buyer' | 'admin'>('all');

    // Period stats state
    const [statPeriod, setStatPeriod] = useState<'daily' | 'monthly'>('daily');

    // Approve Modal states
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedUserForMapping, setSelectedUserForMapping] = useState<AppUser | null>(null);
    const [availableLicenses, setAvailableLicenses] = useState<License[]>([]);
    const [selectedLicenseId, setSelectedLicenseId] = useState('');
    const [licenseSearchTerm, setLicenseSearchTerm] = useState('');
    const [isLoadingLicenses, setIsLoadingLicenses] = useState(false);

    const fetchDashboardData = async () => {
        try {
            // Fetch Users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            if (usersError) throw usersError;
            setAllUsers(usersData || []);

            // Fetch Licenses
            const { data: licensesData, error: licensesError } = await supabase
                .from('licenses')
                .select('*')
                .order('created_at', { ascending: false });
            if (licensesError) throw licensesError;
            setAllLicenses(licensesData || []);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();

        // Realtime Subscriptions
        const channel = supabase
            .channel('dashboard-realtime-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'licenses' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchDashboardData())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 1. Calculate general stats
    const totalUsers = allUsers.length;
    const totalLicenses = allLicenses.length;

    // Upgraded/Loyal users (contacts with 2 or more licenses)
    const uniqueContacts = Array.from(new Set(allLicenses.map(l => l.contact?.toLowerCase()).filter(Boolean)));
    const upgradeCount = uniqueContacts.filter(email => {
        const userLicenses = allLicenses.filter(l => l.contact?.toLowerCase() === email);
        return userLicenses.length >= 2;
    }).length;

    // Stopped users (contacts who purchased in past but none is currently active/valid)
    const now = new Date();
    const stoppedCount = uniqueContacts.filter(email => {
        const userLicenses = allLicenses.filter(l => l.contact?.toLowerCase() === email);
        const hasActive = userLicenses.some(l => {
            const expireDate = l.expire_date ? new Date(l.expire_date) : null;
            const isExpired = expireDate && expireDate < now;
            return (l.status === 'active' || l.status === 'used') && !isExpired;
        });
        return !hasActive;
    }).length;

    // Product Normalizer for aggregation
    const normalizeProduct = (productId: string) => {
        if (!productId) return '기타 도구';
        const lower = productId.toLowerCase();
        if (lower === 'placedb' || lower === 'nplace-db' || lower === 'nplace_db') {
            return 'NPLace_DB';
        }
        if (lower === 'cafecrawler' || lower === 'cafe-crawler' || lower === 'cafe_crawler') {
            return '카페 크롤러';
        }
        return productId;
    };

    // 2. Aggregate counts & sales by product and package (license_type)
    const getProductPackageStats = () => {
        const stats: { [product: string]: { [pkg: string]: { count: number; sales: number } } } = {};
        
        allLicenses.forEach(lic => {
            const prod = normalizeProduct(lic.product_id);
            const pkg = lic.license_type || '기타';
            
            if (!stats[prod]) {
                stats[prod] = {};
            }
            if (!stats[prod][pkg]) {
                stats[prod][pkg] = { count: 0, sales: 0 };
            }
            
            stats[prod][pkg].count += 1;
            stats[prod][pkg].sales += lic.price_sold || 0;
        });

        const rows: { product: string; pkg: string; count: number; sales: number }[] = [];
        Object.keys(stats).forEach(prod => {
            Object.keys(stats[prod]).forEach(pkg => {
                rows.push({
                    product: prod,
                    pkg,
                    count: stats[prod][pkg].count,
                    sales: stats[prod][pkg].sales
                });
            });
        });

        // Sort: NPLace_DB first, then by package length/descending
        return rows.sort((a, b) => a.product.localeCompare(b.product) || b.pkg.localeCompare(a.pkg));
    };

    // 3. Period-based statistics (Daily/Monthly)
    const getDailyStats = () => {
        const daily: { [dateStr: string]: { count: number; sales: number } } = {};
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
            daily[dateStr] = { count: 0, sales: 0 };
        }

        allLicenses.forEach(lic => {
            if (!lic.created_at) return;
            const licDate = new Date(lic.created_at);
            const dateStr = licDate.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
            if (daily[dateStr] !== undefined) {
                daily[dateStr].count += 1;
                daily[dateStr].sales += lic.price_sold || 0;
            }
        });

        return Object.entries(daily).map(([date, data]) => ({ label: date, ...data }));
    };

    const getMonthlyStats = () => {
        const monthly: { [monthStr: string]: { count: number; sales: number } } = {};
        
        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthStr = d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' });
            monthly[monthStr] = { count: 0, sales: 0 };
        }

        allLicenses.forEach(lic => {
            if (!lic.created_at) return;
            const licDate = new Date(lic.created_at);
            const monthStr = licDate.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' });
            if (monthly[monthStr] !== undefined) {
                monthly[monthStr].count += 1;
                monthly[monthStr].sales += lic.price_sold || 0;
            }
        });

        return Object.entries(monthly).map(([month, data]) => ({ label: month, ...data }));
    };

    const periodData = statPeriod === 'daily' ? getDailyStats() : getMonthlyStats();
    const maxPeriodSales = Math.max(...periodData.map(d => d.sales || 1));

    // 4. Filter user list
    const filteredUsers = allUsers.filter(u => {
        const nameMatch = (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase());
        const emailMatch = (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase());
        const matchesSearch = nameMatch || emailMatch;

        if (userRoleFilter === 'all') return matchesSearch;

        const isBuyer = u.role === 'buyer' || allLicenses.some(l => l.contact?.toLowerCase() === u.email?.toLowerCase());
        const isAdminUser = u.role === 'admin';

        if (userRoleFilter === 'buyer') return matchesSearch && isBuyer && !isAdminUser;
        if (userRoleFilter === 'admin') return matchesSearch && isAdminUser;
        if (userRoleFilter === 'non-buyer') return matchesSearch && !isBuyer && !isAdminUser;

        return matchesSearch;
    });

    const getUserType = (u: AppUser) => {
        if (u.role === 'admin') {
            return { label: '관리자', color: 'bg-purple-50 text-purple-700 border-purple-200' };
        }
        const isBuyer = u.role === 'buyer' || allLicenses.some(l => l.contact?.toLowerCase() === u.email?.toLowerCase());
        if (isBuyer) {
            return { label: '구매자', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        }
        return { label: '비구매자', color: 'bg-slate-50 text-slate-500 border-slate-200' };
    };

    // 5. License Matching Actions
    const handleOpenApproveModal = async (userObj: AppUser) => {
        setSelectedUserForMapping(userObj);
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
            
            // Available licenses (contact matches user email OR contact is blank/null)
            const filtered = (data || []).filter(lic => {
                const hasNoEmail = !lic.contact || lic.contact.trim() === '';
                const isSameEmail = lic.contact?.toLowerCase() === userObj.email.toLowerCase();
                return hasNoEmail || isSameEmail;
            });

            setAvailableLicenses(filtered as License[]);
            
            // Auto-select exact matching buyer_name or contact
            const exactMatch = filtered.find(lic => 
                (lic.buyer_name && userObj.name && lic.buyer_name.toLowerCase() === userObj.name.toLowerCase()) ||
                (lic.contact && lic.contact.toLowerCase() === userObj.email.toLowerCase())
            );
            if (exactMatch) {
                setSelectedLicenseId(exactMatch.id);
            }
        } catch (err) {
            console.error("Error fetching licenses for mapping:", err);
        } finally {
            setIsLoadingLicenses(false);
        }
    };

    const handleApproveAndMap = async () => {
        if (!selectedUserForMapping) return;
        if (!selectedLicenseId) {
            alert("매칭할 라이선스를 선택해주세요.");
            return;
        }

        try {
            // 1. Map license email and name
            const { error: licError } = await supabase
                .from('licenses')
                .update({ 
                    contact: selectedUserForMapping.email.toLowerCase(),
                    buyer_name: selectedUserForMapping.name || selectedUserForMapping.email.split('@')[0]
                })
                .eq('id', selectedLicenseId);

            if (licError) throw licError;

            // 2. Update user role and channel to approve
            const nextChannel = selectedUserForMapping.channel 
                ? selectedUserForMapping.channel.replace(/\s*\(Pending\)/g, '') 
                : 'Direct';
            
            const { error: userError } = await supabase
                .from('users')
                .update({ 
                    role: 'buyer',
                    channel: nextChannel 
                })
                .eq('email', selectedUserForMapping.email);

            if (userError) throw userError;

            alert("라이선스 매칭 및 구매자 전환 승인이 완료되었습니다.");
            setIsApproveModalOpen(false);
            await fetchDashboardData();
        } catch (err: any) {
            console.error("Error mapping license to user:", err);
            alert(`승인 처리 중 오류 발생: ${err.message}`);
        }
    };

    const productPackageRows = getProductPackageStats();

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">관리자 대시보드</h1>
                <p className="text-slate-400 font-medium">서비스 이용 현황 및 통합 매출 통계 보드입니다.</p>
            </div>

            {/* General Stats KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="p-6 flex items-center gap-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                        <UsersIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">앱 가입 고객</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{totalUsers}명</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600">
                        <Key className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">발행 라이선스 수</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{totalLicenses}개</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                        <Award className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">업그레이드/재구매</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{upgradeCount}명</h3>
                    </div>
                </Card>
                <Card className="p-6 flex items-center gap-5 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-600">
                        <XCircle className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">이용 중단 고객</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{stoppedCount}명</h3>
                    </div>
                </Card>
            </div>

            {/* Split Content Columns */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                
                {/* Left Column (8 Units) */}
                <div className="xl:col-span-8 space-y-8">
                    
                    {/* Product & Package Sales Summary Card */}
                    <Card className="p-8 bg-white border-none shadow-sm rounded-3xl space-y-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-indigo-650" />
                            <h3 className="text-lg font-black text-slate-800">제품 및 패키지별 발행/판매 현황</h3>
                        </div>
                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/70">
                                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                                        <th className="px-6 py-4">제품군</th>
                                        <th className="px-6 py-4">패키지</th>
                                        <th className="px-6 py-4">발행 건수</th>
                                        <th className="px-6 py-4 text-right">총 판매액</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-semibold">
                                    {productPackageRows.length > 0 ? (
                                        productPackageRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-4 font-black text-slate-700">{row.product}</td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    <span className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                        {row.pkg}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-bold">{row.count}건</td>
                                                <td className="px-6 py-4 text-right text-indigo-600 font-black">{row.sales.toLocaleString()}원</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-slate-400 font-bold">집계 데이터가 존재하지 않습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* App Registered Users List Table */}
                    <Card className="p-8 bg-white border-none shadow-sm rounded-3xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <UsersIcon className="w-5 h-5 text-indigo-650" />
                                <h3 className="text-lg font-black text-slate-800">앱가입 고객 리스트</h3>
                            </div>

                            {/* Search and Filters */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-52">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="이름 또는 이메일 검색..."
                                        value={userSearchTerm}
                                        onChange={e => setUserSearchTerm(e.target.value)}
                                        className="pl-9 h-9 text-xs font-bold bg-slate-50 border-none rounded-xl"
                                    />
                                </div>
                                <select
                                    value={userRoleFilter}
                                    onChange={e => setUserRoleFilter(e.target.value as any)}
                                    className="h-9 px-3 text-xs font-bold bg-slate-50 border-none rounded-xl text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="all">구분 전체</option>
                                    <option value="buyer">구매자</option>
                                    <option value="non-buyer">비구매자</option>
                                    <option value="admin">관리자</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-hidden border border-slate-100 rounded-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/70">
                                    <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-left">
                                        <th className="px-6 py-4 w-12 text-center">번호</th>
                                        <th className="px-6 py-4">가입일자</th>
                                        <th className="px-6 py-4">이름</th>
                                        <th className="px-6 py-4">이메일</th>
                                        <th className="px-6 py-4">가입 경로</th>
                                        <th className="px-6 py-4">회원 구분</th>
                                        <th className="px-6 py-4 text-right">라이선스 제어</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-semibold">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map((u, idx) => {
                                            const type = getUserType(u);
                                            const isNonBuyer = type.label === '비구매자';
                                            return (
                                                <tr key={u.id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                                    <td className="px-6 py-4 text-slate-500 font-bold">
                                                        {u.created_at ? format(new Date(u.created_at), 'yyyy.MM.dd HH:mm') : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-black text-slate-700">{u.name || '이름 없음'}</td>
                                                    <td className="px-6 py-4 text-slate-600 font-mono">{u.email}</td>
                                                    <td className="px-6 py-4 text-slate-500">{u.channel || 'Direct'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn("px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider", type.color)}>
                                                            {type.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {u.role !== 'admin' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleOpenApproveModal(u)}
                                                                className={cn(
                                                                    "h-7 px-3 text-[10px] font-black rounded-lg transition-all",
                                                                    isNonBuyer
                                                                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-100"
                                                                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                                                                )}
                                                            >
                                                                {isNonBuyer ? "라이선스 매칭" : "추가 매칭"}
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-bold">가입 회원이 존재하지 않거나 검색 결과가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Column (4 Units) */}
                <div className="xl:col-span-4 space-y-8">
                    
                    {/* Period Sales Statistics Card */}
                    <Card className="p-8 bg-white border-none shadow-sm rounded-3xl space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-indigo-650" />
                                <h3 className="text-lg font-black text-slate-800">기간별 발행/판매 통계</h3>
                            </div>
                            
                            {/* Toggle switcher */}
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setStatPeriod('daily')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-black rounded-lg transition-all",
                                        statPeriod === 'daily' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    일별 (최근 7일)
                                </button>
                                <button
                                    onClick={() => setStatPeriod('monthly')}
                                    className={cn(
                                        "px-4 py-2 text-xs font-black rounded-lg transition-all",
                                        statPeriod === 'monthly' ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    월별 (최근 6개월)
                                </button>
                            </div>
                        </div>

                        {/* Period List with beautiful progress bar visual */}
                        <div className="space-y-4">
                            {periodData.map((item: any, idx: number) => {
                                const percentage = maxPeriodSales > 0 ? (item.sales / maxPeriodSales) * 100 : 0;
                                return (
                                    <div key={idx} className="space-y-1.5 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                            <span>{item.label}</span>
                                            <span className="text-indigo-650 font-black">
                                                {item.sales.toLocaleString()}원 <span className="text-[10px] text-slate-400 font-bold">({item.count}건)</span>
                                            </span>
                                        </div>
                                        {/* Progress Bar Container */}
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.max(3, percentage)}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Approve / Match License Modal */}
            <Modal
                isOpen={isApproveModalOpen}
                onClose={() => setIsApproveModalOpen(false)}
                title="구매자 수동 승인 및 라이선스 매칭"
                className="max-w-md bg-white border-none"
            >
                {selectedUserForMapping && (
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">대상 고객 정보</p>
                            <div className="flex items-center gap-3">
                                <img src={`https://ui-avatars.com/api/?name=${selectedUserForMapping.name || selectedUserForMapping.email}&background=EEF2FF&color=6366F1`} className="h-10 w-10 rounded-xl" alt={selectedUserForMapping.name} />
                                <div className="text-left">
                                    <p className="text-sm font-black text-slate-800">{selectedUserForMapping.name || '이름 없음'}</p>
                                    <p className="text-xs text-slate-400 font-semibold">{selectedUserForMapping.email}</p>
                                </div>
                            </div>
                            <div className="text-left mt-1">
                                <span className="text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                                    현재 역할: {selectedUserForMapping.role || 'user'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 text-left">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                매칭할 라이선스 검색 및 선택
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350" />
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
                                    className="w-full h-12 rounded-xl bg-slate-50 px-4 text-xs font-bold border-none outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none text-slate-800"
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
                                            [{normalizeProduct(lic.product_id)}] {lic.buyer_name || '미할당'} ({lic.serial_key ? lic.serial_key.substring(0, 8) + '...' : '시리얼 없음'})
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
