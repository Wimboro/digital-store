import { Product } from "../data/products";
import { CheckCircle, Minus, Plus, Trash2 } from "lucide-react";

export type CartLine = {
  product: Product;
  quantity: number;
};

type CartSummaryProps = {
  lines: CartLine[];
  subtotal: number;
  onDecrease: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  checkoutCompleted: boolean;
};

export function CartSummary({
  lines,
  subtotal,
  onDecrease,
  onIncrease,
  onRemove,
  onCheckout,
  checkoutCompleted
}: CartSummaryProps) {
  return (
    <aside className="cart" aria-label="Demo checkout">
      <header className="cart__header">
        <h2>Demo Checkout</h2>
        <p>No real payments — instantly generate download links.</p>
      </header>
      <div className="cart__lines">
        {lines.length === 0 && !checkoutCompleted && <p>Your cart is empty. Add products to preview the flow.</p>}
        {lines.map(({ product, quantity }) => (
          <div className="cart__line" key={product.id}>
            <div>
              <p className="cart__line-name">{product.name}</p>
              <p className="cart__line-meta">
                {product.category} • ${product.price}
              </p>
            </div>
            <div className="cart__line-actions">
              <button className="icon-button" onClick={() => onDecrease(product.id)} aria-label="Decrease quantity">
                <Minus size={14} aria-hidden />
              </button>
              <span className="cart__qty">{quantity}</span>
              <button className="icon-button" onClick={() => onIncrease(product.id)} aria-label="Increase quantity">
                <Plus size={14} aria-hidden />
              </button>
              <button className="icon-button icon-button--danger" onClick={() => onRemove(product.id)} aria-label="Remove item">
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          </div>
        ))}
        {checkoutCompleted && (
          <div className="cart__success">
            <CheckCircle size={18} aria-hidden />
            <div>
              <p>Downloads are ready!</p>
              <p className="cart__success-meta">We just generated mock delivery links for your inbox.</p>
            </div>
          </div>
        )}
      </div>
      <footer className="cart__footer">
        <div>
          <span className="label">Subtotal</span>
          <p className="cart__subtotal">${subtotal.toFixed(2)}</p>
        </div>
        <button className="button button--full" onClick={onCheckout} disabled={lines.length === 0}>
          Complete demo checkout
        </button>
      </footer>
    </aside>
  );
}
