import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ColDef, ICellRendererParams, SelectionChangedEvent, CellValueChangedEvent } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';
import {
  FiPlus,
  FiCheckSquare,
  FiArrowRight,
  FiCalendar,
  FiDownload,
  FiEdit,
  FiFilter,
  FiSearch,
  FiUpload,
  FiPause,
  FiPlay,
  FiTrash2,
  FiFileText,
  FiLayers,
  FiArrowLeft,
  FiGift,
  FiTruck,
} from 'react-icons/fi';
import { DataGrid, DataGridPaginationFooter, type DataGridRef } from '@/components/grid';
import { PageLayout } from '@/components/layout/PageLayout';
import { useCorporationStore } from '@/store/useCorporationStore';
import { useClickOutside } from '@/hooks/useClickOutside';
import { showSuccess, showError, confirm } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { useUserSettings } from '@/features/settings/hooks';
import { useOrderList, useOrderProcessStatusCodes, useOrderCountsByStatus, useBulkHoldOrders, useBulkUnholdOrders, useBulkDeleteOrders, useBulkOrderProcess, useBulkOrderProcessByFilter, useBulkOrderReceivedProcess, useBulkOrderReceivedProcessByFilter, useBulkShipOrderProcess, useBulkShipOrderProcessByFilter, useBulkProcessingProcess, useUpdateOrderMasterField, useUpdateOrderItemField, useBulkImportOrders } from './hooks';
import type { OrderListItem, OrderDateType } from './types';
import { downloadOrderFullExport, type OrderBulkItem, type OrderBulkItemItem, type OrderBulkProcessResult } from '@/api/orders';
import { OrderDetailModal } from './OrderDetailModal';
import { ManualOrderModal } from './ManualOrderModal';
import { OrderStatusLogModal } from './OrderStatusLogModal';
import type { TabItem } from '@/store/useTabStore';

/** 경로별 판매구분(sales_type_cd). 동일 OrderList에서 메뉴별 그리드 필터만 다르게 적용. */
const PATH_SALES_TYPE_CD: Record<string, string> = {
  '/order': 'B2C_DOMESTIC',
  '/order/overseas-b2c': 'B2C_OVERSEAS',
  '/order/domestic-b2b': 'B2B_DOMESTIC',
  '/order/overseas-b2b': 'B2B_OVERSEAS',
  '/order/other': 'ETC',
};

/** 주문 간편 보기 시 표시할 컬럼 필드명 (나머지는 숨김). */
const ORDER_SIMPLE_VIEW_FIELDS = [
  'rowNum', 'orderNo', 'combinedShipNo', 'storeNm', 'orderDt', 'registDt',
  'invoiceNo', 'productCd', 'productNm', 'lineQty', 'lineAmount', 'receiverNm',
] as const;

/** 경로별 페이지 제목 키 (orders.titleDomesticB2c 등). */
const PATH_TITLE_KEY: Record<string, string> = {
  '/order': 'orders.titleDomesticB2c',
  '/order/overseas-b2c': 'orders.titleOverseasB2c',
  '/order/domestic-b2b': 'orders.titleDomesticB2b',
  '/order/overseas-b2b': 'orders.titleOverseasB2b',
  '/order/other': 'orders.titleOther',
};

/** 공통코드 API가 비었을 때 툴바에 쓸 기본 주문처리상태 (취소·보류·비매칭 제외). */
const DEFAULT_ORDER_PROCESS_STATUS_CODES = [
  { subCd: 'ORDER_RECEIVED', codeNm: '발주(접수)' },
  { subCd: 'PROCESSING', codeNm: '처리(주문서처리)' },
  { subCd: 'SHIP_READY', codeNm: '출고준비' },
  { subCd: 'DELIVERY_READY', codeNm: '발송준비' },
  { subCd: 'SHIPPING', codeNm: '배송중' },
  { subCd: 'DELIVERED', codeNm: '배송완료' },
];

/** jQuery + daterangepicker (window.$ from index.html) */
type JQueryDaterange = (el: unknown) => {
  daterangepicker: (opts: unknown, cb?: (s: { format: (f: string) => string }, e: { format: (f: string) => string }) => void) => unknown;
  data: (k: string) => unknown;
};

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function getDefaultOrderDtFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 3);
  return formatYmd(d);
}
function getDefaultOrderDtTo(): string {
  return formatYmd(new Date());
}

const STATUS_BADGE_CLASSES = [
  'badge badge-phoenix badge-phoenix-primary',
  'badge badge-phoenix badge-phoenix-info',
  'badge badge-phoenix badge-phoenix-success',
  'badge badge-phoenix badge-phoenix-warning',
  'badge badge-phoenix badge-phoenix-secondary',
  'badge badge-phoenix badge-phoenix-danger',
  'badge badge-phoenix badge-phoenix-dark',
];

