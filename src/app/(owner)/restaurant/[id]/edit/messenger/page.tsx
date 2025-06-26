/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { userApi } from '@/api/user';
import { useAuth } from '@/context/auth-context';
import { Conversation, Message, ConversationType, SendMessageDto } from '@/interface';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useParams } from 'next/navigation';
import { MessageCircle, Send, Phone, User, Clock, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSubscription } from '@apollo/client';
import { MESSAGE_SENT_SUBSCRIPTION, MESSAGES_READ_SUBSCRIPTION } from '@/lib/graphql/subcriptions/messengerSubscriptions';
import { Textarea } from '@/components/ui/textarea';

const RestaurantMessengerPage = () => {
  const { user, getToken } = useAuth();
  const params = useParams();
  const restaurantId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Subscription for new messages in selected conversation
  const { data: newMessageData, error: messageError } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { conversationId: selectedConversation?.id || '' },
    skip: !selectedConversation?.id,
    onError: (error) => {
      console.error('Message subscription error:', error);
      setConnectionError('Failed to connect to real-time messaging');
    },
    onData: ({ data }) => {
      console.log('📨 New message received:', data.data);
      if (data.data?.messageSent) {
        const newMsg = data.data.messageSent;
        
        // Enable auto-scroll for new messages
        setShouldAutoScroll(true);
        
        // Add message to current conversation messages
        setMessages(prev => {
          // If the real message already exists, skip
          if (prev.some(msg => msg.id === newMsg.id)) {
            return prev;
          }
          // If a temp message with the same content and sender exists, replace it
          const hasTemp = prev.some(
            msg =>
              msg.id.startsWith('temp_') &&
              msg.content === newMsg.content &&
              msg.sender.id === newMsg.sender.id
          );
          if (hasTemp) {
            return prev.map(msg =>
              msg.id.startsWith('temp_') &&
              msg.content === newMsg.content &&
              msg.sender.id === newMsg.sender.id
                ? newMsg
                : msg
            );
          }
          // Otherwise, add the new message
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
  });

  // Subscription for read receipts
  const { data: messagesReadData, error: readError } = useSubscription(MESSAGES_READ_SUBSCRIPTION, {
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

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      
      const response = await userApi.messenger.getUserConversations(token);
      // Filter conversations related to this restaurant
      const restaurantConversations = response.items.filter(conv => 
        conv.conversationType === ConversationType.CUSTOMER_SHOP && 
        conv.restaurantId === restaurantId
      );
      setConversations(restaurantConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, restaurantId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await userApi.messenger.getConversationMessages(token, conversationId);
      console.log('Loaded messages:', response.items);
      setMessages(response.items);
      // Mark messages as read
      await userApi.messenger.markMessagesAsRead(token, conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, [getToken]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage || !user) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}`;

    try {
      setSendingMessage(true);
      setShouldAutoScroll(true); // Enable auto-scroll for new messages
      const token = await getToken();
      if (!token) return;

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

      const messageData: SendMessageDto = {
        conversationId: selectedConversation.id,
        content: messageContent,
        messageType: 'text'
      };

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
      // ✅ REMOVE the duplicate shouldAutoScroll trigger
    }
  }, [newMessage, selectedConversation, sendingMessage, user, getToken]);

  // Clear connection error when token changes
  useEffect(() => {
    const token = getToken();
    if (token) {
      setConnectionError(null);
    }
  }, [getToken]);

  // Load conversations when component mounts
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto-scroll to bottom when messages change
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

  const getCustomer = useCallback((conversation: Conversation) => {
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
    console.log('Selecting conversation:', conversation.id);
    setShouldAutoScroll(false);
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  }, [loadMessages]);

  const filteredConversations = conversations.filter(conv => {
    const customer = getCustomer(conv);
    return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Connection Error Alert */}
      {connectionError && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
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

      <div className="flex h-full">
        {/* Sidebar - Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Tin nhắn khách hàng</h2>
                  <p className="text-sm text-gray-500">{filteredConversations.length} cuộc trò chuyện</p>
                </div>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Tìm kiếm khách hàng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
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
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Chưa có tin nhắn</p>
                <p className="text-sm">
                  Khách hàng sẽ có thể nhắn tin cho nhà hàng khi đặt đơn hàng
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const customer = getCustomer(conversation);
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
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {customer.name}
                          </p>
                          {conversation.lastMessageAt && (
                            <p className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                          </p>
                          {customer.phone && (
                            <Phone className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {getCustomer(selectedConversation).name}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>Khách hàng</span>
                        {getCustomer(selectedConversation).phone && (
                          <>
                            <span>•</span>
                            <span>{getCustomer(selectedConversation).phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>Gọi</span>
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center space-x-1">
                      <Filter className="h-4 w-4" />
                    </Button>
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
                              <Clock className="h-3 w-3" />
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
                      placeholder="Nhập tin nhắn cho khách hàng..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={1}
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="bg-orange-100 p-6 rounded-full mx-auto mb-4 w-24 h-24 flex items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Chọn cuộc trò chuyện</h3>
                <p className="text-gray-500 max-w-sm">
                  Chọn một khách hàng từ danh sách bên trái để bắt đầu trò chuyện và hỗ trợ họ
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantMessengerPage;