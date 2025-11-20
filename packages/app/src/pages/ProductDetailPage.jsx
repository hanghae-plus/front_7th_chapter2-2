import { useEffect, useState } from "react";
import { productStore } from "../stores";
import { loadProductDetailForPage } from "../services";
import { router } from "../router";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, ProductDetail, PublicImage } from "../components";

/**
 * 상품 상세 페이지 컴포넌트
 */
export const ProductDetailPage = () => {
  const [productState, setProductState] = useState(productStore.getState());
  const { currentProduct: product, relatedProducts = [], error, loading } = productState;

  // productStore 구독
  useEffect(() => {
    const unsubscribe = productStore.subscribe(() => {
      setProductState(productStore.getState());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadProductDetailForPage(router.params.id);
  }, [router.params.id]);

  return (
    <PageWrapper
      headerLeft={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <PublicImage src="/back-icon.svg" alt="뒤로" className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 p-4">
        {loading ? (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        ) : error || !product ? (
          <ErrorContent error={error} />
        ) : (
          <ProductDetail product={product} relatedProducts={relatedProducts} />
        )}
      </div>
    </PageWrapper>
  );
};
