// src/context/CartContext.tsx
import { createContext, useReducer, useContext } from "react";
import type { ReactNode } from "react";

// ============================================================
// 1. 类型定义（从 ShoppingCart 复制）
// ============================================================

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

export type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: { id: number } }
  | { type: "INCREASE"; payload: { id: number } }
  | { type: "DECREASE"; payload: { id: number } }
  | { type: "CLEAR_CART" };

// ============================================================
// 2. Context 类型
// ============================================================

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
}

// ============================================================
// 3. 创建 Context
// ============================================================

const CartContext = createContext<CartContextType | null>(null);

// ============================================================
// 4. 初始状态（从 ShoppingCart 复制）
// ============================================================

const initialState: CartState = {
  items: [],
};

// ============================================================
// 5. Reducer（从 ShoppingCart 复制，完全一样）
// ============================================================

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const newItem: CartItem = {
        ...action.payload,
        quantity: 1,
      };
      const existing = state.items.find((item) => item.id === newItem.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, newItem],
      };
    }

    case "REMOVE_ITEM": {
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload.id),
      };
    }

    case "INCREASE": {
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      };
    }

    case "DECREASE": {
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity - 1 }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };
    }

    case "CLEAR_CART": {
      return {
        ...state,
        items: [],
      };
    }

    default: {
      return state;
    }
  }
};

// ============================================================
// 6. Provider 组件
// ============================================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

// ============================================================
// 7. 自定义 Hook（方便消费）
// ============================================================

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart 必须在 CartProvider 内使用");
  }
  return context;
}
