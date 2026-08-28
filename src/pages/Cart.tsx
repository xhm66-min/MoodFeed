// src/pages/Cart.tsx
import { useCart } from "../context/CartContext";

function Cart() {
  const { state, dispatch } = useCart(); // 👈 从 Context 取数据

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const products = [
    { id: 1, name: "React 高级指南", price: 99 },
    { id: 2, name: "TypeScript 实战", price: 79 },
    { id: 3, name: "Vite 从入门到精通", price: 59 },
    { id: 4, name: "Tailwind 完全指南", price: 49 },
  ];

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}>
        🛒 购物车示例（useReducer + Context 全局）
      </h2>

      {/* 商品列表 */}
      <div style={{ marginBottom: "28px" }}>
        <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>📦 商品列表</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            >
              <span>
                {product.name}（¥{product.price}）
              </span>
              <button
                onClick={() =>
                  dispatch({
                    type: "ADD_ITEM",
                    payload: {
                      id: product.id,
                      name: product.name,
                      price: product.price,
                    },
                  })
                }
                style={{
                  padding: "4px 14px",
                  background: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                加入购物车
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 购物车列表 */}
      <div>
        <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>🛍️ 购物车</h3>
        {state.items.length === 0 ? (
          <p style={{ color: "#94a3b8", padding: "20px 0" }}>购物车是空的</p>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {state.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    background: "#f1f5f9",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span style={{ flex: 1 }}>
                    {item.name} × {item.quantity}
                  </span>
                  <span style={{ fontWeight: "bold", marginRight: "16px" }}>
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() =>
                        dispatch({ type: "DECREASE", payload: { id: item.id } })
                      }
                      style={{
                        padding: "2px 10px",
                        background: "#e2e8f0",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      −
                    </button>
                    <button
                      onClick={() =>
                        dispatch({ type: "INCREASE", payload: { id: item.id } })
                      }
                      style={{
                        padding: "2px 10px",
                        background: "#e2e8f0",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "16px",
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() =>
                        dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } })
                      }
                      style={{
                        padding: "2px 12px",
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "14px 18px",
                background: "#e2e8f0",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "18px" }}>
                总计：¥{total.toFixed(2)}
              </span>
              <button
                onClick={() => dispatch({ type: "CLEAR_CART" })}
                style={{
                  padding: "6px 18px",
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                清空购物车
              </button>
            </div>
          </>
        )}
      </div>

      {/* 调试 */}
      <details style={{ marginTop: "24px" }}>
        <summary style={{ cursor: "pointer", color: "#94a3b8", fontSize: "14px" }}>
          📋 当前 state（调试）
        </summary>
        <pre
          style={{
            background: "#1e293b",
            color: "#e2e8f0",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "12px",
            overflowX: "auto",
            marginTop: "8px",
          }}
        >
          {JSON.stringify(state, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default Cart;