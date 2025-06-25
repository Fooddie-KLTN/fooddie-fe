/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { userApi } from '@/api/user';
import { useAuth } from '@/context/auth-context';
import { Conversation, Message, ConversationType, SendMessageDto } from '@/interface';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useSubscription } from '@apollo/client';
import { MESSAGE_SENT_SUBSCRIPTION, CONVERSATION_CREATED_SUBSCRIPTION, MESSAGES_READ_SUBSCRIPTION } from '@/lib/graphql/subcriptions/messengerSubscriptions';

const MessengerPage = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'shop' | 'shipper'>('shop');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscription for new messages in selected conversation
  const { data: newMessageData } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { conversationId: selectedConversation?.id || '' },
    skip: !selectedConversation?.id,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.messageSent) {
        const newMessage = subscriptionData.data.messageSent;
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          if (messageExists) return prev;
          return [...prev, newMessage];
        });
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === newMessage.conversation.id 
            ? { ...conv, lastMessage: newMessage.content, lastMessageAt: new Date(newMessage.createdAt) }
            : conv
        ));
      }
    }
  });

  // Subscription for new conversations
  const { data: newConversationData } = useSubscription(CONVERSATION_CREATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.conversationCreated) {
        const newConversation = subscriptionData.data.conversationCreated;
        const shouldShow = activeTab === 'shop' 
          ? newConversation.conversationType === ConversationType.CUSTOMER_SHOP
          : newConversation.conversationType === ConversationType.CUSTOMER_SHIPPER;
          
        if (shouldShow) {
          setConversations(prev => {
            const conversationExists = prev.some(conv => conv.id === newConversation.id);
            if (conversationExists) return prev;
            return [newConversation, ...prev];
          });
        }
      }
    }
  });

  // Subscription for read receipts
  const { data: messagesReadData } = useSubscription(MESSAGES_READ_SUBSCRIPTION, {
    variables: { conversationId: selectedConversation?.id || '' },
    skip: !selectedConversation?.id,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.messagesRead) {
        // Update message read status
        setMessages(prev => prev.map(msg => 
          msg.sender.id === user?.id ? { ...msg, isRead: true, readAt: new Date() } : msg
        ));
      }
    }
  });

  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await userApi.messenger.getUserConversations(token!);
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
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await userApi.messenger.getConversationMessages(token!, conversationId);
      setMessages(response.items);
      // Mark messages as read
      await userApi.messenger.markMessagesAsRead(token!, conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      const messageData: SendMessageDto = {
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
        messageType: 'text'
      };

       await userApi.messenger.sendMessage(token!, messageData);
      // Don't add to messages here - let the subscription handle it
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // If sending fails, we can add it locally as a fallback
      const tempMessage: Message = {
        id: Date.now().toString(),
        content: newMessage.trim(),
        sender: user!,
        conversation: selectedConversation,
        messageType: 'text',
        isRead: false,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant1.id === user?.id 
      ? conversation.participant2 
      : conversation.participant1;
  };

  const formatTime = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tin nhắn</h1>
          <p className="text-gray-600 mt-2">Trò chuyện với cửa hàng và shipper</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-200px)]">
          <div className="flex h-full">
            {/* Sidebar */}
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
                        onClick={() => {
                          setSelectedConversation(conversation);
                          loadMessages(conversation.id);
                        }}
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
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                        <textarea
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