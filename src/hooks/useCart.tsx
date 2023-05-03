import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseStock = await api.get(`/stock/${productId}`)
      const productExists = cart.find(prod => prod.id === productId);
      const currentAmount = productExists ? productExists.amount : 0

      const { amount: stockAmount } = responseStock.data

      if(currentAmount + 1 > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      if(productExists){
        const newCart = cart.map(prod => (
          prod.id === productId
           ? {...prod, amount: prod.amount + 1}
           : prod
        ))

        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return
      }

      const responseProduct = await api.get(`/products/${productId}`)
      const product = responseProduct.data;
      const newCart = [...cart, {...product, amount: 1}]
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      return


    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(prod => prod.id === productId);

      if(!productExists){
        throw Error()
      }
      const newCart = cart.filter(prod => prod.id !== productId)
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return;
      }

      const responseStock = await api.get(`/stock/${productId}`)
      const {amount: stockAmount} = responseStock.data;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(prod => (
        prod.id === productId
        ? {...prod, amount}
        : prod ))

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
