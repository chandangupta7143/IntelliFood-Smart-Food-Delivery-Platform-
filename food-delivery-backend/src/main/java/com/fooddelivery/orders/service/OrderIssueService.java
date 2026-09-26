package com.fooddelivery.orders.service;

import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.orders.dto.CreateOrderIssueRequest;
import com.fooddelivery.orders.dto.OrderIssueResponse;
import com.fooddelivery.orders.dto.ResolveOrderIssueRequest;
import com.fooddelivery.orders.entity.OrderIssueStatus;

import java.util.List;

public interface OrderIssueService {

    OrderIssueResponse reportIssue(String orderId, CreateOrderIssueRequest request, String principalEmail);

    List<OrderIssueResponse> getIssuesForOrder(String orderId, String principalEmail);

    PaginatedResponse<OrderIssueResponse> listAllIssues(OrderIssueStatus status, int page, int size, String adminEmail);

    OrderIssueResponse resolveIssue(String issueId, ResolveOrderIssueRequest request, String adminEmail);
}
