import { useState, useEffect } from "react";
import { fetchCategories } from "../services/categoryApi";
import type { Category, CategoryType } from "../types/category";

export function useCategories(type: CategoryType): Category[] {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data.filter((cat) => cat.type === type)))
      .catch(() => {});
  }, [type]);

  return categories;
}
