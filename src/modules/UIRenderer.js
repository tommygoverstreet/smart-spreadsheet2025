/**
 * UI Component System with Virtual DOM
 * Optimized rendering for large datasets
 */
export class UIRenderer {
  constructor() {
    this.virtualDOM = new Map();
    this.renderQueue = [];
    this.isRendering = false;
    this.observers = new Map();

    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.lazyLoadElement(entry.target);
          }
        });
      }, {
        rootMargin: '100px'
      });
    }
  }

  // Virtual DOM implementation for table rows
  createVirtualRow(rowData, headers, index) {
    return {
      type: 'tr',
      key: `row-${index}`,
      props: {
        className: index % 2 === 0 ? 'even' : 'odd',
        'data-index': index
      },
      children: headers.map(header => ({
        type: 'td',
        key: `cell-${index}-${header}`,
        props: {
          contentEditable: true,
          'data-column': header,
          'data-row': index
        },
        children: [rowData[header] || '']
      }))
    };
  }

  // Optimized table rendering with virtualization
  renderTable(data, container, options = {}) {
    const {
      startRow = 0,
      endRow = Math.min(data.rows.length, 100),
      pageSize = 50
    } = options;

    // Performance tracking
    const startTime = performance.now();
    window.performanceMonitor?.startRenderTracking();

    // Clear existing content
    container.innerHTML = '';

    // Create header
    if (data.headers && data.headers.length > 0) {
      const headerRow = this.createTableHeader(data.headers);
      container.appendChild(headerRow);
    }

    // Create tbody
    const tbody = document.createElement('tbody');
    tbody.id = 'tableBody';

    // Render visible rows only (virtualization)
    const visibleRows = data.rows.slice(startRow, endRow);

    visibleRows.forEach((rowData, index) => {
      const actualIndex = startRow + index;
      const row = this.createTableRow(rowData, data.headers, actualIndex);
      tbody.appendChild(row);
    });

    container.appendChild(tbody);

    // Setup lazy loading for remaining rows
    if (endRow < data.rows.length) {
      this.setupLazyLoading(container, data, endRow);
    }

    // Performance tracking end
    const renderTime = performance.now() - startTime;
    window.performanceMonitor?.endRenderTracking();

    console.log(`🎨 Table rendered: ${visibleRows.length} rows in ${Math.round(renderTime)}ms`);

    return container;
  }

  createTableHeader(headers) {
    const thead = document.createElement('thead');
    thead.id = 'tableHead';
    thead.className = 'bg-gray-50 sticky top-0 border-b border-gray-200';

    const headerRow = document.createElement('tr');

    headers.forEach(header => {
      const th = document.createElement('th');
      th.className = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors';
      th.textContent = header;
      th.dataset.column = header;

      // Add sort indicator
      const sortIcon = document.createElement('span');
      sortIcon.className = 'ml-1 text-gray-400';
      sortIcon.innerHTML = '↕️';
      th.appendChild(sortIcon);

      // Add click handler for sorting
      th.addEventListener('click', (e) => {
        this.handleColumnSort(e, header);
      });

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    return thead;
  }

  createTableRow(rowData, headers, index) {
    const row = document.createElement('tr');
    row.className = `border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`;
    row.dataset.index = index;

    headers.forEach(header => {
      const cell = document.createElement('td');
      cell.className = 'px-4 py-3 text-sm text-gray-900 whitespace-nowrap';
      cell.contentEditable = true;
      cell.dataset.column = header;
      cell.dataset.row = index;

      // Format cell value based on type
      const value = rowData[header] || '';
      cell.textContent = this.formatCellValue(value);

      // Add input handlers
      this.addCellEventListeners(cell);

      row.appendChild(cell);
    });

    return row;
  }

  formatCellValue(value) {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }

    return value;
  }

  addCellEventListeners(cell) {
    // Debounced input handler
    const debouncedHandler = this.debounce((e) => {
      this.handleCellEdit(e);
    }, 300);

    cell.addEventListener('input', debouncedHandler);
    cell.addEventListener('blur', (e) => this.handleCellBlur(e));
    cell.addEventListener('keydown', (e) => this.handleCellKeydown(e));
  }

  handleCellEdit(event) {
    const cell = event.target;
    const column = cell.dataset.column;
    const row = parseInt(cell.dataset.row);
    const value = cell.textContent;

    // Emit custom event for data change
    const changeEvent = new CustomEvent('dataChange', {
      detail: { column, row, value, cell }
    });
    document.dispatchEvent(changeEvent);
  }

  handleCellBlur(event) {
    const cell = event.target;
    cell.classList.remove('ring-2', 'ring-blue-500');
  }

  handleCellKeydown(event) {
    const cell = event.target;

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.moveToNextCell(cell, 'down');
        break;
      case 'Tab':
        event.preventDefault();
        this.moveToNextCell(cell, event.shiftKey ? 'left' : 'right');
        break;
      case 'Escape':
        cell.blur();
        break;
    }
  }

  moveToNextCell(currentCell, direction) {
    const row = parseInt(currentCell.dataset.row);
    const column = currentCell.dataset.column;
    const table = currentCell.closest('table');

    let nextCell = null;

    switch (direction) {
      case 'right':
        nextCell = table.querySelector(`[data-row="${row}"][data-column]:not([data-column="${column}"])`);
        break;
      case 'left':
        // Find previous column
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.dataset.column);
        const currentIndex = headers.indexOf(column);
        if (currentIndex > 0) {
          const prevColumn = headers[currentIndex - 1];
          nextCell = table.querySelector(`[data-row="${row}"][data-column="${prevColumn}"]`);
        }
        break;
      case 'down':
        nextCell = table.querySelector(`[data-row="${row + 1}"][data-column="${column}"]`);
        break;
      case 'up':
        nextCell = table.querySelector(`[data-row="${row - 1}"][data-column="${column}"]`);
        break;
    }

    if (nextCell) {
      nextCell.focus();
      nextCell.classList.add('ring-2', 'ring-blue-500');
    }
  }

  handleColumnSort(event, column) {
    const th = event.currentTarget;
    const currentSort = th.dataset.sort || 'asc';
    const newSort = currentSort === 'asc' ? 'desc' : 'asc';

    // Clear other column sorts
    th.parentElement.querySelectorAll('th').forEach(header => {
      header.dataset.sort = '';
      header.querySelector('span').innerHTML = '↕️';
    });

    // Set new sort
    th.dataset.sort = newSort;
    th.querySelector('span').innerHTML = newSort === 'asc' ? '↑' : '↓';

    // Emit sort event
    const sortEvent = new CustomEvent('columnSort', {
      detail: { column, direction: newSort }
    });
    document.dispatchEvent(sortEvent);
  }

  setupLazyLoading(container, data, startIndex) {
    // Create sentinel element for intersection observer
    const sentinel = document.createElement('div');
    sentinel.className = 'lazy-load-sentinel h-1';
    sentinel.dataset.startIndex = startIndex;
    container.appendChild(sentinel);

    if (this.intersectionObserver) {
      this.intersectionObserver.observe(sentinel);
    }
  }

  lazyLoadElement(element) {
    const startIndex = parseInt(element.dataset.startIndex);
    // Implement lazy loading logic here
    console.log(`🔄 Lazy loading from index: ${startIndex}`);
  }

  // Skeleton loading for better UX
  createSkeletonRow(columnCount) {
    const row = document.createElement('tr');
    row.className = 'animate-pulse';

    for (let i = 0; i < columnCount; i++) {
      const cell = document.createElement('td');
      cell.className = 'px-4 py-3';

      const skeleton = document.createElement('div');
      skeleton.className = 'h-4 bg-gray-200 rounded';
      cell.appendChild(skeleton);

      row.appendChild(cell);
    }

    return row;
  }

  showSkeletonTable(container, rowCount = 5, columnCount = 4) {
    container.innerHTML = '';

    const table = document.createElement('table');
    table.className = 'min-w-full divide-y divide-gray-200';

    const tbody = document.createElement('tbody');
    tbody.className = 'bg-white divide-y divide-gray-200';

    for (let i = 0; i < rowCount; i++) {
      const skeletonRow = this.createSkeletonRow(columnCount);
      tbody.appendChild(skeletonRow);
    }

    table.appendChild(tbody);
    container.appendChild(table);
  }

  // Progressive enhancement for file list
  renderFilesList(files, container) {
    const fragment = document.createDocumentFragment();

    files.forEach(file => {
      const fileElement = this.createFileListItem(file);
      fragment.appendChild(fileElement);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
  }

  createFileListItem(file) {
    const item = document.createElement('div');
    item.className = 'file-item p-3 border border-gray-200 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer';
    item.dataset.fileId = file.id;

    item.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">${file.name}</p>
            <p class="text-xs text-gray-500">${file.rows?.length || 0} rows • ${file.headers?.length || 0} columns</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button class="text-gray-400 hover:text-red-500 transition-colors" data-action="delete" data-file-id="${file.id}">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Add click handler
    item.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="delete"]')) {
        this.handleFileDelete(file.id);
      } else {
        this.handleFileSelect(file.id);
      }
    });

    return item;
  }

  handleFileSelect(fileId) {
    const selectEvent = new CustomEvent('fileSelect', {
      detail: { fileId }
    });
    document.dispatchEvent(selectEvent);
  }

  handleFileDelete(fileId) {
    const deleteEvent = new CustomEvent('fileDelete', {
      detail: { fileId }
    });
    document.dispatchEvent(deleteEvent);
  }

  // Utility methods
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Clean up
  destroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.virtualDOM.clear();
  }
}

export const uiRenderer = new UIRenderer();