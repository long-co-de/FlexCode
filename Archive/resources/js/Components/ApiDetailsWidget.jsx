import React from 'react';
import { CurrencyDollarIcon, CreditCardIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function ApiDetailsWidget({ apiDetails }) {
    if (!apiDetails) {
        return (
            <div className="bg-base-100 p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-4">API Details</h3>
                <div className="flex justify-center items-center h-40">
                    <p className="igg-500">No API details available</p>
                </div>
            </div>
        );
    }

    const { balance, balanceError, virtualAccounts, virtualAccountError, lastChecked } = apiDetails;

    return (
        <div className="bg-base-100 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">API Details</h3>
                <span className="text-xs igg-500">Last updated: {lastChecked}</span>
            </div>

            {/* Balance Section */}
            <div className="mb-6">
                <h4 className="font-medium text-md mb-2 flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-primary" />
                    Husmodata Balance
                </h4>
                
                {balanceError ? (
                    <div className="alert alert-error text-sm">
                        <ExclamationCircleIcon className="h-5 w-5" />
                        <span>{balanceError}</span>
                    </div>
                ) : balance ? (
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Main Balance</div>
                            <div className="stat-value text-primary">₦{parseFloat(balance.balance || 0).toLocaleString()}</div>
                        </div>
                        
                        {balance.wallet_balance !== undefined && (
                            <div className="stat">
                                <div className="stat-title">Wallet Balance</div>
                                <div className="stat-value text-secondary">₦{parseFloat(balance.wallet_balance).toLocaleString()}</div>
                            </div>
                        )}
                        
                        {balance.bonus_balance !== undefined && (
                            <div className="stat">
                                <div className="stat-title">Bonus Balance</div>
                                <div className="stat-value text-accent">₦{parseFloat(balance.bonus_balance).toLocaleString()}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="alert alert-info">
                        <span>No balance information available</span>
                    </div>
                )}
            </div>

            {/* Virtual Accounts Section */}
            <div>
                <h4 className="font-medium text-md mb-2 flex items-center">
                    <CreditCardIcon className="h-5 w-5 mr-2 text-primary" />
                    Virtual Accounts
                </h4>
                
                {virtualAccountError ? (
                    <div className="alert alert-error text-sm">
                        <ExclamationCircleIcon className="h-5 w-5" />
                        <span>{virtualAccountError}</span>
                    </div>
                ) : virtualAccounts && virtualAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th>Bank</th>
                                    <th>Account Number</th>
                                    <th>Account Name</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {virtualAccounts.map((account, index) => (
                                    <tr key={index}>
                                        <td>{account.bank_name}</td>
                                        <td>{account.account_number}</td>
                                        <td>{account.account_name}</td>
                                        <td>
                                            <span className={`badge ${account.type === 'Reserved Account' ? 'badge-primary' : 'badge-secondary'}`}>
                                                {account.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="alert alert-info">
                        <span>No virtual accounts available</span>
                    </div>
                )}
            </div>
        </div>
    );
}