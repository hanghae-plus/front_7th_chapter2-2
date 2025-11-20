/** @jsx createVNode */
import { createVNode } from "../lib";
import {
  toggleCartSelect,
  updateCartQuantity,
  removeFromCart,
} from "../services";
import { PublicImage } from "./PublicImage";

export function CartItem({ id, title, image, price, quantity, selected }) {
  const subtotal = price * quantity;

  return (
    <div
      className="flex items-center py-3 border-b border-gray-100 cart-item"
      data-product-id={id}
    >
      <label className="flex items-center mr-3">
        <input
          type="checkbox"
          checked={selected}
          className="cart-item-checkbox w-4 h-4 text-blue-600 border-gray-300 rounded
                      focus:ring-blue-500"
          data-product-id={id}
          onChange={() => toggleCartSelect(id)}
        />
      </label>

      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover cursor-pointer cart-item-image"
          data-product-id={id}
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4
          className="text-sm font-medium text-gray-900 truncate cursor-pointer cart-item-title"
          data-product-id={id}
        >
          {title}
        </h4>
        <p className="text-sm text-gray-600 mt-1">{price.toLocaleString()}원</p>

        <div className="flex items-center mt-2">
          <button
            className="quantity-decrease-btn w-7 h-7 flex items-center justify-center
                         border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100"
            data-product-id={id}
            onClick={() => updateCartQuantity(id, Math.max(1, quantity - 1))}
          >
            <PublicImage src="/minus-icon.svg" alt="감소" className="w-3 h-3" />
          </button>

          <input
            type="number"
            value={quantity}
            min="1"
            className="quantity-input w-12 h-7 text-center text-sm border-t border-b
                        border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled
            data-product-id={id}
          />

          <button
            className="quantity-increase-btn w-7 h-7 flex items-center justify-center
                         border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
            data-product-id={id}
            onClick={() => updateCartQuantity(id, quantity + 1)}
          >
            <PublicImage src="/plus-icon.svg" alt="증가" className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="text-right ml-3">
        <p className="text-sm font-medium text-gray-900">
          {subtotal.toLocaleString()}원
        </p>
        <button
          className="cart-item-remove-btn mt-1 text-xs text-red-600 hover:text-red-800"
          data-product-id={id}
          onClick={() => removeFromCart(id)}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
