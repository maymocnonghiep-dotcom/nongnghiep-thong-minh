export interface ProductReview {
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  group: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  description: string;
  unit?: string;
  specs: { [key: string]: string };
  reviews: ProductReview[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    district: string;
    province: string;
    notes?: string;
  };
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
}
