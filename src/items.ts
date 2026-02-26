export interface Item {
  id: string;
  name: string;
  price: number;
}

export const items: Item[] = [
  { id: "a1b2c3d4-0001-4000-8000-000000000001", name: "Bike", price: 29999 },
  { id: "a1b2c3d4-0002-4000-8000-000000000002", name: "TV", price: 49999 },
  { id: "a1b2c3d4-0003-4000-8000-000000000003", name: "Car", price: 2499999 },
  { id: "a1b2c3d4-0004-4000-8000-000000000004", name: "Laptop", price: 129999 },
];

export function findItem(id: string): Item | undefined {
  return items.find((item) => item.id === id);
}
