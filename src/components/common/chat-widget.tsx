'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

const isClient = typeof window !== 'undefined';
const sendSound = isClient ? new Audio('/sounds/send.mp3') : null;
const receiveSound = isClient ? new Audio('/sounds/receive.mp3') : null;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  type Message = {
    from: 'user' | 'bot';
    text?: string;
    foodCards?: {
      id: string;
      name: string;
      price: number;
      image: string;
      link: string;
    }[];
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const { getToken } = useAuth();
  const router = useRouter();

  const [metadata, setMetadata] = useState({
    orderItems: [],
    addresses: [],
    isOrdering: false,
    isFoodConfirmed: false,
    isRestaurantConfirmed: false,
    isAddressConfirmed: false,
    isPaymentConfirmed: false,
  });


  useEffect(() => {
    localStorage.setItem('metadata', JSON.stringify(metadata));
  }, [metadata]);
  // Hàm gửi tin nhắn và gửi metadata cho BE
  const sendMessage = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { from: 'user', text: input }]);
    sendSound?.play();
    setInput('');
    setIsTyping(true);

    try {
      const token = await getToken();
      if (!token) {
        console.error('[AUTH] Token không tồn tại!');
        throw new Error('Chưa đăng nhập hoặc token không tồn tại');
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userMessage: input, metadata }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Lỗi không xác định từ server');
      }

      const data = await res.json();
      console.log('[BOT REPLY]', data);

      const actualReply =
        typeof data.reply === 'string'
          ? data.reply
          : data.reply?.reply || 'Bot không trả lời được.';

      const actualSuggestions = Array.isArray(data.reply?.suggestions)
        ? data.reply.suggestions
        : Array.isArray(data.suggestions)
          ? data.suggestions
          : [];

      // Cập nhật messages với phản hồi từ bot
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: actualReply,
          foodCards: actualSuggestions,
        },
      ]);

      // Cập nhật metadata từ phản hồi của bot
      setMetadata((prev) => ({
        ...prev,
        isOrdering: data.metadata?.isOrdering ?? prev.isOrdering,
        isFoodConfirmed: data.metadata?.isFoodConfirmed ?? prev.isFoodConfirmed,
        isRestaurantConfirmed: data.metadata?.isRestaurantConfirmed ?? prev.isRestaurantConfirmed,
        isAddressConfirmed: data.metadata?.isAddressConfirmed ?? prev.isAddressConfirmed,
        isPaymentConfirmed: data.metadata?.isPaymentConfirmed ?? prev.isPaymentConfirmed,
        orderItems: data.metadata?.orderItems ?? prev.orderItems,
      }));

      receiveSound?.play();
    } catch (err) {
      // Kiểm tra nếu lỗi là đối tượng Error
      if (err instanceof Error) {
        console.log('[BOT ERROR]', err.message); // Lỗi từ exception
        console.log('[BOT ERROR STACK]', err.stack); // Stack trace của lỗi
      } else {
        // Nếu không phải lỗi thông thường, log đối tượng lỗi
        console.log('[BOT ERROR]', err);
      }
      
      // Cập nhật trạng thái tin nhắn lỗi
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Xin lỗi, đã có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.' },
      ]);
    }     finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, isTyping]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Khung chat */}
      <div
        className={`transition-all duration-300 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}
      >
        {open && (
          <div className="w-80 h-96 shadow-xl rounded-lg flex flex-col border border-[#9F6508] bg-gradient-to-br from-[#F3C871] to-[#FFF3B4]">
            {/* Header */}
            <div className="bg-[#9F6508] text-white p-3 font-semibold rounded-t-lg flex justify-between items-center">
              <span>💬 FoodieBot</span>
              <button onClick={() => setOpen(false)} className="text-sm font-light">✖</button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 p-2 overflow-y-auto text-sm space-y-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.from === 'bot' && (
                      <img
                        src="/bot-avatar.png"
                        alt="bot"
                        className="w-6 h-6 rounded-full border"
                      />
                    )}
                    <div
                      className={`max-w-[75%] p-2 rounded-md text-sm whitespace-normal break-normal
                        ${msg.from === 'user'
                          ? 'bg-white border border-[#F3C871] self-end mr-2'
                          : 'bg-white border border-[#9F6508] self-start ml-2'}`}
                    >
                      {msg.text}
                      {msg.foodCards && msg.foodCards.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {msg.foodCards.map((food, i) => (
                            <div
                              key={i}
                              onClick={() => router.push(food.link)}
                              className="flex gap-2 border border-[#F3C871] bg-white rounded-lg p-2 shadow-sm cursor-pointer hover:shadow-md transition"
                              title="Xem chi tiết món ăn"
                            >
                              <img
                                src={food.image}
                                alt={food.name}
                                className="w-14 h-14 rounded object-cover border"
                              />
                              <div className="flex flex-col justify-between text-sm">
                                <div className="font-semibold text-[#9F6508]">{food.name}</div>
                                <div className="text-gray-600">
                                  {Number(food.price).toLocaleString()}đ
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start text-sm italic text-gray-600 px-2">Bot đang trả lời...</div>
              )}
            </div>

            {/* Input */}
            <div className="p-2 border-t border-[#9F6508] flex gap-2 bg-white rounded-b-lg">
              <input
                type="text"
                className="flex-1 border rounded p-1 text-sm border-[#F3C871]"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage} className="text-[#9F6508] font-semibold text-sm">Gửi</button>
            </div>
          </div>
        )}
      </div>

      {/* Nút bong bóng chat */}
      {!open && (
        <button
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-gradient-to-br from-[#F3C871] to-[#9F6508] text-white text-xl transition-all duration-300"
          onClick={() => setOpen(true)}
        >
          💬
        </button>
      )}
    </div>
  );
}
