package com.vishwathedev.Adaptive.Learning.Path.Builder.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluateRequest {
    private String currentNodeId;
    private Map<String, Object> metrics;
}
