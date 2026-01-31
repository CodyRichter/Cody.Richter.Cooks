export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  subtext?: string;
  order_index: number;
  recipe_id: string;
}
