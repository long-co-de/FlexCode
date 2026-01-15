import { 
    CreditCardIcon, 
    UserGroupIcon, 
    WalletIcon, 
    PhoneIcon,
    BanknotesIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';

export default function DashboardStats({ stats }) {
    // Format large numbers with commas
    const formatNumber = (num) => {
        return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    };

    // Format currency values
    const formatCurrency = (amount) => {
        return `₦${formatNumber(amount)}`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
                title="Total Users" 
                value={formatNumber(stats?.totalUsers)} 
                icon={<UserGroupIcon className="h-8 w-8 text-primary-500" />} 
                color="primary"
                subtitle="Registered accounts"
            />
            <StatCard 
                title="Total Transactions" 
                value={formatNumber(stats?.totalTransactions)} 
                icon={<CreditCardIcon className="h-8 w-8 text-green-500" />} 
                color="success"
                subtitle="All processed transactions"
            />
            <StatCard 
                title="Total Revenue" 
                value={formatCurrency(stats?.totalRevenue)} 
                icon={<BanknotesIcon className="h-8 w-8 text-yellow-500" />} 
                color="warning"
                subtitle="From successful transactions"
            />
            <StatCard 
                title="Users Wallet Balance" 
                value={formatCurrency(stats?.totalWalletBalance)} 
                icon={<WalletIcon className="h-8 w-8 text-purple-500" />} 
                color="purple"
                subtitle="Total funds in user wallets"
            />
        </div>
    );
}

function StatCard({ title, value, icon, color, subtitle }) {
    return (
        <div className={`dashboard-stat-card dashboard-stat-card-${color}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium igg-500">{title}</p>
                    <p className="text-2xl font-semibold mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-xs igg-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className="p-2 rounded-lg bg-opacity-10" style={{ backgroundColor: `var(--color-${color}-100, #f3f4f6)` }}>
                    {icon}
                </div>
            </div>
        </div>
    );
}