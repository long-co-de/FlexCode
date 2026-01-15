import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import {
    FaArrowLeft, FaClipboard, FaCheckCircle, FaClock, FaCoins,
    FaUsers, FaShare, FaWhatsapp, FaCheck, FaCopy
} from 'react-icons/fa';
import { GiMoneyStack as GiMoneybag } from 'react-icons/gi';

export default function ReferralIndex({ referralStats, referredUsers, referralEarnings, referralUrl }) {
    const { auth } = usePage().props;
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'code') {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } else {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        }
    };

    const shareToWhatsapp = () => {
        const message = `I'm using BorrowLite and it's amazing! 🚀 Get instant airtime, data, and loans with 4% earnings on referrals. Join with my code: ${referralStats.referral_code}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <AppLayout
            user={auth.user}
            header={
                <div className="flex items-center gap-4">
                    <Link
                        href={route('dashboard')}
                        className="text-base-content/60 hover:text-base-content transition-colors"
                    >
                        <FaArrowLeft className="text-lg" />
                    </Link>
                    <div>
                        <h2 className="text-xl font-bold text-base-content">Referral Program</h2>
                        <p className="text-sm text-base-content/60">Earn 4% on every friend's first deposit</p>
                    </div>
                </div>
            }
        >
            <Head title="Referral Program" />

            <div className="py-6 max-w-7xl mx-auto px-4 space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-base-content/60 uppercase tracking-widest">Your Code</h3>
                            <FaClipboard className="text-primary text-lg" />
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-black text-primary">{referralStats.referral_code}</p>
                            <button
                                onClick={() => copyToClipboard(referralStats.referral_code, 'code')}
                                className={`p-2 rounded-lg transition-all ${
                                    copiedCode
                                        ? 'bg-success/20 text-success'
                                        : 'bg-base-200 text-base-content/60 hover:bg-base-300'
                                }`}
                            >
                                {copiedCode ? <FaCheck className="text-sm" /> : <FaCopy className="text-sm" />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-base-content/60 uppercase tracking-widest">Users Referred</h3>
                            <FaUsers className="text-secondary text-lg" />
                        </div>
                        <p className="text-3xl font-black text-base-content mb-1">{referralStats.total_referred_users}</p>
                        <p className="text-xs text-success font-bold">{referralStats.active_referred_users} active</p>
                    </div>

                    <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-base-content/60 uppercase tracking-widest">Total Earnings</h3>
                            <GiMoneybag className="text-success text-lg" />
                        </div>
                        <p className="text-3xl font-black text-base-content">₦{Number(referralStats.total_earnings || 0).toLocaleString()}</p>
                        <p className="text-xs text-base-content/60 font-bold">Credited to wallet</p>
                    </div>

                    <div className="bg-base-100 p-6 rounded-[2rem] border border-base-300 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-base-content/60 uppercase tracking-widest">Pending</h3>
                            <FaClock className="text-warning text-lg" />
                        </div>
                        <p className="text-3xl font-black text-base-content">₦{Number(referralStats.pending_earnings || 0).toLocaleString()}</p>
                        <p className="text-xs text-base-content/60 font-bold">Awaiting deposits</p>
                    </div>
                </div>

                {/* Share Section */}
                <div className="bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-[2.5rem] p-8 border border-secondary/30 shadow-lg">
                    <div className="max-w-2xl">
                        <h3 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-3">
                            <FaShare className="text-secondary" />
                            Share Your Referral Link
                        </h3>

                        <div className="space-y-4 mb-6">
                            {/* Link Input */}
                            <div>
                                <label className="block text-sm font-bold text-base-content mb-2">Your Referral Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={referralUrl}
                                        readOnly
                                        className="flex-1 px-4 py-3 rounded-xl border border-base-300 bg-base-100 text-sm font-mono"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(referralUrl, 'url')}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                                            copiedUrl
                                                ? 'bg-success text-success-content'
                                                : 'bg-primary text-primary-content hover:bg-primary-focus'
                                        }`}
                                    >
                                        {copiedUrl ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                            </div>

                            {/* Share Buttons */}
                            <div className="flex gap-3 flex-wrap">
                                <button
                                    onClick={shareToWhatsapp}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm hover:bg-[#20BA5A] transition-all"
                                >
                                    <FaWhatsapp className="text-lg" />
                                    Share on WhatsApp
                                </button>
                                <button
                                    onClick={() => {
                                        const message = `Check out BorrowLite! Use my code ${referralStats.referral_code} to get started`;
                                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#1DA1F2] text-white rounded-xl font-bold text-sm hover:bg-[#1a8cd8] transition-all"
                                >
                                    Share on Twitter
                                </button>
                                <button
                                    onClick={() => {
                                        const message = `Check out BorrowLite! ${referralUrl}`;
                                        window.open(`mailto:?subject=Join%20BorrowLite&body=${encodeURIComponent(message)}`, '_blank');
                                    }}
                                    className="flex items-center gap-2 px-6 py-3 bg-base-300 text-base-content rounded-xl font-bold text-sm hover:bg-base-400 transition-all"
                                >
                                    Share via Email
                                </button>
                            </div>
                        </div>

                        <div className="bg-base-100/50 border border-base-300/50 rounded-xl p-4">
                            <p className="text-xs text-base-content/70">
                                💡 <strong>Tip:</strong> You earn 4% on every friend's first deposit! Share your code with friends and watch your earnings grow.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Referred Users Section */}
                <div className="bg-base-100 rounded-[2.5rem] shadow-sm border border-base-300 overflow-hidden">
                    <div className="px-8 py-6 border-b border-base-300">
                        <h3 className="text-lg font-bold text-base-content flex items-center gap-3">
                            <FaUsers className="text-secondary" />
                            Your Referrals ({referralStats.total_referred_users})
                        </h3>
                    </div>

                    <div className="p-8">
                        {referredUsers && referredUsers.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-base-300">
                                            <th className="text-left py-4 px-4 font-bold text-sm text-base-content/60 uppercase tracking-widest">Name</th>
                                            <th className="text-left py-4 px-4 font-bold text-sm text-base-content/60 uppercase tracking-widest">Email</th>
                                            <th className="text-left py-4 px-4 font-bold text-sm text-base-content/60 uppercase tracking-widest">Status</th>
                                            <th className="text-left py-4 px-4 font-bold text-sm text-base-content/60 uppercase tracking-widest">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referredUsers.map((user) => (
                                            <tr key={user.id} className="border-b border-base-300/50 hover:bg-base-200/30 transition-colors">
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <p className="font-bold text-base-content">{user.name}</p>
                                                        <p className="text-xs text-base-content/60">{user.phone_number || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-sm text-base-content/80">{user.email}</td>
                                                <td className="py-4 px-4">
                                                    {user.has_deposited ? (
                                                        <div className="flex items-center gap-2">
                                                            <FaCheckCircle className="text-success" />
                                                            <span className="text-xs font-bold text-success">Deposited</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <FaClock className="text-warning" />
                                                            <span className="text-xs font-bold text-warning">Pending</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4 text-sm text-base-content/60">
                                                    {new Date(user.created_at).toLocaleDateString('en-GB', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FaUsers className="text-base-content/20 text-4xl mx-auto mb-4" />
                                <p className="text-base-content/60 font-bold">No referrals yet</p>
                                <p className="text-sm text-base-content/50 mt-2">Start sharing your code to earn money!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Earnings History */}
                <div className="bg-base-100 rounded-[2.5rem] shadow-sm border border-base-300 overflow-hidden">
                    <div className="px-8 py-6 border-b border-base-300">
                        <h3 className="text-lg font-bold text-base-content flex items-center gap-3">
                            <FaCoins className="text-success" />
                            Referral Earnings History
                        </h3>
                    </div>

                    <div className="p-8">
                        {referralEarnings && referralEarnings.length > 0 ? (
                            <div className="space-y-4">
                                {referralEarnings.map((earning) => (
                                    <div
                                        key={earning.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-base-200/30 border border-base-300/50 hover:bg-base-200/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center">
                                                <FaCoins className="text-lg" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-base-content">{earning.referred_user}</p>
                                                <p className="text-xs text-base-content/60">
                                                    4% of ₦{Number(earning.deposit_amount).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-success text-lg">+₦{Number(earning.amount).toLocaleString()}</p>
                                            <p className="text-xs text-base-content/60">
                                                {new Date(earning.created_at).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <FaCoins className="text-base-content/20 text-4xl mx-auto mb-4" />
                                <p className="text-base-content/60 font-bold">No earnings yet</p>
                                <p className="text-sm text-base-content/50 mt-2">Your referral earnings will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
