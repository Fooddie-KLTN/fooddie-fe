'use client';

import { useCheckout } from './_hook/checkout';
import { CartItemsSection } from './_components/cart-item-section';
import { AddressSection } from './_components/address-section';
import { PaymentSection } from './_components/payment-section';
import { OrderNoteSection } from './_components/order-note-section';
import { OrderSummary } from './_components/order-summary';
import { EmptyCart } from './_components/emty-cart';
import { useEffect, useState } from "react";
import { GuestPromotionResponse, guestService } from "@/api/guest";
import MapboxSearch from '@/components/mapbox-search';

export default function CheckoutPage() {
  const [promotions, setPromotions] = useState<GuestPromotionResponse[]>([]);
  const [selectedAddressType, setSelectedAddressType] = useState<"saved" | "custom">("saved");
  const [selectedAddress, setSelectedAddress] = useState<{
    full: string;
    latitude?: number;
    longitude?: number;
  } | null>(null);
  const {
    displayCartItems,
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
  } = useCheckout({
    selectedAddressType,
    selectedAddress,
  });


  useEffect(() => {
    guestService.promotion.getActivePromotions(1, 20).then(res => {
      setPromotions(res.items || []);
    });
  }, []);

  // Add this wrapper function
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setShowOnlineDropdown(false);
  };

  console.log('Display cart items', displayCartItems)
  const restaurantId = displayCartItems?.[0]?.restaurant.id;

  return (
    <div className="container mx-auto px-2 py-8 max-w-5xl min-h-screen">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-2">
        <h1 className="text-3xl font-bold">Thanh toán</h1>

        {displayCartItems?.length > 0 && (
          <a
            href={`/restaurant/${restaurantId}`}
            className="inline-flex items-center gap-2 rounded-md bg-[#9F6508] px-4 py-2 text-white font-semibold hover:text-primary hover:bg-white hover:border hover:border-black transition-colors"
          >
            ← Quay về cửa hàng
          </a>
        )}
      </div>
      {initialLoading ? (
        <div className="text-center py-10">Đang tải giỏ hàng...</div>
      ) : !displayCartItems || displayCartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          {/* LEFT: Address & Payment */}
          <div className="flex-1 flex flex-col gap-6">
            <CartItemsSection
              displayCartItems={displayCartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              formatPrice={formatPrice}
            />
          {/* Address Selector */}
          <div className="space-y-4">
            <div className="my-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="addressType"
                  value="saved"
                  checked={selectedAddressType === "saved"}
                  onChange={() => setSelectedAddressType("saved")}
                />
                Dùng địa chỉ đã lưu
              </label>
              <label className="flex items-center gap-2 text-sm mt-1">
                <input
                  type="radio"
                  name="addressType"
                  value="custom"
                  checked={selectedAddressType === "custom"}
                  onChange={() => setSelectedAddressType("custom")}
                />
                Nhập địa chỉ mới
              </label>
            </div>

            {selectedAddressType === "saved" && (
              <AddressSection
                userAddresses={userAddresses}
                selectedUserAddressId={selectedUserAddressId}
                onSetDefaultAddress={handleSetDefaultAddress}
              />
            )}

            {selectedAddressType === "custom" && (
              <div className="mt-4 space-y-2">
                <MapboxSearch
                  onAddressSelect={(address) => setSelectedAddress(address)}
                  placeholder="Nhập địa chỉ giao hàng mới..."
                />
                {selectedAddress && (
                  <div className="text-sm text-muted-foreground">
                    Đã chọn: {selectedAddress.full}
                  </div>
                )}
              </div>
            )}
          </div>

            <PaymentSection
              paymentMethod={paymentMethod}
              showOnlineDropdown={showOnlineDropdown}
              onPaymentMethodChange={handlePaymentMethodChange}
              onToggleDropdown={() => setShowOnlineDropdown((prev) => !prev)}
            />
            <OrderNoteSection
              orderNote={orderNote}
              onOrderNoteChange={setOrderNote}
            />
          </div>
          {/* RIGHT: Order Summary */}
          <div className="md:w-[380px] w-full">
            <OrderSummary
              displayCartItems={displayCartItems}
              totalPrice={calculation?.foodTotal ?? 0}
              shippingFee={calculation?.shippingFee ?? 0}
              distance={calculation?.distance ?? 0}
              total={calculation?.total ?? 0}
              calculating={calculating}
              selectedUserAddressId={selectedUserAddressId}
              onOrder={() => handleOrder(selectedAddressType, selectedAddress)}
              formatPrice={formatPrice}
              promotions={promotions}
              selectedPromotionCode={promotionCode}
              onSelectPromotion={setPromotionCode}
            />
          </div>
        </div>
      )}
    </div>
  );
}