import { cloneElement, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FiInfo, FiMapPin, FiUser, FiMoreHorizontal } from 'react-icons/fi';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { isPhoneFormat } from '@/utils/validation';
import { useOrderDetail, useUpdateOrder, useOrderProcessStatusCodes, useSalesTypeCodes, useOrderTypeCodes, usePaymentMethodCodes } from './hooks';
import type { OrderMasterDetail, OrderItemDetail } from './types';

type TabKey = 'master' | 'items';

interface OrderDetailModalProps {
  orderId: number | null;
  registDt: string | null;
  corporationCd: string;
  storeCd?: string | null;
  orderProcessStatus?: string | null;
  onClose: () => void;
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

export function OrderDetailModal({ orderId, registDt, corporationCd, storeCd, orderProcessStatus, onClose }: OrderDetailModalProps) {
  const { t } = useTranslation();
  const { data: detail, isLoading, isError, error } = useOrderDetail(orderId, registDt, corporationCd, storeCd);
  const updateOrder = useUpdateOrder(orderId ?? 0);
  const { data: statusCodes = [] } = useOrderProcessStatusCodes();
  const { data: salesTypeCodes = [] } = useSalesTypeCodes();
  const { data: orderTypeCodes = [] } = useOrderTypeCodes();
  const { data: paymentMethodCodes = [] } = usePaymentMethodCodes();

  const [activeTab, setActiveTab] = useState<TabKey>('master');
  const [master, setMaster] = useState<OrderMasterDetail | null>(null);
  const [items, setItems] = useState<OrderItemDetail[]>([]);

  useEffect(() => {
    if (detail?.master) {
      const m = { ...detail.master };
      // API가 flat으로 주지 않을 수 있으므로 orderInfo JSON에서 배송비·결제방법 보정
      if (m.orderInfo && typeof m.orderInfo === 'string') {
        try {
          const parsed = JSON.parse(m.orderInfo) as Record<string, unknown>;
          if (m.deliveryFee == null && parsed.deliveryFee != null)
            m.deliveryFee = typeof parsed.deliveryFee === 'number' ? parsed.deliveryFee : Number(parsed.deliveryFee);
          if ((m.paymentMethodCd == null || m.paymentMethodCd === '') && parsed.paymentMethodCd != null)
            m.paymentMethodCd = String(parsed.paymentMethodCd);
        } catch {
          // ignore
        }
      }
      setMaster(m);
    }
    if (detail?.items) setItems(detail.items.map((i) => ({ ...i })));
  }, [detail]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateMaster = useCallback((updates: Partial<OrderMasterDetail>) => {
    setMaster((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const updateItem = useCallback((lineNo: number, updates: Partial<OrderItemDetail>) => {
    setItems((prev) =>
      prev.map((it) => (it.lineNo === lineNo ? { ...it, ...updates } : it))
    );
  }, []);

  const currentOrderStatus = (orderProcessStatus ?? detail?.master?.orderProcessStatus ?? '').toUpperCase();
  const isOrderReceivedOrHoldStatus = currentOrderStatus === 'ORDER_RECEIVED' || currentOrderStatus === 'HOLD';
  const isShippingFlowStatus =
    currentOrderStatus === 'DELIVERY_READY' || currentOrderStatus === 'SHIPPING' || currentOrderStatus === 'DELIVERED';
  const isReceiverReadonly = !isOrderReceivedOrHoldStatus;
  const isMasterReadonly = isShippingFlowStatus;
  const isAllLineReadonly = isShippingFlowStatus;
  const readOnlyInputStyle = { backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' } as const;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isMasterReadonly) return;
    if (!orderId || !registDt || !master) return;
    const receiverFields = [
      master.receiverNm,
      master.receiverTel,
      master.receiverMobile,
      master.receiverAddr,
      master.receiverAddr2,
      master.receiverZip,
    ];
    if (receiverFields.some((v) => !(v ?? '').trim())) {
      showError(t('common.error'), t('orders.detail.receiverAddressRequired'));
      return;
    }
    const phoneFields = [
      master.receiverTel,
      master.receiverMobile,
      master.ordererTel,
      master.ordererMobile,
    ];
    if (phoneFields.some((v) => (v ?? '').trim() !== '' && !isPhoneFormat(v))) {
      showError(t('common.error'), t('validation.phoneInvalid'));
      return;
    }
    if (items.some((it) => (it.lineQty ?? 0) <= 0 || (it.lineAmount ?? 0) <= 0)) {
      showError(t('common.error'), t('orders.detail.qtyAmountPositive'));
      return;
    }
    const request = {
      registDt,
      master: { ...master, orderId, registDt },
      items: items.map((it) => ({ ...it, orderId, registDt })),
    };
    updateOrder.mutate(request, {
      onSuccess: () => {
        showSuccess(t('orders.detail.saveSuccess')).then(() => onClose());
      },
      onError: (err) => {
        showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
      },
    });
  };

  if (orderId == null || registDt == null) return null;

  const modalContent = (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-modal-title"
    >
      <div className="product-modal" style={{ maxWidth: 720 }}>
        <div className="product-modal__header">
          <h3 id="order-detail-modal-title">{t('orders.detail.title')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        {isLoading && (
          <div className="product-modal__body">{t('common.loading')}</div>
        )}
        {isError && (
          <div className="product-modal__body">{error instanceof Error ? error.message : t('common.error')}</div>
        )}
        {detail && master && (
          <form onSubmit={handleSubmit}>
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

            <div className="product-modal__body">
              {activeTab === 'master' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {/* 기본정보 */}
                  <section style={{ position: 'relative', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                    <h3 className="mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4a5568' }}>
                      <FiInfo size={14} aria-hidden />
                      {t('orders.manualOrder.sectionBasic')}
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                      <FloatingRow id="detail-orderNo" label={t('orders.col.orderNo')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.orderNo ?? ''}
                          readOnly
                          disabled
                          style={{ backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' }}
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-combinedShipNo" label={t('orders.col.combinedShipNo')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.combinedShipNo ?? ''}
                          readOnly
                          disabled
                          style={{ backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' }}
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-orderDt" label={t('orders.col.orderDt')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.orderDt ?? ''}
                          readOnly
                          disabled
                          style={{ backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' }}
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-orderProcessStatus" label={t('orders.col.orderProcessStatus')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={statusCodes.find((c) => c.subCd === (master.orderProcessStatus ?? ''))?.codeNm ?? (master.orderProcessStatus ?? '')}
                          readOnly
                          disabled
                          style={{ backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' }}
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-salesTypeCd" label={t('orders.col.salesTypeCd')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={salesTypeCodes.find((c) => c.subCd === (master.salesTypeCd ?? ''))?.codeNm ?? (master.salesTypeCd ?? '')}
                          readOnly
                          disabled
                          style={{ backgroundColor: 'var(--phoenix-input-disabled-bg, #e9ecef)', cursor: 'not-allowed' }}
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-orderTypeCd" label={t('orders.col.orderTypeCd')}>
                        <select
                          className="form-select form-select-sm"
                          value={master.orderTypeCd ?? ''}
                          onChange={(e) => updateMaster({ orderTypeCd: e.target.value || null })}
                          disabled={isMasterReadonly}
                        >
                          <option value="">{t('common.select')}</option>
                          {orderTypeCodes.map((c) => (
                            <option key={c.subCd} value={c.subCd}>
                              {c.codeNm}
                            </option>
                          ))}
                        </select>
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
                      <FloatingRow id="detail-receiverNm" label={t('orders.col.receiverNm')} required requiredLabel={t('common.requiredMark')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.receiverNm ?? ''}
                          onChange={(e) => updateMaster({ receiverNm: e.target.value || null })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                          required
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-receiverTel" label={t('orders.col.receiverTel')} required requiredLabel={t('common.requiredMark')}>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={master.receiverTel ?? ''}
                          onChange={(e) => updateMaster({ receiverTel: e.target.value || null })}
                          readOnly={isMasterReadonly || isReceiverReadonly}
                          disabled={isMasterReadonly || isReceiverReadonly}
                          style={isMasterReadonly || isReceiverReadonly ? readOnlyInputStyle : undefined}
                          required
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-receiverMobile" label={t('orders.col.receiverMobile')} required requiredLabel={t('common.requiredMark')}>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={master.receiverMobile ?? ''}
                          onChange={(e) => updateMaster({ receiverMobile: e.target.value || null })}
                          readOnly={isMasterReadonly || isReceiverReadonly}
                          disabled={isMasterReadonly || isReceiverReadonly}
                          style={isMasterReadonly || isReceiverReadonly ? readOnlyInputStyle : undefined}
                          required
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-receiverAddr" label={t('orders.col.receiverAddr')} required requiredLabel={t('common.requiredMark')} style={{ gridColumn: '1 / -1' }}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.receiverAddr ?? ''}
                          onChange={(e) => updateMaster({ receiverAddr: e.target.value || null })}
                          readOnly={isMasterReadonly || isReceiverReadonly}
                          disabled={isMasterReadonly || isReceiverReadonly}
                          style={isMasterReadonly || isReceiverReadonly ? readOnlyInputStyle : undefined}
                          required
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-receiverAddr2" label={t('orders.col.receiverAddr2')} required requiredLabel={t('common.requiredMark')} style={{ gridColumn: '1 / -1' }}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.receiverAddr2 ?? ''}
                          onChange={(e) => updateMaster({ receiverAddr2: e.target.value || null })}
                          readOnly={isMasterReadonly || isReceiverReadonly}
                          disabled={isMasterReadonly || isReceiverReadonly}
                          style={isMasterReadonly || isReceiverReadonly ? readOnlyInputStyle : undefined}
                          required
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-receiverZip" label={t('orders.col.receiverZip')} required requiredLabel={t('common.requiredMark')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.receiverZip ?? ''}
                          onChange={(e) => updateMaster({ receiverZip: e.target.value || null })}
                          readOnly={isMasterReadonly || isReceiverReadonly}
                          disabled={isMasterReadonly || isReceiverReadonly}
                          style={isMasterReadonly || isReceiverReadonly ? readOnlyInputStyle : undefined}
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
                      <FloatingRow id="detail-ordererNm" label={t('orders.col.ordererNm')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.ordererNm ?? ''}
                          onChange={(e) => updateMaster({ ordererNm: e.target.value || null })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-ordererUserId" label={t('orders.col.ordererUserId')}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={master.ordererUserId ?? ''}
                          onChange={(e) => updateMaster({ ordererUserId: e.target.value || null })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-ordererTel" label={t('orders.col.ordererTel')}>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={master.ordererTel ?? ''}
                          onChange={(e) => updateMaster({ ordererTel: e.target.value || null })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-ordererMobile" label={t('orders.col.ordererMobile')}>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={master.ordererMobile ?? ''}
                          onChange={(e) => updateMaster({ ordererMobile: e.target.value || null })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
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
                      <FloatingRow id="detail-deliveryFee" label={t('orders.manualOrder.deliveryFee')}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="form-control form-control-sm"
                          value={master.deliveryFee != null ? master.deliveryFee : ''}
                          onChange={(e) => updateMaster({ deliveryFee: e.target.value === '' ? null : parseFloat(e.target.value) || 0 })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                          placeholder=" "
                        />
                      </FloatingRow>
                      <FloatingRow id="detail-paymentMethodCd" label={t('orders.manualOrder.paymentMethodCd')}>
                        <select
                          className="form-select form-select-sm"
                          value={master.paymentMethodCd ?? ''}
                          onChange={(e) => updateMaster({ paymentMethodCd: e.target.value || null })}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                        >
                          <option value="">{t('common.select')}</option>
                          {paymentMethodCodes.map((c) => (
                            <option key={c.subCd} value={c.subCd}>
                              {c.codeNm}
                            </option>
                          ))}
                        </select>
                      </FloatingRow>
                      <FloatingRow id="detail-memo" label={t('orders.col.memo')} style={{ gridColumn: '1 / -1' }}>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={master.memo ?? ''}
                          onChange={(e) => updateMaster({ memo: e.target.value || null })}
                          readOnly={isMasterReadonly}
                          disabled={isMasterReadonly}
                          style={isMasterReadonly ? readOnlyInputStyle : undefined}
                          placeholder=" "
                        />
                      </FloatingRow>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'items' && (
                <div style={{ overflowX: 'auto' }}>
                  {items.map((item) => (
                    <div key={item.lineNo} style={{ border: '1px solid #e3e6f0', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Line {item.lineNo}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1rem' }}>
                        <FloatingRow id={`detail-itemOrderNo-${item.lineNo}`} label={t('orders.col.itemOrderNo')}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={item.itemOrderNo ?? ''}
                            onChange={(e) => updateItem(item.lineNo, { itemOrderNo: e.target.value || null })}
                            readOnly
                            disabled
                            style={readOnlyInputStyle}
                          />
                        </FloatingRow>
                        <FloatingRow id={`detail-productCd-${item.lineNo}`} label={t('orders.col.productCd')}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={item.productCd ?? ''}
                            onChange={(e) => updateItem(item.lineNo, { productCd: e.target.value || null })}
                            readOnly
                            disabled
                            style={readOnlyInputStyle}
                          />
                        </FloatingRow>
                        <FloatingRow id={`detail-productNm-${item.lineNo}`} label={t('orders.col.productNm')} style={{ gridColumn: '1 / -1' }}>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={item.productNm ?? ''}
                            onChange={(e) => updateItem(item.lineNo, { productNm: e.target.value || null })}
                            readOnly
                            disabled
                            style={readOnlyInputStyle}
                          />
                        </FloatingRow>
                        <FloatingRow id={`detail-lineQty-${item.lineNo}`} label={t('orders.col.lineQty')}>
                          <input
                            type="number"
                            min={1}
                            className="form-control form-control-sm"
                            value={item.lineQty ?? ''}
                            onChange={(e) => updateItem(item.lineNo, { lineQty: Math.max(1, Number(e.target.value) || 1) })}
                            readOnly={isAllLineReadonly}
                            disabled={isAllLineReadonly}
                            style={isAllLineReadonly ? readOnlyInputStyle : undefined}
                          />
                        </FloatingRow>
                        <FloatingRow id={`detail-lineAmount-${item.lineNo}`} label={t('orders.col.lineAmount')}>
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            className="form-control form-control-sm"
                            value={item.lineAmount ?? ''}
                            onChange={(e) => updateItem(item.lineNo, { lineAmount: Math.max(0.01, Number(e.target.value) || 0.01) })}
                            readOnly={isAllLineReadonly}
                            disabled={isAllLineReadonly}
                            style={isAllLineReadonly ? readOnlyInputStyle : undefined}
                          />
                        </FloatingRow>
                        <FloatingRow id={`detail-lineDiscountAmount-${item.lineNo}`} label={t('orders.col.lineDiscountAmount')}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            value={item.lineDiscountAmount ?? ''}
                            onChange={(e) => updateItem(item.lineNo, { lineDiscountAmount: Number(e.target.value) || 0 })}
                            readOnly={isAllLineReadonly}
                            disabled={isAllLineReadonly}
                            style={isAllLineReadonly ? readOnlyInputStyle : undefined}
                          />
                        </FloatingRow>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="product-modal__footer product-modal__footer--compact" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-phoenix-secondary btn-sm btn-default-visible" onClick={onClose}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-phoenix-primary btn-sm" disabled={updateOrder.isPending || isMasterReadonly}>
                {updateOrder.isPending ? t('common.loading') : t('orders.detail.save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  const portalRoot = document.getElementById('modal-portal');
  if (portalRoot) return createPortal(modalContent, portalRoot);
  return modalContent;
}
