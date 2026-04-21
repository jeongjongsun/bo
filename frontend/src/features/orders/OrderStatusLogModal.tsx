import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  FiClipboard,
  FiPause,
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiBox,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiInfo,
  FiAlertTriangle,
  FiList,
} from 'react-icons/fi';
import type { IconBaseProps } from 'react-icons';
import { useOrderStatusLog } from './hooks';
import type { OrderStatusLogItem as LogItem } from './types';

export interface OrderStatusLogModalProps {
  orderId: number | null;
  registDt: string | null;
  corporationCd: string;
  storeCd?: string | null;
  onClose: () => void;
}

const ICON_SIZE = 14;

type IconComponent = React.ComponentType<IconBaseProps>;

/** 표시 가능한 모든 상태(kind+value)에 대한 아이콘 매핑 (react-icons/fi). */
const STATUS_LOG_ICONS: Record<string, { Icon: IconComponent; className: string }> = {
  // ORDER_PROCESS (주문처리상태)
  'ORDER_PROCESS:ORDER_RECEIVED': { Icon: FiClipboard, className: 'text-primary' },
  'ORDER_PROCESS:HOLD': { Icon: FiPause, className: 'text-warning' },
  'ORDER_PROCESS:PROCESSING': { Icon: FiPackage, className: 'text-info' },
  'ORDER_PROCESS:SHIP_READY': { Icon: FiTruck, className: 'text-success' },
  'ORDER_PROCESS:DELIVERED': { Icon: FiCheckCircle, className: 'text-success' },
  'ORDER_PROCESS:CANCELLED': { Icon: FiXCircle, className: 'text-danger' },
  // SHIP_STATUS (출고상태)
  'SHIP_STATUS:PENDING': { Icon: FiClock, className: 'text-body-secondary' },
  'SHIP_STATUS:READY': { Icon: FiBox, className: 'text-info' },
  'SHIP_STATUS:SHIPPED': { Icon: FiTruck, className: 'text-success' },
  'SHIP_STATUS:PARTIAL': { Icon: FiPackage, className: 'text-warning' },
  // DELIVERY_STATUS (배송상태)
  'DELIVERY_STATUS:PENDING': { Icon: FiClock, className: 'text-body-secondary' },
  'DELIVERY_STATUS:IN_TRANSIT': { Icon: FiTruck, className: 'text-info' },
  'DELIVERY_STATUS:DELIVERED': { Icon: FiCheckCircle, className: 'text-success' },
  'DELIVERY_STATUS:RETURNED': { Icon: FiPackage, className: 'text-warning' },
  'DELIVERY_STATUS:FAILED': { Icon: FiAlertTriangle, className: 'text-danger' },
  // ETC (기타)
  'ETC:REGISTERED': { Icon: FiPlus, className: 'text-success' },
  'ETC:UPDATED': { Icon: FiEdit2, className: 'text-info' },
  'ETC:LINE_DELETED': { Icon: FiTrash2, className: 'text-danger' },
  'ETC:CREATED': { Icon: FiPlus, className: 'text-success' },
};

/** statusKind만으로 쓰는 기본 아이콘 (value 매칭 실패 시) */
const STATUS_KIND_DEFAULT_ICONS: Record<string, { Icon: IconComponent; className: string }> = {
  ORDER_PROCESS: { Icon: FiList, className: 'text-primary' },
  SHIP_STATUS: { Icon: FiBox, className: 'text-info' },
  DELIVERY_STATUS: { Icon: FiTruck, className: 'text-info' },
  ETC: { Icon: FiInfo, className: 'text-body-secondary' },
};

function getLogIcon(item: LogItem): { Icon: IconComponent; className: string } {
  const key = `${item.statusKind}:${item.statusValue}`;
  return (
    STATUS_LOG_ICONS[key] ??
    STATUS_KIND_DEFAULT_ICONS[item.statusKind] ?? { Icon: FiInfo, className: 'text-body-secondary' }
  );
}

function formatDateTime(s: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min}:${sec}`;
}

export function OrderStatusLogModal({
  orderId,
  registDt,
  corporationCd,
  storeCd,
  onClose,
}: OrderStatusLogModalProps) {
  const { t } = useTranslation();
  const { data: logs = [], isLoading, isError, error } = useOrderStatusLog(orderId, registDt, corporationCd, storeCd);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (orderId == null || registDt == null) return null;

  const label = (item: LogItem): string => {
    const kindKey = `orders.statusLog.statusKind.${item.statusKind}`;
    const valueKey = `orders.statusLog.statusValue.${item.statusValue}`;
    const kind = t(kindKey) !== kindKey ? t(kindKey) : item.statusKind;
    const value = t(valueKey) !== valueKey ? t(valueKey) : item.statusValue;
    return `${kind}: ${value}`;
  };

  const modalContent = (
    <div
      className="product-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-status-log-modal-title"
    >
      <div className="product-modal" style={{ maxWidth: 560 }}>
        <div className="product-modal__header">
          <h3 id="order-status-log-modal-title">{t('orders.statusLog.title')}</h3>
          <button type="button" className="product-modal__close" onClick={onClose} aria-label={t('common.cancel')}>
            ×
          </button>
        </div>

        {isLoading && <div className="product-modal__body">{t('common.loading')}</div>}
        {isError && (
          <div className="product-modal__body">{error instanceof Error ? error.message : t('common.error')}</div>
        )}
        {!isLoading && !isError && (
          <div className="product-modal__body" style={{ padding: '1rem 1.25rem' }}>
            {logs.length === 0 ? (
              <p className="text-body-secondary mb-0">{t('orders.statusLog.empty')}</p>
            ) : (
              <div className="timeline-basic">
                {logs.map((item, index) => {
                  const { Icon, className } = getLogIcon(item);
                  const isLast = index === logs.length - 1;
                  const byLabel =
                    item.statusByNm != null && item.statusByNm !== ''
                      ? `${item.statusByNm} (${item.statusBy})`
                      : item.statusBy ?? '';
                  return (
                    <div key={item.id} className="timeline-item order-status-log-item">
                      <div className="row g-3">
                        <div className="col-auto d-flex flex-column">
                          <div className="icon-item icon-item-md rounded-7 border border-translucent d-flex align-items-center justify-content-center flex-shrink-0">
                            <Icon size={ICON_SIZE} className={className} />
                          </div>
                          {!isLast && <div className="order-status-log-timeline-bar" aria-hidden />}
                        </div>
                        <div className="col">
                          <div className="d-flex justify-content-between">
                            <div className="d-flex mb-2">
                              <h6 className="lh-sm mb-0 me-2 text-body-secondary timeline-item-title">
                                {label(item)}
                              </h6>
                            </div>
                            <p className="text-body-quaternary fs-9 mb-0 text-nowrap timeline-time">
                              <FiClock size={12} className="me-1" />
                              {formatDateTime(item.statusDt)}
                            </p>
                          </div>
                          {byLabel !== '' && (
                            <h6 className="fs-10 fw-normal mb-0">
                              {t('orders.statusLog.byLabel')}{' '}
                              <span className="fw-semibold link-primary">
                                {byLabel}
                              </span>
                            </h6>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const portalRoot = document.getElementById('modal-portal');
  if (portalRoot) return createPortal(modalContent, portalRoot);
  return modalContent;
}
