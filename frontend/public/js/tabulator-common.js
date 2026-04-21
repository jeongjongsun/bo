/**
 * Tabulator 공통 유틸리티 함수
 * 그리드 높이 계산 및 리사이즈 이벤트 핸들러를 제공합니다.
 */

(function() {
  'use strict';

  /**
   * 그리드 높이 계산 함수
   * 브라우저 뷰포트 높이를 기준으로 그리드의 적절한 높이를 계산합니다.
   * 
   * @param {Object} options - 옵션 객체
   * @param {number} options.headerHeight - 헤더, 네비게이션 등 고정 높이 (기본값: 200)
   * @param {number} options.paginationHeight - 페이징 컨트롤 높이 (기본값: 60)
   * @param {number} options.padding - 여백 (기본값: 40)
   * @param {number} options.minHeight - 최소 높이 (기본값: 400)
   * @returns {number} 계산된 그리드 높이
   */
  window.calculateGridHeight = function(options) {
    options = options || {};
    const viewportHeight = window.innerHeight;
    const headerHeight = options.headerHeight || 200;
    const paginationHeight = options.paginationHeight || 60;
    const padding = options.padding || 40;
    const minHeight = options.minHeight || 400;
    
    const calculatedHeight = viewportHeight - headerHeight - paginationHeight - padding;
    return Math.max(calculatedHeight, minHeight);
  };

  /**
   * 그리드 리사이즈 이벤트 핸들러 등록
   * 브라우저 리사이즈 시 그리드 높이를 자동으로 조정합니다.
   * 
   * @param {Tabulator} instance - Tabulator 인스턴스
   * @param {Function} heightCalculator - 높이 계산 함수 (기본값: calculateGridHeight)
   * @param {number} debounceTime - 디바운싱 시간(ms) (기본값: 250)
   * @returns {Function} 이벤트 핸들러 제거 함수
   */
  window.setupGridResizeHandler = function(instance, heightCalculator, debounceTime) {
    if (!instance) {
      console.warn('Tabulator instance is required for resize handler');
      return function() {}; // 빈 함수 반환
    }

    heightCalculator = heightCalculator || window.calculateGridHeight;
    debounceTime = debounceTime || 250;

    let resizeTimeout;
    
    const resizeHandler = function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (instance) {
          try {
            const newHeight = heightCalculator();
            instance.setHeight(newHeight);
          } catch (error) {
            console.error('Error updating grid height:', error);
          }
        }
      }, debounceTime);
    };

    window.addEventListener('resize', resizeHandler);

    // 이벤트 핸들러 제거 함수 반환
    return function() {
      window.removeEventListener('resize', resizeHandler);
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  };

  /**
   * 엑셀 다운로드 기능 초기화
   * Tabulator 그리드의 모든 데이터를 엑셀 파일로 다운로드하는 기능을 제공합니다.
   * 
   * @param {Object} options - 옵션 객체
   * @param {Tabulator} options.instance - Tabulator 인스턴스
   * @param {string} options.apiUrl - 데이터를 가져올 API URL (예: '/api/user/list')
   * @param {string|HTMLElement} options.buttonId - 다운로드 버튼 ID 또는 버튼 요소
   * @param {string} options.fileName - 다운로드할 파일명 (예: 'user-list.xlsx')
   * @param {string} options.sheetName - 엑셀 시트명 (예: 'Users')
   * @param {Function} options.getCurrentFilter - 현재 필터 상태를 반환하는 함수 (선택사항)
   * @param {Function} options.transformData - 엑셀 다운로드 전 데이터 변환 함수 (선택사항)
   * @param {string} options.loadingText - 다운로드 중 표시할 텍스트 (기본값: '다운로드 중...')
   * @param {string} options.noDataMessage - 데이터가 없을 때 표시할 메시지 (기본값: '다운로드할 데이터가 없습니다.')
   */
  window.initExcelDownload = function(options) {
    const {
      instance,
      apiUrl,
      buttonId,
      fileName,
      sheetName,
      getCurrentFilter = null,
      transformData = null,
      loadingText = '다운로드 중...',
      noDataMessage = '다운로드할 데이터가 없습니다.'
    } = options;

    if (!instance) {
      console.error('Tabulator instance is required');
      return;
    }

    if (!apiUrl) {
      console.error('API URL is required');
      return;
    }

    if (!fileName) {
      console.error('File name is required');
      return;
    }

    if (!sheetName) {
      console.error('Sheet name is required');
      return;
    }

    // 버튼 요소 찾기
    let downloadButton = null;
    if (typeof buttonId === 'string') {
      // 탭 콘텐츠 내에서 버튼 찾기
      const downloadTabPane = document.querySelector('.tab-pane.show.active');
      if (downloadTabPane) {
        downloadButton = downloadTabPane.querySelector('#' + buttonId);
      }
      if (!downloadButton) {
        downloadButton = document.getElementById(buttonId);
      }
    } else if (buttonId instanceof HTMLElement) {
      downloadButton = buttonId;
    }

    if (!downloadButton) {
      console.warn('Download button not found:', buttonId);
      return;
    }

    // 이미 바인딩된 버튼인지 확인
    if (downloadButton._bound) {
      return;
    }

    downloadButton._bound = true;
    downloadButton.addEventListener('click', async function() {
      if (typeof XLSX === 'undefined') {
        alert('엑셀 다운로드를 위해 xlsx 라이브러리가 필요합니다.');
        return;
      }

      // 버튼 비활성화
      downloadButton.disabled = true;
      const originalText = downloadButton.innerHTML;
      downloadButton.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>' + loadingText;

      try {
        // 모든 데이터를 가져오기 위한 파라미터 구성
        const searchParams = new URLSearchParams();
        searchParams.set('page', '1');
        searchParams.set('size', '999999'); // 매우 큰 값으로 모든 데이터 가져오기

        // 현재 필터 조건 추가
        if (getCurrentFilter && typeof getCurrentFilter === 'function') {
          const currentFilter = getCurrentFilter();
          if (currentFilter && currentFilter.field && currentFilter.value) {
            searchParams.set('filterField', currentFilter.field);
            searchParams.set('filterType', currentFilter.type || 'like');
            searchParams.set('filterValue', currentFilter.value);
          }
        }

        // 모든 데이터 가져오기
        const response = await fetch(apiUrl + '?' + searchParams.toString());
        if (!response.ok) {
          throw new Error('데이터를 가져오는 중 오류가 발생했습니다: ' + response.statusText);
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
          // 데이터 변환 함수 (옵션으로 제공)
          let transformedData = data.data;
          if (transformData && typeof transformData === 'function') {
            transformedData = data.data.map(row => transformData(row));
          }

          // 임시로 모든 데이터를 그리드에 설정
          const originalData = instance.getData();
          instance.setData(transformedData);

          // 엑셀 다운로드
          instance.download('xlsx', fileName, { sheetName: sheetName });

          // 원래 데이터로 복원
          instance.setData(originalData);
        } else {
          alert(noDataMessage);
        }
      } catch (error) {
        console.error('엑셀 다운로드 오류:', error);
        alert('엑셀 다운로드 중 오류가 발생했습니다: ' + error.message);
      } finally {
        // 버튼 활성화
        downloadButton.disabled = false;
        downloadButton.innerHTML = originalText;
      }
    });
  };

})();
