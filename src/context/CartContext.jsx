import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [optimizedCart, setOptimizedCart] = useState(null); // stores split-order recommendation
  const [isOptimizedMode, setIsOptimizedMode] = useState(false);

  // Clear cart if user logs out or switches role
  useEffect(() => {
    setCartItems([]);
    setOptimizedCart(null);
    setIsOptimizedMode(false);
  }, [user]);

  // Load active orders when user is loaded
  useEffect(() => {
    if (user && token) {
      fetchActiveOrders();
    } else {
      setActiveOrders([]);
    }
  }, [user, token]);

  const fetchActiveOrders = async () => {
    try {
      const endpoint = user.role === 'customer' ? '/api/orders/customer' 
                     : user.role === 'shopkeeper' ? '/api/orders/shopkeeper' 
                     : user.role === 'delivery' ? '/api/orders/delivery' 
                     : '/api/orders/admin';
      
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveOrders(data.orders);
      }
    } catch (err) {
      console.error("Error fetching active orders:", err);
    }
  };

  const addToCart = (product, quantity = 1, storeId = null) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product._id === product._id && item.storeId === storeId);
      if (existing) {
        return prev.map(item => 
          item.product._id === product._id && item.storeId === storeId 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity, storeId }];
    });
    // Reset optimized cart if items change
    setOptimizedCart(null);
  };

  const removeFromCart = (productId, storeId = null) => {
    setCartItems(prev => prev.filter(item => !(item.product._id === productId && item.storeId === storeId)));
    setOptimizedCart(null);
  };

  const updateQuantity = (productId, quantity, storeId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, storeId);
      return;
    }
    setCartItems(prev => prev.map(item => 
      item.product._id === productId && item.storeId === storeId 
        ? { ...item, quantity } 
        : item
    ));
    setOptimizedCart(null);
  };

  const optimizeBasket = async () => {
    if (cartItems.length === 0) return;
    try {
      const itemsPayload = cartItems.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        name: item.product.name
      }));
      
      const res = await fetch('/api/ai/optimize-basket', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: itemsPayload })
      });
      const data = await res.json();
      if (res.ok) {
        setOptimizedCart(data);
        setIsOptimizedMode(true);
        return data;
      }
      throw new Error(data.message || "Optimization failed");
    } catch (err) {
      console.error("Basket optimization error:", err);
      throw err;
    }
  };

  const checkout = async (paymentMethod = 'cash_on_delivery', optStoreId = null) => {
    // If optStoreId is passed, checkout that specific sub-cart from the optimized split-order
    try {
      const payload = {
        paymentMethod,
        items: isOptimizedMode && optimizedCart 
          ? optimizedCart.splitOrders.flatMap(so => 
              (optStoreId === null || so.storeId === optStoreId) 
                ? so.items.map(i => ({ productId: i.productId, quantity: i.quantity, storeId: so.storeId }))
                : []
            )
          : cartItems.map(item => ({
              productId: item.product._id,
              quantity: item.quantity,
              storeId: item.storeId
            })),
        isOptimized: isOptimizedMode
      };

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Checkout failed');
      
      // Remove ordered items from cart
      if (isOptimizedMode && optimizedCart && optStoreId !== null) {
        // Only clear items from that store
        const itemsToKeep = cartItems.filter(item => {
          const inOptimizedStore = optimizedCart.splitOrders
            .find(so => so.storeId === optStoreId)?.items
            .some(oi => oi.productId === item.product._id);
          return !inOptimizedStore;
        });
        setCartItems(itemsToKeep);
      } else {
        // Clear all
        setCartItems([]);
        setOptimizedCart(null);
        setIsOptimizedMode(false);
      }
      
      // Refresh order listing
      fetchActiveOrders();
      return data.orders;
    } catch (err) {
      console.error("Checkout error:", err);
      throw err;
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getCartStats = () => {
    const subtotal = getSubtotal();
    const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 40;
    const taxes = Math.round(subtotal * 0.05); // 5% GST
    const total = subtotal + deliveryFee + taxes;
    return { subtotal, deliveryFee, taxes, total };
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      optimizeBasket,
      optimizedCart,
      isOptimizedMode,
      setIsOptimizedMode,
      checkout,
      activeOrders,
      fetchActiveOrders,
      getCartStats
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
