package com.vishwathedev.Adaptive.Learning.Path.Builder.controller;

import com.vishwathedev.Adaptive.Learning.Path.Builder.model.EvaluateRequest;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.EvaluateResponse;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.LearningPath;
import com.vishwathedev.Adaptive.Learning.Path.Builder.service.LearningPathService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/learning-paths")
public class LearningPathController {

    @Autowired
    private LearningPathService learningPathService;

    @GetMapping
    public ResponseEntity<List<LearningPath>> getAllLearningPaths() {
        return ResponseEntity.ok(learningPathService.getAllLearningPaths());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LearningPath> getLearningPath(@PathVariable String id) {
        return learningPathService.getLearningPath(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LearningPath> saveLearningPath(@RequestBody LearningPath learningPath) {
        if (learningPath.getId() == null || learningPath.getId().trim().isEmpty()) {
            learningPath.setId("lp-" + UUID.randomUUID().toString().substring(0, 8));
        }
        LearningPath saved = learningPathService.saveLearningPath(learningPath);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLearningPath(@PathVariable String id) {
        if (learningPathService.getLearningPath(id).isPresent()) {
            learningPathService.deleteLearningPath(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<EvaluateResponse> evaluateNextNode(
            @PathVariable String id,
            @RequestBody EvaluateRequest request) {
        try {
            String nextNodeId = learningPathService.evaluateNextNode(id, request);
            return ResponseEntity.ok(new EvaluateResponse(nextNodeId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
