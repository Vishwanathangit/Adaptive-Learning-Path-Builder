package com.vishwathedev.Adaptive.Learning.Path.Builder.service;

import com.vishwathedev.Adaptive.Learning.Path.Builder.model.EvaluateRequest;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.LearningPath;
import com.vishwathedev.Adaptive.Learning.Path.Builder.repository.LearningPathRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LearningPathService {

    @Autowired
    private LearningPathRepository learningPathRepository;

    public List<LearningPath> getAllLearningPaths() {
        return learningPathRepository.findAll();
    }

    public Optional<LearningPath> getLearningPath(String id) {
        return learningPathRepository.findById(id);
    }

    public LearningPath saveLearningPath(LearningPath learningPath) {
        // If version is null, initialize to 1, else increment
        if (learningPath.getVersion() == null) {
            learningPath.setVersion(1);
        } else {
            learningPath.setVersion(learningPath.getVersion() + 1);
        }
        return learningPathRepository.save(learningPath);
    }

    public void deleteLearningPath(String id) {
        learningPathRepository.deleteById(id);
    }

    public String evaluateNextNode(String pathId, EvaluateRequest request) {
        LearningPath path = learningPathRepository.findById(pathId).orElse(null);
        if (path == null) {
            throw new IllegalArgumentException("Learning path not found: " + pathId);
        }
        String current = request.getCurrentNodeId();
        Map<String, Object> metrics = request.getMetrics();
        if (current == null || metrics == null) {
            throw new IllegalArgumentException("Current node ID and metrics are required");
        }

        List<Map<String, Object>> edges = path.getEdges();
        if (edges == null || edges.isEmpty()) {
            return null;
        }

        // Filter edges originating from the current node
        List<Map<String, Object>> outgoingEdges = new java.util.ArrayList<>();
        for (Map<String, Object> edge : edges) {
            if (current.equals(edge.get("sourceNodeId"))) {
                outgoingEdges.add(edge);
            }
        }

        if (outgoingEdges.isEmpty()) {
            return null;
        }

        // Sort edges: non-default first, then by priority. Default edges evaluated last.
        outgoingEdges.sort((e1, e2) -> {
            boolean def1 = e1.get("isDefault") != null && getBooleanValue(e1.get("isDefault"));
            boolean def2 = e2.get("isDefault") != null && getBooleanValue(e2.get("isDefault"));
            if (def1 != def2) {
                return def1 ? 1 : -1; // e2 first if e1 is default, e1 first if e2 is default
            }
            int p1 = e1.get("priority") != null ? ((Number) e1.get("priority")).intValue() : 1;
            int p2 = e2.get("priority") != null ? ((Number) e2.get("priority")).intValue() : 1;
            return Integer.compare(p1, p2);
        });

        String defaultTargetNodeId = null;

        for (Map<String, Object> edge : outgoingEdges) {
            boolean isDefault = edge.get("isDefault") != null && getBooleanValue(edge.get("isDefault"));
            String target = (String) edge.get("targetNodeId");
            if (isDefault) {
                defaultTargetNodeId = target;
                continue;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> conditions = (Map<String, Object>) edge.get("conditions");
            if (evaluateConditions(conditions, metrics)) {
                return target;
            }
        }

        return defaultTargetNodeId;
    }

    private boolean evaluateConditions(Map<String, Object> conditions, Map<String, Object> metrics) {
        if (conditions == null) {
            return true; // No conditions means always true
        }
        String op = (String) conditions.get("operator");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rules = (List<Map<String, Object>>) conditions.get("rules");
        if (rules == null || rules.isEmpty()) {
            return true; // No rules means always true
        }

        boolean isAnd = !"OR".equalsIgnoreCase(op);
        for (Map<String, Object> rule : rules) {
            boolean ruleResult = evaluateRule(rule, metrics);
            if (isAnd && !ruleResult) {
                return false; // For AND, any false rule fails the whole condition
            }
            if (!isAnd && ruleResult) {
                return true; // For OR, any true rule satisfies the whole condition
            }
        }
        return isAnd; // If AND, all passed so true. If OR, none passed so false.
    }

    private boolean evaluateRule(Map<String, Object> rule, Map<String, Object> metrics) {
        if (rule == null || metrics == null) {
            return false;
        }
        String metric = (String) rule.get("metric");
        if (metric == null) {
            return false;
        }
        Object metricValObj = metrics.get(metric);
        if (metricValObj == null) {
            return false; // Metric not found in learner context
        }

        String operator = (String) rule.get("operator");
        if (operator == null) {
            return false;
        }

        Object ruleValueObj = rule.get("value");

        if ("eq".equalsIgnoreCase(operator)) {
            if (metricValObj instanceof Boolean || ruleValueObj instanceof Boolean) {
                return getBooleanValue(metricValObj).equals(getBooleanValue(ruleValueObj));
            }
            if (metricValObj instanceof Number || ruleValueObj instanceof Number) {
                Double val1 = getNumericValue(metricValObj);
                Double val2 = getNumericValue(ruleValueObj);
                if (val1 == null || val2 == null) return false;
                return Math.abs(val1 - val2) < 0.00001;
            }
            return metricValObj.toString().equals(ruleValueObj != null ? ruleValueObj.toString() : "");
        } else if ("ne".equalsIgnoreCase(operator)) {
            if (metricValObj instanceof Boolean || ruleValueObj instanceof Boolean) {
                return !getBooleanValue(metricValObj).equals(getBooleanValue(ruleValueObj));
            }
            if (metricValObj instanceof Number || ruleValueObj instanceof Number) {
                Double val1 = getNumericValue(metricValObj);
                Double val2 = getNumericValue(ruleValueObj);
                if (val1 == null || val2 == null) return true;
                return Math.abs(val1 - val2) >= 0.00001;
            }
            return !metricValObj.toString().equals(ruleValueObj != null ? ruleValueObj.toString() : "");
        } else if ("gt".equalsIgnoreCase(operator)) {
            Double val1 = getNumericValue(metricValObj);
            Double val2 = getNumericValue(ruleValueObj);
            if (val1 == null || val2 == null) return false;
            return val1 > val2;
        } else if ("gte".equalsIgnoreCase(operator)) {
            Double val1 = getNumericValue(metricValObj);
            Double val2 = getNumericValue(ruleValueObj);
            if (val1 == null || val2 == null) return false;
            return val1 >= val2;
        } else if ("lt".equalsIgnoreCase(operator)) {
            Double val1 = getNumericValue(metricValObj);
            Double val2 = getNumericValue(ruleValueObj);
            if (val1 == null || val2 == null) return false;
            return val1 < val2;
        } else if ("lte".equalsIgnoreCase(operator)) {
            Double val1 = getNumericValue(metricValObj);
            Double val2 = getNumericValue(ruleValueObj);
            if (val1 == null || val2 == null) return false;
            return val1 <= val2;
        } else if ("between".equalsIgnoreCase(operator)) {
            @SuppressWarnings("unchecked")
            Map<String, Object> range = (Map<String, Object>) rule.get("range");
            if (range == null) return false;
            Double val = getNumericValue(metricValObj);
            Double min = getNumericValue(range.get("min"));
            Double max = getNumericValue(range.get("max"));
            if (val == null || min == null || max == null) return false;

            Boolean minInc = range.get("minInclusive") != null ? getBooleanValue(range.get("minInclusive")) : true;
            Boolean maxInc = range.get("maxInclusive") != null ? getBooleanValue(range.get("maxInclusive")) : true;

            boolean satisfiesMin = minInc ? (val >= min) : (val > min);
            boolean satisfiesMax = maxInc ? (val <= max) : (val < max);
            return satisfiesMin && satisfiesMax;
        }

        return false;
    }

    private Double getNumericValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) {
            return ((Number) obj).doubleValue();
        }
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean getBooleanValue(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Boolean) {
            return (Boolean) obj;
        }
        return Boolean.parseBoolean(obj.toString());
    }
}
