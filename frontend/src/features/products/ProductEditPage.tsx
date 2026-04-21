/**
 * 상품 편집 페이지 (탭). 기본정보·부가정보·단위/바코드·세트구성품 탭으로 구분.
 * PUT /api/v1/products/{productId} 로 일괄 저장. units/setComponents는 서버에서 해당 테이블 전체 교체.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from '@/utils/swal';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { PageLayout } from '@/components/layout/PageLayout';
import { useProductDetail, useUpdateProduct, useCreateProduct, useProductList, useUnitCodes } from './hooks';
import { useCorporationStore } from '@/store/useCorporationStore';
import { useTabStore } from '@/store/useTabStore';
import type { TabItem } from '@/store/useTabStore';
import { FiTrash2, FiFileText, FiInfo, FiLayers, FiPackage, FiPlus, FiX, FiSave } from 'react-icons/fi';
import { ProductChoicesSelect } from './ProductChoicesSelect';
import type { ProductUnit, ProductSetComponent } from './types';
import { isRequired, EMPTY_PRODUCT, type SectionKey, type ProductDetailLike } from './productEditConstants';

interface ProductEditPageProps {
  tab?: TabItem;
}

export function ProductEditPage({ tab }: ProductEditPageProps) {
  const { t } = useTranslation();
  const { corporationCd } = useCorporationStore();
  const { closeTab } = useTabStore();
  const productId = (tab?.data?.productId as string) ?? null;
  const isCreateMode = tab?.data?.mode === 'create';

  const { data: productFromApi, isLoading, isError, error } = useProductDetail(isCreateMode ? null : productId);
  const { data: products = [] } = useProductList(corporationCd ? { corporationCd } : {});
  const { data: unitCodes = [] } = useUnitCodes();
  const { mutate: update, isPending: isUpdatePending } = useUpdateProduct(productId ?? '');
  const { mutate: create, isPending: isCreatePending } = useCreateProduct();

  const [activeSection, setActiveSection] = useState<SectionKey>('basic');
  const [productTypeInForm, setProductTypeInForm] = useState<string>('SINGLE');
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [setComponents, setSetComponents] = useState<ProductSetComponent[]>([]);

  const product: ProductDetailLike | null = isCreateMode
    ? { ...EMPTY_PRODUCT, corporationCd: corporationCd ?? '' }
    : productFromApi ?? null;

  useEffect(() => {
    if (product?.productType) setProductTypeInForm(product.productType);
  }, [product?.productId, product?.productType]);

  useEffect(() => {
    if (!isCreateMode && product?.units) setUnits([...product.units]);
    else if (!isCreateMode) setUnits([]);
    if (!isCreateMode && product?.setComponents) setSetComponents([...product.setComponents]);
    else if (!isCreateMode) setSetComponents([]);
  }, [isCreateMode, product?.productId, product?.units, product?.setComponents]);

  if (!productId && !isCreateMode) {
    return (
      <PageLayout title={t('products.detail.title')} lead={t('products.edit.selectProductGuide')} />
    );
  }

  if (isCreateMode && !corporationCd) {
    return (
      <PageLayout title={t('products.register.title')} lead={t('products.corporation_required')} />
    );
  }

  if (!isCreateMode && isLoading) return <PageLayout title={t('products.detail.title')} lead={t('common.loading')} />;
  if (!isCreateMode && isError) return <PageLayout title={t('products.detail.title')} lead={error instanceof Error ? error.message : t('common.error')} />;
  if (!product) return null;

  const isPending = isUpdatePending || isCreatePending;

  const sectionIcons: Record<SectionKey, React.ReactNode> = {
    basic: <FiFileText size={14} />,
    info: <FiInfo size={14} />,
    units: <FiLayers size={14} />,
    setComponents: <FiPackage size={14} />,
  };
  const sections: { key: SectionKey; label: string; show?: boolean }[] = ([
    { key: 'basic', label: t('products.detail.tabBasic') },
    { key: 'info', label: t('products.detail.tabInfo') },
    { key: 'units', label: t('products.edit.unitsTitle') },
    { key: 'setComponents', label: t('products.edit.setComponentsTitle'), show: productTypeInForm === 'SET' },
  ] as { key: SectionKey; label: string; show?: boolean }[]).filter((s) => s.show !== false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const num = (k: string) => { const v = fd.get(k) as string; return v ? Number(v) : null; };
    const productTypeVal = productTypeInForm;
    if (productTypeVal === 'SET') {
      const validComponents = displaySetComponents.filter((c) => (c.componentProductId ?? '').trim());
      if (validComponents.length === 0) {
        showError(t('products.edit.setComponentsRequiredTitle'), t('products.edit.setComponentsRequiredMessage'));
        setActiveSection('setComponents');
        return;
      }
    }
    const productCdVal = (fd.get('productCd') as string)?.trim() || product.productCd;
    const productNmVal = (fd.get('productNm') as string) || product.productNm;
    const isSaleVal = fd.get('isSale') != null ? fd.get('isSale') === 'true' : product.isSale;
    const isDisplayVal = fd.get('isDisplay') != null ? fd.get('isDisplay') === 'true' : product.isDisplay;

    const payload = {
      productCd: productCdVal,
      productNm: productNmVal,
      productType: productTypeVal,
      isSale: isSaleVal,
      isDisplay: isDisplayVal,
      productEnNm: (fd.get('productEnNm') as string) ?? null,
      categoryCd: (fd.get('categoryCd') as string) ?? null,
      brandCd: (fd.get('brandCd') as string) ?? null,
      costPrice: num('costPrice'),
      supplyPrice: num('supplyPrice'),
      taxType: (fd.get('taxType') as string) ?? null,
      safetyStockQty: num('safetyStockQty'),
      minOrderQty: num('minOrderQty'),
      maxOrderQty: num('maxOrderQty'),
      sortOrder: num('sortOrder'),
      description: (fd.get('description') as string) ?? null,
      imageUrl: (fd.get('imageUrl') as string) ?? null,
      remark: (fd.get('remark') as string) ?? null,
      units: displayUnits.length > 0
        ? displayUnits.map((u) => ({
            unitCd: u.unitCd ?? '',
            barcode: u.barcode ?? null,
            packQty: u.packQty != null ? u.packQty : null,
            isBaseUnit: u.isBaseUnit ?? false,
          }))
        : undefined,
      setComponents: productTypeVal === 'SET'
        ? displaySetComponents
            .filter((c) => (c.componentProductId ?? '').trim())
            .map((c) => ({
              componentProductId: c.componentProductId ?? '',
              componentQty: c.componentQty ?? 1,
            }))
        : [],
    };

    if (isCreateMode) {
      const corpCd = (corporationCd ?? '').trim();
      if (!corpCd) {
        showError(t('common.error'), t('products.corporation_required'));
        return;
      }
      create(
        { corporationCd: corpCd, ...payload },
        {
          onSuccess: () => {
            showSuccess(t('products.edit.saveSuccess'));
            closeTab(tab?.id ?? '');
          },
          onError: (err) => {
            showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
          },
        },
      );
      return;
    }

    if (!productId) return;
    update(
      payload,
      {
        onSuccess: () => showSuccess(t('products.edit.saveSuccess')),
        onError: (err) => {
          showError(t('common.error'), getApiErrorMessage(err, t('common.error'), t));
        },
      },
    );
  };

  const baseUnits = product.units ?? [];
  const baseSetComponents = product.setComponents ?? [];
  const addUnit = () => {
    const base = units.length > 0 ? units : baseUnits;
    setUnits([...base, { unitCd: 'EA', barcode: null, packQty: 1, isBaseUnit: base.length === 0 }]);
  };
  const removeUnit = (i: number) => {
    const base = units.length > 0 ? units : baseUnits;
    setUnits(base.filter((_, idx) => idx !== i));
  };
  const updateUnit = (i: number, f: Partial<ProductUnit>) => {
    const base = units.length > 0 ? units : baseUnits;
    setUnits(base.map((u, idx) => (idx === i ? { ...u, ...f } : u)));
  };
  const addSetComponent = () => {
    const base = setComponents.length > 0 ? setComponents : baseSetComponents;
    setSetComponents([...base, { componentProductId: '', componentQty: 1 }]);
  };
  const removeSetComponent = (i: number) => {
    const base = setComponents.length > 0 ? setComponents : baseSetComponents;
    setSetComponents(base.filter((_, idx) => idx !== i));
  };
  const updateSetComponent = (i: number, f: Partial<ProductSetComponent>) => {
    const base = setComponents.length > 0 ? setComponents : baseSetComponents;
    setSetComponents(base.map((c, idx) => (idx === i ? { ...c, ...f } : c)));
  };

  const displayUnits = units.length > 0 ? units : (product.units ?? []);
  const displaySetComponents = setComponents.length > 0 ? setComponents : (product.setComponents ?? []);

  const fieldId = (name: string) => `product-edit-${name}`;
  const toBool = (v: unknown) => v === true || v === 'true' || v === 'Y' || v === 1;
  const isSaleVal = toBool(product.isSale) || toBool((product as { sale?: unknown }).sale);
  const isDisplayVal = toBool(product.isDisplay) || toBool((product as { display?: unknown }).display);

  return (
    <PageLayout title={isCreateMode ? t('products.register.title') : t('products.detail.title')}>
      <div className="card shadow-none border mb-4">
        <div className="card-header py-3 border-bottom bg-body d-flex justify-content-between align-items-center flex-wrap gap-2">
          <p className="text-body-tertiary lead mb-0">
            {isCreateMode ? t('products.toolbar.addProduct') : `${product.productCd} — ${product.productNm}`}
          </p>
          <div className="d-flex flex-wrap gap-2">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`btn btn-sm d-inline-flex align-items-center ${activeSection === s.key ? 'btn-phoenix-primary' : 'btn-phoenix-secondary btn-default-visible'}`}
                onClick={() => setActiveSection(s.key)}
              >
                <span className="me-1" aria-hidden>{sectionIcons[s.key]}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            {activeSection === 'basic' && (
              <div key={`basic-${product.productId || 'new'}`} className="row g-2">
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input
                      className="form-control bg-body-secondary"
                      id={fieldId('productId')}
                      type="text"
                      value={isCreateMode ? t('products.register.autoAssign') : product.productId}
                      readOnly
                      aria-label="productId"
                    />
                    <label htmlFor={fieldId('productId')}>{t('products.col.productId')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className={`form-floating mb-2${isRequired('productCd') ? ' required' : ''}`}>
                    <input className="form-control" id={fieldId('productCd')} name="productCd" type="text" defaultValue={product.productCd} required={isRequired('productCd')} placeholder=" " />
                    <label htmlFor={fieldId('productCd')}>{t('products.col.productCd')}{isRequired('productCd') && <span className="text-primary ms-1" aria-hidden="true">*</span>}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className={`form-floating mb-2${isRequired('productNm') ? ' required' : ''}`}>
                    <input className="form-control" id={fieldId('productNm')} name="productNm" type="text" defaultValue={product.productNm} required={isRequired('productNm')} placeholder=" " />
                    <label htmlFor={fieldId('productNm')}>{t('products.col.productNm')}{isRequired('productNm') && <span className="text-primary ms-1" aria-hidden="true">*</span>}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className={`form-floating mb-2${isRequired('productType') ? ' required' : ''}`}>
                    <select className="form-select" id={fieldId('productType')} name="productType" value={productTypeInForm} onChange={(e) => setProductTypeInForm(e.target.value)} required={isRequired('productType')} aria-label="productType">
                      <option value="SINGLE">{t('products.type.single')}</option>
                      <option value="SET">{t('products.type.set')}</option>
                    </select>
                    <label htmlFor={fieldId('productType')}>{t('products.col.productType')}{isRequired('productType') && <span className="text-primary ms-1" aria-hidden="true">*</span>}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <select className="form-select" id={fieldId('isSale')} name="isSale" defaultValue={isSaleVal ? 'true' : 'false'} aria-label="isSale">
                      <option value="true">{t('common.yes')}</option>
                      <option value="false">{t('common.no')}</option>
                    </select>
                    <label htmlFor={fieldId('isSale')}>{t('products.col.isSale')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <select className="form-select" id={fieldId('isDisplay')} name="isDisplay" defaultValue={isDisplayVal ? 'true' : 'false'} aria-label="isDisplay">
                      <option value="true">{t('common.yes')}</option>
                      <option value="false">{t('common.no')}</option>
                    </select>
                    <label htmlFor={fieldId('isDisplay')}>{t('products.col.isDisplay')}</label>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'info' && (
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('productEnNm')} name="productEnNm" type="text" defaultValue={product.productEnNm ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('productEnNm')}>{t('products.detail.productEnNm')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('categoryCd')} name="categoryCd" type="text" defaultValue={product.categoryCd ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('categoryCd')}>{t('products.detail.categoryCd')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('brandCd')} name="brandCd" type="text" defaultValue={product.brandCd ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('brandCd')}>{t('products.detail.brandCd')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('costPrice')} name="costPrice" type="number" step="0.01" min="0" defaultValue={product.costPrice ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('costPrice')}>{t('products.detail.costPrice')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('supplyPrice')} name="supplyPrice" type="number" step="0.01" min="0" defaultValue={product.supplyPrice ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('supplyPrice')}>{t('products.detail.supplyPrice')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <select className="form-select" id={fieldId('taxType')} name="taxType" defaultValue={product.taxType ?? ''} aria-label="taxType">
                      <option value="">-</option>
                      <option value="TAXABLE">{t('products.taxType.TAXABLE')}</option>
                      <option value="TAX_FREE">{t('products.taxType.TAX_FREE')}</option>
                      <option value="ZERO">{t('products.taxType.ZERO')}</option>
                    </select>
                    <label htmlFor={fieldId('taxType')}>{t('products.detail.taxType')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('safetyStockQty')} name="safetyStockQty" type="number" min="0" defaultValue={product.safetyStockQty ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('safetyStockQty')}>{t('products.detail.safetyStockQty')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('minOrderQty')} name="minOrderQty" type="number" min="0" defaultValue={product.minOrderQty ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('minOrderQty')}>{t('products.detail.minOrderQty')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('maxOrderQty')} name="maxOrderQty" type="number" min="0" defaultValue={product.maxOrderQty ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('maxOrderQty')}>{t('products.detail.maxOrderQty')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('sortOrder')} name="sortOrder" type="number" min="0" defaultValue={product.sortOrder ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('sortOrder')}>{t('products.detail.sortOrder')}</label>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-floating mb-2">
                    <textarea className="form-control" id={fieldId('description')} name="description" rows={3} defaultValue={product.description ?? ''} placeholder=" " style={{ height: '100px' }} />
                    <label htmlFor={fieldId('description')}>{t('products.detail.description')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('imageUrl')} name="imageUrl" type="text" defaultValue={product.imageUrl ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('imageUrl')}>{t('products.detail.imageUrl')}</label>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="form-floating mb-2">
                    <input className="form-control" id={fieldId('remark')} name="remark" type="text" defaultValue={product.remark ?? ''} placeholder=" " />
                    <label htmlFor={fieldId('remark')}>{t('products.detail.remark')}</label>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'units' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <p className="text-body-tertiary mb-0">{t('products.edit.unitsDesc')}</p>
                  <button type="button" className="btn btn-phoenix-primary btn-sm d-inline-flex align-items-center" onClick={addUnit}>
                    <FiPlus size={14} className="me-1" aria-hidden />
                    {t('products.edit.add')}
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="bg-body-highlight">
                      <tr>
                        <th>{t('products.edit.unitCd')}</th>
                        <th>{t('products.edit.barcode')}</th>
                        <th>{t('products.edit.packQty')}</th>
                        <th>{t('products.edit.isBaseUnit')}</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayUnits.map((u, i) => (
                        <tr key={i}>
                          <td>
                            <select className="form-select form-select-sm" value={u.unitCd} onChange={(e) => updateUnit(i, { unitCd: e.target.value })} aria-label="unitCd">
                              {unitCodes.map((c) => (
                                <option key={c.subCd} value={c.subCd}>{c.codeNm}</option>
                              ))}
                              {unitCodes.length === 0 && <option value={u.unitCd || 'EA'}>{u.unitCd || 'EA'}</option>}
                              {unitCodes.length > 0 && u.unitCd && !unitCodes.some((c) => c.subCd === u.unitCd) && (
                                <option value={u.unitCd}>{u.unitCd}</option>
                              )}
                            </select>
                          </td>
                          <td>
                            <input className="form-control form-control-sm" value={u.barcode ?? ''} onChange={(e) => updateUnit(i, { barcode: e.target.value || null })} />
                          </td>
                          <td>
                            <input className="form-control form-control-sm" type="number" min={0} value={u.packQty ?? ''} onChange={(e) => updateUnit(i, { packQty: e.target.value ? Number(e.target.value) : null })} />
                          </td>
                          <td>
                            <select className="form-select form-select-sm" value={u.isBaseUnit ? 'true' : 'false'} onChange={(e) => updateUnit(i, { isBaseUnit: e.target.value === 'true' })}>
                              <option value="true">{t('common.yes')}</option>
                              <option value="false">{t('common.no')}</option>
                            </select>
                          </td>
                          <td className="text-center">
                            <button type="button" className="btn btn-phoenix-danger btn-sm px-2 d-inline-flex align-items-center justify-content-center" onClick={() => removeUnit(i)} aria-label={t('common.delete')}>
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {activeSection === 'setComponents' && productTypeInForm === 'SET' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <p className="text-body-tertiary mb-0">{t('products.edit.setComponentsDesc')}</p>
                  <button type="button" className="btn btn-phoenix-primary btn-sm d-inline-flex align-items-center" onClick={addSetComponent}>
                    <FiPlus size={14} className="me-1" aria-hidden />
                    {t('products.edit.add')}
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="bg-body-highlight">
                      <tr>
                        <th>{t('products.edit.componentProduct')}</th>
                        <th style={{ width: '120px' }}>{t('products.edit.componentQty')}</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {displaySetComponents.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <ProductChoicesSelect
                              value={c.componentProductId}
                              onChange={(pid) => updateSetComponent(i, { componentProductId: pid })}
                              options={products}
                              excludeProductId={isCreateMode ? undefined : productId}
                              placeholder={t('products.edit.selectProduct')}
                              searchPlaceholder={t('products.edit.searchProduct')}
                            />
                          </td>
                          <td>
                            <input className="form-control form-control-sm" type="number" min={1} value={c.componentQty} onChange={(e) => updateSetComponent(i, { componentQty: Number(e.target.value) || 1 })} />
                          </td>
                          <td className="text-center">
                            <button type="button" className="btn btn-phoenix-danger btn-sm px-2 d-inline-flex align-items-center justify-content-center" onClick={() => removeSetComponent(i)} aria-label={t('common.delete')}>
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-4 border-top">
              <button type="button" className="btn btn-phoenix-secondary btn-default-visible d-inline-flex align-items-center" onClick={() => closeTab(tab?.id ?? '')}>
                <FiX size={14} className="me-1" aria-hidden />
                {t('products.edit.list')}
              </button>
              <button type="submit" className="btn btn-phoenix-primary d-inline-flex align-items-center" disabled={isPending}>
                <FiSave size={14} className="me-1" aria-hidden />
                {isPending ? t('common.loading') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  );
}
