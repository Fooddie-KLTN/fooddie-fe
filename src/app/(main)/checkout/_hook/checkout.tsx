/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useCart } from '@/context/cart-context';
import { useAuth } from '@/context/auth-context';
import { userApi } from '@/api/user';
import { Address } from '@/interface';
import { CalculateOrderResponse, OrderResponse } from '@/api/response.interface';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

interface UseCheckoutProps {
    selectedAddressType: "saved" | "custom";
    selectedAddress: {
      full: string;
      latitude?: number;
      longitude?: number;
    } | null;
  }

export const useCheckout =  ({ selectedAddressType, selectedAddress }: UseCheckoutProps) => {
    const searchParams = useSearchParams();
    const restaurantId = searchParams.get('restaurantId');

    const { cartItems, removeFromCart, updateQuantity, getCartItems, getTotalPrice } = useCart();
    const { user, getToken } = useAuth();
    const router = useRouter();

    const [displayCartItems, setDisplayCartItems] = useState<any[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [, setLoadingCart] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    const [userAddresses, setUserAddresses] = useState<Address[]>([]);
    const [selectedUserAddressId, setSelectedUserAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<string>('cod');
    const [showOnlineDropdown, setShowOnlineDropdown] = useState(false);
    const [orderNote, setOrderNote] = useState('');
    const [calculation, setCalculation] = useState<CalculateOrderResponse | null>(null);
    const [calculating, setCalculating] = useState(false);

    const [promotionCode, setPromotionCode] = useState<string | null>(null);

    useEffect(() => {
        const fetchCart = async () => {
            const items = await getCartItems();

            const filtered = restaurantId
              ? items.filter(item => item.restaurant?.id === restaurantId)
              : items;
            
            setDisplayCartItems(filtered);
            
            setTotalPrice(await getTotalPrice());
            setLoadingCart(false);
            if (initialLoading) setInitialLoading(false);
        };
        fetchCart();
    }, [cartItems, getCartItems, getTotalPrice, initialLoading]);

    useEffect(() => {
        const fetchUserAddresses = async () => {
            if (!user) return;
            try {
                const token = await getToken();
                if (!token) {
                    setUserAddresses([]);
                    return;
                }
                const profile = await userApi.getMe(token);
                setUserAddresses(profile?.address || []);
                for (const address of profile?.address || []) {
                    if (address.isDefault) {
                        setSelectedUserAddressId(address.id || null);
                        break;
                    }
                }
            } catch {
                setUserAddresses([]);
            }
        };
        fetchUserAddresses();
    }, [user, getToken]);
    useEffect(() => {
        const calc = async () => {
          const restaurantId = displayCartItems[0]?.restaurant?.id;
      
          if (
            !restaurantId ||
            displayCartItems.length === 0 ||
            (selectedAddressType === "saved" && !selectedUserAddressId) ||
            (selectedAddressType === "custom" && !selectedAddress?.full)
          ) {
            setCalculation(null);
            return;
          }
      
          setCalculating(true);
      
          try {
            const items = displayCartItems.map(item => ({
              foodId: item.foodId || item.id,
              quantity: item.quantity,
            }));
      
            const payload =
              selectedAddressType === "saved"
                ? await userApi.order.calculateOrder(
                    selectedUserAddressId!,
                    restaurantId,
                    items,
                    promotionCode || undefined
                  )
                : await userApi.order.calculateOrderWithCustomAddress(
                    {
                      ...parseAddress(selectedAddress!.full),
                      latitude: selectedAddress!.latitude ?? 0,  
                      longitude: selectedAddress!.longitude ?? 0,
                      label: "Địa chỉ mới",
                    },
                    restaurantId,
                    items,
                    promotionCode || undefined
                  )
                  
      
            setCalculation(payload);
          } catch (e) {
            console.error("Failed to calculate order:", e);
            setCalculation(null);
          }
      
          setCalculating(false);
        };
      
        calc();
      }, [
        displayCartItems,
        selectedUserAddressId,
        selectedAddress,
        selectedAddressType,
        promotionCode,
      ]);
      

    const handleSetDefaultAddress = (addressId: string) => {
        setUserAddresses(prev =>
            prev.map(addr => ({
                ...addr,
                isDefault: addr.id === addressId,
            }))
        );
        setSelectedUserAddressId(addressId);
    };

    const handleUpdateQuantity = (id: string, qty: number) => {
        updateQuantity(id, qty);
    };

    const handleRemoveFromCart = (id: string) => {
        removeFromCart(id);
    };

    function parseAddress(full: string) {
        const parts = full.split(',').map(p => p.trim());
        return {
          street: parts[0] || '',
          ward: parts[1] && parts[2] ? `${parts[1]}, ${parts[2]}` : (parts[1] || ''),
          district: parts[3] || '',
          city: parts[4] || '',
        };
      }
      
      const handleOrder = async (
        selectedAddressType: "saved" | "custom",
        selectedAddress: { full: string; latitude?: number; longitude?: number } | null
      ) => {
      
        if (!user || !selectedUserAddressId || displayCartItems.length === 0) return;

        const orderPayload = {
            userId: user.id,
            restaurantId: displayCartItems[0]?.restaurant?.id,
            total: totalPrice,
            note: orderNote,
            paymentMethod,
            ...(selectedAddressType === "saved"
              ? { addressId: selectedUserAddressId }
              : selectedAddress && {
                  address: {
                    ...parseAddress(selectedAddress.full),
                    latitude: selectedAddress.latitude,
                    longitude: selectedAddress.longitude,
                    label: "Địa chỉ mới",
                  }
                }
            ),
            orderDetails: displayCartItems.map(item => ({
              foodId: item.id,
              quantity: String(item.quantity),
              price: String(item.price),
              note: item.note || '',
            })),
          };

        try {
            const token = await getToken();
            if (!token) {
                console.error('User is not authenticated');
                return;
            }
            const response: OrderResponse = await userApi.order.createOrder(token, orderPayload);

            if (response.paymentUrl) {
                window.location.href = response.paymentUrl;
                return;
            }

            router.push(`/orders/${response.order.id}`);
        } catch (err) {
            console.error('Failed to create order:', err);
        }
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
    };

    return {
        displayCartItems,
        totalPrice,
        initialLoading,
        userAddresses,
        selectedUserAddressId,
        paymentMethod,
        showOnlineDropdown,
        orderNote,
        setPaymentMethod,
        setShowOnlineDropdown,
        setOrderNote,
        handleSetDefaultAddress,
        handleUpdateQuantity,
        handleRemoveFromCart,
        handleOrder,
        formatPrice,
        calculation,
        calculating,
        promotionCode,
        setPromotionCode,
    };
};