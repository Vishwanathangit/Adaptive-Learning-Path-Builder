package com.vishwathedev.Adaptive.Learning.Path.Builder;

import tools.jackson.databind.ObjectMapper;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.EvaluateRequest;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.LearningPath;
import com.vishwathedev.Adaptive.Learning.Path.Builder.repository.LearningPathRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import java.util.List;
import java.util.Map;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
public class LearningPathControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        learningPathRepository.deleteAll();
    }

    @Test
    public void testGetComponents() throws Exception {
        mockMvc.perform(get("/api/components"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount", greaterThan(0)))
                .andExpect(jsonPath("$.items", hasSize(greaterThan(0))));
    }

    @Test
    public void testSaveAndGetLearningPath() throws Exception {
        LearningPath path = new LearningPath();
        path.setId("lp-test-001");
        path.setName("Test Learning Path");
        path.setDescription("Test Description");
        path.setStatus("draft");
        path.setVersion(1);
        path.setCanvas(Map.of("zoom", 1.0, "offsetX", 0, "offsetY", 0));
        path.setNodes(List.of(
                Map.of("id", "node-start", "type", "start", "label", "Start", "position", Map.of("x", 0, "y", 0), "componentId", "system-start")
        ));
        path.setEdges(List.of());

        mockMvc.perform(post("/api/learning-paths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(path)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("lp-test-001")))
                .andExpect(jsonPath("$.name", is("Test Learning Path")));

        mockMvc.perform(get("/api/learning-paths/lp-test-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Test Learning Path")))
                .andExpect(jsonPath("$.nodes", hasSize(1)));
    }

    @Test
    public void testEvaluatePathTransitions() throws Exception {
        // Create a learning path with two branches: Easy and Advanced
        // Source node: node-math-1
        // Condition: score between 0 and 49 goes to Easy, passed = true goes to Advanced
        LearningPath path = new LearningPath();
        path.setId("lp-test-eval");
        path.setName("Evaluation Test Path");
        path.setStatus("published");
        path.setVersion(1);
        path.setCanvas(Map.of("zoom", 1.0, "offsetX", 0, "offsetY", 0));

        // Define nodes
        path.setNodes(List.of(
                Map.of("id", "node-start", "type", "start", "label", "Start", "position", Map.of("x", 0, "y", 0), "componentId", "system-start"),
                Map.of("id", "node-math-1", "type", "assessment", "label", "Math Module 1", "position", Map.of("x", 100, "y", 100), "componentId", "cmp-assess-math-1"),
                Map.of("id", "node-math-2-easy", "type", "unit", "label", "Math Module 2 - Easy", "position", Map.of("x", 200, "y", 200), "componentId", "cmp-unit-math-2-easy"),
                Map.of("id", "node-math-2-advanced", "type", "unit", "label", "Math Module 2 - Advanced", "position", Map.of("x", 300, "y", 300), "componentId", "cmp-unit-math-2-advanced")
        ));

        // Define edges
        path.setEdges(List.of(
                Map.of(
                        "id", "edge-start-math1",
                        "sourceNodeId", "node-start",
                        "targetNodeId", "node-math-1",
                        "isDefault", true,
                        "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                        "id", "edge-math1-easy",
                        "sourceNodeId", "node-math-1",
                        "targetNodeId", "node-math-2-easy",
                        "isDefault", false,
                        "priority", 1,
                        "conditions", Map.of(
                                "operator", "AND",
                                "rules", List.of(
                                        Map.of(
                                                "id", "rule-low-score",
                                                "sourceType", "assessment",
                                                "sourceNodeId", "node-math-1",
                                                "metric", "score_range",
                                                "operator", "between",
                                                "range", Map.of("min", 0, "max", 49, "minInclusive", true, "maxInclusive", true)
                                        )
                                )
                        )
                ),
                Map.of(
                        "id", "edge-math1-advanced",
                        "sourceNodeId", "node-math-1",
                        "targetNodeId", "node-math-2-advanced",
                        "isDefault", false,
                        "priority", 2,
                        "conditions", Map.of(
                                "operator", "AND",
                                "rules", List.of(
                                        Map.of(
                                                "id", "rule-high-score",
                                                "sourceType", "assessment",
                                                "sourceNodeId", "node-math-1",
                                                "metric", "passed",
                                                "operator", "eq",
                                                "value", true
                                        )
                                )
                        )
                )
        ));

        // Save path
        mockMvc.perform(post("/api/learning-paths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(path)))
                .andExpect(status().isOk());

        // Scenario 1: Score is 35 (below passing score 50) -> Routes to Easy
        EvaluateRequest requestEasy = new EvaluateRequest("node-math-1", Map.of(
                "score", 35,
                "score_range", 35,
                "passed", false,
                "completion", true
        ));

        mockMvc.perform(post("/api/learning-paths/lp-test-eval/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestEasy)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextNodeId", is("node-math-2-easy")));

        // Scenario 2: Passed is true (passed score threshold) -> Routes to Advanced
        EvaluateRequest requestAdvanced = new EvaluateRequest("node-math-1", Map.of(
                "score", 85,
                "score_range", 85,
                "passed", true,
                "completion", true
        ));

        mockMvc.perform(post("/api/learning-paths/lp-test-eval/evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestAdvanced)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextNodeId", is("node-math-2-advanced")));
    }
}
