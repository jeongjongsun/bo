package com.shopeasy.api;

import java.util.List;

/**
 * 페이징 응답 data 필드 (docs/02-개발-표준.md). items, page, size, total, totalPages.
 */
public class PagedData<T> {

    private List<T> items;
    private int page;
    private int size;
    private long total;
    private int totalPages;
    private boolean first;
    private boolean last;
    private List<SortOrder> sort;

    public PagedData() {}

    public PagedData(List<T> items, int page, int size, long total,
                     int totalPages, boolean first, boolean last, List<SortOrder> sort) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.total = total;
        this.totalPages = totalPages;
        this.first = first;
        this.last = last;
        this.sort = sort;
    }

    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public int getTotalPages() { return totalPages; }
    public void setTotalPages(int totalPages) { this.totalPages = totalPages; }

    public boolean isFirst() { return first; }
    public void setFirst(boolean first) { this.first = first; }

    public boolean isLast() { return last; }
    public void setLast(boolean last) { this.last = last; }

    public List<SortOrder> getSort() { return sort; }
    public void setSort(List<SortOrder> sort) { this.sort = sort; }
}
