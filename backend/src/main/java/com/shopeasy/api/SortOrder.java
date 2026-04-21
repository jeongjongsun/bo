package com.shopeasy.api;

/** 정렬 조건 (PagedData.sort). property=필드명, direction=ASC|DESC */
public class SortOrder {

    private String property;
    private String direction;

    public SortOrder() {}

    public String getProperty() { return property; }
    public void setProperty(String property) { this.property = property; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
}
