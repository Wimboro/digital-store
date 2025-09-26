import { useMemo, useState } from "react";
import { Product, products } from "./data/products";
import { ProductCard } from "./components/ProductCard";
import { ProductFilters } from "./components/ProductFilters";
import { CartLine, CartSummary } from "./components/CartSummary";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { Rocket, ShieldCheck, Sparkles } from "lucide-react";

export default function App() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))), []);
  const tags = useMemo(() => Array.from(new Set(products.flatMap((product) => product.tags))).sort(), []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = [product.name, product.shortDescription, product.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory = category === "All" || product.category === category;
      const matchesTags =
        selectedTags.length === 0 || selectedTags.every((tag) => product.tags.includes(tag));

      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [search, category, selectedTags]);

  const subtotal = useMemo(
    () => cart.reduce((total, line) => total + line.product.price * line.quantity, 0),
    [cart]
  );

  const handleAddToCart = (product: Product) => {
    setCart((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (existing) {
        return lines.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...lines, { product, quantity: 1 }];
    });
    setCheckoutCompleted(false);
  };

  const handleDecrease = (productId: string) => {
    setCart((lines) =>
      lines
        .map((line) =>
          line.product.id === productId ? { ...line, quantity: line.quantity - 1 } : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const handleIncrease = (productId: string) => {
    setCart((lines) =>
      lines.map((line) =>
        line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line
      )
    );
  };

  const handleRemove = (productId: string) => {
    setCart((lines) => lines.filter((line) => line.product.id !== productId));
  };

  const handleCheckout = () => {
    setCheckoutCompleted(true);
    setCart([]);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
  };

  const stats = useMemo(
    () => [
      {
        icon: <Sparkles size={16} aria-hidden />,
        label: "Launch-ready modules",
        value: "60+"
      },
      {
        icon: <Rocket size={16} aria-hidden />,
        label: "Time to launch",
        value: "15 minutes"
      },
      {
        icon: <ShieldCheck size={16} aria-hidden />,
        label: "Demo safe",
        value: "Mock checkout"
      }
    ],
    []
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="hero__content">
          <p className="hero__eyebrow">Digital Store Demo</p>
          <h1>Preview the storefront experience with zero setup.</h1>
          <p className="hero__subtitle">
            Explore curated digital products, filter the catalog, and run through the entire checkout
            journey — all powered by in-memory mock data that deploys anywhere, including Cloudflare
            Pages.
          </p>
          <dl className="hero__stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt>
                  {stat.icon}
                  {stat.label}
                </dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="hero__panel">
          <p>How it works</p>
          <ol>
            <li>Install dependencies inside <code>demo-app</code>.</li>
            <li>Run <code>npm run dev</code> to explore locally.</li>
            <li>Deploy the Vite build to Cloudflare Pages for a shareable demo.</li>
          </ol>
        </div>
      </header>

      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        categories={categories}
        onCategoryChange={setCategory}
        tags={tags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
      />

      <main className="layout">
        <section className="catalog" aria-live="polite">
          <header className="catalog__header">
            <h2>Featured digital goods</h2>
            <p>{filteredProducts.length} products match your filters.</p>
          </header>
          <div className="catalog__grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <p>No products match your filters (yet).</p>
              <button className="button button--ghost" onClick={() => setSelectedTags([])}>
                Clear tag filters
              </button>
            </div>
          )}
        </section>

        <CartSummary
          lines={cart}
          subtotal={subtotal}
          onDecrease={handleDecrease}
          onIncrease={handleIncrease}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
          checkoutCompleted={checkoutCompleted}
        />
      </main>

      <footer className="footer">
        <p>
          Built for the production app's stakeholders — replicate the end-to-end checkout without a
          database by running <code>npm install</code> then <code>npm run dev</code> inside <code>demo-app</code>.
        </p>
      </footer>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(product) => {
          handleAddToCart(product);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}
