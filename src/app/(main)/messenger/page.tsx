/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { userApi } from '@/api/user';
import { useAuth } from '@/context/auth-context';
import { Conversation, Message, ConversationType, SendMessageDto } from '@/interface';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSubscription } from '@apollo/client';
import { MESSAGE_SENT_SUBSCRIPTION, MESSAGES_READ_SUBSCRIPTION } from '@/lib/graphql/subcriptions/messengerSubscriptions';
import { Textarea } from '@/components/ui/textarea';

const MessengerPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'shipper'>('shop');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Subscription for new messages with better debugging - modified to match restaurant version
  const { data: newMessageData, loading: subscriptionLoading, error: subscriptionError } = useSubscription(
    MESSAGE_SENT_SUBSCRIPTION,
    {
      variables: { conversationId: selectedConversation?.id || '' },
      skip: !selectedConversation?.id,
      onError: (err) => {
        console.error('💥 Subscription error:', err);
        setConnectionError('Failed to connect to real-time messaging');
      },
      onData: ({ data }) => {
        console.log('📨 New message received:', data.data);
        if (data.data?.messageSent) {
          const newMsg = data.data.messageSent;
          
          // Enable auto-scroll for new incoming messages
          setShouldAutoScroll(true);
          
          // Add message to current conversation messages with proper deduplication
          setMessages(prev => {
            // Check if message already exists by ID to prevent duplicates
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) {
              console.log('🔄 Message already exists, skipping:', newMsg.id);
              return prev;
            }
            
            // Also check for temporary messages that may need replacement
            const hasTempVersion = prev.some(msg => 
              msg.id.startsWith('temp_') && 
              msg.content === newMsg.content && 
              msg.sender.id === newMsg.sender.id
            );
            
            if (hasTempVersion) {
              console.log('🔄 Replacing temp message with real message:', newMsg.id);
              return prev.map(msg => 
                (msg.id.startsWith('temp_') && 
                 msg.content === newMsg.content && 
                 msg.sender.id === newMsg.sender.id) 
                  ? newMsg 
                  : msg
              );
            }
            
            console.log('✅ Adding new message to UI:', newMsg.id);
            return [...prev, newMsg];
          });
          
          // Update conversation last message
          setConversations(prev => prev.map(conv => 
            conv.id === newMsg.conversation.id 
              ? { 
                  ...conv, 
                  lastMessage: newMsg.content, 
                  lastMessageAt: new Date(newMsg.createdAt) 
                }
              : conv
          ));
        }
      },
    }
  );

  // Subscription for read receipts - also updated to match restaurant version
  const { data: messagesReadData } = useSubscription(MESSAGES_READ_SUBSCRIPTION, {
    variables: { conversationId: selectedConversation?.id || '' },
    skip: !selectedConversation?.id,
    onError: (error) => {
      console.error('Read receipts subscription error:', error);
    },
    onData: ({ data }) => {
      console.log('📖 Read receipt received:', data);
      if (data.data?.messagesRead) {
        setMessages(prev => prev.map(msg => 
          msg.sender.id === user?.id ? { ...msg, isRead: true, readAt: new Date() } : msg
        ));
      }
    }
  });

  // Debug subscription status
  useEffect(() => {
    console.log('🔍 Subscription status:', {
      selectedConversationId: selectedConversation?.id,
      hasToken: !!token,
      subscriptionLoading,
      subscriptionError,
      connectionError
    });
  }, [selectedConversation?.id, token, subscriptionLoading, subscriptionError, connectionError]);

  const loadConversations = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await userApi.messenger.getUserConversations(token);
      const filteredConversations = response.items.filter(conv => {
        if (activeTab === 'shop') {
          return conv.conversationType === ConversationType.CUSTOMER_SHOP;
        } else {
          return conv.conversationType === ConversationType.CUSTOMER_SHIPPER;
        }
      });
      setConversations(filteredConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [token, activeTab]);

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!token) return;
    
    try {
      console.log('📥 Loading messages for conversation:', conversationId);
      // Clear existing messages first to avoid any potential duplicates
      setMessages([]);
      const response = await userApi.messenger.getConversationMessages(token, conversationId);
      console.log('📥 Loaded messages:', response.items);
      
      // Ensure we have unique message IDs
      const uniqueMessages = Array.from(
        new Map(response.items.map(item => [item.id, item])).values()
      );
      
      setMessages(uniqueMessages);
      await userApi.messenger.markMessagesAsRead(token, conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [token]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage || !token || !user) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}`;
    
    try {
      setSendingMessage(true);
      setShouldAutoScroll(true); // Enable auto-scroll for new messages
      
      // Add optimistic message immediately
      const tempMessage: Message = {
        id: tempId,
        content: messageContent,
        sender: user,
        conversation: selectedConversation,
        messageType: 'text',
        isRead: false,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('🚀 Adding optimistic message:', tempMessage);
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');

      // Send to backend
      const messageData: SendMessageDto = {
        conversationId: selectedConversation.id,
        content: messageContent,
        messageType: 'text'
      };

      console.log('📤 Sending message to backend...');
      const sentMessage = await userApi.messenger.sendMessage(token, messageData);
      console.log('✅ Message sent successfully:', sentMessage);
      
      // Replace temp message with real message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? sentMessage : msg
        )
      );

    } catch (error) {
      console.error('❌ Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageContent); // Restore message text
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation, sendingMessage, token, user]);

  // Clear connection error when token changes
  useEffect(() => {
    if (token) {
      setConnectionError(null);
    }
  }, [token]);

  // Load conversations when component mounts or tab changes
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Modified auto-scroll effect – only scroll when shouldAutoScroll is true
  useEffect(() => {
    if (shouldAutoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, shouldAutoScroll]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    return conversation.participant1.id === user?.id 
      ? conversation.participant2 
      : conversation.participant1;
  }, [user?.id]);

  const formatTime = useCallback((date: Date | string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: vi 
    });
  }, []);

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    console.log('🔄 Selecting conversation:', conversation.id);
    // Ensure auto-scroll remains off on select
    setShouldAutoScroll(false);
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  }, [loadMessages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tin nhắn</h1>
          <p className="text-gray-600 mt-2">Trò chuyện với cửa hàng và shipper</p>
          
          {/* Connection Status */}
          <div className="mt-2 flex items-center space-x-4 text-sm">
            <div className={`flex items-center space-x-1 ${
                  subscriptionLoading ? 'text-yellow-600' : 
                  subscriptionError ? 'text-red-600' : 'text-green-600'
                }`}>
              <div className={`w-2 h-2 rounded-full ${
                loading ? 'bg-yellow-400' : 
                subscriptionError ? 'bg-red-400' : 'bg-green-400'
              }`}></div>
              <span>
                {subscriptionLoading ? 'Connecting...' : 
                 subscriptionError ? 'Disconnected' : 'Connected'}
              </span>
            </div>
            {selectedConversation && (
              <span className="text-gray-500">
                Conversation: {selectedConversation.id.slice(0, 8)}...
              </span>
            )}
          </div>
          
          {/* Connection Error Alert */}
          {connectionError && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-800">
                    {connectionError}. Tin nhắn mới có thể không hiển thị ngay lập tức.
                  </p>
                  <button 
                    onClick={() => {
                      setConnectionError(null);
                      window.location.reload();
                    }} 
                    className="text-sm text-yellow-800 underline hover:text-yellow-900"
                  >
                    Làm mới trang
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-200px)]">
          <div className="flex h-full">
            {/* Sidebar - Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex">
                  <button
                    onClick={() => setActiveTab('shop')}
                    className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
                      activeTab === 'shop'
                        ? 'border-orange-500 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      Cửa hàng
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('shipper')}
                    className={`flex-1 py-4 px-6 text-sm font-medium text-center border-b-2 transition-colors ${
                      activeTab === 'shipper'
                        ? 'border-orange-500 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Shipper
                    </div>
                  </button>
                </nav>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-6">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">Chưa có cuộc trò chuyện</p>
                    <p className="text-sm">
                      {activeTab === 'shop' 
                        ? 'Bắt đầu trò chuyện với cửa hàng khi đặt hàng' 
                        : 'Trò chuyện với shipper sẽ xuất hiện khi có đơn hàng'}
                    </p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const otherParticipant = getOtherParticipant(conversation);
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-orange-50 border-orange-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={otherParticipant.avatar || '/default-avatar.png'}
                              alt={otherParticipant.name}
                              className="w-12 h-12 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/default-avatar.png';
                              }}
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {otherParticipant.name}
                              </p>
                              {conversation.lastMessageAt && (
                                <p className="text-xs text-gray-500">
                                  {formatTime(conversation.lastMessageAt)}
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getOtherParticipant(selectedConversation).avatar || '/default-avatar.png'}
                        alt={getOtherParticipant(selectedConversation).name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/default-avatar.png';
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {getOtherParticipant(selectedConversation).name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {activeTab === 'shop' ? 'Cửa hàng' : 'Shipper'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
                  >
                    {messages.map((message) => {
                      const isOwn = message.sender.id === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                            isOwn 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}>
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center justify-between mt-1 ${
                              isOwn ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              <p className="text-xs">
                                {formatTime(message.createdAt)}
                              </p>
                              {isOwn && (
                                <div className="flex items-center space-x-1">
                                  {message.isRead && <span className="text-xs">✓✓</span>}
                                  {message.id.startsWith('temp_') && (
                                    <span className="text-xs opacity-60">⏳</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex space-x-4">
                      <div className="flex-1">
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Nhập tin nhắn..."
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={1}
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingMessage ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Chọn cuộc trò chuyện</h3>
                    <p className="text-gray-500">Chọn một cuộc trò chuyện từ danh sách để bắt đầu nhắn tin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessengerPage;