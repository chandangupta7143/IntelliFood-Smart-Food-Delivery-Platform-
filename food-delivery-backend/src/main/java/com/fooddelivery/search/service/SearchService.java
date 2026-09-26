package com.fooddelivery.search.service;

import com.fooddelivery.common.response.PaginatedResponse;
import com.fooddelivery.restaurants.entity.Restaurant;
import com.fooddelivery.search.dto.AdvancedSearchRequest;
import com.fooddelivery.search.dto.AdvancedSearchResponse;
import com.fooddelivery.search.enums.SearchMode;
import com.fooddelivery.search.mapper.SearchMapper;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.NearQuery;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private final MongoTemplate mongoTemplate;
    private final SearchMapper searchMapper;

    public SearchService(MongoTemplate mongoTemplate, SearchMapper searchMapper) {
        this.mongoTemplate = mongoTemplate;
        this.searchMapper = searchMapper;
    }

    public PaginatedResponse<AdvancedSearchResponse> search(AdvancedSearchRequest request) {
        if (request.getSearchMode() == SearchMode.TEXT_SEARCH && !StringUtils.hasText(request.getQuery())) {
            throw new IllegalArgumentException("Query must be provided and cannot be blank when SearchMode is TEXT_SEARCH.");
        }

        // Attempt Atlas Search for TEXT_SEARCH mode; fall back to regex-based search on local MongoDB
        if (request.getSearchMode() == SearchMode.TEXT_SEARCH) {
            try {
                return executeWithAtlasSearch(request);
            } catch (Exception e) {
                // Atlas $search not supported on local MongoDB (error code 31082: SearchNotEnabled)
                // Fall back to regex-based query search
                if (e.getMessage() != null && (e.getMessage().contains("SearchNotEnabled") || e.getMessage().contains("31082") || e.getMessage().contains("$search"))) {
                    return executeWithRegexFallback(request);
                }
                throw e;
            }
        }

        return executeWithGeoNear(request);
    }

    private PaginatedResponse<AdvancedSearchResponse> executeWithAtlasSearch(AdvancedSearchRequest request) {
        List<AggregationOperation> operations = new ArrayList<>();
        operations.add(buildAtlasSearchStage(request.getQuery()));
        operations.add(Aggregation.match(buildMatchCriteria(request)));
        Sort sort = buildSortingCascade(request);
        if (sort.isSorted()) operations.add(Aggregation.sort(sort));
        operations.add(Aggregation.skip((long) request.getPage() * request.getSize()));
        operations.add(Aggregation.limit(request.getSize()));
        Aggregation aggregation = Aggregation.newAggregation(operations);
        AggregationResults<Restaurant> results = mongoTemplate.aggregate(aggregation, "restaurants", Restaurant.class);
        List<AdvancedSearchResponse> content = results.getMappedResults().stream()
                .map(searchMapper::toResponse).collect(Collectors.toList());
        return new PaginatedResponse<>(content, request.getPage(), request.getSize(), content.size(), 1);
    }

    private PaginatedResponse<AdvancedSearchResponse> executeWithRegexFallback(AdvancedSearchRequest request) {
        // Regex fallback: match by name or cuisines (case-insensitive)
        org.bson.types.ObjectId[] ignored = {};
        org.springframework.data.mongodb.core.query.Query query =
                new org.springframework.data.mongodb.core.query.Query();
        Criteria baseCriteria = Criteria.where("isActive").is(true)
                .and("isVerified").is(true)
                .and("isDeleted").is(false);
        if (StringUtils.hasText(request.getQuery())) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile(
                    java.util.regex.Pattern.quote(request.getQuery().trim()), java.util.regex.Pattern.CASE_INSENSITIVE);
            baseCriteria.andOperator(
                new Criteria().orOperator(
                    Criteria.where("name").regex(pattern),
                    Criteria.where("cuisines").regex(pattern)
                )
            );
        }
        // Apply additional facet filters
        if (request.getMinRating() != null) baseCriteria.and("averageRating").gte(request.getMinRating());
        if (request.getMaxDeliveryTime() != null) baseCriteria.and("averageDeliveryTimeMinutes").lte(request.getMaxDeliveryTime());
        if (request.getPriceRanges() != null && !request.getPriceRanges().isEmpty()) baseCriteria.and("priceRange").in(request.getPriceRanges());
        if (request.getIsVegetarian() != null && request.getIsVegetarian()) baseCriteria.and("isVegetarian").is(true);
        if (request.getCuisines() != null && !request.getCuisines().isEmpty()) baseCriteria.and("cuisines").in(request.getCuisines().stream().map(String::toLowerCase).collect(Collectors.toList()));

        // Geo filter: find within radius
        query.addCriteria(baseCriteria.and("location").nearSphere(
                new Point(request.getLongitude(), request.getLatitude())).maxDistance(request.getRadiusInKm() * 1000.0));
        query.with(Sort.by(Sort.Direction.DESC, "popularityScore"));
        query.skip((long) request.getPage() * request.getSize());
        query.limit(request.getSize());

        List<Restaurant> restaurants = mongoTemplate.find(query, Restaurant.class);
        List<AdvancedSearchResponse> content = restaurants.stream().map(searchMapper::toResponse).collect(Collectors.toList());
        return new PaginatedResponse<>(content, request.getPage(), request.getSize(), content.size(), 1);
    }

    private PaginatedResponse<AdvancedSearchResponse> executeWithGeoNear(AdvancedSearchRequest request) {
        List<AggregationOperation> operations = new ArrayList<>();
        operations.add(buildGeoNearStage(request));
        operations.add(Aggregation.match(buildMatchCriteria(request)));
        Sort sort = buildSortingCascade(request);
        if (sort.isSorted()) operations.add(Aggregation.sort(sort));
        operations.add(Aggregation.skip((long) request.getPage() * request.getSize()));
        operations.add(Aggregation.limit(request.getSize()));
        Aggregation aggregation = Aggregation.newAggregation(operations);
        AggregationResults<Restaurant> results = mongoTemplate.aggregate(aggregation, "restaurants", Restaurant.class);
        List<AdvancedSearchResponse> content = results.getMappedResults().stream()
                .map(searchMapper::toResponse).collect(Collectors.toList());
        return new PaginatedResponse<>(content, request.getPage(), request.getSize(), content.size(), 1);
    }

    private AggregationOperation buildAtlasSearchStage(String query) {
        Document fuzzy = new Document("maxEdits", 1).append("prefixLength", 2);
        Document text = new Document("query", query)
                .append("path", List.of("name", "cuisines"))
                .append("fuzzy", fuzzy);
        Document search = new Document("index", "default").append("text", text);
        
        return context -> new Document("$search", search);
    }

    private GeoNearOperation buildGeoNearStage(AdvancedSearchRequest request) {
        NearQuery nearQuery = NearQuery.near(new Point(request.getLongitude(), request.getLatitude()))
                .spherical(true)
                .distanceMultiplier(1.0 / 1000.0) // Convert meters to km
                .maxDistance(request.getRadiusInKm() * 1000.0);
        return Aggregation.geoNear(nearQuery, "distanceInKm");
    }

    private Criteria buildMatchCriteria(AdvancedSearchRequest request) {
        // Triple Guard
        Criteria criteria = Criteria.where("isActive").is(true)
                .and("isVerified").is(true)
                .and("isDeleted").is(false);

        if (request.getCuisines() != null && !request.getCuisines().isEmpty()) {
            criteria.and("cuisines").in(request.getCuisines().stream().map(String::toLowerCase).collect(Collectors.toList()));
        }

        if (request.getMinRating() != null) {
            criteria.and("averageRating").gte(request.getMinRating());
        }

        if (request.getMaxDeliveryTime() != null) {
            criteria.and("averageDeliveryTimeMinutes").lte(request.getMaxDeliveryTime());
        }

        if (request.getPriceRanges() != null && !request.getPriceRanges().isEmpty()) {
            criteria.and("priceRange").in(request.getPriceRanges());
        }

        if (request.getIsVegetarian() != null && request.getIsVegetarian()) {
            criteria.and("isVegetarian").is(true);
        }

        if (request.getSearchMode() == SearchMode.TEXT_SEARCH) {
            criteria.and("location").nearSphere(new Point(request.getLongitude(), request.getLatitude()))
                    .maxDistance(request.getRadiusInKm() * 1000.0);
        }

        return criteria;
    }

    private Sort buildSortingCascade(AdvancedSearchRequest request) {
        String sortBy = request.getSortBy() != null ? request.getSortBy().toUpperCase() : "";

        return switch (sortBy) {
            case "RATING" -> Sort.by(Sort.Direction.DESC, "averageRating")
                                 .and(Sort.by(Sort.Direction.DESC, "totalRatings"))
                                 .and(Sort.by(Sort.Direction.ASC, "_id"));
            case "POPULARITY" -> Sort.by(Sort.Direction.DESC, "popularityScore")
                                     .and(Sort.by(Sort.Direction.DESC, "totalOrders"))
                                     .and(Sort.by(Sort.Direction.ASC, "_id"));
            case "DELIVERY_TIME" -> Sort.by(Sort.Direction.ASC, "averageDeliveryTimeMinutes")
                                        .and(Sort.by(Sort.Direction.DESC, "popularityScore"))
                                        .and(Sort.by(Sort.Direction.ASC, "_id"));
            case "DISTANCE" -> {
                // $geoNear automatically sorts by distance, so we just add tie-breakers
                if (request.getSearchMode() == SearchMode.DISCOVERY) {
                    yield Sort.by(Sort.Direction.DESC, "popularityScore")
                              .and(Sort.by(Sort.Direction.ASC, "_id"));
                } else {
                    yield Sort.unsorted();
                }
            }
            default -> {
                // RELEVANCE (Text Search default) or purely DISCOVERY default
                if (request.getSearchMode() == SearchMode.TEXT_SEARCH) {
                    yield Sort.by(Sort.Direction.DESC, "popularityScore")
                              .and(Sort.by(Sort.Direction.ASC, "_id"));
                } else {
                    // Default discovery: Popularity -> _id (since distance is handled by $geoNear)
                    yield Sort.by(Sort.Direction.DESC, "popularityScore")
                              .and(Sort.by(Sort.Direction.ASC, "_id"));
                }
            }
        };
    }
}
