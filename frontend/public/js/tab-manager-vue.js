/**
 * Tab Manager Vue Component
 * Vue 3 Composition API를 사용한 탭 관리 컴포넌트
 */

const { createApp, ref, reactive, computed, onMounted, nextTick, watch } = Vue;

const TabManager = {
  setup() {
    const MAX_TABS = 10;
    const STORAGE_KEY_TABS = 'shopeasy_openTabs';
    const STORAGE_KEY_ACTIVE = 'shopeasy_activeTabId';
    const STORAGE_KEY_CACHE = 'shopeasy_tabContentCache';
    const isDevMode = window.APP_CONFIG && (window.APP_CONFIG.devMode === true || window.APP_CONFIG.devMode === 'true');

    // 반응형 상태
    const openTabs = ref([]);
    const activeTabId = ref(null);
    const loadingTabs = reactive({});
    // 탭 콘텐츠 캐시 (메모리에 저장하여 재로드 방지)
    const tabContentCache = reactive({});
    
    // Feather 아이콘 업데이트 함수
    const updateFeatherIcons = () => {
      if (window.feather) {
        nextTick(() => {
          window.feather.replace();
        });
      }
    };

    // 그리드가 이미 초기화되어 있는지 확인하는 헬퍼 함수
    const isGridInitialized = (contentEl) => {
      if (!contentEl || contentEl.children.length === 0) return false;
      const tableEl = contentEl.querySelector('#productTable, #userTable');
      return tableEl && tableEl._tabulatorInstance;
    };

    // 법인 선택 드롭다운 복원 함수
    function restoreCorporationSelect() {
      const corporationSelect = document.getElementById('corporationSelect');
      if (!corporationSelect) return;
      
      // 옵션이 비어있으면 (초기화된 경우) 세션에서 법인 목록을 다시 가져와야 함
      // 하지만 서버에서 받은 HTML의 navbar 부분이 이미 렌더링되어 있으므로,
      // 실제로는 탭 콘텐츠를 로드할 때 서버가 반환하는 HTML의 navbar 부분이 
      // 세션의 corporationList를 제대로 읽지 못하는 것이 문제입니다.
      // 
      // 해결 방법: 탭 콘텐츠 로드 후 navbar의 법인 선택 드롭다운이 비어있으면
      // 페이지를 새로고침하지 않고 현재 세션의 법인 목록을 유지하도록 합니다.
      // 
      // 현재는 탭 콘텐츠 로드 시 navbar가 영향을 받지 않아야 하므로,
      // 이 함수는 탭 콘텐츠 로드 완료 후 호출되어 navbar의 상태를 확인하고
      // 필요시 복원하는 역할을 합니다.
      
      // 옵션이 비어있고 (초기화된 경우), 이전에 저장된 법인 목록이 있으면 복원
      if (corporationSelect.options.length <= 1) {
        // 세션 스토리지에서 법인 목록 복원 시도
        const savedCorporationList = sessionStorage.getItem('shopeasy_corporationList');
        const savedSelectedCorp = sessionStorage.getItem('shopeasy_selectedCorporation');
        
        if (savedCorporationList) {
          try {
            const corporationList = JSON.parse(savedCorporationList);
            // 기존 옵션 제거 (첫 번째 "법인 선택" 옵션 제외)
            while (corporationSelect.options.length > 1) {
              corporationSelect.remove(1);
            }
            
            // 법인 목록 추가
            corporationList.forEach(corp => {
              const option = document.createElement('option');
              option.value = corp.corporation_cd;
              option.textContent = corp.corporation_nm;
              if (savedSelectedCorp && corp.corporation_cd === savedSelectedCorp) {
                option.selected = true;
              }
              corporationSelect.appendChild(option);
            });
            
            // 선택된 값 설정
            if (savedSelectedCorp) {
              corporationSelect.value = savedSelectedCorp;
            }
          } catch (e) {
            console.error('Failed to restore corporation list from sessionStorage:', e);
          }
        }
      }
    }

    // 법인 선택 드롭다운 복원 함수
    function restoreCorporationSelect() {
      const corporationSelect = document.getElementById('corporationSelect');
      if (!corporationSelect) return;
      
      // 세션에서 선택된 법인 코드 가져오기 (서버에서 전달된 값)
      const selectedCorpCd = corporationSelect.getAttribute('data-selected-corp-cd') || 
                            (window.SESSION_DATA && window.SESSION_DATA.selectedCorporationCd);
      
      // 옵션이 비어있으면 AJAX로 법인 목록 가져오기
      if (corporationSelect.options.length <= 1) {
        fetch('/api/corporation/list')
          .then(response => response.json())
          .then(data => {
            if (data.success && data.corporationList) {
              // 기존 옵션 제거 (첫 번째 "법인 선택" 옵션 제외)
              while (corporationSelect.options.length > 1) {
                corporationSelect.remove(1);
              }
              
              // 법인 목록 추가
              data.corporationList.forEach(corp => {
                const option = document.createElement('option');
                option.value = corp.corporation_cd;
                option.textContent = corp.corporation_nm;
                if (selectedCorpCd && corp.corporation_cd === selectedCorpCd) {
                  option.selected = true;
                }
                corporationSelect.appendChild(option);
              });
              
              // 선택된 값 설정
              if (selectedCorpCd) {
                corporationSelect.value = selectedCorpCd;
              }
            }
          })
          .catch(error => {
            console.error('Failed to load corporation list:', error);
          });
      } else if (selectedCorpCd) {
        // 옵션이 이미 있으면 선택된 값만 설정
        corporationSelect.value = selectedCorpCd;
      }
    }

    // sessionStorage에서 탭 정보 로드
    function loadTabsFromStorage() {
      try {
        const savedTabs = sessionStorage.getItem(STORAGE_KEY_TABS);
        const savedActive = sessionStorage.getItem(STORAGE_KEY_ACTIVE);
        const savedCache = sessionStorage.getItem(STORAGE_KEY_CACHE);
        let parsedCache = {};
        if (!isDevMode && savedCache) {
          parsedCache = JSON.parse(savedCache);
          Object.keys(parsedCache).forEach(id => {
            tabContentCache[id] = parsedCache[id];
          });
        } else if (isDevMode) {
          sessionStorage.removeItem(STORAGE_KEY_CACHE);
        }
        
        if (savedTabs) {
          // 새로고침 시에는 loaded=false로 두고, watch/onMounted에서 캐시를 사용해 복원하거나 필요 시 재조회
          openTabs.value = JSON.parse(savedTabs).map(tab => ({
            ...tab,
            loaded: false
          }));
        }
        if (savedActive) {
          activeTabId.value = savedActive;
        }
      } catch (e) {
        console.error('Failed to load tabs from storage:', e);
        openTabs.value = [];
        activeTabId.value = null;
      }
    }

    // sessionStorage에 탭 정보 저장
    function saveTabsToStorage() {
      try {
        sessionStorage.setItem(STORAGE_KEY_TABS, JSON.stringify(openTabs.value));
        if (activeTabId.value) {
          sessionStorage.setItem(STORAGE_KEY_ACTIVE, activeTabId.value);
        } else {
          sessionStorage.removeItem(STORAGE_KEY_ACTIVE);
        }
        if (!isDevMode) {
          sessionStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(tabContentCache));
        } else {
          sessionStorage.removeItem(STORAGE_KEY_CACHE);
        }
      } catch (e) {
        console.error('Failed to save tabs to storage:', e);
      }
    }

    // Tab ID 생성
    function generateTabId(url, title) {
      const str = url + '|' + title;
      const utf8Bytes = new TextEncoder().encode(str);
      const base64 = btoa(String.fromCharCode(...utf8Bytes));
      // Base64 문자열을 더 길게 사용하고 해시를 추가하여 충돌 방지
      const cleanBase64 = base64.replace(/[+/=]/g, '');
      // URL과 title의 해시를 추가하여 고유성 보장
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return `tab-${cleanBase64.substring(0, 20)}-${Math.abs(hash).toString(36).substring(0, 6)}`;
    }

    // Tab이 이미 열려있는지 확인
    function findTabByUrl(url) {
      return openTabs.value.find(tab => tab.url === url);
    }

    // Tab 추가
    function addTab(url, title, icon) {
      // 이미 열려있는 tab인지 확인
      const existingTab = findTabByUrl(url);
      if (existingTab) {
        activateTab(existingTab.id);
        return existingTab;
      }

      // 최대 개수 확인
      if (openTabs.value.length >= MAX_TABS) {
        // 경고 메시지 표시
        alert(`최대 ${MAX_TABS}개의 탭만 열 수 있습니다. 다른 탭을 닫은 후 다시 시도해주세요.`);
        return null;
      }

      // 새 tab 생성
      const tabId = generateTabId(url, title);
      const newTab = {
        id: tabId,
        url: url,
        title: title,
        icon: icon || null, // 아이콘 정보 추가
        timestamp: Date.now(),
        loaded: false
      };

      openTabs.value.push(newTab);
      saveTabsToStorage();

      // Tab 활성화 (watch가 자동으로 콘텐츠 로드 처리)
      // Vue가 DOM을 업데이트하기 위해 nextTick 사용
      nextTick(() => {
        activateTab(tabId);
      });
      
      return newTab;
    }

    // Tab 제거
    function removeTab(tabId) {
      const index = openTabs.value.findIndex(tab => tab.id === tabId);
      if (index === -1) return;

      const tab = openTabs.value[index];
      
      // 비활성 탭의 그리드 인스턴스 정리 (메모리 누수 방지)
      // v-if로 DOM이 제거되지만, 그리드 인스턴스는 수동으로 정리 필요
      if (tab.id !== activeTabId.value && typeof GridManager !== 'undefined') {
        const contentElement = document.querySelector(`#tab-content-${tab.id}`);
        if (contentElement) {
          const gridElements = contentElement.querySelectorAll('.tabulator-grid');
          gridElements.forEach(function(gridElement) {
            if (gridElement._gridInstance) {
              try {
                if (typeof gridElement._gridInstance.destroy === 'function') {
                  gridElement._gridInstance.destroy();
                }
                delete gridElement._gridInstance;
                delete gridElement._gridId;
              } catch (e) {
                console.warn('Failed to destroy grid instance:', e);
              }
            }
          });
        }
      }

      // 활성 탭이면 다른 탭 활성화
      if (activeTabId.value === tabId) {
        if (openTabs.value.length > 1) {
          // 이전 또는 다음 탭 활성화
          const newIndex = index > 0 ? index - 1 : 0;
          activateTab(openTabs.value[newIndex].id);
        } else {
          activeTabId.value = null;
        }
      }

      openTabs.value.splice(index, 1);
      
      // 탭 제거 시 캐시도 삭제
      if (tabContentCache[tab.id]) {
        delete tabContentCache[tab.id];
        saveTabsToStorage();
      }
      
      saveTabsToStorage();

      // 탭이 없으면 기본 콘텐츠 표시
      if (openTabs.value.length === 0) {
        const tabContainer = document.getElementById('dynamicTabsContainer');
        const defaultContent = document.getElementById('defaultContent');
        if (tabContainer) {
          tabContainer.style.display = 'none';
          tabContainer.classList.remove('active');
        }
        if (defaultContent) {
          defaultContent.style.display = 'block';
          defaultContent.style.visibility = 'visible';
        }
      }
    }

    // Tab 활성화
    function activateTab(tabId) {
      const tab = openTabs.value.find(t => t.id === tabId);
      if (!tab) return;

      // 이전 활성 탭의 그리드 인스턴스는 유지 (탭 전환 시 빠른 재표시를 위해)
      // 단, DOM은 v-if로 제거되어 메모리 사용량은 줄어듦

      activeTabId.value = tabId;
      saveTabsToStorage();

      // Vue가 DOM을 업데이트한 후 기본 콘텐츠 숨김 처리
      // 탭 컨테이너는 v-if="hasTabs"로 자동 표시됨
      nextTick(() => {
        const defaultContent = document.getElementById('defaultContent');
        if (defaultContent) {
          defaultContent.style.display = 'none';
          defaultContent.style.visibility = 'hidden';
        }
      });
      // 콘텐츠 로드는 watch에서 처리
    }

    // Tab 콘텐츠 로드 (캐시가 없을 때만 호출됨)
    async function executeScripts(scripts, tabId, skipIfGridExists = false) {
      if (!scripts || scripts.length === 0) {
        return;
      }
      
      // 그리드가 이미 초기화되어 있으면 스크립트를 재실행하지 않음 (탭 전환 시 데이터 보존)
      let contentElement = null;
      let tableElement = null;
      if (skipIfGridExists && tabId) {
        contentElement = document.querySelector(`#tab-content-${tabId}`);
        if (contentElement) {
          tableElement = contentElement.querySelector('#productTable, #userTable');
          if (tableElement && tableElement._tabulatorInstance) {
            // 그리드가 이미 초기화되어 있으면 스크립트 재실행하지 않음
            return;
          }
        }
      }
      
      for (const scriptInfo of scripts) {
        if (scriptInfo.src) {
          const existingScript = document.querySelector(`script[src="${scriptInfo.src}"]`);
          if (existingScript) {
            continue;
          }
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptInfo.src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        } else if (scriptInfo.text) {
          // 텍스트 스크립트는 그리드 초기화 함수인지 확인
          // initProductTable 또는 initUserTable이 포함되어 있으면 그리드가 있을 때 스킵
          if (skipIfGridExists && tabId) {
            if (!contentElement) {
              contentElement = document.querySelector(`#tab-content-${tabId}`);
            }
            if (contentElement) {
              if (!tableElement) {
                tableElement = contentElement.querySelector('#productTable, #userTable');
              }
              if (tableElement && tableElement._tabulatorInstance) {
                // 그리드 초기화 함수 호출이 포함된 스크립트는 스킵
                if (scriptInfo.text.includes('initProductTable()') || scriptInfo.text.includes('initUserTable()')) {
                  continue;
                }
              }
            }
          }
          
          const script = document.createElement('script');
          script.textContent = scriptInfo.text;
          // 탭 콘텐츠 요소에 직접 추가 (탭으로 로드된 경우 DOM이 준비된 후 실행되도록)
          // contentElement가 있으면 그곳에 추가, 없으면 body에 추가
          if (tabId) {
            const contentElement = document.querySelector(`#tab-content-${tabId}`);
            if (contentElement && contentElement.isConnected) {
              contentElement.appendChild(script);
            } else if (document.body) {
              document.body.appendChild(script);
            }
          } else if (document.body) {
            document.body.appendChild(script);
          }
        }
      }
    }

    async function loadTabContent(tab) {
      // 탭이 이미 제거되었으면 중단
      if (!openTabs.value.find(t => t.id === tab.id)) return;
      if (loadingTabs[tab.id]) return;
      
      const contentElement = document.querySelector(`#tab-content-${tab.id}`);
      if (!contentElement || !contentElement.isConnected) {
        return;
      }

      // 이미 로드된 탭이고 그리드가 초기화되어 있으면 완전히 건너뜀 (데이터 보존)
      if (tab.loaded && isGridInitialized(contentElement)) {
        loadingTabs[tab.id] = false;
        updateFeatherIcons();
        return; // 이미 로드된 탭이므로 완전히 건너뜀
      }

      // 이전 내용 제거 (중복 방지)
      contentElement.innerHTML = '';

      // loadTabContent는 watch에서 캐시 확인 후 호출되므로
      // 여기서는 무조건 서버에서 새로 로드
      loadingTabs[tab.id] = true;

      try {
        const fetchUrl = isDevMode
          ? `${tab.url}${tab.url.includes('?') ? '&' : '?'}_ts=${Date.now()}`
          : tab.url;
        const response = await fetch(fetchUrl, isDevMode ? { cache: 'no-store' } : undefined);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // 콘텐츠 요소가 사라졌으면 아무 것도 하지 않고 종료 (탭이 닫히거나 DOM이 재구성된 경우)
        if (!contentElement.isConnected) {
          return;
        }

        // 스크립트와 스타일시트 수집
        const scriptsToExecute = [];
        const linksToAdd = [];

        // default-content에서 스크립트와 링크 추출
        const defaultContent = doc.querySelector('.default-content');
        if (defaultContent) {
          defaultContent.querySelectorAll('script').forEach(script => {
            const src = script.getAttribute('src');
            const fullSrc = src ? (src.startsWith('http') ? src : new URL(src, window.location.origin).href) : null;
            scriptsToExecute.push({
              src: fullSrc,
              text: script.textContent || script.innerHTML,
              type: script.type || 'text/javascript'
            });
          });

          defaultContent.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            const href = link.getAttribute('href');
            const fullHref = href ? (href.startsWith('http') ? href : new URL(href, window.location.origin).href) : null;
            linksToAdd.push({
              href: fullHref,
              rel: link.rel
            });
          });

          // 콘텐츠 복사 (스크립트와 링크 제외)
          Array.from(defaultContent.children).forEach(child => {
            if (!contentElement.isConnected) return;
            if (child.tagName !== 'SCRIPT' && child.tagName !== 'LINK') {
              contentElement.appendChild(child.cloneNode(true));
            }
          });
        }

        // 링크 추가
        linksToAdd.forEach(linkInfo => {
          if (!document.head) return;
          const existingLink = document.querySelector(`link[href="${linkInfo.href}"]`);
          if (!existingLink && linkInfo.href) {
            const link = document.createElement('link');
            link.rel = linkInfo.rel;
            link.href = linkInfo.href;
            document.head.appendChild(link);
          }
        });

        // Tabulator 초기화를 위한 특별 처리
        // .tabulator-grid 클래스를 가진 모든 요소 처리
        const gridElements = contentElement.querySelectorAll('.tabulator-grid, #productTable');
        gridElements.forEach(function(gridElement) {
          const parent = gridElement.parentNode;
          if (parent && contentElement.isConnected) {
            // 기존 요소의 모든 속성 복사
            const attributes = Array.from(gridElement.attributes);
            const elementId = gridElement.id || 'grid-' + Math.random().toString(36).substr(2, 9);
            
            gridElement.remove();
            const newElement = document.createElement('div');
            newElement.id = elementId;
            
            // 모든 속성 복사 (특히 data-* 속성)
            attributes.forEach(function(attr) {
              newElement.setAttribute(attr.name, attr.value);
            });
            
            parent.appendChild(newElement);
          }
        });

        // Vue가 DOM을 업데이트할 시간을 주기 위해 nextTick 대기
        await Vue.nextTick();
        
        // 스크립트 실행 (탭 ID 전달하여 탭 콘텐츠에 직접 추가)
        // 콘텐츠가 DOM에 추가된 후 실행되도록 약간의 지연 추가
        await new Promise(resolve => setTimeout(resolve, 50));
        // 그리드가 이미 있으면 스크립트 재실행하지 않음 (탭 전환 시 데이터 보존)
        const hasExistingGrid = contentElement.querySelector('#productTable, #userTable')?._tabulatorInstance;
        await executeScripts(scriptsToExecute, tab.id, !!hasExistingGrid);

        // 스크립트 실행 후 그리드 초기화 (약간의 지연 후)
        await Vue.nextTick();
        // 그리드 초기화를 위해 약간의 지연 후 실행
        // 단, 이미 그리드가 초기화되어 있으면 재초기화하지 않음 (탭 전환 시 데이터 보존)
        setTimeout(() => {
          // 그리드가 이미 초기화되어 있는지 확인
          if (isGridInitialized(contentElement)) {
            // 이미 초기화되어 있으면 재초기화하지 않음
            return;
          }
          
          // GridManager를 사용하는 경우 자동 초기화
          if (typeof GridManager !== 'undefined') {
            try {
              GridManager.initAll();
            } catch (e) {
              console.error('Failed to initialize grids:', e);
            }
          }
          // GridManager를 사용하지 않는 페이지는 전역 초기화 함수 실행
          // 단, 그리드가 없을 때만 실행
          const tableElement = contentElement.querySelector('#productTable, #userTable');
          if (!tableElement || !tableElement._tabulatorInstance) {
            if (typeof window.initProductTable === 'function') {
              try { window.initProductTable(); } catch (e) { console.error(e); }
            }
            if (typeof window.initUserTable === 'function') {
              try { window.initUserTable(); } catch (e) { console.error(e); }
            }
          }
        }, 150);

        // Feather icons 초기화
        updateFeatherIcons();

        // 법인 선택 드롭다운 복원 (탭 콘텐츠 로드 후 navbar의 드롭다운이 초기화되는 문제 해결)
        restoreCorporationSelect();

        // 콘텐츠를 캐시에 저장 (재활성화 시 재사용)
        // innerHTML을 저장하기 전에 콘텐츠가 있는지 확인
        // 콘텐츠 요소가 사라졌으면 캐시/표시 모두 건너뜀
        if (!contentElement.isConnected) {
          loadingTabs[tab.id] = false;
          return;
        }

        const htmlContent = contentElement.innerHTML;
        if (!isDevMode && htmlContent && htmlContent.trim().length > 0) {
          tabContentCache[tab.id] = {
            html: htmlContent,
            scripts: scriptsToExecute,
            timestamp: Date.now()
          };
          saveTabsToStorage();
        } else if (!isDevMode) {
          console.warn('Tab content is empty, not caching:', tab.id);
        }

        tab.loaded = true;
      } catch (error) {
        console.error('Failed to load tab content:', error);
        if (contentElement && contentElement.isConnected) {
          contentElement.innerHTML = '<div class="alert alert-danger">콘텐츠를 불러오는데 실패했습니다.</div>';
        }
      } finally {
        loadingTabs[tab.id] = false;
      }
    }

    // Navbar에서 탭 열기 이벤트 처리
    function attachNavbarListeners() {
      // 아이콘 추출 헬퍼 함수
      function extractIcon(linkElement) {
        // 1. data-feather 속성이 있는 요소 찾기
        const featherElement = linkElement.querySelector('[data-feather]');
        if (featherElement) {
          return featherElement.getAttribute('data-feather');
        }
        // 2. nav-link-icon 내부의 SVG 요소 찾기 (이미 렌더링된 경우)
        const iconContainer = linkElement.querySelector('.nav-link-icon');
        if (iconContainer) {
          const svg = iconContainer.querySelector('svg');
          if (svg) {
            // SVG의 class에서 feather feather-{icon-name} 패턴 찾기
            const classList = svg.className.baseVal || svg.className || '';
            const classString = typeof classList === 'string' ? classList : (classList.toString ? classList.toString() : '');
            // feather feather-pie-chart 형식에서 두 번째 단어부터 끝까지 추출 (하이픈 포함)
            const match = classString.match(/\bfeather\s+feather-([\w-]+)\b/);
            if (match) {
              return match[1];
            }
            // feather-pie-chart 형식도 시도 (하이픈 포함)
            const match2 = classString.match(/\bfeather-([\w-]+)\b/);
            if (match2) {
              return match2[1];
            }
          }
        }
        return null;
      }

      // 통합 클릭 핸들러 (이벤트 위임 사용)
      function handleNavbarClick(e) {
        // 클릭된 요소가 링크인지 확인
        const link = e.target.closest('a[href], [data-tab-url]');
        if (!link) return;
        
        // data-tab-url 속성이 있는 경우
        if (link.hasAttribute('data-tab-url')) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          const url = link.getAttribute('data-tab-url');
          const title = link.getAttribute('data-tab-title') || link.textContent.trim();
          const icon = extractIcon(link);
          addTab(url, title, icon);
          return false;
        }
        
        // 일반 링크인 경우
        const href = link.getAttribute('href');
        if (!href) return;
        
        // 외부 링크나 특수 링크는 무시
        if (href.startsWith('#') || href.startsWith('http') || href === '/logout' || href === '#!') {
          return;
        }
        
        // Vertical Navbar 또는 Top Navbar의 링크인지 확인
        const isNavbarLink = link.closest('#navbarVerticalNav, #navbarTopCollapse');
        if (!isNavbarLink) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // 아이콘 정보 추출
        let icon = extractIcon(link);
        // 상단 메뉴의 경우 dropdown-item-wrapper 안의 아이콘도 확인
        if (!icon && link.closest('#navbarTopCollapse')) {
          const iconWrapper = link.querySelector('.dropdown-item-wrapper [data-feather]');
          if (iconWrapper) {
            icon = iconWrapper.getAttribute('data-feather');
          }
        }
        
        // 제목 추출
        let title = link.querySelector('.nav-link-text')?.textContent.trim() || 
                   link.querySelector('.dropdown-item-wrapper')?.textContent.trim() ||
                   link.textContent.trim() || 
                   'New Tab';
        // dropdown-item-wrapper의 텍스트에서 아이콘 텍스트 제거
        if (title && title.includes(' ')) {
          title = title.trim();
        }
        
        addTab(href, title, icon);
        return false;
      }

      // 이벤트 위임을 사용하여 document 레벨에서 처리
      // 기존 리스너가 있으면 제거 (중복 방지)
      if (window._tabManagerNavbarHandler) {
        document.removeEventListener('click', window._tabManagerNavbarHandler, true);
      }
      
      // 핸들러를 전역에 저장하여 나중에 제거할 수 있도록 함
      window._tabManagerNavbarHandler = handleNavbarClick;
      
      // capture phase에서 이벤트 위임 사용
      document.addEventListener('click', handleNavbarClick, true);
    }

    // 계산된 속성
    const hasTabs = computed(() => openTabs.value.length > 0);
    const activeTab = computed(() => openTabs.value.find(tab => tab.id === activeTabId.value));

    // activeTabId 변경 감시하여 콘텐츠 로드
    watch(activeTabId, (newTabId, oldTabId) => {
      if (!newTabId) return;
      
      const tab = openTabs.value.find(t => t.id === newTabId);
      if (!tab) return;

      if (isDevMode) {
        nextTick(() => loadTabContent(tab));
        return;
      }

      // 이미 로드된 탭이고 캐시가 있으면 재로딩/재초기화 없이 그대로 표시만 한다
      // DOM은 v-show로 유지되므로 innerHTML을 설정하지 않음
      if (!isDevMode && tab.loaded && tabContentCache[tab.id]) {
        const contentElement = document.querySelector(`#tab-content-${tab.id}`);
        if (isGridInitialized(contentElement)) {
          // 이미 로드되고 그리드가 초기화된 탭이므로 완전히 건너뜀
          loadingTabs[tab.id] = false;
          tab.loaded = true;
          updateFeatherIcons();
          return; // 여기서 완전히 종료하여 checkAndRestore가 실행되지 않도록 함
        }
      }

      // Vue가 DOM을 완전히 업데이트한 후 처리
      nextTick(() => {
        // 탭 전환 시 이미 로드된 탭은 완전히 건너뛰기 (데이터 보존)
        const contentElement = document.querySelector(`#tab-content-${tab.id}`);
        if (isGridInitialized(contentElement)) {
          // 이미 로드되고 그리드가 초기화된 탭이므로 완전히 건너뜀
          loadingTabs[tab.id] = false;
          tab.loaded = true;
          updateFeatherIcons();
          return; // 여기서 완전히 종료하여 checkAndRestore가 실행되지 않도록 함
        }
        
        const checkAndRestore = () => {
          // 탭이 이미 제거되었으면 중단
          if (!openTabs.value.find(t => t.id === tab.id)) {
            return;
          }

          const contentElement = document.querySelector(`#tab-content-${tab.id}`);
          if (!contentElement) {
            // 아직 DOM에 없다면 재시도
            setTimeout(checkAndRestore, 50);
            return;
          }

          // 탭이 닫히거나 DOM에서 제거된 경우 안전하게 종료
          if (!contentElement.isConnected) {
            return;
          }

          // 이미 로드된 탭이고 그리드가 초기화되어 있으면 아무것도 하지 않음
          if (tab.loaded && isGridInitialized(contentElement)) {
            loadingTabs[tab.id] = false;
            updateFeatherIcons();
            return; // 이미 로드된 탭이므로 아무것도 하지 않음
          }

          // 1. 캐시가 있으면 즉시 복원 (탭 전환 시)
          if (!isDevMode && tabContentCache[tab.id]) {
            const cachedContent = tabContentCache[tab.id];
            
            // 콘텐츠가 없을 때만 복원
            if (contentElement.children.length === 0) {
              contentElement.innerHTML = cachedContent.html;
              // 그리드가 없을 때만 스크립트 실행
              // skipIfGridExists=true로 설정하여 그리드가 있으면 스크립트 재실행하지 않음
              executeScripts(cachedContent.scripts, tab.id, true);
            }
            
            // Feather icons 초기화
            updateFeatherIcons();
            
            // 로딩 상태가 설정되어 있다면 해제 (로딩바 숨김)
            if (loadingTabs[tab.id]) {
              loadingTabs[tab.id] = false;
            }
            
            // 캐시에서 복원한 경우도 저장 상태 동기화
            saveTabsToStorage();
            tab.loaded = true;
            
            return; // 캐시 복원 완료, 더 이상 진행하지 않음
          }

          // 2. 캐시가 없고 아직 로드되지 않았으면 새로 로드
          // 단, 그리드가 이미 초기화되어 있으면 로드하지 않음 (데이터 보존)
          if (!tab.loaded) {
            if (!isGridInitialized(contentElement)) {
              loadTabContent(tab);
            } else {
              tab.loaded = true;
              loadingTabs[tab.id] = false;
              updateFeatherIcons();
            }
          }
          // 3. 이미 로드되었지만 캐시가 없는 경우 (이론적으로 발생하지 않아야 함)
          // 하지만 안전을 위해 콘텐츠가 없으면 다시 로드
          // 단, 그리드가 이미 초기화되어 있으면 로드하지 않음 (데이터 보존)
          else if (contentElement.children.length === 0) {
            if (!isGridInitialized(contentElement)) {
              loadTabContent(tab);
            } else {
              tab.loaded = true;
              loadingTabs[tab.id] = false;
              updateFeatherIcons();
            }
          }
        };
        
        checkAndRestore();
      });
    });

    // 초기화
    onMounted(() => {
      loadTabsFromStorage();
      
      // 탭이 있으면 컨테이너 표시
      if (openTabs.value.length > 0) {
        const defaultContent = document.getElementById('defaultContent');
        if (defaultContent) {
          defaultContent.style.display = 'none';
          defaultContent.style.visibility = 'hidden';
        }
        // 활성 탭 콘텐츠 로드
        if (activeTabId.value) {
          const tab = openTabs.value.find(t => t.id === activeTabId.value);
          nextTick(() => {
            const contentElement = document.querySelector(`#tab-content-${tab?.id}`);
            if (isDevMode && tab) {
              loadTabContent(tab);
              return;
            }
            // 1) 캐시가 있으면 즉시 복원
            if (!isDevMode && tab && tabContentCache[tab.id] && contentElement) {
              const cachedContent = tabContentCache[tab.id];
              contentElement.innerHTML = cachedContent.html;
              tab.loaded = true;
              loadingTabs[tab.id] = false;
              // 그리드가 이미 초기화되어 있으면 스크립트 재실행하지 않음 (탭 전환 시 데이터 보존)
              executeScripts(cachedContent.scripts, tab.id, true);
              updateFeatherIcons();
              saveTabsToStorage();
            }
            // 2) 캐시가 없으면 서버 로드
            else if (tab && !tab.loaded) {
              loadTabContent(tab);
            }
          });
        }
      }
      
      // Navbar 리스너는 약간의 지연 후에 추가 (DOM이 완전히 로드된 후)
      nextTick(() => {
        setTimeout(attachNavbarListeners, 100);
      });
    });

    // 전역으로 export
    window.TabManager = {
      addTab,
      removeTab,
      activateTab
    };

    return {
      openTabs,
      activeTabId,
      hasTabs,
      activeTab,
      addTab,
      removeTab,
      activateTab,
      loadingTabs
    };
  },
  template: `
    <div v-if="hasTabs" class="tab-container active" id="dynamicTabsContainer" style="display: flex !important;">
      <ul class="nav nav-tabs border-bottom" id="dynamicTabsList" role="tablist">
        <li v-for="tab in openTabs" :key="tab.id" class="nav-item" role="presentation">
          <a 
            :class="['nav-link', { active: tab.id === activeTabId }]"
            :id="'tab-' + tab.id"
            :href="'#' + tab.id"
            role="tab"
            @click.prevent="activateTab(tab.id)"
          >
            <span v-if="tab.icon" class="tab-icon">
              <i :data-feather="tab.icon"></i>
            </span>
            <span class="tab-title">{{ tab.title }}</span>
            <span 
              class="tab-close-icon" 
              @click.stop="removeTab(tab.id)"
              data-tab-close
            >
              <i data-feather="x"></i>
            </span>
          </a>
        </li>
      </ul>
      <div class="tab-content" id="dynamicTabsContent">
        <!-- v-show를 사용하여 비활성 탭 DOM을 유지하고 표시만 전환 -->
        <template v-for="tab in openTabs" :key="tab.id">
          <div 
            :id="'tab-pane-' + tab.id"
            :class="['tab-pane', { show: tab.id === activeTabId, active: tab.id === activeTabId }]"
            role="tabpanel"
            v-show="tab.id === activeTabId"
          >
            <div v-show="loadingTabs[tab.id]" class="text-center p-5">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div :id="'tab-content-' + tab.id" class="tab-pane-body"></div>
          </div>
        </template>
      </div>
    </div>
  `,
  updated() {
    // Vue가 DOM을 업데이트한 후 Feather 아이콘 초기화
    if (window.feather) {
      Vue.nextTick(() => {
        window.feather.replace();
      });
    }
  }
};

// Vue 앱 생성 및 마운트 (DOM이 준비된 후)
function initVueTabManager() {
  const appElement = document.getElementById('tab-manager-app');
  if (appElement && typeof Vue !== 'undefined') {
    createApp(TabManager).mount('#tab-manager-app');
  } else if (!appElement) {
    console.warn('tab-manager-app element not found');
  } else {
    setTimeout(initVueTabManager, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVueTabManager);
} else {
  initVueTabManager();
}
