/**
 * 공통 필터 관리자
 * Tabulator 그리드에 필터 기능을 추가하는 공통 함수
 */

(function() {
  'use strict';

  /**
   * 필터 기능 초기화
   * @param {Object} options - 필터 설정 옵션
   * @param {Object} options.instance - Tabulator 인스턴스
   * @param {Array} options.filterFields - 필터 가능한 필드 목록 [{value: 'field', label: 'Label'}, ...]
   * @param {Array} options.filterTypes - 필터 타입 목록 [{value: 'equals', label: '일치'}, ...]
   * @param {Object} options.defaultFilter - 기본 필터 설정 {field: '', type: 'like', value: ''}
   * @param {Function} options.onFilterChange - 필터 변경 시 콜백 함수 (currentFilter) => {}
   */
  window.initFilterManager = function(options) {
    const {
      instance,
      filterFields = [],
      filterTypes = [
        { value: 'equals', label: '일치' },
        { value: 'like', label: '포함' }
      ],
      defaultFilter = {
        field: '',
        type: 'like',
        value: ''
      },
      onFilterChange = null
    } = options;

    if (!instance) {
      console.error('Tabulator instance is required');
      return null;
    }

    // 필터 상태 저장 변수
    let currentFilter = {
      field: null,
      type: null,
      value: null
    };

    // 필터 업데이트 중복 호출 방지 플래그
    let isFilterUpdating = false;

    // DOM 요소 가져오기 (활성 탭의 콘텐츠 내에서만 찾기)
    // 그리드 인스턴스의 테이블 요소를 기준으로 부모 콘텐츠 영역에서 찾기
    let tableElement = instance.element;
    let contentElement = tableElement;
    // tab-content-로 시작하는 부모 요소 찾기
    while (contentElement && !contentElement.id.startsWith('tab-content-')) {
      contentElement = contentElement.parentElement;
    }
    
    // 활성 탭의 콘텐츠 내에서만 요소 찾기
    let fieldEl, typeEl, valueEl;
    if (contentElement && contentElement.id.startsWith('tab-content-')) {
      fieldEl = contentElement.querySelector("#filter-field");
      typeEl = contentElement.querySelector("#filter-type");
      valueEl = contentElement.querySelector("#filter-value");
    } else {
      // 탭이 아닌 경우 전체 문서에서 찾기
      fieldEl = document.getElementById("filter-field");
      typeEl = document.getElementById("filter-type");
      valueEl = document.getElementById("filter-value");
    }

    // DOM 요소가 없으면 잠시 후 재시도
    if (!fieldEl || !typeEl || !valueEl) {
      let retries = 0;
      const maxRetries = 20;
      const checkInterval = setInterval(() => {
        if (contentElement && contentElement.id.startsWith('tab-content-')) {
          fieldEl = contentElement.querySelector("#filter-field");
          typeEl = contentElement.querySelector("#filter-type");
          valueEl = contentElement.querySelector("#filter-value");
        } else {
          fieldEl = document.getElementById("filter-field");
          typeEl = document.getElementById("filter-type");
          valueEl = document.getElementById("filter-value");
        }
        
        retries++;
        if (fieldEl && typeEl && valueEl) {
          clearInterval(checkInterval);
          // 요소를 찾았으면 초기화 계속 진행
          return initializeFilterManager();
        } else if (retries >= maxRetries) {
          clearInterval(checkInterval);
          console.warn('Filter elements not found after retries');
          return null;
        }
      }, 50);
      
      // 재시도 중에는 null 반환
      return null;
    }
    
    // DOM 요소를 찾았으면 초기화 진행
    return initializeFilterManager();
    
    function initializeFilterManager() {
      // 필터 옵션 동적 생성
      function initFilterOptions() {
        // 필터 필드 옵션 생성 (항상 새로 생성)
      if (fieldEl) {
        fieldEl.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '필드 선택';
        fieldEl.appendChild(defaultOption);

        filterFields.forEach(field => {
          const option = document.createElement('option');
          option.value = field.value;
          option.textContent = field.label;
          fieldEl.appendChild(option);
        });

        if (defaultFilter.field) {
          fieldEl.value = defaultFilter.field;
        }
      }

      // 필터 타입 옵션 생성 (항상 새로 생성)
      if (typeEl) {
        typeEl.innerHTML = '';
        filterTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type.value;
          option.textContent = type.label;
          typeEl.appendChild(option);
        });

        if (defaultFilter.type) {
          typeEl.value = defaultFilter.type;
        }
      }

        // 기본 값 적용
        if (valueEl && defaultFilter.value) {
          valueEl.value = defaultFilter.value;
        }
      }

    // 필터 업데이트 함수
    function updateFilter(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (isFilterUpdating) {
        return;
      }

      const filterVal = fieldEl.options[fieldEl.selectedIndex].value;
      const typeVal = typeEl.options[typeEl.selectedIndex].value;
      const valueVal = valueEl.value.trim();

      isFilterUpdating = true;

      if (filterVal && valueVal) {
        const filterType = typeVal;

        currentFilter = {
          field: filterVal,
          type: filterType,
          value: valueVal
        };

        // 콜백 호출
        if (onFilterChange) {
          onFilterChange(currentFilter);
        }

        const currentPage = instance.getPage();
        if (currentPage !== 1) {
          instance.setPage(1).then(() => {
            isFilterUpdating = false;
          }).catch(() => {
            isFilterUpdating = false;
          });
        } else {
          instance.replaceData();
          setTimeout(() => {
            isFilterUpdating = false;
          }, 100);
        }
      } else {
        console.log('Clearing filter');
        currentFilter = {
          field: null,
          type: null,
          value: null
        };

        if (onFilterChange) {
          onFilterChange(currentFilter);
        }

        instance.clearFilter();
        instance.setPage(1).then(() => {
          isFilterUpdating = false;
        });
      }
    }

    // 필터 초기화 함수
    function clearFilter() {
      fieldEl.value = "";
      typeEl.value = defaultFilter.type || "equals";
      valueEl.value = "";
      currentFilter = {
        field: null,
        type: null,
        value: null
      };

      if (onFilterChange) {
        onFilterChange(currentFilter);
      }

      instance.clearFilter();
      instance.setPage(1);
    }

      // 필터 옵션 초기화 (항상 실행)
      initFilterOptions();

      // 이벤트 리스너 등록 (활성 탭의 콘텐츠 내에서만 찾기)
      let filterApplyBtn, filterClearBtn;
      if (contentElement && contentElement.id.startsWith('tab-content-')) {
        filterApplyBtn = contentElement.querySelector("#filter-apply");
        filterClearBtn = contentElement.querySelector("#filter-clear");
      } else {
        filterApplyBtn = document.getElementById("filter-apply");
        filterClearBtn = document.getElementById("filter-clear");
      }
      
      if (filterApplyBtn) {
        // 기존 리스너 제거를 위해 새 요소로 교체
        const oldBtn = filterApplyBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        newBtn.addEventListener("click", updateFilter);
      }

      if (valueEl) {
        // 기존 리스너 제거를 위해 새 요소로 교체
        const oldValueEl = valueEl;
        const newValueEl = oldValueEl.cloneNode(true);
        oldValueEl.parentNode.replaceChild(newValueEl, oldValueEl);
        newValueEl.addEventListener("keyup", function(e) {
          if (e.key === 'Enter') {
            updateFilter();
          }
        });
        // valueEl 참조 업데이트
        valueEl = newValueEl;
      }

      if (filterClearBtn) {
        // 기존 리스너 제거를 위해 새 요소로 교체
        const oldBtn = filterClearBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        newBtn.addEventListener("click", clearFilter);
      }

      // currentFilter getter 함수 반환
      return {
        getCurrentFilter: function() {
          return currentFilter;
        },
        setCurrentFilter: function(filter) {
          currentFilter = filter;
          if (onFilterChange) {
            onFilterChange(currentFilter);
          }
        },
        updateFilter: updateFilter,
        clearFilter: clearFilter
      };
    }
    
    // initializeFilterManager가 호출되지 않았으면 null 반환
    return null;
  };

})();
