import { Product } from "../data/products";
import { Download, Package, Star, X } from "lucide-react";

type ProductDetailModalProps = {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
};

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!product) {
    return null;
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__content">
        <header className="modal__header">
          <div>
            <p className="modal__eyebrow">{product.category}</p>
            <h2 id="product-modal-title">{product.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close details">
            <X size={18} aria-hidden />
          </button>
        </header>
        <section className="modal__grid">
          <div className="modal__media">
            <img src={product.thumbnail} alt={product.name} loading="lazy" />
            <div className="modal__stats">
              <span>
                <Star size={16} aria-hidden />
                {product.rating.toFixed(1)} rating
              </span>
              <span>
                <Download size={16} aria-hidden />
                {product.downloads.toLocaleString()} downloads
              </span>
              <span>
                <Package size={16} aria-hidden />
                Updated {new Date(product.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="modal__body">
            <p className="modal__description">{product.description}</p>
            <div className="modal__section">
              <h3>What's inside</h3>
              <ul>
                {product.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className="modal__section modal__section--meta">
              <div>
                <span className="label">Formats</span>
                <p>{product.fileFormats.join(", ")}</p>
              </div>
              <div>
                <span className="label">Delivery</span>
                <p>{product.delivery}</p>
              </div>
              <div>
                <span className="label">License</span>
                <p>{product.license}</p>
              </div>
            </div>
          </div>
        </section>
        <footer className="modal__footer">
          <div>
            <span className="price">${product.price}</span>
            <p className="modal__hint">100% mock checkout — no payment required.</p>
          </div>
          <button className="button" onClick={() => onAddToCart(product)}>
            Add to cart
          </button>
        </footer>
      </div>
    </div>
  );
}
