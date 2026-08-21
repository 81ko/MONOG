// src/pro/purchase.ts
import * as RNIap from 'react-native-iap';
import { Platform } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { usePro } from './usePro';

const SKU = Platform.select({
  ios: 'remove_ads_100',
  android: 'remove_ads_100',
}) as string;

export function usePurchase() {
  const { setPro } = usePro();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<RNIap.Product[]>([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await RNIap.initConnection();
        // 商品情報の取得（ストア側でSKUを事前に作成しておく）
        const list = await RNIap.fetchProducts({ skus: [SKU], type: 'in-app' });
        if (mounted) setProducts((list ?? []) as RNIap.Product[]);
      } catch (e) {
        // noop
      }
    })();

    return () => {
      mounted = false;
      RNIap.endConnection();
    };
  }, []);

  const buy = useCallback(async () => {
    try {
      setLoading(true);
      const result = await RNIap.requestPurchase({
        type: 'in-app',
        request: Platform.select({
          ios: { ios: { sku: SKU } },
          android: { android: { skus: [SKU] } },
        })!,
      });
      const purchase = Array.isArray(result) ? result[0] : result;
      if (!purchase || purchase.productId !== SKU) return false;
      await RNIap.finishTransaction({ purchase, isConsumable: false });
      await setPro(true);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [setPro]);

  const restore = useCallback(async () => {
    try {
      setLoading(true);
      const purchases = await RNIap.getAvailablePurchases();
      const owned = purchases.some(p => p.productId === SKU);
      if (owned) await setPro(true);
      return owned;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, [setPro]);

  return { products, buy, restore, loading, SKU };
}
