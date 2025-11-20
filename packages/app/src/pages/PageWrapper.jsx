import { useMemo, useState, useEffect } from "react";
import { cartStore, UI_ACTIONS, uiStore } from "../stores";
import { CartModal, Footer, PublicImage, Toast } from "../components";

// 장바구니 모달 열기 핸들러
const close = () => {
  uiStore.dispatch({ type: UI_ACTIONS.OPEN_CART_MODAL });
};

export const PageWrapper = ({ headerLeft, children }) => {
  // store 상태를 useState로 관리하여 변경 시 리렌더 트리거
  const [cart, setCart] = useState(cartStore.getState());
  const [uiState, setUiState] = useState(uiStore.getState());
  const { cartModal, toast } = uiState;
  const cartSize = cart.items.length;

  // store 변경 구독
  useEffect(() => {
    // cartStore 구독
    const unsubscribeCart = cartStore.subscribe(() => {
      setCart(cartStore.getState());
    });

    // uiStore 구독
    const unsubscribeUI = uiStore.subscribe(() => {
      setUiState(uiStore.getState());
    });

    // cleanup: 언마운트 시 구독 해제
    return () => {
      unsubscribeCart();
      unsubscribeUI();
    };
  }, []);

  const cartCount = useMemo(
    () => (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {cartSize > 99 ? "99+" : cartSize}
      </span>
    ),
    [cartSize],
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {headerLeft}
            <div className="flex items-center space-x-2">
              {/* 장바구니 아이콘 */}
              <button
                id="cart-icon-btn"
                className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors"
                onClick={close}
              >
                <PublicImage src="/cart-header-icon.svg" alt="장바구니" className="w-6 h-6" />
                {cartSize > 0 && cartCount}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">{children}</main>

      <CartModal {...cart} isOpen={cartModal.isOpen} />

      <Toast {...toast} />

      <Footer />
    </div>
  );
};