export function OrderList({ tab }: { tab?: TabItem }) {
  const { t, i18n } = useTranslation();
  const { corporationCd } = useCorporationStore();
  const { data: userSettings } = useUserSettings();
  const orderSimpleView = userSettings?.orderSimpleViewYn ?? false;
  const salesTypeCd = tab?.path ? PATH_SALES_TYPE_CD[tab.path] : undefined;
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(1000);
  const [statusFilter, setStatusFilter] = useState<string>('ORDER_RECEIVED');
  const [dateTypeFilter, setDateTypeFilter] = useState<OrderDateType>('ORDER_DT');
  const [orderDtFrom, setOrderDtFrom] = useState<string>(getDefaultOrderDtFrom);
  const [orderDtTo, setOrderDtTo] = useState<string>(getDefaultOrderDtTo);
  const [searchColumn, setSearchColumn] = useState<string>('ORDER_NO_CONTAINS');
  const [appliedSearchColumn, setAppliedSearchColumn] = useState<string>('ORDER_NO_CONTAINS'); // 검색 실행 시 API에 전달되는 컬럼
  const [searchKeyword, setSearchKeyword] = useState<string>(''); // 입력 필드 값
  const [appliedSearchKeyword, setAppliedSearchKeyword] = useState<string>(''); // 검색 버튼 클릭 시 API에 전달되는 값
  const [searchTrigger, setSearchTrigger] = useState(0); // 검색 클릭 시 증가하여 queryKey 변경·리패치 보장
  const [selectedOrder, setSelectedOrder] = useState<OrderListItem | null>(null);
  const gridRef = useRef<DataGridRef>(null);
  const orderRegisterDropdownRef = useRef<HTMLDivElement>(null);
  const selectActionDropdownRef = useRef<HTMLDivElement>(null);
  const nextStepDropdownRef = useRef<HTMLDivElement>(null);
  const giftDropdownRef = useRef<HTMLDivElement>(null);
  const prevStepDropdownRef = useRef<HTMLDivElement>(null);
  const shipNextStepDropdownRef = useRef<HTMLDivElement>(null);
  const shipReadyPrevDropdownRef = useRef<HTMLDivElement>(null);
  const shipInstructionDropdownRef = useRef<HTMLDivElement>(null);
  const combinedSelectActionDropdownRef = useRef<HTMLDivElement>(null);
  const shipReadySelectActionDropdownRef = useRef<HTMLDivElement>(null);
  const excelDropdownRef = useRef<HTMLDivElement>(null);
  const orderBulkImportFileInputRef = useRef<HTMLInputElement>(null);
  const [orderRegisterDropdownOpen, setOrderRegisterDropdownOpen] = useState(false);
  const [manualOrderModalOpen, setManualOrderModalOpen] = useState(false);
  const [statusLogOrder, setStatusLogOrder] = useState<{
    orderId: number;
    registDt: string;
    corporationCd: string;
    storeCd?: string;
  } | null>(null);
  const [selectActionDropdownOpen, setSelectActionDropdownOpen] = useState(false);
  const [nextStepDropdownOpen, setNextStepDropdownOpen] = useState(false);
  const [giftDropdownOpen, setGiftDropdownOpen] = useState(false);
  const [prevStepDropdownOpen, setPrevStepDropdownOpen] = useState(false);
  const [shipNextStepDropdownOpen, setShipNextStepDropdownOpen] = useState(false);
  const [shipReadyPrevDropdownOpen, setShipReadyPrevDropdownOpen] = useState(false);
  const [shipInstructionDropdownOpen, setShipInstructionDropdownOpen] = useState(false);
  const [combinedSelectActionDropdownOpen, setCombinedSelectActionDropdownOpen] = useState(false);
  const [shipReadySelectActionDropdownOpen, setShipReadySelectActionDropdownOpen] = useState(false);
  const [excelDropdownOpen, setExcelDropdownOpen] = useState(false);
  const [isFullExportDownloading, setIsFullExportDownloading] = useState(false);

  const daterangeInputRef = useRef<HTMLInputElement>(null);
  const [selectedRows, setSelectedRows] = useState<OrderListItem[]>([]);

  const showOrderToolbarButtons = statusFilter === 'ORDER_RECEIVED' || statusFilter === 'HOLD';
  const showCombinedToolbarButtons = statusFilter === 'PROCESSING';
  const showShipReadyToolbarButtons = statusFilter === 'SHIP_READY';
  /** 발주/합포장/출고준비 탭에서는 선택처리 사용 → 선택 유지 */
  const tabHasSelectProcess = statusFilter === 'ORDER_RECEIVED' || statusFilter === 'HOLD' || statusFilter === 'PROCESSING' || statusFilter === 'SHIP_READY';

  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<OrderListItem>) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  useEffect(() => {
    if (!tabHasSelectProcess) setSelectedRows([]);
  }, [tabHasSelectProcess]);

  useEffect(() => {
    if (statusFilter !== 'ORDER_RECEIVED') return;
    if (searchColumn === 'COMBINED_SHIP_NO_EXACT') {
      setSearchColumn('ORDER_NO_CONTAINS');
    }
    if (appliedSearchColumn === 'COMBINED_SHIP_NO_EXACT') {
      setAppliedSearchColumn('ORDER_NO_CONTAINS');
    }
  }, [statusFilter, searchColumn, appliedSearchColumn]);

  useEffect(() => {
    setPage(0);
    gridRef.current?.scrollToTop();
  }, [statusFilter]);

  /** 환경설정에 저장된 주문 그리드 기간 검색 기본값 적용 */
  useEffect(() => {
    if (userSettings != null) {
      const defaultType = (userSettings.defaultOrderDateType === 'ORDER_DT' || userSettings.defaultOrderDateType === 'REGIST_DT')
        ? userSettings.defaultOrderDateType
        : 'ORDER_DT';
      setDateTypeFilter(defaultType);
    }
  }, [userSettings?.defaultOrderDateType]);

  useClickOutside(orderRegisterDropdownRef, () => setOrderRegisterDropdownOpen(false), orderRegisterDropdownOpen);
  useClickOutside(selectActionDropdownRef, () => setSelectActionDropdownOpen(false), selectActionDropdownOpen);
  useClickOutside(nextStepDropdownRef, () => setNextStepDropdownOpen(false), nextStepDropdownOpen);
  useClickOutside(giftDropdownRef, () => setGiftDropdownOpen(false), giftDropdownOpen);
  useClickOutside(prevStepDropdownRef, () => setPrevStepDropdownOpen(false), prevStepDropdownOpen);
  useClickOutside(shipNextStepDropdownRef, () => setShipNextStepDropdownOpen(false), shipNextStepDropdownOpen);
  useClickOutside(shipReadyPrevDropdownRef, () => setShipReadyPrevDropdownOpen(false), shipReadyPrevDropdownOpen);
  useClickOutside(shipInstructionDropdownRef, () => setShipInstructionDropdownOpen(false), shipInstructionDropdownOpen);
  useClickOutside(combinedSelectActionDropdownRef, () => setCombinedSelectActionDropdownOpen(false), combinedSelectActionDropdownOpen);
  useClickOutside(shipReadySelectActionDropdownRef, () => setShipReadySelectActionDropdownOpen(false), shipReadySelectActionDropdownOpen);
  useClickOutside(excelDropdownRef, () => setExcelDropdownOpen(false), excelDropdownOpen);

  useEffect(() => {
    const win = window as Window & { $?: (el: unknown) => unknown; moment?: (inp?: unknown) => unknown };
    const $ = win.$;
    const moment = win.moment;
    const el = daterangeInputRef.current;
    if (!$ || !el || typeof moment !== 'function') return;
    // moment from index.html script
    const momentFn = moment as (inp?: unknown) => { clone: () => unknown; startOf: (u: string) => unknown; endOf: (u: string) => unknown; subtract: (n: number, u: string) => unknown } & { locale?: (l: string) => void };
    if (typeof (momentFn as unknown as { locale?: (l: string) => void }).locale === 'function') {
      (momentFn as unknown as { locale: (l: string) => void }).locale(i18n.language);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const now = momentFn() as any;
    const todayLabel = t('orders.dateRange.today');
    const yesterdayLabel = t('orders.dateRange.yesterday');
    const oneWeekLabel = t('orders.dateRange.oneWeek');
    const oneMonthLabel = t('orders.dateRange.oneMonth');
    const thisMonthLabel = t('orders.dateRange.thisMonth');
    const lastMonthLabel = t('orders.dateRange.lastMonth');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ranges: Record<string, [any, any]> = {
      [todayLabel]: [now.clone().startOf('day'), now.clone().endOf('day')],
      [yesterdayLabel]: [now.clone().subtract(1, 'day').startOf('day'), now.clone().subtract(1, 'day').endOf('day')],
      [oneWeekLabel]: [now.clone().subtract(6, 'days').startOf('day'), now.clone().endOf('day')],
      [oneMonthLabel]: [now.clone().subtract(29, 'days').startOf('day'), now.clone().endOf('day')],
      [thisMonthLabel]: [now.clone().startOf('month'), now.clone().endOf('month')],
      [lastMonthLabel]: [now.clone().subtract(1, 'month').startOf('month'), now.clone().subtract(1, 'month').endOf('month')],
    };
    const jq = $ as JQueryDaterange;
    jq(el).daterangepicker(
      {
        startDate: orderDtFrom,
        endDate: orderDtTo,
        autoUpdateInput: false,
        locale: {
          format: 'YYYY-MM-DD',
          separator: ' ~ ',
          applyLabel: t('orders.dateRange.apply'),
          cancelLabel: t('orders.dateRange.cancel'),
          customRangeLabel: t('orders.dateRange.customRange'),
          daysOfWeek: [
            t('orders.dateRange.daySun'),
            t('orders.dateRange.dayMon'),
            t('orders.dateRange.dayTue'),
            t('orders.dateRange.dayWed'),
            t('orders.dateRange.dayThu'),
            t('orders.dateRange.dayFri'),
            t('orders.dateRange.daySat'),
          ],
          monthNames: [
            t('orders.dateRange.month1'),
            t('orders.dateRange.month2'),
            t('orders.dateRange.month3'),
            t('orders.dateRange.month4'),
            t('orders.dateRange.month5'),
            t('orders.dateRange.month6'),
            t('orders.dateRange.month7'),
            t('orders.dateRange.month8'),
            t('orders.dateRange.month9'),
            t('orders.dateRange.month10'),
            t('orders.dateRange.month11'),
            t('orders.dateRange.month12'),
          ],
          firstDay: 0,
        },
        opens: 'left',
        ranges,
        showCustomRangeLabel: true,
      },
      (start: { format: (f: string) => string }, end: { format: (f: string) => string }) => {
        setOrderDtFrom(start.format('YYYY-MM-DD'));
        setOrderDtTo(end.format('YYYY-MM-DD'));
        setPage(0);
      },
    );
    return () => {
      const picker = jq(el).data('daterangepicker') as { remove?: () => void } | undefined;
      if (picker?.remove) picker.remove();
    };
  }, [i18n.language, t]);

  const bulkHold = useBulkHoldOrders();
  const bulkUnhold = useBulkUnholdOrders();
  const bulkDelete = useBulkDeleteOrders();
  const { mutateAsync: bulkImportOrders, isPending: isBulkImporting } = useBulkImportOrders();
  const bulkOrderProcess = useBulkOrderProcess();
  const bulkOrderProcessByFilter = useBulkOrderProcessByFilter();
  const bulkOrderReceivedProcess = useBulkOrderReceivedProcess();
  const bulkOrderReceivedProcessByFilter = useBulkOrderReceivedProcessByFilter();
  const bulkShipOrderProcess = useBulkShipOrderProcess();
  const bulkShipOrderProcessByFilter = useBulkShipOrderProcessByFilter();
  const bulkProcessingProcess = useBulkProcessingProcess();
  const updateOrderMasterField = useUpdateOrderMasterField();
  const updateOrderItemField = useUpdateOrderItemField();

  /** 선택 주문서처리 / 일괄 주문서 처리 / 주문 엑셀 일괄등록 / 선택 출고보류·보류해제 / 선택 삭제 진행 중 여부 (로딩바 표시용) */
  const isBulkActionPending =
    bulkHold.isPending ||
    bulkUnhold.isPending ||
    bulkDelete.isPending ||
    isBulkImporting ||
    bulkOrderProcess.isPending ||
    bulkOrderProcessByFilter.isPending ||
    bulkOrderReceivedProcess.isPending ||
    bulkOrderReceivedProcessByFilter.isPending ||
    bulkShipOrderProcess.isPending ||
    bulkShipOrderProcessByFilter.isPending ||
    bulkProcessingProcess.isPending;

  const { data: statusCodes = [] } = useOrderProcessStatusCodes();
  const { data: countsData } = useOrderCountsByStatus({
    corporationCd: corporationCd ?? undefined,
    salesTypeCd,
    dateType: dateTypeFilter,
    orderDtFrom,
    orderDtTo,
  });

  const listParams = useMemo(
    () => ({
      corporationCd: corporationCd ?? undefined,
      salesTypeCd,
      orderProcessStatus: statusFilter === 'all' || statusFilter === 'DELETED' ? undefined : statusFilter,
      dateType: dateTypeFilter,
      orderDtFrom,
      orderDtTo,
      showDeletedOnly: statusFilter === 'DELETED',
      searchColumn: appliedSearchColumn || undefined,
      searchKeyword: appliedSearchKeyword || undefined,
      page,
      size: pageSize,
      searchTrigger,
      minimalColumns: orderSimpleView,
    }),
    [corporationCd, salesTypeCd, statusFilter, dateTypeFilter, orderDtFrom, orderDtTo, appliedSearchColumn, appliedSearchKeyword, page, pageSize, searchTrigger, orderSimpleView],
  );

  const handleSearch = useCallback(() => {
    setAppliedSearchColumn(searchColumn);
    setAppliedSearchKeyword(searchKeyword.trim());
    setPage(0);
    setSearchTrigger((t) => t + 1);
  }, [searchColumn, searchKeyword]);

  const { data, isLoading, isFetching } = useOrderList(listParams);
  const isGridLoading = isLoading || isFetching;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const first = data?.first ?? true;
  const last = data?.last ?? true;

  const openOrderDetail = useCallback((order: OrderListItem) => setSelectedOrder(order), []);

  const handleBulkImportClick = useCallback(() => {
    setOrderRegisterDropdownOpen(false);
    if (!corporationCd) {
      showError(t('common.error'), t('orders.corporationRequired'));
      return;
    }
    requestAnimationFrame(() => orderBulkImportFileInputRef.current?.click());
  }, [corporationCd, t]);

  const handleBulkImportFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (!corporationCd) {
        showError(t('common.error'), t('orders.corporationRequired'));
        return;
      }
      bulkImportOrders({ file, corporationCd, salesTypeCd })
        .then((res) => {
          const hasErrors = res.errors?.length > 0;
          const noSuccess = res.successOrderCount === 0;
          const translateErr = (err: string) => {
            if (err.startsWith('orders.bulkImport.requiredFieldMissing|')) {
              const parts = err.split('|');
              const row = parts[1];
              const fieldKey = parts[2] || '';
              const fieldLabel = t(`orders.bulkImport.fields.${fieldKey}`);
              return t('orders.bulkImport.requiredFieldMissing', { row, field: fieldLabel });
            }
            if (err.startsWith('orders.bulkImport.duplicateOrderNo|')) {
              const orderNosStr = err.slice('orders.bulkImport.duplicateOrderNo|'.length);
              const arr = orderNosStr.split(',').map((s) => s.trim()).filter(Boolean);
              const displayList = arr.length > 3 ? arr.slice(0, 3) : arr;
              const orderNosFormatted = displayList.join('\n') + (arr.length > 3 ? ' ...' : '');
              return t('orders.bulkImport.duplicateOrderNo', { orderNos: orderNosFormatted });
            }
            if (err.startsWith('orders.bulkImport.invalidStoreCd|')) {
              const storeCdsStr = err.slice('orders.bulkImport.invalidStoreCd|'.length);
              const arr = storeCdsStr.split(',').map((s) => s.trim()).filter(Boolean);
              const displayList = arr.length > 3 ? arr.slice(0, 3) : arr;
              const storeCdsFormatted = displayList.join('\n') + (arr.length > 3 ? ' ...' : '');
              return t('orders.bulkImport.invalidStoreCd', { storeCds: storeCdsFormatted });
            }
            const m = err.match(/^주문 (\d+): (.+)$/);
            if (m) return `${t('orders.bulkImport.orderLabel')} ${m[1]}: ${t(m[2])}`;
            return t(err) || err;
          };
          if (hasErrors && noSuccess) {
            const translated = res.errors!.map(translateErr);
            const title =
              translated.length > 3
                ? t('orders.bulkImport.errorDetailWithCount', { count: translated.length })
                : t('orders.bulkImport.errorDetail');
            const firstThree = translated.slice(0, 3);
            const content =
              translated.length > 3
                ? firstThree.map((line, i) => (i === firstThree.length - 1 ? `${line} ...` : line)).join('\n')
                : translated.join('\n');
            showError(title, content);
            return;
          }
          const msg =
            res.failOrderCount > 0
              ? t('orders.bulkImport.resultWithErrors', {
                  successOrder: res.successOrderCount,
                  successLine: res.successLineCount,
                  failOrder: res.failOrderCount,
                })
              : t('orders.bulkImport.resultSuccess', {
                  successOrder: res.successOrderCount,
                  successLine: res.successLineCount,
                });
          showSuccess(msg);
          if (hasErrors) {
            const translated = res.errors!.map(translateErr);
            const title =
              translated.length > 3
                ? t('orders.bulkImport.errorDetailWithCount', { count: translated.length })
                : t('orders.bulkImport.errorDetail');
            const firstThree = translated.slice(0, 3);
            const content =
              translated.length > 3
                ? firstThree.map((line, i) => (i === firstThree.length - 1 ? `${line} ...` : line)).join('\n')
                : translated.join('\n');
            showError(title, content);
          }
        })
        .catch((err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        });
    },
    [corporationCd, salesTypeCd, bulkImportOrders, t],
  );

  /** 선택된 라인에서 주문 단위( orderId + registDt )만 유일하게 추출 (출고보류/보류해제/선택 주문서 처리용) */
  const selectedOrderKeys = useMemo((): OrderBulkItem[] => {
    const set = new Set<string>();
    const list: OrderBulkItem[] = [];
    for (const row of selectedRows) {
      const key = `${row.orderId}-${row.registDt}`;
      if (!set.has(key)) {
        set.add(key);
        list.push({ orderId: row.orderId, registDt: row.registDt });
      }
    }
    return list;
  }, [selectedRows]);

  /** 선택된 라인 단위 (삭제용: orderId + registDt + lineNo) */
  const selectedOrderItems = useMemo((): OrderBulkItemItem[] => {
    return selectedRows.map((row) => ({
      orderId: row.orderId,
      registDt: row.registDt,
      lineNo: row.lineNo,
    }));
  }, [selectedRows]);

  const showOrderTransitionResult = useCallback(
    (successKey: string, orderCount: number, lineCount: number, updatedCount?: number, requestedCount?: number) => {
      const skipped = requestedCount != null && updatedCount != null && requestedCount > updatedCount;
      if (skipped && updatedCount != null && requestedCount != null) {
        const skippedCount = requestedCount - updatedCount;
        showSuccess(
          t(successKey, { orderCount, lineCount }),
          t('orders.toolbar.concurrentSkipped', {
            requested: requestedCount,
            updated: updatedCount,
            skipped: skippedCount,
          }),
        );
        return;
      }
      showSuccess(t(successKey, { orderCount, lineCount }));
    },
    [t],
  );

  /** 주문서 처리 결과 표시: 제외 건이 있으면 처리자(processedBy)를 요약해 표시 */
  const showOrderProcessResult = useCallback(
    (successKey: string, result: OrderBulkProcessResult, orderCount: number, lineCount: number, requestedCount: number) => {
      if (result.skippedCount > 0 && result.skipped && result.skipped.length > 0) {
        const byUser = result.skipped.reduce<Record<string, number>>((acc, s) => {
          const name = (s.processedByNm ?? '').trim() || t('orders.toolbar.unknownUser');
          acc[name] = (acc[name] ?? 0) + 1;
          return acc;
        }, {});
        const userSummary = Object.entries(byUser)
          .map(([name, n]) => (n > 1 ? `${name}(${n}건)` : name))
          .join(', ');
        showSuccess(
          t(successKey, { orderCount, lineCount }),
          t('orders.toolbar.concurrentSkippedWithUsers', {
            requested: requestedCount,
            updated: result.processedCount,
            skipped: result.skippedCount,
            userSummary,
          }),
        );
        return;
      }
      if (result.skippedCount > 0) {
        showSuccess(
          t(successKey, { orderCount, lineCount }),
          t('orders.toolbar.concurrentSkipped', {
            requested: requestedCount,
            updated: result.processedCount,
            skipped: result.skippedCount,
          }),
        );
        return;
      }
      showSuccess(t(successKey, { orderCount, lineCount }));
    },
    [t],
  );

  const handleBulkHold = useCallback(() => {
    setSelectActionDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkHold.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          showOrderTransitionResult('orders.toolbar.holdSuccess', result.orderCount, result.lineCount);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkHold, t, showOrderTransitionResult]);

  const handleBulkUnhold = useCallback(() => {
    setSelectActionDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkUnhold.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          showOrderTransitionResult('orders.toolbar.unholdSuccess', result.orderCount, result.lineCount);
          setStatusFilter('ORDER_RECEIVED');
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkUnhold, t, showOrderTransitionResult]);

  const handleBulkDelete = useCallback(async () => {
    setSelectActionDropdownOpen(false);
    if (!corporationCd || selectedOrderItems.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    const confirmed = await confirm(
      t('orders.toolbar.deleteConfirm', { count: selectedOrderItems.length }),
      undefined,
      { confirmButtonText: t('common.delete'), cancelButtonText: t('common.cancel'), icon: 'warning' },
    );
    if (!confirmed) return;
    bulkDelete.mutate(
      { corporationCd, items: selectedOrderItems },
      {
        onSuccess: (count) => {
          showSuccess(t('orders.toolbar.deleteSuccess', { orderCount: selectedOrderKeys.length, lineCount: count }));
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderItems, bulkDelete, t]);

  /** 선택 주문서 처리: 선택된 행만 처리 (선택 필수) */
  const handleBulkOrderProcess = useCallback(() => {
    setNextStepDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkOrderProcess.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          const orderCount = result.processedCount;
          const lineCount = result.processedLineCount ?? 0;
          showOrderProcessResult('orders.toolbar.orderProcessSuccess', result, orderCount, lineCount, selectedOrderKeys.length);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkOrderProcess, t, showOrderProcessResult]);

  /** 일괄 주문서 처리: 필터 조건(날짜범위·검색조건·검색어)에 맞는 발주(접수) 전체 처리 (선택 무관) */
  const handleBulkOrderProcessAll = useCallback(() => {
    setNextStepDropdownOpen(false);
    if (!corporationCd) {
      showError(t('orders.toolbar.noSelection'), t('orders.corporation_required'));
      return;
    }
    bulkOrderProcessByFilter.mutate(
      {
        corporationCd,
        salesTypeCd: salesTypeCd ?? undefined,
        dateType: dateTypeFilter,
        orderDtFrom,
        orderDtTo,
        searchColumn: appliedSearchColumn || undefined,
        searchKeyword: appliedSearchKeyword || undefined,
      },
      {
        onSuccess: (result) => {
          const orderCount = result.processedCount;
          const lineCount = result.processedLineCount ?? total;
          showOrderProcessResult('orders.toolbar.orderProcessSuccess', result, orderCount, lineCount, total);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, salesTypeCd, dateTypeFilter, orderDtFrom, orderDtTo, appliedSearchColumn, appliedSearchKeyword, bulkOrderProcessByFilter, t, total, showOrderProcessResult]);

  const handleComingSoonAction = useCallback(
    (labelKey: string) => {
      showSuccess(t('orders.toolbar.comingSoon', { action: t(labelKey) }));
    },
    [t],
  );

  const handleBulkOrderReceivedProcess = useCallback(() => {
    setPrevStepDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkOrderReceivedProcess.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          showOrderTransitionResult('orders.toolbar.orderReceivedProcessSuccess', result.orderCount, result.lineCount);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkOrderReceivedProcess, t, showOrderTransitionResult]);

  const handleBulkOrderReceivedProcessAll = useCallback(() => {
    setPrevStepDropdownOpen(false);
    if (!corporationCd) {
      showError(t('orders.toolbar.noSelection'), t('orders.corporation_required'));
      return;
    }
    bulkOrderReceivedProcessByFilter.mutate(
      {
        corporationCd,
        salesTypeCd: salesTypeCd ?? undefined,
        dateType: dateTypeFilter,
        orderDtFrom,
        orderDtTo,
        searchColumn: appliedSearchColumn || undefined,
        searchKeyword: appliedSearchKeyword || undefined,
      },
      {
        onSuccess: (result) => {
          showOrderTransitionResult('orders.toolbar.orderReceivedProcessSuccess', result.orderCount, result.lineCount);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, salesTypeCd, dateTypeFilter, orderDtFrom, orderDtTo, appliedSearchColumn, appliedSearchKeyword, bulkOrderReceivedProcessByFilter, t, showOrderTransitionResult]);

  const handleBulkShipOrderProcess = useCallback(() => {
    setShipNextStepDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkShipOrderProcess.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          showSuccess(t('orders.toolbar.shipOrderProcessSuccess', { orderCount: result.orderCount, lineCount: result.lineCount }));
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkShipOrderProcess, t]);

  const handleBulkShipOrderProcessAll = useCallback(() => {
    setShipNextStepDropdownOpen(false);
    if (!corporationCd) {
      showError(t('orders.toolbar.noSelection'), t('orders.corporation_required'));
      return;
    }
    bulkShipOrderProcessByFilter.mutate(
      {
        corporationCd,
        salesTypeCd: salesTypeCd ?? undefined,
        dateType: dateTypeFilter,
        orderDtFrom,
        orderDtTo,
        searchColumn: appliedSearchColumn || undefined,
        searchKeyword: appliedSearchKeyword || undefined,
      },
      {
        onSuccess: (result) => {
          showSuccess(t('orders.toolbar.shipOrderProcessSuccess', { orderCount: result.orderCount, lineCount: result.lineCount }));
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, salesTypeCd, dateTypeFilter, orderDtFrom, orderDtTo, appliedSearchColumn, appliedSearchKeyword, bulkShipOrderProcessByFilter, t]);

  const handleMoveToOrderReceivedFromShipReady = useCallback(() => {
    setShipReadyPrevDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkOrderReceivedProcess.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          showOrderTransitionResult('orders.toolbar.orderReceivedProcessSuccess', result.orderCount, result.lineCount);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkOrderReceivedProcess, t, showOrderTransitionResult]);

  const handleMoveToProcessingFromShipReady = useCallback(() => {
    setShipReadyPrevDropdownOpen(false);
    if (!corporationCd || selectedOrderKeys.length === 0) {
      showError(t('orders.toolbar.noSelection'), t('orders.toolbar.selectFirst'));
      return;
    }
    bulkProcessingProcess.mutate(
      { corporationCd, items: selectedOrderKeys },
      {
        onSuccess: (result) => {
          showOrderTransitionResult('orders.toolbar.moveToCombinedProcessingSuccess', result.orderCount, result.lineCount);
        },
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      }
    );
  }, [corporationCd, selectedOrderKeys, bulkProcessingProcess, t, showOrderTransitionResult]);

  /** 그리드 셀 편집 시 저장 (수령인=마스터, 수량/금액/할인=라인). 저장 결과 SweetAlert 미표시 */
  const RECEIVER_EDITABLE_FIELDS = ['receiverNm', 'receiverTel', 'receiverMobile', 'receiverAddr', 'receiverAddr2', 'receiverZip'];
  const LINE_EDITABLE_FIELDS: ('lineQty' | 'lineAmount' | 'lineDiscountAmount')[] = ['lineQty', 'lineAmount', 'lineDiscountAmount'];
  const handleCellValueChanged = useCallback(
    (event: CellValueChangedEvent<OrderListItem>) => {
      const { data, colDef, newValue } = event;
      if (!data || !colDef.field || !corporationCd) return;
      if (RECEIVER_EDITABLE_FIELDS.includes(colDef.field)) {
        updateOrderMasterField.mutate(
          {
            orderId: data.orderId,
            registDt: data.registDt,
            corporationCd,
            storeCd: data.storeCd || undefined,
            field: colDef.field,
            value: newValue == null || newValue === '' ? null : String(newValue),
          },
          {
            onError: (err) => {
              showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
              event.api.undoCellEditing();
            },
          }
        );
        return;
      }
      if (LINE_EDITABLE_FIELDS.includes(colDef.field as (typeof LINE_EDITABLE_FIELDS)[number])) {
        const num = typeof newValue === 'number' ? newValue : Number(newValue);
        if (Number.isNaN(num) || (colDef.field === 'lineQty' && (num < 0 || !Number.isInteger(num)))) {
          event.api.undoCellEditing();
          return;
        }
        updateOrderItemField.mutate(
          {
            orderId: data.orderId,
            registDt: data.registDt,
            corporationCd,
            storeCd: data.storeCd || undefined,
            lineNo: data.lineNo,
            field: colDef.field as 'lineQty' | 'lineAmount' | 'lineDiscountAmount',
            value: colDef.field === 'lineQty' ? Math.floor(num) : num,
          },
          {
            onError: (err) => {
              showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
              event.api.undoCellEditing();
            },
          }
        );
      }
    },
    [corporationCd, updateOrderMasterField, updateOrderItemField, t],
  );

  const showShipInstructionCols = statusFilter === 'DELIVERY_READY' || statusFilter === 'SHIPPING' || statusFilter === 'DELIVERED';
  const showShippedAtCol = statusFilter === 'SHIPPING' || statusFilter === 'DELIVERED';
  const showDeliveredAtCol = statusFilter === 'DELIVERED';
  const showHoldCols = statusFilter === 'HOLD';
  const showDeleteCols = statusFilter === 'DELETED';
  const showRowCheckboxes = statusFilter !== 'all' && statusFilter !== 'DELETED';

  const columnDefs = useMemo<ColDef<OrderListItem>[]>(
    () => {
      const hideInSimpleView = (field: string, statusHide?: boolean) =>
        orderSimpleView
          ? !ORDER_SIMPLE_VIEW_FIELDS.includes(field as (typeof ORDER_SIMPLE_VIEW_FIELDS)[number]) || (statusHide ?? false)
          : (statusHide ?? false);
      return [
      {
        field: 'rowNum',
        headerName: t('orders.col.rowNum'),
        width: 72,
        pinned: 'left',
        filter: 'agNumberColumnFilter',
        cellStyle: { textAlign: 'center' },
        valueGetter: (params) => {
          const totalRows = params.api?.getDisplayedRowCount?.() ?? 0;
          const idx = params.node?.rowIndex ?? 0;
          return total > 0 && totalRows > 0 ? total - (page * pageSize) - idx : undefined;
        },
        valueFormatter: (params) =>
          params.value != null ? Number(params.value).toLocaleString() : '',
      },
      {
        field: 'orderNo',
        headerName: t('orders.col.orderNo'),
        width: 140,
        pinned: 'left',
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<OrderListItem>) => {
          const orderNo = params.value as string | undefined;
          if (orderNo == null || orderNo === '') return null;
          return (
            <button
              type="button"
              className="btn btn-link link-primary p-0 text-decoration-underline border-0 bg-transparent"
              onClick={() => params.data && openOrderDetail(params.data)}
            >
              {orderNo}
            </button>
          );
        },
      },
      {
        field: 'itemOrderNo',
        headerName: t('orders.col.itemOrderNo'),
        width: 140,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('itemOrderNo'),
      },
      {
        field: 'combinedShipNo',
        headerName: t('orders.col.combinedShipNo'),
        width: 140,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('combinedShipNo', statusFilter === 'ORDER_RECEIVED'),
      },
      {
        field: 'mallNm',
        headerName: t('orders.col.mallNm'),
        width: 120,
        cellStyle: { textAlign: 'left' },
        hide: hideInSimpleView('mallNm'),
      },
      {
        field: 'storeNm',
        headerName: t('orders.col.storeNm'),
        width: 140,
        cellStyle: { textAlign: 'left' },
      },
      {
        field: 'orderDt',
        headerName: t('orders.col.orderDt'),
        width: 110,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'registDt',
        headerName: t('orders.col.registDt'),
        width: 110,
        cellStyle: { textAlign: 'center' },
        cellRenderer: (params: ICellRendererParams<OrderListItem>) => {
          const value = params.value as string | undefined;
          const row = params.data;
          if (!value || !row || !corporationCd) return value ?? null;
          return (
            <button
              type="button"
              className="btn btn-link link-primary p-0 text-decoration-underline border-0 bg-transparent"
              style={{ fontSize: 'inherit' }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setStatusLogOrder({
                  orderId: row.orderId,
                  registDt: row.registDt,
                  corporationCd,
                  storeCd: row.storeCd ?? undefined,
                });
              }}
            >
              {value}
            </button>
          );
        },
      },
      {
        field: 'orderProcessStatus',
        headerName: t('orders.col.orderProcessStatus'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('orderProcessStatus'),
        cellRenderer: (params: ICellRendererParams<OrderListItem>) => {
          const value = params.value as string | undefined;
          if (!value) return null;
          const idx = statusCodes.findIndex((c) => c.subCd === value);
          const label = idx >= 0 ? statusCodes[idx].codeNm : value;
          const badgeClass =
            idx >= 0
              ? STATUS_BADGE_CLASSES[idx % STATUS_BADGE_CLASSES.length]
              : 'badge badge-phoenix badge-phoenix-secondary';
          return <span className={badgeClass}>{label}</span>;
        },
      },
      {
        field: 'holdDate',
        headerName: t('orders.col.holdDate'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('holdDate', !showHoldCols),
      },
      {
        field: 'holdBy',
        headerName: t('orders.col.holdBy'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('holdBy', !showHoldCols),
      },
      {
        field: 'holdReason',
        headerName: t('orders.col.holdReason'),
        width: 180,
        cellStyle: { textAlign: 'left' },
        hide: hideInSimpleView('holdReason', !showHoldCols),
      },
      {
        field: 'deleteDate',
        headerName: t('orders.col.deleteDate'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('deleteDate', !showDeleteCols),
      },
      {
        field: 'deleteBy',
        headerName: t('orders.col.deleteBy'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('deleteBy', !showDeleteCols),
      },
      {
        field: 'deleteReason',
        headerName: t('orders.col.deleteReason'),
        width: 180,
        cellStyle: { textAlign: 'left' },
        hide: hideInSimpleView('deleteReason', !showDeleteCols),
      },
      {
        field: 'invoiceNo',
        headerName: t('orders.col.invoiceNo'),
        width: 130,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('invoiceNo', !showShipInstructionCols),
      },
      {
        field: 'shipInstructionAt',
        headerName: t('orders.col.shipInstructionAt'),
        width: 160,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('shipInstructionAt', !showShipInstructionCols),
      },
      {
        field: 'shipInstructionBy',
        headerName: t('orders.col.shipInstructionBy'),
        width: 120,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('shipInstructionBy', !showShipInstructionCols),
      },
      {
        field: 'shippedAt',
        headerName: t('orders.col.shippedAt'),
        width: 130,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('shippedAt', !showShippedAtCol),
      },
      {
        field: 'deliveredAt',
        headerName: t('orders.col.deliveredAt'),
        width: 130,
        cellStyle: { textAlign: 'center' },
        hide: hideInSimpleView('deliveredAt', !showDeliveredAtCol),
      },
      {
        field: 'productCd',
        headerName: t('orders.col.productCd'),
        width: 110,
        cellStyle: { textAlign: 'center' },
      },
      {
        field: 'productNm',
        headerName: t('orders.col.productNm'),
        flex: 1,
        minWidth: 160,
        cellStyle: { textAlign: 'left' },
        cellRenderer: (params: ICellRendererParams<OrderListItem>) => {
          const linePayload = params.data?.linePayload;
          let isGift = false;
          if (linePayload && typeof linePayload === 'string') {
            try {
              const payload = JSON.parse(linePayload) as Record<string, unknown>;
              isGift = payload?.is_gift === true;
            } catch {
              // ignore invalid JSON
            }
          }
          const name = params.value ?? '';
          return (
            <div className="d-flex flex-wrap align-items-center gap-1 text-break">
              {isGift && (
                <span
                  className="badge badge-phoenix badge-phoenix-info flex-shrink-0 d-inline-flex align-items-center"
                  style={{ padding: '2px' }}
                  title={t('products.badge.gift')}
                  aria-label={t('products.badge.gift')}
                >
                  <FiGift size={12} aria-hidden />
                </span>
              )}
              {name ? <span>{name}</span> : null}
            </div>
          );
        },
      },
      {
        field: 'lineQty',
        headerName: t('orders.col.lineQty'),
        width: 90,
        filter: 'agNumberColumnFilter',
        cellStyle: { textAlign: 'right' },
        editable: true,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : ''),
      },
      {
        field: 'lineAmount',
        headerName: t('orders.col.lineAmount'),
        width: 110,
        filter: 'agNumberColumnFilter',
        cellStyle: { textAlign: 'right' },
        editable: true,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : ''),
      },
      {
        field: 'lineDiscountAmount',
        headerName: t('orders.col.lineDiscountAmount'),
        width: 110,
        cellStyle: { textAlign: 'right' },
        editable: true,
        valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : ''),
        hide: hideInSimpleView('lineDiscountAmount'),
      },
      {
        field: 'receiverNm',
        headerName: t('orders.col.receiverNm'),
        width: 100,
        cellStyle: { textAlign: 'left' },
        editable: true,
      },
      {
        field: 'receiverTel',
        headerName: t('orders.col.receiverTel'),
        width: 120,
        cellStyle: { textAlign: 'left' },
        editable: true,
        hide: hideInSimpleView('receiverTel'),
      },
      {
        field: 'receiverMobile',
        headerName: t('orders.col.receiverMobile'),
        width: 120,
        cellStyle: { textAlign: 'left' },
        editable: true,
        hide: hideInSimpleView('receiverMobile'),
      },
      {
        field: 'receiverAddr',
        headerName: t('orders.col.receiverAddr'),
        width: 180,
        cellStyle: { textAlign: 'left' },
        editable: true,
        hide: hideInSimpleView('receiverAddr'),
      },
      {
        field: 'receiverAddr2',
        headerName: t('orders.col.receiverAddr2'),
        width: 140,
        cellStyle: { textAlign: 'left' },
        editable: true,
        hide: hideInSimpleView('receiverAddr2'),
      },
      {
        field: 'receiverZip',
        headerName: t('orders.col.receiverZip'),
        width: 90,
        cellStyle: { textAlign: 'center' },
        editable: true,
        hide: hideInSimpleView('receiverZip'),
      },
    ];
    },
    [t, statusCodes, page, pageSize, total, openOrderDetail, statusFilter, orderSimpleView, showShipInstructionCols, showShippedAtCol, showDeliveredAtCol, showHoldCols, showDeleteCols],
  );

  const goFirst = useCallback(() => setPage(0), []);
  const goPrev = useCallback(() => {
    if (!first) setPage((p) => Math.max(0, p - 1));
  }, [first]);
  const goNext = useCallback(() => {
    if (!last) setPage((p) => p + 1);
  }, [last]);
  const goLast = useCallback(() => setPage(Math.max(0, totalPages - 1)), [totalPages]);

  const handleDownloadCurrentList = useCallback(() => {
    setExcelDropdownOpen(false);
    gridRef.current?.exportExcel();
  }, []);

  const handleDownloadFullOrders = useCallback(async () => {
    setExcelDropdownOpen(false);
    if (!corporationCd) {
      showError(t('common.error'), t('orders.corporation_required'));
      return;
    }
    if (isFullExportDownloading) return;

    const confirmed = await confirm(
      t('orders.toolbar.fullOrderDownloadConfirmTitle'),
      t('orders.toolbar.fullOrderDownloadConfirmDesc'),
      {
        confirmButtonText: t('orders.toolbar.fullOrderDownload'),
        cancelButtonText: t('common.cancel'),
        icon: 'warning',
      },
    );
    if (!confirmed) return;

    setIsFullExportDownloading(true);
    try {
      await downloadOrderFullExport(listParams, i18n.language);
      showSuccess(t('orders.toolbar.fullOrderDownloadSuccess'));
    } catch (err) {
      showError(t('common.error'), getApiErrorMessage(err, t('orders.toolbar.fullOrderDownloadFail'), t));
    } finally {
      setIsFullExportDownloading(false);
    }
  }, [corporationCd, isFullExportDownloading, listParams, i18n.language, t]);

  /** 툴바에 표시할 상태만 (취소·출고보류·비매칭 제외). API가 비었으면 기본 목록 사용. */
  const statusCodesFiltered = useMemo(() => {
    const list = statusCodes.length > 0 ? statusCodes : DEFAULT_ORDER_PROCESS_STATUS_CODES;
    return list.filter((c) => !['CANCELLED', 'HOLD', 'UNMATCHED'].includes(c.subCd));
  }, [statusCodes]);

  const toolbar = (
    <ul className="nav nav-links mb-0 mx-n3 flex-shrink-0" role="tablist">
      <li className="nav-item">
        <button
          type="button"
          role="tab"
          className={`nav-link ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
          aria-current={statusFilter === 'all' ? 'page' : undefined}
        >
          {t('orders.toolbar.tabAll')} <span className="orders-toolbar-count">({(countsData?.total ?? 0).toLocaleString()})</span>
        </button>
      </li>
      {statusCodesFiltered.map((code) => (
        <li key={code.subCd} className="nav-item">
          <button
            type="button"
            role="tab"
            className={`nav-link ${statusFilter === code.subCd ? 'active' : ''}`}
            onClick={() => setStatusFilter(code.subCd)}
            aria-current={statusFilter === code.subCd ? 'page' : undefined}
          >
            {code.codeNm} <span className="orders-toolbar-count">({(countsData?.counts?.[code.subCd] ?? 0).toLocaleString()})</span>
          </button>
        </li>
      ))}
      <li className="nav-item">
        <button
          type="button"
          role="tab"
          className={`nav-link ${statusFilter === 'HOLD' ? 'active' : ''}`}
          onClick={() => setStatusFilter('HOLD')}
          aria-current={statusFilter === 'HOLD' ? 'page' : undefined}
        >
          {t('orders.toolbar.tabHold')} <span className="orders-toolbar-count">({(countsData?.counts?.['HOLD'] ?? 0).toLocaleString()})</span>
        </button>
      </li>
      <li className="nav-item">
        <button
          type="button"
          role="tab"
          className={`nav-link ${statusFilter === 'DELETED' ? 'active' : ''}`}
          onClick={() => setStatusFilter('DELETED')}
          aria-current={statusFilter === 'DELETED' ? 'page' : undefined}
        >
          {t('orders.toolbar.tabDeleted')} <span className="orders-toolbar-count">({(countsData?.deletedCount ?? 0).toLocaleString()})</span>
        </button>
      </li>
    </ul>
  );

  const toolbarSecondary = (_exportButton: ReactNode) => (
    <div className="d-flex align-items-center justify-content-between gap-2 flex-grow-1 flex-wrap">
      {/* 기간검색 + 검색조건(컬럼/검색어) 한 그룹으로 왼쪽 배치 */}
      <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-nowrap orders-filter-row">
        <div className="input-group input-group-sm orders-daterange-bar" id="orders-daterange-full-group">
          <span className="input-group-text orders-toolbar-addon" id="orders-date-type-addon">
            <FiCalendar size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <select
            className="form-select form-select-sm orders-daterange-type"
            aria-label={t('orders.filter.dateType')}
            aria-describedby="orders-date-type-addon"
            value={dateTypeFilter}
            onChange={(e) => {
              setDateTypeFilter(e.target.value as OrderDateType);
              setPage(0);
            }}
          >
            <option value="REGIST_DT">{t('orders.filter.registDt')}</option>
            <option value="ORDER_DT">{t('orders.filter.orderDtLabel')}</option>
          </select>
          <div className="orders-daterange-wrap">
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-sm text-center orders-daterange-from"
                value={orderDtFrom}
                readOnly
                tabIndex={-1}
                aria-hidden
              />
              <span
                className="orders-daterange-sep"
                aria-hidden
                style={{
                  paddingLeft: '0.5rem',
                  paddingRight: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ~
              </span>
              <input
                type="text"
                className="form-control form-control-sm text-center orders-daterange-to"
                value={orderDtTo}
                readOnly
                tabIndex={-1}
                aria-hidden
              />
            </div>
            <input
              ref={daterangeInputRef}
              type="text"
              className="orders-daterange-hidden"
              readOnly
              aria-label={t('orders.filter.orderDtFrom')}
            />
          </div>
        </div>
        <div className="input-group input-group-sm orders-search-group" id="orders-search-full-group">
          <span className="input-group-text orders-toolbar-addon" id="orders-search-column-addon">
            <FiFilter size={16} className="orders-filter-icon" aria-hidden />
          </span>
          <select
            className="form-select form-select-sm orders-search-column"
            aria-label={t('orders.filter.searchColumn')}
            aria-describedby="orders-search-column-addon"
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
          >
            <option value="ORDER_NO_CONTAINS">{t('orders.filter.searchOrderNoContains')}</option>
            <option value="ITEM_ORDER_NO_EXACT">{t('orders.filter.searchItemOrderNoExact')}</option>
            {statusFilter !== 'ORDER_RECEIVED' && (
              <option value="COMBINED_SHIP_NO_EXACT">{t('orders.filter.searchCombinedShipNoExact')}</option>
            )}
            <option value="PRODUCT_CD_EXACT">{t('orders.filter.searchProductCdExact')}</option>
            <option value="PRODUCT_NM_CONTAINS">{t('orders.filter.searchProductNmContains')}</option>
            <option value="ORDERER_NM_CONTAINS">{t('orders.filter.searchOrdererNmContains')}</option>
            <option value="RECEIVER_NM_CONTAINS">{t('orders.filter.searchReceiverNmContains')}</option>
            <option value="ORDER_ID_EXACT">{t('orders.filter.searchOrderIdExact')}</option>
          </select>
          <input
            type="text"
            className="form-control form-control-sm orders-search-keyword"
            placeholder={t('orders.filter.searchKeywordPlaceholder')}
            aria-label={t('orders.filter.searchKeywordPlaceholder')}
            aria-describedby="orders-search-btn-addon"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            type="button"
            id="orders-search-btn-addon"
            className="btn btn-phoenix-secondary btn-sm btn-default-visible d-inline-flex align-items-center orders-search-btn"
            onClick={handleSearch}
            title={t('orders.filter.search')}
            aria-label={t('orders.filter.search')}
          >
            <FiSearch size={16} className="me-1" aria-hidden />
            {t('orders.filter.search')}
          </button>
        </div>
      </div>
      <div className="d-flex align-items-center gap-1 flex-shrink-0">
        <input
          ref={orderBulkImportFileInputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="d-none"
          aria-hidden
          onChange={handleBulkImportFileChange}
        />
        {showOrderToolbarButtons && (
          <>
          {statusFilter === 'ORDER_RECEIVED' && (
            <div className="btn-group position-relative" role="group" ref={orderRegisterDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setOrderRegisterDropdownOpen((v) => !v)}
                aria-expanded={orderRegisterDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.orderRegister')}
              >
                <FiPlus size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.orderRegister')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${orderRegisterDropdownOpen ? 'show' : ''}`}
                style={orderRegisterDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button type="button" className="dropdown-item d-inline-flex align-items-center" onClick={() => setOrderRegisterDropdownOpen(false)}>
                    <FiDownload size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.orderCollect')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setOrderRegisterDropdownOpen(false);
                      setManualOrderModalOpen(true);
                    }}
                  >
                    <FiEdit size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.orderManualRegister')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={handleBulkImportClick}
                    disabled={isBulkImporting || !corporationCd}
                  >
                    <FiUpload size={14} className="me-1" aria-hidden />
                    {isBulkImporting ? t('common.loading') : t('orders.toolbar.orderBulkRegister')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setOrderRegisterDropdownOpen(false);
                      const a = document.createElement('a');
                      a.href = '/order_import_template.xlsx';
                      a.download = 'order_import_template.xlsx';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.downloadBulkOrderTemplate')}
                  </button>
                </li>
              </ul>
            </div>
          )}
          <div className="btn-group position-relative" role="group" ref={selectActionDropdownRef}>
            <button
              type="button"
              className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
              onClick={() => setSelectActionDropdownOpen((v) => !v)}
              aria-expanded={selectActionDropdownOpen}
              aria-haspopup="true"
              title={t('orders.toolbar.selectAction')}
            >
              <FiCheckSquare size={14} className="me-1" aria-hidden />
              {t('orders.toolbar.selectAction')}
            </button>
            <ul
              className={`dropdown-menu dropdown-menu-end ${selectActionDropdownOpen ? 'show' : ''}`}
              style={selectActionDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
            >
              {statusFilter === 'ORDER_RECEIVED' && (
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={handleBulkHold}
                    disabled={bulkHold.isPending}
                  >
                    <FiPause size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectShipHold')}
                  </button>
                </li>
              )}
              {statusFilter === 'HOLD' && (
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={handleBulkUnhold}
                    disabled={bulkUnhold.isPending}
                  >
                    <FiPlay size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectUnhold')}
                  </button>
                </li>
              )}
              <li>
                <button
                  type="button"
                  className="dropdown-item d-inline-flex align-items-center"
                  onClick={handleBulkDelete}
                  disabled={bulkDelete.isPending}
                >
                  <FiTrash2 size={14} className="me-1" aria-hidden />
                  {t('orders.toolbar.selectDelete')}
                </button>
              </li>
            </ul>
          </div>
          {statusFilter === 'ORDER_RECEIVED' && (
            <div className="btn-group position-relative" role="group" ref={nextStepDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setNextStepDropdownOpen((v) => !v)}
                aria-expanded={nextStepDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.nextStep')}
              >
                <FiArrowRight size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.nextStep')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${nextStepDropdownOpen ? 'show' : ''}`}
                style={nextStepDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button type="button" className="dropdown-item d-inline-flex align-items-center" onClick={handleBulkOrderProcess}>
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectOrderProcess')}
                  </button>
                </li>
                <li>
                  <button type="button" className="dropdown-item d-inline-flex align-items-center" onClick={handleBulkOrderProcessAll}>
                    <FiLayers size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.bulkOrderProcess')}
                  </button>
                </li>
              </ul>
            </div>
          )}
          </>
        )}
        {showCombinedToolbarButtons && (
          <>
            <div className="btn-group position-relative" role="group" ref={giftDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setGiftDropdownOpen((v) => !v)}
                aria-expanded={giftDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.giftGrant')}
              >
                <FiGift size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.giftGrant')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${giftDropdownOpen ? 'show' : ''}`}
                style={giftDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setGiftDropdownOpen(false);
                      handleComingSoonAction('orders.toolbar.selectGiftGrant');
                    }}
                  >
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectGiftGrant')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setGiftDropdownOpen(false);
                      handleComingSoonAction('orders.toolbar.bulkGiftGrant');
                    }}
                  >
                    <FiLayers size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.bulkGiftGrant')}
                  </button>
                </li>
              </ul>
            </div>
            <div className="btn-group position-relative" role="group" ref={combinedSelectActionDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setCombinedSelectActionDropdownOpen((v) => !v)}
                aria-expanded={combinedSelectActionDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.selectAction')}
              >
                <FiCheckSquare size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.selectAction')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${combinedSelectActionDropdownOpen ? 'show' : ''}`}
                style={combinedSelectActionDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setCombinedSelectActionDropdownOpen(false);
                      handleBulkHold();
                    }}
                    disabled={bulkHold.isPending}
                  >
                    <FiPause size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectShipHold')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setCombinedSelectActionDropdownOpen(false);
                      handleBulkDelete();
                    }}
                    disabled={bulkDelete.isPending}
                  >
                    <FiTrash2 size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectDelete')}
                  </button>
                </li>
              </ul>
            </div>
            <div className="btn-group position-relative" role="group" ref={prevStepDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setPrevStepDropdownOpen((v) => !v)}
                aria-expanded={prevStepDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.prevStep')}
              >
                <FiArrowLeft size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.prevStep')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${prevStepDropdownOpen ? 'show' : ''}`}
                style={prevStepDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      handleBulkOrderReceivedProcess();
                    }}
                  >
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectOrderReceivedProcess')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      handleBulkOrderReceivedProcessAll();
                    }}
                  >
                    <FiLayers size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.bulkOrderReceivedProcess')}
                  </button>
                </li>
              </ul>
            </div>
            <div className="btn-group position-relative" role="group" ref={shipNextStepDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setShipNextStepDropdownOpen((v) => !v)}
                aria-expanded={shipNextStepDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.nextStep')}
              >
                <FiArrowRight size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.nextStep')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${shipNextStepDropdownOpen ? 'show' : ''}`}
                style={shipNextStepDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      handleBulkShipOrderProcess();
                    }}
                  >
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectShipOrderProcess')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      handleBulkShipOrderProcessAll();
                    }}
                  >
                    <FiLayers size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.bulkShipOrderProcess')}
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
        {showShipReadyToolbarButtons && (
          <>
            <div className="btn-group position-relative" role="group" ref={shipInstructionDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setShipInstructionDropdownOpen((v) => !v)}
                aria-expanded={shipInstructionDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.shipInstruction')}
              >
                <FiTruck size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.shipInstruction')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${shipInstructionDropdownOpen ? 'show' : ''}`}
                style={shipInstructionDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setShipInstructionDropdownOpen(false);
                      handleComingSoonAction('orders.toolbar.selectShipInstructionProcess');
                    }}
                  >
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectShipInstructionProcess')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setShipInstructionDropdownOpen(false);
                      handleComingSoonAction('orders.toolbar.bulkShipInstructionProcess');
                    }}
                  >
                    <FiLayers size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.bulkShipInstructionProcess')}
                  </button>
                </li>
              </ul>
            </div>
            <div className="btn-group position-relative" role="group" ref={shipReadySelectActionDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setShipReadySelectActionDropdownOpen((v) => !v)}
                aria-expanded={shipReadySelectActionDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.selectAction')}
              >
                <FiCheckSquare size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.selectAction')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${shipReadySelectActionDropdownOpen ? 'show' : ''}`}
                style={shipReadySelectActionDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setShipReadySelectActionDropdownOpen(false);
                      handleBulkHold();
                    }}
                    disabled={bulkHold.isPending}
                  >
                    <FiPause size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectShipHold')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      setShipReadySelectActionDropdownOpen(false);
                      handleBulkDelete();
                    }}
                    disabled={bulkDelete.isPending}
                  >
                    <FiTrash2 size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.selectDelete')}
                  </button>
                </li>
              </ul>
            </div>
            <div className="btn-group position-relative" role="group" ref={shipReadyPrevDropdownRef}>
              <button
                type="button"
                className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
                onClick={() => setShipReadyPrevDropdownOpen((v) => !v)}
                aria-expanded={shipReadyPrevDropdownOpen}
                aria-haspopup="true"
                title={t('orders.toolbar.prevStep')}
              >
                <FiArrowLeft size={14} className="me-1" aria-hidden />
                {t('orders.toolbar.prevStep')}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end ${shipReadyPrevDropdownOpen ? 'show' : ''}`}
                style={shipReadyPrevDropdownOpen ? { display: 'block', position: 'absolute', top: '100%', right: 0, left: 'auto', zIndex: 1050 } : undefined}
              >
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      handleMoveToOrderReceivedFromShipReady();
                    }}
                  >
                    <FiFileText size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.moveToOrderReceived')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-inline-flex align-items-center"
                    onClick={() => {
                      handleMoveToProcessingFromShipReady();
                    }}
                  >
                    <FiLayers size={14} className="me-1" aria-hidden />
                    {t('orders.toolbar.moveToCombinedProcessing')}
                  </button>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );

  /** 페이지 헤더(새로고침 버튼 옆)에 둘 엑셀 다운로드 버튼 그룹 */
  const excelDownloadActions = (
    <div className="btn-group position-relative" role="group" ref={excelDropdownRef}>
      <button
        type="button"
        className="btn btn-phoenix-secondary btn-sm btn-default-visible dropdown-toggle d-inline-flex align-items-center"
        onClick={() => setExcelDropdownOpen((o) => !o)}
        aria-expanded={excelDropdownOpen}
        title={t('grid.exportExcel')}
        disabled={isFullExportDownloading}
      >
        <FiDownload size={16} className="me-1" aria-hidden />
        {t('grid.exportExcel')}
      </button>
      <ul
        className={`dropdown-menu dropdown-menu-end ${excelDropdownOpen ? 'show' : ''}`}
        style={{ minWidth: 230 }}
      >
        <li>
          <button
            type="button"
            className="dropdown-item d-inline-flex align-items-center"
            onClick={handleDownloadCurrentList}
            disabled={isFullExportDownloading}
          >
            <FiFileText size={14} className="me-1" aria-hidden />
            {t('orders.toolbar.listOrderDownload')}
          </button>
        </li>
        <li>
          <button
            type="button"
            className="dropdown-item d-inline-flex align-items-center"
            onClick={() => { void handleDownloadFullOrders(); }}
            disabled={isFullExportDownloading}
          >
            <FiLayers size={14} className="me-1" aria-hidden />
            {isFullExportDownloading ? t('common.loading') : t('orders.toolbar.fullOrderDownload')}
          </button>
        </li>
      </ul>
    </div>
  );

  const footer = (
    <DataGridPaginationFooter
      total={total}
      page={page}
      pageSize={pageSize}
      pageSizeOptions={[100, 1000, 5000, 10000]}
      loading={isGridLoading}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(0);
      }}
      onFirst={goFirst}
      onPrev={goPrev}
      onNext={goNext}
      onLast={goLast}
      first={first}
      last={last}
    />
  );

  return (
    <PageLayout
      title={t(PATH_TITLE_KEY[tab?.path ?? '/order'] ?? 'orders.titleDomesticB2c')}
      lead={corporationCd ? undefined : t('orders.corporation_required')}
      actions={excelDownloadActions}
    >
      <div className="order-list-content">
        {isBulkImporting && (
          <div className="order-bulk-import-overlay" role="status" aria-live="polite">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">{t('common.loading')}</span>
            </div>
            <span>{t('orders.bulkImport.uploading')}</span>
          </div>
        )}
        {isBulkActionPending && !isBulkImporting && (
          <div className="orders-bulk-loading-bar" role="progressbar" aria-label={t('common.loading')} />
        )}
        {corporationCd && (
        <DataGrid<OrderListItem>
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={items}
          loading={isGridLoading}
          pagination={false}
          exportFileName="orders"
          showExportButton={false}
          getRowId={(params) =>
            `${params.data?.orderId ?? ''}-${params.data?.lineNo ?? ''}`
          }
          rowSelection={showRowCheckboxes ? 'multiple' : undefined}
          onCellValueChanged={handleCellValueChanged}
          onSelectionChanged={handleSelectionChanged}
          toolbar={toolbar}
          toolbarSecondary={toolbarSecondary}
          footer={footer}
        />
      )}
      {selectedOrder && corporationCd && (
        <OrderDetailModal
          orderId={selectedOrder.orderId}
          registDt={selectedOrder.registDt}
          corporationCd={corporationCd}
          orderProcessStatus={selectedOrder.orderProcessStatus}
          onClose={() => setSelectedOrder(null)}
        />
      )}
      {manualOrderModalOpen && corporationCd && (
        <ManualOrderModal
          corporationCd={corporationCd}
          salesTypeCd={salesTypeCd}
          onSuccess={() => setManualOrderModalOpen(false)}
          onClose={() => setManualOrderModalOpen(false)}
        />
      )}
      {statusLogOrder && (
        <OrderStatusLogModal
          orderId={statusLogOrder.orderId}
          registDt={statusLogOrder.registDt}
          corporationCd={statusLogOrder.corporationCd}
          storeCd={statusLogOrder.storeCd}
          onClose={() => setStatusLogOrder(null)}
        />
      )}
      </div>
    </PageLayout>
  );
}
