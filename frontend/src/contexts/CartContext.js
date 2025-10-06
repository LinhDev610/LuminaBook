// CartContext
// Quản lý state giỏ hàng

import { createContext, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    // TODO: Implement cart context
    return (
        <CartContext.Provider value={{}}>
            {children}
        </CartContext.Provider>
    );
};
