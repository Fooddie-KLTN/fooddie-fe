"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onOpenChange}>
        {/* Overlay with blur and fade */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        {/* Sheet container */}
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              {children}
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface SheetContentProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  side?: "left" | "right";
}

export function SheetContent({
  children,
  className = "",
  side = "right",
}: SheetContentProps) {
  const isRight = side === "right";

  return (
    <Transition.Child
      as={Fragment}
      enter="transform transition ease-in-out duration-300"
      enterFrom={isRight ? "translate-x-full" : "-translate-x-full"}
      enterTo="translate-x-0"
      leave="transform transition ease-in-out duration-200"
      leaveFrom="translate-x-0"
      leaveTo={isRight ? "translate-x-full" : "-translate-x-full"}
    >
      <Dialog.Panel
        className={`pointer-events-auto w-screen max-w-md bg-gradient-to-br from-[#FFF3B4] via-[#F3C871] to-[#9F6508] text-brown-900 shadow-2xl rounded-l-xl ${className}`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-brown-800">🛒 Giỏ hàng của bạn</h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500 scrollbar-track-transparent">
            {children}
          </div>
        </div>
      </Dialog.Panel>
    </Transition.Child>
  );
}
