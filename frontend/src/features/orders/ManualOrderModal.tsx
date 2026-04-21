import { cloneElement, useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiInfo, FiMapPin, FiUser, FiMoreHorizontal, FiPlus, FiTrash2 } from 'react-icons/fi';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { isPhoneFormat } from '@/utils/validation';
import { useCreateManualOrder, useSalesTypeCodes, usePaymentMethodCodes } from './hooks';
import { useMallList } from '@/features/malls/hooks';
import { useProductList } from '@/features/products/hooks';
import type { ManualOrderCreateRequest, ManualOrderLineItem } from './types';
import type { ProductListItem } from '@/features/products/types';

/** 사용자 로컬 날짜 YYYY-MM-DD (toISOString은 UTC라 시간대에 따라 하루 어긋날 수 있음) */
function formatYmd(d: Date): string {
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** docs/10-CSS-표준: form-floating mb-2. id는 children(input/select)에 전달됨. */
function FloatingRow({
  id,
  label,
  required,
  requiredLabel,
  children,
  style,
}: {
  id: string;
  label: string;
  required?: boolean;
  requiredLabel?: string;
  children: React.ReactElement;
  style?: React.CSSProperties;
}) {
  const childWithId = cloneElement(children, { id });
  return (
    <div className={`form-floating mb-2 ${required ? 'required' : ''}`} style={style}>
      {childWithId}
      <label htmlFor={id}>
        {label}
        {required && (
          <>
            <span className="text-primary ms-1" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">{requiredLabel}</span>
          </>
        )}
      </label>
    </div>
  );
}

export interface ManualOrderModalProps {
  corporationCd: string;
  initialMallCd?: string | null;
  initialStoreCd?: string | null;
  salesTypeCd?: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

const emptyLine = (): ManualOrderLineItem => ({
  id: crypto.randomUUID(),
  productId: null as string | null,
  productCd: '',
  productNm: '',
  lineQty: 1,
  lineAmount: 0,
  lineDiscountAmount: 0,
});

export function ManualOrderModal({
  corporationCd,
  initialMallCd,
  initialStoreCd,
  salesTypeCd: initialSalesTypeCd,
  onSuccess,
  onClose,
}: ManualOrderModalProps) {
  const { t } = useTranslation();
  const createManual = useCreateManualOrder();
  const { data: salesTypeCodes = [] } = useSalesTypeCodes();
  const { data: paymentMethodCodes = [] } = usePaymentMethodCodes();
  const { data: mallListData } = useMallList({ corporationCd, page: 0, size: 500 });
  const { data: productList = [] } = useProductList({ corporationCd });

  const today = formatYmd(new Date());
  const [mallCd, setMallCd] = useState(initialMallCd ?? '');
  const [storeCd, setStoreCd] = useState(initialStoreCd ?? '');
  const [orderDt, setOrderDt] = useState(today);
  const [registDt, setRegistDt] = useState(today);
  const [salesTypeCd, setSalesTypeCd] = useState(initialSalesTypeCd ?? 'B2C_DOMESTIC');
  const [receiverNm, setReceiverNm] = useState('');
  const [receiverTel, setReceiverTel] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');
  const [receiverAddr, setReceiverAddr] = useState('');
  const [receiverAddr2, setReceiverAddr2] = useState('');
  const [receiverZip, setReceiverZip] = useState('');
  const [ordererNm, setOrdererNm] = useState('');
  const [ordererTel, setOrdererTel] = useState('');
  const [ordererMobile, setOrdererMobile] = useState('');
  const [memo, setMemo] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number | ''>('');
  const [paymentMethodCd, setPaymentMethodCd] = useState('');
  const [items, setItems] = useState<ManualOrderLineItem[]>([emptyLine()]);
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});
  type TabKey = 'master' | 'items';
  const [activeTab, setActiveTab] = useState<TabKey>('master');

  const mallStoreItems = mallListData?.items ?? [];
  const malls = useMemo(() => {
    const seen = new Set<string>();
    return mallStoreItems
      .filter((s) => {
        if (seen.has(s.mallCd)) return false;
        seen.add(s.mallCd);
        return true;
      })
      .map((s) => ({ mallCd: s.mallCd, mallNm: s.mallNm }));
  }, [mallStoreItems]);
  const stores = useMemo(
    () => mallStoreItems.filter((s) => s.mallCd === mallCd),
    [mallStoreItems, mallCd]
  );

  useEffect(() => {
    if (mallCd && !stores.some((s) => s.storeCd === storeCd)) {
      setStoreCd(stores[0]?.storeCd ?? '');
    }
  }, [mallCd, stores, storeCd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredProducts = useMemo(() => {
    return productList;
  }, [productList]);

  const getFilteredProductsForLine = useCallback(
    (lineIndex: number): ProductListItem[] => {
      const currentLine = items[lineIndex];
      const currentProductId = currentLine?.productId != null && currentLine.productId !== ''
        ? String(currentLine.productId)
        : null;
      const byKeyword = (p: ProductListItem) => {
        const kw = (productSearch[lineIndex] ?? '').trim().toLowerCase();
        if (!kw) return true;
        return (
          (p.productCd ?? '').toLowerCase().includes(kw) ||
          (p.productNm ?? '').toLowerCase().includes(kw)
        );
      };
      const filtered = filteredProducts
        .filter(byKeyword)
        .slice(0, 50);
      if (currentProductId == null) return filtered;
      const alreadyInList = filtered.some((p) => String(p.productId) === currentProductId);
      if (alreadyInList) return filtered;
      const selected = filteredProducts.find((p) => String(p.productId) === currentProductId);
      if (!selected) return filtered;
      return [selected, ...filtered.slice(0, 49)];
    },
    [filteredProducts, productSearch, items]
  );

  const addLine = () => {
    setItems((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    setProductSearch((prev) => {
      const next: Record<number, string> = {};
      for (const k of Object.keys(prev).map(Number)) {
        if (k < index) next[k] = prev[k];
        else if (k > index) next[k - 1] = prev[k];
      }
      return next;
    });
  };

  const updateLine = (index: number, updates: Partial<ManualOrderLineItem>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...updates } : it))
    );
  };

  const selectProduct = (lineIndex: number, p: ProductListItem) => {
    updateLine(lineIndex, {
      productId: p.productId == null ? null : String(p.productId),
      productCd: p.productCd ?? '',
      productNm: p.productNm ?? '',
    });
    setProductSearch((prev) => ({ ...prev, [lineIndex]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corporationCd.trim()) return;
    if (!mallCd.trim()) {
      showError(t('common.error'), t('orders.manualOrder.mallRequired'));
      return;
    }
    if (!storeCd.trim()) {
      showError(t('common.error'), t('orders.manualOrder.storeRequired'));
      return;
    }
    const receiverFields = [receiverNm, receiverTel, receiverMobile, receiverAddr, receiverAddr2, receiverZip];
    if (receiverFields.some((v) => !(v ?? '').trim())) {
      showError(t('common.error'), t('orders.manualOrder.receiverAddressRequired'));
      return;
    }
    const phoneFields = [receiverTel, receiverMobile, ordererTel, ordererMobile];
    if (phoneFields.some((v) => (v ?? '').trim() !== '' && !isPhoneFormat(v))) {
      showError(t('common.error'), t('validation.phoneInvalid'));
      return;
    }
    const validItems = items.filter(
      (it) =>
        (it.productId != null && it.productId !== '') ||
        (it.productCd && it.productCd.trim()) ||
        (it.productNm && it.productNm.trim())
    );
    if (validItems.length === 0) {
      showError(t('common.error'), t('orders.manualOrder.itemsRequired'));
      return;
    }
    if (validItems.some((it) => (it.lineQty ?? 0) <= 0 || (it.lineAmount ?? 0) <= 0)) {
      showError(t('common.error'), t('orders.manualOrder.qtyAmountPositive'));
      return;
    }
    const request: ManualOrderCreateRequest = {
      corporationCd: corporationCd.trim(),
      mallCd: mallCd.trim(),
      storeCd: storeCd.trim(),
      salesTypeCd: salesTypeCd || undefined,
      orderDt: orderDt || undefined,
      registDt: registDt || undefined,
      receiverNm: receiverNm || null,
      receiverTel: receiverTel || null,
      receiverMobile: receiverMobile || null,
      receiverAddr: receiverAddr || null,
      receiverAddr2: receiverAddr2 || null,
      receiverZip: receiverZip || null,
      ordererNm: ordererNm || null,
      ordererTel: ordererTel || null,
      ordererMobile: ordererMobile || null,
      memo: memo || null,
      deliveryFee: deliveryFee !== '' && deliveryFee != null ? Number(deliveryFee) : null,
      paymentMethodCd: paymentMethodCd?.trim() || null,
      items: validItems.map((it) => ({
        productId: it.productId != null && it.productId !== '' ? String(it.productId) : undefined,
        productCd: it.productCd?.trim() || undefined,
        productNm: it.productNm?.trim() || undefined,
        lineQty: it.lineQty ?? 1,
        lineAmount: it.lineAmount ?? 0,
        lineDiscountAmount: it.lineDiscountAmount ?? 0,
      })),
    };
    createManual.mutate(request, {
      onSuccess: () => {
        showSuccess(t('orders.manualOrder.registerSuccess')).then(() => {
          onSuccess();
          onClose();
        });
      },
      onError: (err) => {
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      },
    });
  };

  const modalContent = (
    <div
      className="product-modal-overlay"
      style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-order-modal-title"
    >
      <div className="product-modal" style={{ maxWidth: 820, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="product-modal__header">
          <h3 id="manual-order-modal-title">{t('orders.manualOrder.title')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="product-modal__tabs" style={{ display: 'flex', gap: '0.5rem', padding: '0 1.25rem', borderBottom: '1px solid #e3e6f0' }}>
            <button
              type="button"
              className={`product-modal__tab ${activeTab === 'master' ? 'product-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('master')}
            >
              {t('orders.detail.tabMaster')}
            </button>
            <button
              type="button"
              className={`product-modal__tab ${activeTab === 'items' ? 'product-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('items')}
            >
              {t('orders.detail.tabItems')}
            </button>
          </div>
          <div className="product-modal__body" style={{ overflow: 'auto', flex: 1 }}>
            {activeTab === 'master' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {/* 기본정보 */}
                <section style={{ position: 'relative', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                  <h3 className="mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4a5568' }}>
                    <FiInfo size={14} aria-hidden />
                    {t('orders.manualOrder.sectionBasic')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                    <FloatingRow id="manual-mallCd" label={t('orders.manualOrder.mallCd')} required requiredLabel={t('common.requiredMark')}>
                      <select
                        className="form-select form-select-sm"
                        value={mallCd}
                        onChange={(e) => { setMallCd(e.target.value); setStoreCd(''); }}
                        required
                      >
                        <option value="">{t('common.select')}</option>
                        {malls.map((m) => (
                          <option key={m.mallCd} value={m.mallCd}>{m.mallNm || m.mallCd}</option>
                        ))}
                      </select>
                    </FloatingRow>
                    <FloatingRow id="manual-storeCd" label={t('orders.manualOrder.storeCd')} required requiredLabel={t('common.requiredMark')}>
                      <select
                        className="form-select form-select-sm"
                        value={storeCd}
                        onChange={(e) => setStoreCd(e.target.value)}
                        required
                        disabled={!mallCd}
                      >
                        <option value="">{t('common.select')}</option>
                        {stores.map((s) => (
                          <option key={s.storeId} value={s.storeCd}>{s.storeNm || s.storeCd}</option>
                        ))}
                      </select>
                    </FloatingRow>
                    <FloatingRow id="manual-orderDt" label={t('orders.manualOrder.orderDt')}>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={orderDt}
                        onChange={(e) => setOrderDt(e.target.value)}
                        placeholder=" "
                      />
                    </FloatingRow>
                    <FloatingRow id="manual-registDt" label={t('orders.manualOrder.registDt')}>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={registDt}
                        onChange={(e) => setRegistDt(e.target.value)}
                        placeholder=" "
                      />
                    </FloatingRow>
                    <FloatingRow id="manual-salesTypeCd" label={t('orders.col.salesTypeCd')}>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={salesTypeCodes.find((c) => c.subCd === salesTypeCd)?.codeNm ?? salesTypeCd}
                        readOnly
                        disabled
                        style={{ backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' }}
                      />
                    </FloatingRow>
                  </div>
                </section>
                <hr className="my-2 border-secondary opacity-25" />

                {/* 수령인정보 */}
                <section style={{ position: 'relative', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                  <h3 className="mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4a5568' }}>
                    <FiMapPin size={14} aria-hidden />
                    {t('orders.manualOrder.sectionReceiver')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                <FloatingRow id="manual-receiverNm" label={t('orders.col.receiverNm')} required requiredLabel={t('common.requiredMark')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={receiverNm}
                    onChange={(e) => setReceiverNm(e.target.value)}
                    required
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-receiverTel" label={t('orders.col.receiverTel')} required requiredLabel={t('common.requiredMark')}>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    value={receiverTel}
                    onChange={(e) => setReceiverTel(e.target.value)}
                    required
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-receiverMobile" label={t('orders.col.receiverMobile')} required requiredLabel={t('common.requiredMark')}>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    value={receiverMobile}
                    onChange={(e) => setReceiverMobile(e.target.value)}
                    required
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-receiverAddr" label={t('orders.col.receiverAddr')} required requiredLabel={t('common.requiredMark')} style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={receiverAddr}
                    onChange={(e) => setReceiverAddr(e.target.value)}
                    required
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-receiverAddr2" label={t('orders.col.receiverAddr2')} required requiredLabel={t('common.requiredMark')} style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={receiverAddr2}
                    onChange={(e) => setReceiverAddr2(e.target.value)}
                    required
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-receiverZip" label={t('orders.col.receiverZip')} required requiredLabel={t('common.requiredMark')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={receiverZip}
                    onChange={(e) => setReceiverZip(e.target.value)}
                    required
                    placeholder=" "
                  />
                </FloatingRow>
                  </div>
                </section>
                <hr className="my-2 border-secondary opacity-25" />

                {/* 주문자정보 */}
                <section style={{ position: 'relative', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                  <h3 className="mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4a5568' }}>
                    <FiUser size={14} aria-hidden />
                    {t('orders.manualOrder.sectionOrderer')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                <FloatingRow id="manual-ordererNm" label={t('orders.col.ordererNm')}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={ordererNm}
                    onChange={(e) => setOrdererNm(e.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-ordererTel" label={t('orders.col.ordererTel')}>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    value={ordererTel}
                    onChange={(e) => setOrdererTel(e.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                <FloatingRow id="manual-ordererMobile" label={t('orders.col.ordererMobile')}>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    value={ordererMobile}
                    onChange={(e) => setOrdererMobile(e.target.value)}
                    placeholder=" "
                  />
                </FloatingRow>
                  </div>
                </section>
                <hr className="my-2 border-secondary opacity-25" />

                {/* 그외(기타) */}
                <section style={{ position: 'relative', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                  <h3 className="mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4a5568' }}>
                    <FiMoreHorizontal size={14} aria-hidden />
                    {t('orders.manualOrder.sectionEtc')}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                    <FloatingRow id="manual-deliveryFee" label={t('orders.manualOrder.deliveryFee')}>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        className="form-control form-control-sm"
                        value={deliveryFee === '' ? '' : deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        placeholder=" "
                      />
                    </FloatingRow>
                    <FloatingRow id="manual-paymentMethodCd" label={t('orders.manualOrder.paymentMethodCd')}>
                      <select
                        className="form-select form-select-sm"
                        value={paymentMethodCd}
                        onChange={(e) => setPaymentMethodCd(e.target.value)}
                      >
                        <option value="">{t('common.select')}</option>
                        {paymentMethodCodes.map((c) => (
                          <option key={c.subCd} value={c.subCd}>{c.codeNm}</option>
                        ))}
                      </select>
                    </FloatingRow>
                    <FloatingRow id="manual-memo" label={t('orders.col.memo')} style={{ gridColumn: '1 / -1' }}>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder=" "
                      />
                    </FloatingRow>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'items' && (
              <>
                <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center gap-1" onClick={addLine}>
                    <FiPlus size={14} aria-hidden />
                    {t('orders.manualOrder.addLine')}
                  </button>
                </div>
                <div style={{ overflow: 'auto', marginBottom: '1rem' }}>
                  <table className="table table-sm table-bordered">
                <thead>
                  <tr>
                    <th style={{ width: '28px' }}></th>
                    <th style={{ minWidth: 200 }}>{t('orders.col.productNm')}</th>
                    <th style={{ width: 90 }}>{t('orders.col.lineQty')}</th>
                    <th style={{ width: 110 }}>{t('orders.col.lineAmount')}</th>
                    <th style={{ width: 110 }}>{t('orders.col.lineDiscountAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((line, idx) => (
                    <tr key={line.id ?? idx}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 text-danger"
                          onClick={() => removeLine(idx)}
                          disabled={items.length <= 1}
                          aria-label={t('orders.manualOrder.removeLine')}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder={t('orders.manualOrder.productSearchPlaceholder')}
                            value={productSearch[idx] ?? ''}
                            onChange={(e) => setProductSearch((prev) => ({ ...prev, [idx]: e.target.value }))}
                            onFocus={(e) => e.target.select()}
                            style={{ flex: '1 1 0', minWidth: 0 }}
                          />
                          <select
                            className="form-select form-select-sm"
                            value={line.productId != null && line.productId !== '' ? String(line.productId) : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '') {
                                updateLine(idx, { productId: null, productCd: '', productNm: '' });
                                return;
                              }
                              const p = getFilteredProductsForLine(idx).find((x) => String(x.productId) === v);
                              if (p) selectProduct(idx, p);
                            }}
                            style={{ flex: '1 1 0', minWidth: 0 }}
                          >
                            <option value="">{t('common.select')}</option>
                            {getFilteredProductsForLine(idx).map((p) => (
                              <option key={String(p.productId)} value={String(p.productId)}>
                                {p.productCd} - {p.productNm}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          className="form-control form-control-sm"
                          value={line.lineQty ?? 1}
                          onChange={(e) => updateLine(idx, { lineQty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0.01}
                          step={0.01}
                          className="form-control form-control-sm"
                          value={line.lineAmount ?? 0}
                          onChange={(e) => updateLine(idx, { lineAmount: Math.max(0.01, parseFloat(e.target.value) || 0.01) })}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="form-control form-control-sm"
                          value={line.lineDiscountAmount ?? 0}
                          onChange={(e) => updateLine(idx, { lineDiscountAmount: Math.max(0, parseFloat(e.target.value) || 0) })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
              </>
            )}
          </div>
          <div className="product-modal__footer product-modal__footer--compact" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={createManual.isPending}>
              {createManual.isPending ? t('common.loading') : t('orders.manualOrder.register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const portalRoot = document.getElementById('modal-portal');
  if (portalRoot) return createPortal(modalContent, portalRoot);
  return modalContent;
}
