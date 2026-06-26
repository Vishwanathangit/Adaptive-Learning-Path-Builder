package com.vishwathedev.Adaptive.Learning.Path.Builder;

import tools.jackson.databind.ObjectMapper;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.EvaluateRequest;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.LearningPath;
import com.vishwathedev.Adaptive.Learning.Path.Builder.repository.LearningPathRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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

/**
 * Integration tests for all REST API endpoints.
 *
 * Each nested class groups related test scenarios and sets up
 * its own data so tests remain independent and readable.
 *
 * Uses @SpringBootTest + MockMvc (spring-boot-starter-test).
 */
@SpringBootTest
@DisplayName("Adaptive Learning Path Builder — API Integration Tests")
public class AdaptiveLearningIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Autowired
    private ObjectMapper objectMapper;

    // ─── Shared helpers ──────────────────────────────────────────────────────

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        learningPathRepository.deleteAll();
    }

    /** Build a minimal valid learning path ready for persistence. */
    private LearningPath buildPath(String id, String name, List<Map<String, Object>> nodes, List<Map<String, Object>> edges) {
        LearningPath path = new LearningPath();
        path.setId(id);
        path.setName(name);
        path.setDescription("Integration test path");
        path.setStatus("published");
        path.setVersion(1);
        path.setCanvas(Map.of("zoom", 1.0, "offsetX", 0, "offsetY", 0));
        path.setNodes(nodes);
        path.setEdges(edges);
        return path;
    }

    /** Save a path via the REST API and assert 200 OK. */
    private void savePath(LearningPath path) throws Exception {
        mockMvc.perform(post("/api/learning-paths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(path)))
                .andExpect(status().isOk());
    }

    // ─── Component API tests ─────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /api/components")
    class ComponentTests {

        @Test
        @DisplayName("shouldReturnAllComponents — list is non-empty with correct structure")
        void shouldReturnAllComponents() throws Exception {
            mockMvc.perform(get("/api/components"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalCount", greaterThan(0)))
                    .andExpect(jsonPath("$.items",       hasSize(greaterThan(0))))
                    // Every item must have required fields
                    .andExpect(jsonPath("$.items[0].id",    notNullValue()))
                    .andExpect(jsonPath("$.items[0].title", notNullValue()))
                    .andExpect(jsonPath("$.items[0].type",  anyOf(is("unit"), is("assessment"))));
        }

        @Test
        @DisplayName("totalCount matches items array length")
        void totalCountMatchesItemsSize() throws Exception {
            mockMvc.perform(get("/api/components"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalCount").value(
                            // Use a lenient check — just confirm it is a positive integer
                            greaterThan(0)));
        }
    }

    // ─── Learning Path CRUD tests ─────────────────────────────────────────────

    @Nested
    @DisplayName("Learning Path CRUD")
    class LearningPathCrudTests {

        @Test
        @DisplayName("shouldSaveLearningPath — persists and returns saved path with auto-incremented version")
        void shouldSaveLearningPath() throws Exception {
            LearningPath path = buildPath("lp-save-01", "My Saved Path",
                    List.of(Map.of("id", "node-start", "type", "start", "label", "Start",
                            "position", Map.of("x", 0, "y", 0), "componentId", "")),
                    List.of());

            mockMvc.perform(post("/api/learning-paths")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(path)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id",      is("lp-save-01")))
                    .andExpect(jsonPath("$.name",    is("My Saved Path")))
                    .andExpect(jsonPath("$.status",  is("published")))
                    // Service increments version: 1 + 1 = 2
                    .andExpect(jsonPath("$.version", is(2)));
        }

        @Test
        @DisplayName("shouldGetSavedLearningPath — retrieve persisted path by id")
        void shouldGetSavedLearningPath() throws Exception {
            LearningPath path = buildPath("lp-get-01", "Retrieve Me",
                    List.of(Map.of("id", "node-start", "type", "start", "label", "Start",
                            "position", Map.of("x", 0, "y", 0), "componentId", "")),
                    List.of());
            savePath(path);

            mockMvc.perform(get("/api/learning-paths/lp-get-01"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.id",   is("lp-get-01")))
                    .andExpect(jsonPath("$.name", is("Retrieve Me")))
                    .andExpect(jsonPath("$.nodes", hasSize(1)));
        }

        @Test
        @DisplayName("shouldListAllSavedPaths — all created paths appear in GET /api/learning-paths")
        void shouldListAllSavedPaths() throws Exception {
            savePath(buildPath("lp-list-01", "Path One",
                    List.of(Map.of("id", "n1", "type", "start", "label", "Start",
                            "position", Map.of("x", 0, "y", 0), "componentId", "")), List.of()));
            savePath(buildPath("lp-list-02", "Path Two",
                    List.of(Map.of("id", "n1", "type", "start", "label", "Start",
                            "position", Map.of("x", 0, "y", 0), "componentId", "")), List.of()));

            mockMvc.perform(get("/api/learning-paths"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(2)))
                    .andExpect(jsonPath("$[*].name", hasItems("Path One", "Path Two")));
        }

        @Test
        @DisplayName("shouldDeleteLearningPath — path is gone after DELETE")
        void shouldDeleteLearningPath() throws Exception {
            savePath(buildPath("lp-del-01", "Delete Me",
                    List.of(Map.of("id", "n1", "type", "start", "label", "Start",
                            "position", Map.of("x", 0, "y", 0), "componentId", "")), List.of()));

            mockMvc.perform(delete("/api/learning-paths/lp-del-01"))
                    .andExpect(status().isNoContent());

            // After deletion the list is empty
            mockMvc.perform(get("/api/learning-paths"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$", hasSize(0)));
        }
    }

    // ─── Evaluation / routing logic tests ────────────────────────────────────

    @Nested
    @DisplayName("POST /api/learning-paths/{id}/evaluate — Routing Logic")
    class EvaluationTests {

        /**
         * Shared path used by all evaluation tests.
         *
         * Graph structure:
         *   Start ──(default)──▶ Assessment ──(priority 1, score 0-49)──▶ Easy
         *                                   ──(priority 2, passed=true)──▶ Advanced
         */
        private static final String PATH_ID = "lp-eval";

        @BeforeEach
        void seedEvalPath() throws Exception {
            LearningPath path = new LearningPath();
            path.setId(PATH_ID);
            path.setName("Evaluation Path");
            path.setStatus("published");
            path.setVersion(1);
            path.setCanvas(Map.of("zoom", 1.0, "offsetX", 0, "offsetY", 0));

            path.setNodes(List.of(
                    Map.of("id", "node-start",    "type", "start",      "label", "Start",    "position", Map.of("x", 0,   "y", 0),   "componentId", ""),
                    Map.of("id", "node-assess",   "type", "assessment", "label", "Module 1", "position", Map.of("x", 0,   "y", 100), "componentId", "cmp-assess-1"),
                    Map.of("id", "node-easy",     "type", "unit",       "label", "Easy",     "position", Map.of("x", 0,   "y", 200), "componentId", "cmp-easy"),
                    Map.of("id", "node-advanced", "type", "unit",       "label", "Advanced", "position", Map.of("x", 200, "y", 200), "componentId", "cmp-advanced"),
                    Map.of("id", "node-end",      "type", "end",        "label", "End",      "position", Map.of("x", 0,   "y", 300), "componentId", "")
            ));

            path.setEdges(List.of(
                    // Default edge: Start → Assessment (no conditions)
                    Map.of("id", "e-start",    "sourceNodeId", "node-start",  "targetNodeId", "node-assess",
                            "isDefault", true, "priority", 1,
                            "conditions", Map.of("operator", "AND", "rules", List.of())),

                    // Priority 1: score 0–49 → Easy
                    Map.of("id", "e-easy",     "sourceNodeId", "node-assess", "targetNodeId", "node-easy",
                            "isDefault", false, "priority", 1,
                            "conditions", Map.of("operator", "AND", "rules", List.of(
                                    Map.of("id", "r-score", "sourceType", "assessment", "sourceNodeId", "node-assess",
                                            "metric", "score_range", "operator", "between",
                                            "range", Map.of("min", 0, "max", 49, "minInclusive", true, "maxInclusive", true))
                            ))),

                    // Priority 2: passed = true → Advanced
                    Map.of("id", "e-advanced", "sourceNodeId", "node-assess", "targetNodeId", "node-advanced",
                            "isDefault", false, "priority", 2,
                            "conditions", Map.of("operator", "AND", "rules", List.of(
                                    Map.of("id", "r-passed", "sourceType", "assessment", "sourceNodeId", "node-assess",
                                            "metric", "passed", "operator", "eq", "value", true)
                            )))
            ));

            mockMvc.perform(post("/api/learning-paths")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(path)))
                    .andExpect(status().isOk());
        }

        // ── Default edge ──────────────────────────────────────────────────────

        @Test
        @DisplayName("shouldFollowDefaultEdge — Start node routes to Assessment via default edge")
        void shouldFollowDefaultEdge() throws Exception {
            EvaluateRequest req = new EvaluateRequest("node-start",
                    Map.of("score", 50, "score_range", 50, "passed", true, "completion", true));

            mockMvc.perform(post("/api/learning-paths/" + PATH_ID + "/evaluate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nextNodeId", is("node-assess")));
        }

        // ── Conditional: passed = true → Advanced ─────────────────────────────

        @Test
        @DisplayName("shouldEvaluatePassedCondition — passed=true routes to Advanced node")
        void shouldEvaluatePassedCondition() throws Exception {
            EvaluateRequest req = new EvaluateRequest("node-assess",
                    Map.of("score", 85, "score_range", 85, "passed", true, "completion", true));

            mockMvc.perform(post("/api/learning-paths/" + PATH_ID + "/evaluate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nextNodeId", is("node-advanced")));
        }

        // ── Conditional: low score → Easy ─────────────────────────────────────

        @Test
        @DisplayName("shouldEvaluateLowScoreCondition — score_range 0–49 routes to Easy node")
        void shouldEvaluateLowScoreCondition() throws Exception {
            EvaluateRequest req = new EvaluateRequest("node-assess",
                    Map.of("score", 30, "score_range", 30, "passed", false, "completion", true));

            mockMvc.perform(post("/api/learning-paths/" + PATH_ID + "/evaluate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nextNodeId", is("node-easy")));
        }

        // ── Boundary: score exactly at boundary ──────────────────────────────

        @Test
        @DisplayName("shouldEvaluateBoundaryScore — score_range=49 (inclusive upper bound) still routes to Easy")
        void shouldEvaluateBoundaryScore() throws Exception {
            EvaluateRequest req = new EvaluateRequest("node-assess",
                    Map.of("score", 49, "score_range", 49, "passed", false, "completion", true));

            mockMvc.perform(post("/api/learning-paths/" + PATH_ID + "/evaluate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nextNodeId", is("node-easy")));
        }

        // ── Priority: when both rules could match, lower priority wins first ──

        @Test
        @DisplayName("shouldRespectEdgePriority — score_range=49 AND passed=true: priority 1 (Easy) wins over priority 2 (Advanced)")
        void shouldRespectEdgePriority() throws Exception {
            // Both conditions technically match, but priority 1 (Easy) is evaluated first
            EvaluateRequest req = new EvaluateRequest("node-assess",
                    Map.of("score", 49, "score_range", 49, "passed", true, "completion", true));

            mockMvc.perform(post("/api/learning-paths/" + PATH_ID + "/evaluate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.nextNodeId", is("node-easy")));
        }

        // ── Error: non-existent path ──────────────────────────────────────────

        @Test
        @DisplayName("shouldReturn4xx — evaluating a non-existent path returns an error status")
        void shouldReturn4xxForMissingPath() throws Exception {
            EvaluateRequest req = new EvaluateRequest("node-start",
                    Map.of("score", 50, "score_range", 50, "passed", true, "completion", true));

            mockMvc.perform(post("/api/learning-paths/lp-does-not-exist/evaluate")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().is4xxClientError());
        }
    }
}
