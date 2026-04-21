/**
 * 공통 그리드 관리자
 * Tabulator 그리드를 자동으로 초기화하고 관리하는 공통 함수
 */

(function() {
  'use strict';

  const gridPresets = {};

  // 그리드 인스턴스 저장소
  const gridInstances = new Map();

  function resolvePreset(name) {
    if (gridPresets[name]) {
      return gridPresets[name];
    }
    if (window.gridPresets && window.gridPresets[name]) {
      return window.gridPresets[name];
    }
    return null;
  }

  /**
   * 그리드 초기화 함수
   * @param {HTMLElement} element - 그리드를 초기화할 DOM 요소
   * @param {Object} config - 그리드 설정 객체
   */
  function initGrid(element, config) {
    if (typeof Tabulator === 'undefined') {
      console.warn('Tabulator is not loaded');
      return null;
    }

    if (!element.id) {
      element.id = 'grid-' + Math.random().toString(36).substr(2, 9);
    }
    const elementId = element.id;
    
    // 이미 초기화된 인스턴스가 있고 같은 요소를 사용 중이면 스킵
    if (element._gridInstance && element._gridId === elementId) {
      const existingInstance = gridInstances.get(elementId);
      if (existingInstance && existingInstance.element === element) {
        return existingInstance;
      }
    }
    
    // 기존 인스턴스가 있으면 제거
    if (gridInstances.has(elementId)) {
      try {
        const existingInstance = gridInstances.get(elementId);
        if (existingInstance) {
          // 모든 이벤트 핸들러 제거를 위해 destroy 호출
          if (typeof existingInstance.destroy === 'function') {
            existingInstance.destroy();
          }
          // 요소의 참조도 제거
          if (element._gridInstance === existingInstance) {
            delete element._gridInstance;
            delete element._gridId;
          }
        }
      } catch (e) {
        console.warn('Failed to destroy existing grid instance:', e);
      }
      gridInstances.delete(elementId);
    }

    // 기본 설정
    const defaultConfig = {
      paginationMode: "remote",
      paginationSize: 20,
      paginationSizeSelector: [10, 20, 50, 100],
      paginationCounter: "rows",
      placeholder: "데이터가 없습니다.",
      rowHeight: 37,
      editTriggerEvent: "click",
      ajaxConfig: 'GET',
      layout: "fitColumns",
      responsiveLayout: "collapse"
    };

    // 프리셋과 사용자 설정 병합
    let finalConfig = { ...defaultConfig };
    const presetName = config.preset;
    const userConfig = { ...config };
    delete userConfig.preset;

    if (presetName) {
      const preset = resolvePreset(presetName);
      if (preset) {
        finalConfig = { ...finalConfig, ...preset };
      } else {
        console.warn('Preset not found:', presetName);
      }
    }

    finalConfig = { ...finalConfig, ...userConfig };
    
    // ajaxURL이 없으면 에러
    if (!finalConfig.ajaxURL) {
      console.error('Grid config must have ajaxURL. Config:', config, 'FinalConfig:', finalConfig);
      return null;
    }

    // 페이지 정보 저장 변수
    let lastPage = 1;

    // ajaxRequestFunc 설정
    finalConfig.ajaxRequestFunc = function(url, config, params) {
      const page = (params && (params.page || params.pageNum)) || 1;
      const size = (params && (params.size || params.pageSize)) || 20;
      const searchParams = new URLSearchParams();
      searchParams.set('page', page);
      searchParams.set('size', size);
      if (params && Array.isArray(params.sorters) && params.sorters.length > 0) {
        searchParams.set('sortField', params.sorters[0].field);
        searchParams.set('sortDir', params.sorters[0].dir);
      }
      if (params && Array.isArray(params.filters) && params.filters.length > 0) {
        const filter = params.filters[0];
        searchParams.set('filterField', filter.field);
        searchParams.set('filterType', filter.type || 'like');
        searchParams.set('filterValue', filter.value ?? '');
      }
      
      return fetch(url + '?' + searchParams.toString())
        .then(response => response.json())
        .then(data => {
          lastPage = data.last_page || 1;
          return data.data || [];
        })
        .catch(error => {
          console.error('API Error:', error);
          return [];
        });
    };

    // paginationDataReceived 설정
    finalConfig.paginationDataReceived = function(data) {
      if (lastPage > 0) {
        this.setMaxPage(lastPage);
      }
      return data;
    };

    // updateURL이 있으면 cellEdited 설정
    if (finalConfig.updateURL && finalConfig.updateField) {
      finalConfig.cellEdited = function(cell) {
        try {
          // 셀이 유효한지 확인
          if (!cell || typeof cell.getRow !== 'function') {
            console.warn('Invalid cell object in cellEdited callback');
            return;
          }
          
          let row;
          try {
            row = cell.getRow();
          } catch (e) {
            console.warn('Failed to get row from cell, grid may have been reinitialized:', e);
            return;
          }
          
          if (!row || typeof row.getData !== 'function') {
            console.warn('Invalid row object in cellEdited callback');
            return;
          }
          
          const rowData = row.getData();
          const field = cell.getField();
          const value = cell.getValue();
          
          if (!rowData || !field) {
            console.warn('Invalid rowData or field in cellEdited callback');
            return;
          }
          
          const updateData = {};
          updateData[finalConfig.updateField] = rowData[finalConfig.updateField];
          updateData.field = field;
          updateData.value = value;
          
          fetch(finalConfig.updateURL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          })
          .then(response => {
            if (!response.ok) {
              return response.text().then(text => {
                throw new Error('업데이트 실패: ' + text);
              });
            }
            return response.json();
          })
          .then(data => {
            // 셀이 여전히 유효한지 확인
            try {
              if (data[field] !== undefined && cell && typeof cell.setValue === 'function') {
                cell.setValue(data[field]);
              }
            } catch (e) {
              console.warn('Failed to set cell value, grid may have been reinitialized:', e);
            }
          })
          .catch(error => {
            console.error("업데이트 오류:", error);
            try {
              if (cell && typeof cell.restoreOldValue === 'function') {
                cell.restoreOldValue();
              }
            } catch (e) {
              console.warn('Failed to restore old value:', e);
            }
            alert("데이터 업데이트에 실패했습니다: " + error.message);
          });
        } catch (error) {
          console.error('Unexpected error in cellEdited callback:', error);
        }
      };
    }

    // Tabulator 초기화
    const instance = new Tabulator(element, finalConfig);
    
    // 인스턴스 저장
    gridInstances.set(elementId, instance);
    element._gridInstance = instance;
    element._gridId = elementId;
    
    return instance;
  }

  /**
   * data 속성에서 설정 읽기
   * @param {HTMLElement} element - DOM 요소
   * @returns {Object} 설정 객체
   */
  function getConfigFromDataAttributes(element) {
    const config = {};
    
    // 프리셋 (data-grid-preset 속성)
    if (element.dataset.gridPreset) {
      config.preset = element.dataset.gridPreset;
    } else if (element.getAttribute('data-grid-preset')) {
      config.preset = element.getAttribute('data-grid-preset');
    }

    // URL (data-grid-url 속성)
    if (element.dataset.gridUrl) {
      config.ajaxURL = element.dataset.gridUrl;
    } else if (element.getAttribute('data-grid-url')) {
      config.ajaxURL = element.getAttribute('data-grid-url');
    }
    
    // 업데이트 URL (data-update-url 속성)
    if (element.dataset.updateUrl) {
      config.updateURL = element.dataset.updateUrl;
    } else if (element.getAttribute('data-update-url')) {
      config.updateURL = element.getAttribute('data-update-url');
    }
    
    // 업데이트 필드 (data-update-field 속성)
    if (element.dataset.updateField) {
      config.updateField = element.dataset.updateField;
    } else if (element.getAttribute('data-update-field')) {
      config.updateField = element.getAttribute('data-update-field');
    }
    
    // 페이지 크기 (data-page-size 속성)
    if (element.dataset.pageSize) {
      config.paginationSize = parseInt(element.dataset.pageSize);
    } else if (element.getAttribute('data-page-size')) {
      config.paginationSize = parseInt(element.getAttribute('data-page-size'));
    }
    
    // JSON 설정 (더 복잡한 설정을 위해)
    if (element.dataset.gridConfig) {
      try {
        const jsonConfig = JSON.parse(element.dataset.gridConfig);
        Object.assign(config, jsonConfig);
      } catch (e) {
        console.warn('Invalid grid-config JSON:', e);
      }
    } else if (element.getAttribute('data-grid-config')) {
      try {
        const jsonConfig = JSON.parse(element.getAttribute('data-grid-config'));
        Object.assign(config, jsonConfig);
      } catch (e) {
        console.warn('Invalid grid-config JSON:', e);
      }
    }
    
    return config;
  }

  function isManualGrid(element) {
    return element.dataset.gridManual === 'true' || element.getAttribute('data-grid-manual') === 'true';
  }

  /**
   * 모든 그리드 자동 초기화
   */
  function initAllGrids() {
    // .tabulator-grid 클래스를 가진 모든 요소 찾기
    const gridElements = document.querySelectorAll('.tabulator-grid');
    
    gridElements.forEach(function(element) {
      if (isManualGrid(element)) {
        return;
      }
      // 이미 초기화된 그리드는 스킵
      if (element._gridInstance) {
        return;
      }
      
      const config = getConfigFromDataAttributes(element);
      
      // 요소에 ID가 없으면 자동 생성
      if (!element.id) {
        element.id = 'grid-' + Math.random().toString(36).substr(2, 9);
      }
      
      initGrid(element, config);
    });
  }

  /**
   * 특정 요소의 그리드 초기화
   * @param {string|HTMLElement} selector - CSS 선택자 또는 DOM 요소
   * @param {Object} config - 그리드 설정 (선택사항)
   */
  function initGridBySelector(selector, config) {
    const element = typeof selector === 'string' 
      ? document.querySelector(selector)
      : selector;
    
    if (!element) {
      console.warn('Grid element not found:', selector);
      return null;
    }
    
    // 이미 초기화된 그리드는 기존 인스턴스 반환
    if (element._gridInstance) {
      return element._gridInstance;
    }
    
    const dataConfig = getConfigFromDataAttributes(element);
    const finalConfig = { ...dataConfig, ...(config || {}) };
    
    if (!element.id) {
      element.id = 'grid-' + Math.random().toString(36).substr(2, 9);
    }
    
    return initGrid(element, finalConfig);
  }

  // 전역 API
  window.GridManager = {
    init: initGrid,
    initAll: initAllGrids,
    initBySelector: initGridBySelector,
    getInstance: function(elementId) {
      return gridInstances.get(elementId);
    },
    destroy: function(elementId) {
      const instance = gridInstances.get(elementId);
      if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
      }
      gridInstances.delete(elementId);
    },
    addPreset: function(name, config) {
      gridPresets[name] = config;
    }
  };

  // DOM이 준비되면 자동 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // 약간의 지연 후 초기화 (다른 스크립트가 로드될 시간을 줌)
      setTimeout(initAllGrids, 100);
    });
  } else {
    setTimeout(initAllGrids, 100);
  }

  // 리사이즈 시 모든 그리드 재그리기 (반응형 레이아웃 보정)
  let resizeTimer = null;
  function redrawAllGrids() {
    gridInstances.forEach(function(instance) {
      if (instance && typeof instance.redraw === 'function') {
        try { instance.redraw(true); } catch (e) {}
      }
    });
  }
  window.addEventListener('resize', function() {
    if (resizeTimer) {
      cancelAnimationFrame(resizeTimer);
    }
    resizeTimer = requestAnimationFrame(redrawAllGrids);
  });

  // 탭 콘텐츠가 로드될 때도 자동 초기화
  // MutationObserver를 사용하여 동적으로 추가된 그리드 감지
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
      if (node.nodeType === 1) { // Element node
        // 직접 추가된 그리드 요소
        if (node.classList && node.classList.contains('tabulator-grid')) {
          if (isManualGrid(node)) {
            return;
          }
          const config = getConfigFromDataAttributes(node);
          if (!node.id) {
            node.id = 'grid-' + Math.random().toString(36).substr(2, 9);
          }
          initGrid(node, config);
        }
        // 하위 요소에 그리드가 있는지 확인
        const grids = node.querySelectorAll && node.querySelectorAll('.tabulator-grid');
        if (grids) {
          grids.forEach(function(gridElement) {
            if (isManualGrid(gridElement)) {
              return;
            }
            if (!gridElement._gridInstance) {
              const config = getConfigFromDataAttributes(gridElement);
              if (!gridElement.id) {
                gridElement.id = 'grid-' + Math.random().toString(36).substr(2, 9);
              }
                initGrid(gridElement, config);
              }
            });
          }
        }
      });
    });
  });

  // body를 관찰
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
