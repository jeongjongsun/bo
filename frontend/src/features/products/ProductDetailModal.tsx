import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useProductDetail, useUpdateProduct } from './hooks';

type TabKey = 'basic' | 'info';

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
}

export function ProductDetailModal({ productId, onClose }: ProductDetailModalProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const { data: product, isLoading, isError, error } = useProductDetail(productId);
  const { mutate: update, isPending } = useUpdateProduct(productId ?? '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!productId) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const costPriceVal = formData.get('costPrice') as string;
    const supplyPriceVal = formData.get('supplyPrice') as string;
    const safetyStockQtyVal = formData.get('safetyStockQty') as string;
    const minOrderQtyVal = formData.get('minOrderQty') as string;
    const maxOrderQtyVal = formData.get('maxOrderQty') as string;
    const sortOrderVal = formData.get('sortOrder') as string;

    update(
      {
        productNm: formData.get('productNm') as string,
        productType: formData.get('productType') as string,
        baseUnitCd: (formData.get('baseUnitCd') as string) || null,
        isSale: formData.get('isSale') === 'true',
        isDisplay: formData.get('isDisplay') === 'true',
        productEnNm: (formData.get('productEnNm') as string) ?? null,
        categoryCd: (formData.get('categoryCd') as string) ?? null,
        brandCd: (formData.get('brandCd') as string) ?? null,
        costPrice: costPriceVal ? Number(costPriceVal) : null,
        supplyPrice: supplyPriceVal ? Number(supplyPriceVal) : null,
        taxType: (formData.get('taxType') as string) ?? null,
        safetyStockQty: safetyStockQtyVal ? Number(safetyStockQtyVal) : null,
        minOrderQty: minOrderQtyVal ? Number(minOrderQtyVal) : null,
        maxOrderQty: maxOrderQtyVal ? Number(maxOrderQtyVal) : null,
        sortOrder: sortOrderVal ? Number(sortOrderVal) : null,
        description: (formData.get('description') as string) ?? null,
        imageUrl: (formData.get('imageUrl') as string) ?? null,
        remark: (formData.get('remark') as string) ?? null,
      },
      {
        onSuccess: () => {
          showSuccess(t('products.edit.saveSuccess')).then(() => onClose());
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!productId) return null;

  return (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="product-modal">
        <div className="product-modal__header">
          <h3 id="product-modal-title">{t('products.detail.title')}</h3>
          <button
            type="button"
            className="product-modal__close"
            onClick={onClose}
            aria-label={t('common.cancel')}
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="product-modal__body product-modal__loading">
            {t('common.loading')}
          </div>
        ) : isError ? (
          <div className="product-modal__body product-modal__loading">
            {error instanceof Error ? error.message : t('common.error')}
          </div>
        ) : product ? (
          <form key={product.productId} onSubmit={handleSubmit} className="product-modal__form">
            <div className="product-modal__tabs">
              <button
                type="button"
                className={`product-modal__tab ${activeTab === 'basic' ? 'product-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                {t('products.detail.tabBasic')}
              </button>
              <button
                type="button"
                className={`product-modal__tab ${activeTab === 'info' ? 'product-modal__tab--active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                {t('products.detail.tabInfo')}
              </button>
            </div>
            <div className="product-modal__body">
              <div className="product-modal__fields" style={{ display: activeTab === 'basic' ? 'grid' : 'none' }}>
                <FormRow label={t('products.col.productCd')}>
                  <input
                    type="text"
                    value={product.productCd}
                    readOnly
                    className="product-modal__input product-modal__input--readonly"
                  />
                </FormRow>
                <FormRow label={t('products.col.productNm')}>
                  <input
                    type="text"
                    name="productNm"
                    defaultValue={product.productNm}
                    required
                    maxLength={200}
                    className="product-modal__input"
                  />
                </FormRow>
                <FormRow label={t('products.col.productType')}>
                  <select name="productType" defaultValue={product.productType} required>
                    <option value="SINGLE">{t('products.type.single')}</option>
                    <option value="SET">{t('products.type.set')}</option>
                  </select>
                </FormRow>
                <FormRow label={t('products.col.baseUnitCd')}>
                  <input
                    type="text"
                    name="baseUnitCd"
                    defaultValue={product.baseUnitCd ?? ''}
                    placeholder="EA, CS, PLT 등"
                    className="product-modal__input"
                  />
                </FormRow>
                <FormRow label={t('products.col.isSale')}>
                  <select name="isSale" defaultValue={product.isSale ? 'true' : 'false'}>
                    <option value="true">{t('common.yes')}</option>
                    <option value="false">{t('common.no')}</option>
                  </select>
                </FormRow>
                <FormRow label={t('products.col.isDisplay')}>
                  <select name="isDisplay" defaultValue={product.isDisplay ? 'true' : 'false'}>
                    <option value="true">{t('common.yes')}</option>
                    <option value="false">{t('common.no')}</option>
                  </select>
                </FormRow>
              </div>
              <div className="product-modal__fields" style={{ display: activeTab === 'info' ? 'grid' : 'none' }}>
                <FormRow label={t('products.detail.productEnNm')}>
                <input type="text" name="productEnNm" defaultValue={product.productEnNm ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.categoryCd')}>
                <input type="text" name="categoryCd" defaultValue={product.categoryCd ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.brandCd')}>
                <input type="text" name="brandCd" defaultValue={product.brandCd ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.costPrice')}>
                <input type="number" name="costPrice" step="0.01" min="0" defaultValue={product.costPrice ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.supplyPrice')}>
                <input type="number" name="supplyPrice" step="0.01" min="0" defaultValue={product.supplyPrice ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.taxType')}>
                <select name="taxType" defaultValue={product.taxType ?? ''}>
                  <option value="">-</option>
                  <option value="TAXABLE">{t('products.taxType.TAXABLE')}</option>
                  <option value="TAX_FREE">{t('products.taxType.TAX_FREE')}</option>
                  <option value="ZERO">{t('products.taxType.ZERO')}</option>
                </select>
              </FormRow>
              <FormRow label={t('products.detail.safetyStockQty')}>
                <input type="number" name="safetyStockQty" min="0" defaultValue={product.safetyStockQty ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.minOrderQty')}>
                <input type="number" name="minOrderQty" min="0" defaultValue={product.minOrderQty ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.maxOrderQty')}>
                <input type="number" name="maxOrderQty" min="0" defaultValue={product.maxOrderQty ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.sortOrder')}>
                <input type="number" name="sortOrder" min="0" defaultValue={product.sortOrder ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.description')} fullWidth>
                <textarea name="description" rows={3} defaultValue={product.description ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.imageUrl')}>
                <input type="text" name="imageUrl" defaultValue={product.imageUrl ?? ''} className="product-modal__input" />
              </FormRow>
              <FormRow label={t('products.detail.remark')}>
                <input type="text" name="remark" defaultValue={product.remark ?? ''} className="product-modal__input" />
              </FormRow>
              </div>
            </div>
            <div className="product-modal__footer">
              <button type="button" className="product-modal__btn product-modal__btn--secondary" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="product-modal__btn product-modal__btn--primary" disabled={isPending}>
                {isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        ) : (
          <div className="product-modal__body product-modal__loading">
            {t('common.error')}
          </div>
        )}
      </div>
    </div>
  );
}

function FormRow({
  label,
  children,
  fullWidth,
}: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`product-modal__row${fullWidth ? ' product-modal__row--full' : ''}`}>
      <label className="product-modal__label">{label}</label>
      <div className="product-modal__field">{children}</div>
    </div>
  );
}
