import  { useState, useEffect } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import axios from 'axios';

export default function NotificationsIndex({ auth, userCounts }) {
    const [activeTab, setActiveTab] = useState('all');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        title: '',
        message: '',
        type: 'info',
        target: 'all',
        role: 'user',
        user_ids: [],
        action: '',
        action_url: '',
        bulk_criteria: 'active',
        bulk_value: '',
        bulk_operator: 'greater',
    });

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(route('admin.notifications.getUsers'), {
                params: {
                    search: searchTerm,
                    role: activeTab !== 'all' ? activeTab.slice(0, -1) : null,
                    page,
                }
            });
            setUsers(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                per_page: response.data.per_page,
                total: response.data.total,
            });
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data.target === 'individual') {
            fetchUsers();
        }
    }, [data.target, activeTab, searchTerm]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedUsers([]);
        setData('user_ids', []);
        
        if (data.target === 'individual') {
            fetchUsers(1);
        }
    };

    const handleTargetChange = (e) => {
        const target = e.target.value;
        setData('target', target);
        
        if (target === 'individual') {
            fetchUsers();
        } else {
            setSelectedUsers([]);
            setData('user_ids', []);
        }
        
        if (target !== 'bulk') {
            setData('bulk_criteria', 'active');
            setData('bulk_value', '');
            setData('bulk_operator', 'greater');
        }
    };

    const handleUserSelection = (userId) => {
        const isSelected = selectedUsers.includes(userId);
        let newSelectedUsers;
        
        if (isSelected) {
            newSelectedUsers = selectedUsers.filter(id => id !== userId);
        } else {
            newSelectedUsers = [...selectedUsers, userId];
        }
        
        setSelectedUsers(newSelectedUsers);
        setData('user_ids', newSelectedUsers);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1);
    };

    const handlePageChange = (page) => {
        fetchUsers(page);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.notifications.send'), {
            onSuccess: () => {
                reset();
                setSelectedUsers([]);
            },
        });
    };

    const getBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'badge-error';
            case 'agent': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="Send Notifications" />

            <div className="container py-4 mx-auto">
                <div className="flex flex-col">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold">Send Notifications</h1>
                            <Link
                                href={route('admin.notifications.history')}
                                className="px-4 py-2 bg-base-200 mm--200 igg-800 rounded-md hover:bg-base-200 mm--300"
                            >
                                View Notification History
                            </Link>
                        </div>
                        
                        <div className="card bg-base-100 shadow">
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Notification Title</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`input input-bordered ${errors.title ? 'input-error' : ''}`}
                                                value={data.title}
                                                onChange={e => setData('title', e.target.value)}
                                            />
                                            {errors.title && (
                                                <label className="label">
                                                    <span className="label-text-alt text-error">{errors.title}</span>
                                                </label>
                                            )}
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Notification Type</span>
                                            </label>
                                            <select
                                                className={`select select-bordered ${errors.type ? 'select-error' : ''}`}
                                                value={data.type}
                                                onChange={e => setData('type', e.target.value)}
                                            >
                                                <option value="info">Information</option>
                                                <option value="success">Success</option>
                                                <option value="warning">Warning</option>
                                                <option value="error">Error</option>
                                            </select>
                                            {errors.type && (
                                                <label className="label">
                                                    <span className="label-text-alt text-error">{errors.type}</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-control mb-6">
                                        <label className="label">
                                            <span className="label-text">Message</span>
                                        </label>
                                        <textarea
                                            className={`textarea textarea-bordered h-24 ${errors.message ? 'textarea-error' : ''}`}
                                            value={data.message}
                                            onChange={e => setData('message', e.target.value)}
                                        />
                                        {errors.message && (
                                            <label className="label">
                                                <span className="label-text-alt text-error">{errors.message}</span>
                                            </label>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Action Text (Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`input input-bordered ${errors.action ? 'input-error' : ''}`}
                                                value={data.action}
                                                onChange={e => setData('action', e.target.value)}
                                                placeholder="e.g., View Details"
                                            />
                                            {errors.action && (
                                                <label className="label">
                                                    <span className="label-text-alt text-error">{errors.action}</span>
                                                </label>
                                            )}
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">Action URL (Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`input input-bordered ${errors.action_url ? 'input-error' : ''}`}
                                                value={data.action_url}
                                                onChange={e => setData('action_url', e.target.value)}
                                                placeholder="e.g., /dashboard"
                                            />
                                            {errors.action_url && (
                                                <label className="label">
                                                    <span className="label-text-alt text-error">{errors.action_url}</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-control mb-6">
                                        <label className="label">
                                            <span className="label-text">Send To</span>
                                        </label>
                                        <select
                                            className={`select select-bordered ${errors.target ? 'select-error' : ''}`}
                                            value={data.target}
                                            onChange={handleTargetChange}
                                        >
                                            <option value="all">All Users ({userCounts.all})</option>
                                            <option value="role">Users by Role</option>
                                            <option value="individual">Selected Users</option>
                                            <option value="bulk">Bulk Selection</option>
                                        </select>
                                        {errors.target && (
                                            <label className="label">
                                                <span className="label-text-alt text-error">{errors.target}</span>
                                            </label>
                                        )}
                                    </div>

                                    {data.target === 'role' && (
                                        <div className="form-control mb-6">
                                            <label className="label">
                                                <span className="label-text">Select Role</span>
                                            </label>
                                            <select
                                                className={`select select-bordered ${errors.role ? 'select-error' : ''}`}
                                                value={data.role}
                                                onChange={e => setData('role', e.target.value)}
                                            >
                                                <option value="user">Regular Users ({userCounts.users})</option>
                                                <option value="agent">Agents ({userCounts.agents})</option>
                                                <option value="admin">Admins ({userCounts.admins})</option>
                                            </select>
                                            {errors.role && (
                                                <label className="label">
                                                    <span className="label-text-alt text-error">{errors.role}</span>
                                                </label>
                                            )}
                                        </div>
                                    )}
                                    
                                    {data.target === 'bulk' && (
                                        <div className="mb-6">
                                            <div className="form-control mb-4">
                                                <label className="label">
                                                    <span className="label-text">Bulk Selection Criteria</span>
                                                </label>
                                                <select
                                                    className={`select select-bordered ${errors.bulk_criteria ? 'select-error' : ''}`}
                                                    value={data.bulk_criteria}
                                                    onChange={e => setData('bulk_criteria', e.target.value)}
                                                >
                                                    <option value="active">Active Users (Email Verified)</option>
                                                    <option value="inactive">Inactive Users (Email Not Verified)</option>
                                                    <option value="recent">Recently Registered (Last 30 Days)</option>
                                                    <option value="wallet_balance">By Wallet Balance</option>
                                                </select>
                                                {errors.bulk_criteria && (
                                                    <label className="label">
                                                        <span className="label-text-alt text-error">{errors.bulk_criteria}</span>
                                                    </label>
                                                )}
                                            </div>
                                            
                                            {data.bulk_criteria === 'wallet_balance' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Operator</span>
                                                        </label>
                                                        <select
                                                            className={`select select-bordered ${errors.bulk_operator ? 'select-error' : ''}`}
                                                            value={data.bulk_operator}
                                                            onChange={e => setData('bulk_operator', e.target.value)}
                                                        >
                                                            <option value="greater">Greater Than</option>
                                                            <option value="less">Less Than</option>
                                                            <option value="equal">Equal To</option>
                                                        </select>
                                                        {errors.bulk_operator && (
                                                            <label className="label">
                                                                <span className="label-text-alt text-error">{errors.bulk_operator}</span>
                                                            </label>
                                                        )}
                                                    </div>
                                                    <div className="form-control">
                                                        <label className="label">
                                                            <span className="label-text">Value (₦)</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            className={`input input-bordered ${errors.bulk_value ? 'input-error' : ''}`}
                                                            value={data.bulk_value}
                                                            onChange={e => setData('bulk_value', e.target.value)}
                                                            placeholder="Enter amount"
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                        {errors.bulk_value && (
                                                            <label className="label">
                                                                <span className="label-text-alt text-error">{errors.bulk_value}</span>
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {data.target === 'individual' && (
                                        <div className="mb-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h5 className="text-lg font-medium">Select Users</h5>
                                                <span className="badge badge-primary">{selectedUsers.length} selected</span>
                                            </div>

                                            <div className="tabs">
                                                <a 
                                                    className={`tab tab-lg tab-lifted ${activeTab === 'all' ? 'tab-active' : ''}`}
                                                    onClick={() => handleTabChange('all')}
                                                >
                                                    All Users
                                                </a>
                                                <a 
                                                    className={`tab tab-lg tab-lifted ${activeTab === 'users' ? 'tab-active' : ''}`}
                                                    onClick={() => handleTabChange('users')}
                                                >
                                                    Regular Users ({userCounts.users})
                                                </a>
                                                <a 
                                                    className={`tab tab-lg tab-lifted ${activeTab === 'agents' ? 'tab-active' : ''}`}
                                                    onClick={() => handleTabChange('agents')}
                                                >
                                                    Agents ({userCounts.agents})
                                                </a>
                                                <a 
                                                    className={`tab tab-lg tab-lifted ${activeTab === 'admins' ? 'tab-active' : ''}`}
                                                    onClick={() => handleTabChange('admins')}
                                                >
                                                    Admins ({userCounts.admins})
                                                </a>
                                            </div>

                                            <div className="mt-4">
                                                <form onSubmit={handleSearch} className="mb-4">
                                                    <div className="join w-full">
                                                        <input
                                                            className="input input-bordered join-item w-full"
                                                            placeholder="Search by name, email or phone"
                                                            value={searchTerm}
                                                            onChange={e => setSearchTerm(e.target.value)}
                                                        />
                                                        <button type="submit" className="btn btn-primary join-item">
                                                            Search
                                                        </button>
                                                    </div>
                                                </form>

                                                {loading ? (
                                                    <div className="flex justify-center py-8">
                                                        <span className="loading loading-spinner loading-lg text-primary"></span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="overflow-x-auto">
                                                            <table className="table table-zebra">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="w-12"></th>
                                                                        <th>Name</th>
                                                                        <th>Email</th>
                                                                        <th>Phone</th>
                                                                        <th>Role</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {users.length > 0 ? (
                                                                        users.map(user => (
                                                                            <tr key={user.id}>
                                                                                <td>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="checkbox"
                                                                                        checked={selectedUsers.includes(user.id)}
                                                                                        onChange={() => handleUserSelection(user.id)}
                                                                                    />
                                                                                </td>
                                                                                <td>{user.name}</td>
                                                                                <td>{user.email}</td>
                                                                                <td>{user.phone_number}</td>
                                                                                <td>
                                                                                    <span className={`badge ${getBadgeColor(user.role)}`}>
                                                                                        {user.role}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="5" className="text-center py-8">
                                                                                No users found
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>

                                                        {pagination.last_page > 1 && (
                                                            <div className="flex justify-center mt-6">
                                                                <div className="join">
                                                                    {pagination.current_page > 1 && (
                                                                        <button 
                                                                            className="join-item btn"
                                                                            onClick={() => handlePageChange(pagination.current_page - 1)}
                                                                        >
                                                                            «
                                                                        </button>
                                                                    )}
                                                                    
                                                                    {[...Array(pagination.last_page).keys()].map(page => (
                                                                        <button
                                                                            key={page + 1}
                                                                            className={`join-item btn ${page + 1 === pagination.current_page ? 'btn-active' : ''}`}
                                                                            onClick={() => handlePageChange(page + 1)}
                                                                        >
                                                                            {page + 1}
                                                                        </button>
                                                                    ))}
                                                                    
                                                                    {pagination.current_page < pagination.last_page && (
                                                                        <button 
                                                                            className="join-item btn"
                                                                            onClick={() => handlePageChange(pagination.current_page + 1)}
                                                                        >
                                                                            »
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {errors.user_ids && (
                                                <div className="alert alert-error mt-4">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>{errors.user_ids}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className={`btn btn-primary px-8 ${processing ? 'loading' : ''}`}
                                            disabled={processing}
                                        >
                                            {processing ? '' : 'Send Notification'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}