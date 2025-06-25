/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { MESSAGE_SENT_SUBSCRIPTION, CONVERSATION_CREATED_SUBSCRIPTION, MESSAGES_READ_SUBSCRIPTION } from '@/lib/graphql/subcriptions/messengerSubscriptions';


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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscription for new messages in selected conversation
  const { data: newMessageData } = useSubscription(MESSAGE_SENT_SUBSCRIPTION, {
    variables: { conversationId: selectedConversation?.id || '' },
    skip: !selectedConversation?.id,
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.messageSent) {
        const newMessage = subscriptionData.data.messageSent;
        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          if (messageExists) return prev;
          return [...prev, newMessage];
        });
        
        setConversations(prev => prev.map(conv => 
          conv.id === newMessage.conversation.id 
            ? { ...conv, lastMessage: newMessage.content, lastMessageAt: new Date(newMessage.createdAt) }
            : conv
        ));
      }
    }
  });

  // Subscription for new conversations related to this restaurant
  const { data: newConversationData } = useSubscription(CONVERSATION_CREATED_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data?.conversationCreated) {
        const newConversation = subscriptionData.data.conversationCreated;
        if (newConversation.conversationType === ConversationType.CUSTOMER_SHOP && 
            newConversation.restaurantId === restaurantId) {
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
    if (getToken()) {
      loadConversations();
    }
  }, [getToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
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
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const token = await getToken();
      if (!token) return;
      
      const response = await userApi.messenger.getConversationMessages(token, conversationId);
      setMessages(response.items);
      // Mark messages as read
      await userApi.messenger.markMessagesAsRead(token, conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    try {
      setSendingMessage(true);
      const token = await getToken();
      if (!token) return;

      const messageData: SendMessageDto = {
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
        messageType: 'text'
      };

       await userApi.messenger.sendMessage(token, messageData);
      
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
      
      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, lastMessage: newMessage.trim(), lastMessageAt: new Date() }
          : conv
      ));
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

  const getCustomer = (conversation: Conversation) => {
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

  const filteredConversations = conversations.filter(conv => {
    const customer = getCustomer(conv);
    return customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           customer.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-120px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                              <Clock className="h-3 w-3" />
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