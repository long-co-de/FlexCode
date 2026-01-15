import { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AgentLayout from '@/Layouts/AgentLayout';
import Pagination from '@/Components/Pagination';
import TextInput from '@/Components/TextInput';
import Button from '@/Components/Button';
import InputError from '@/Components/InputError';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Messages({ auth, conversations, activeConversation, messages }) {
    const [messageText, setMessageText] = useState('');
    const messagesEndRef = useRef(null);

    const { post, processing, errors, reset,setData,data } = useForm({
        message: '',
        conversation_id: activeConversation?.id || '',
    });

    // Scroll to bottom of messages when they change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();

        post(route('agent.messages.send'), {
            data: {
                conversation_id: activeConversation?.id,
            },
            onSuccess: () => {
                setData('message','');
            },
        });
    };

    return (
        <AgentLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl igg-800 leading-tight">Customer Messages</h2>}
        >
            <Head title="Messages" />

            <div className="py-6">
                <div className="dashboard-card">
                    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)]">
                        {/* Conversations List */}
                        <div className="w-full md:w-1/3 border-r border-base-200 overflow-y-auto">
                            <div className="p-4 border-b border-base-200">
                                <h3 className="font-medium igg-800">Conversations</h3>
                            </div>

                            <div className="divide-y divide-base-200">
                                {conversations.length > 0 ? (
                                    conversations.map((conversation) => (
                                        <Link
                                            key={conversation.id}
                                            href={route('agent.messages.conversation', conversation.id)}
                                            className={`block p-4 hover:bg-base-100 transition-colors ${
                                                activeConversation?.id === conversation.id ? 'bg-base-100' : ''
                                            }`}
                                        >
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <UserCircleIcon className="h-10 w-10 igg-400" />
                                                </div>
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm font-medium igg-900">
                                                            {conversation.user?.name || 'Unknown User'}
                                                        </p>
                                                        <p className="text-xs igg-500">
                                                            {conversation.last_message_at}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm igg-500 truncate">
                                                        {conversation.last_message || 'No messages yet'}
                                                    </p>
                                                </div>
                                                {conversation.unread_count > 0 && (
                                                    <div className="ml-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                                                        {conversation.unread_count}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="p-4 text-center igg-500">
                                        No conversations found
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="w-full md:w-2/3 flex flex-col">
                            {activeConversation ? (
                                <>
                                    {/* Conversation Header */}
                                    <div className="p-4 border-b border-base-200 flex items-center">
                                        <UserCircleIcon className="h-8 w-8 igg-400 mr-3" />
                                        <div>
                                            <h3 className="font-medium igg-800">
                                                {activeConversation.user?.name || 'Unknown User'}
                                            </h3>
                                            <p className="text-xs igg-500">
                                                {activeConversation.user?.email || ''}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 p-4 overflow-y-auto">
                                        {messages.length > 0 ? (
                                            <div className="space-y-4">
                                                {messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${
                                                            message.is_from_user ? 'justify-start' : 'justify-end'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`max-w-[75%] rounded-lg p-3 ${
                                                                message.is_from_user
                                                                    ? 'bg-base-200 igg-800'
                                                                    : 'bg-primary text-white'
                                                            }`}
                                                        >
                                                            <p className="text-sm">{message.message}</p>
                                                            <p className="text-xs mt-1 opacity-70 text-right">
                                                                {message.created_at}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        ) : (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="text-center igg-500">
                                                    <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                    <p>No messages in this conversation yet.</p>
                                                    <p className="text-sm mt-1">Send a message to start the conversation.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-base-200">
                                        <form onSubmit={handleSubmit} className="flex items-center">
                                            <TextInput
                                                type="text"
                                                className="flex-1 mr-3"
                                                placeholder="Type your message..."
                                                value={data.message}
                                                onChange={(e) => setData('message',e.target.value)}
                                                required
                                            />
                                            <Button
                                                type="submit"
                                                processing={processing}
                                                disabled={!data.message.trim()}
                                            >
                                                <PaperAirplaneIcon className="h-5 w-5" />
                                            </Button>
                                        </form>
                                        <InputError message={errors.message} className="mt-2" />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center igg-500">
                                        <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                        <h3 className="text-lg font-medium mb-2">No Conversation Selected</h3>
                                        <p>Select a conversation from the list to view messages.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AgentLayout>
    );
}
