package com.fooddelivery.orders.repository;

import com.fooddelivery.orders.entity.OrderIssue;
import com.fooddelivery.orders.entity.OrderIssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderIssueRepository extends MongoRepository<OrderIssue, String> {

    List<OrderIssue> findByOrderId(String orderId);

    Page<OrderIssue> findByStatus(OrderIssueStatus status, Pageable pageable);

    Page<OrderIssue> findByRestaurantId(String restaurantId, Pageable pageable);

    Page<OrderIssue> findByReportedByUserId(String userId, Pageable pageable);
}
