import { useMemo } from "react";
import { Filter, Search } from "lucide-react";

type ProductFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  categories: string[];
  onCategoryChange: (value: string) => void;
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
};

export function ProductFilters({
  search,
  onSearchChange,
  category,
  categories,
  onCategoryChange,
  tags,
  selectedTags,
  onTagToggle
}: ProductFiltersProps) {
  const normalizedCategories = useMemo(() => ["All", ...categories], [categories]);

  return (
    <section className="filters" aria-label="Catalog filters">
      <div className="filters__search">
        <Search size={16} aria-hidden />
        <input
          type="search"
          placeholder="Search digital products"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="filters__row">
        <label className="filters__select">
          <Filter size={16} aria-hidden />
          <span className="label">Category</span>
          <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
            {normalizedCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <div className="filters__tags" role="group" aria-label="Filter by tags">
          {tags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                className={isActive ? "chip chip--active" : "chip"}
                onClick={() => onTagToggle(tag)}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
