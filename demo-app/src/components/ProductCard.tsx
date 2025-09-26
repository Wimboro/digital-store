import { Product } from "../data/products";
import { Star, ShoppingCart, Info } from "lucide-react";

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className="product-card__media">
        <img src={product.thumbnail} alt={product.name} loading="lazy" />
        <span className="product-card__badge">{product.category}</span>
      </div>
      <div className="product-card__body">
        <header className="product-card__header">
          <h3>{product.name}</h3>
          <div className="product-card__meta">
            <span className="price">${product.price}</span>
            <span className="rating" aria-label={`${product.rating} out of 5 stars`}>
              <Star size={16} aria-hidden />
              {product.rating.toFixed(1)}
            </span>
          </div>
        </header>
        <p className="product-card__description">{product.shortDescription}</p>
        <footer className="product-card__footer">
          <div className="product-card__tags">
            {product.tags.map((tag) => (
              <span className="tag" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
          <div className="product-card__actions">
            <button className="button button--ghost" onClick={() => onViewDetails(product)}>
              <Info size={16} aria-hidden />
              Details
            </button>
            <button className="button" onClick={() => onAddToCart(product)}>
              <ShoppingCart size={16} aria-hidden />
              Add
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}
