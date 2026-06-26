package com.vishwathedev.Adaptive.Learning.Path.Builder.db;

import com.vishwathedev.Adaptive.Learning.Path.Builder.model.Component;
import com.vishwathedev.Adaptive.Learning.Path.Builder.model.LearningPath;
import com.vishwathedev.Adaptive.Learning.Path.Builder.repository.ComponentRepository;
import com.vishwathedev.Adaptive.Learning.Path.Builder.repository.LearningPathRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import java.util.List;
import java.util.Map;

@org.springframework.stereotype.Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private ComponentRepository componentRepository;

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Override
    public void run(String... args) throws Exception {
        if (componentRepository.count() == 0) {
            Component math1 = new Component(
                    "cmp-assess-math-1",
                    "Math Module 1 Assessment",
                    "Baseline math diagnostic used to route learners.",
                    "assessment",
                    35,
                    Map.of("assessment", Map.of("maxScore", 100, "passingScore", 50))
            );

            Component math2Easy = new Component(
                    "cmp-unit-math-2-easy",
                    "Math Module 2 - Easy",
                    "Foundational math remediation unit.",
                    "unit",
                    35,
                    Map.of("unit", Map.of("recommendedMinutes", 30))
            );

            Component math2Advanced = new Component(
                    "cmp-unit-math-2-advanced",
                    "Math Module 2 - Advanced",
                    "Advanced algebra, functions, and coordinate geometry.",
                    "unit",
                    35,
                    Map.of("unit", Map.of("recommendedMinutes", 30))
            );

            Component read1 = new Component(
                    "cmp-assess-reading-1",
                    "Reading & Comp Module 1",
                    "Baseline reading comprehension and syntax diagnostic.",
                    "assessment",
                    32,
                    Map.of("assessment", Map.of("maxScore", 100, "passingScore", 50))
            );

            Component read2Easy = new Component(
                    "cmp-unit-reading-2-easy",
                    "R&C Module 2 - Easy",
                    "Basic vocabulary building and text decoding remediation.",
                    "unit",
                    32,
                    Map.of("unit", Map.of("recommendedMinutes", 30))
            );

            Component read2Advanced = new Component(
                    "cmp-unit-reading-2-advanced",
                    "R&C Module 2 - Advanced",
                    "Critical analysis of complex text arguments and historical documents.",
                    "unit",
                    32,
                    Map.of("unit", Map.of("recommendedMinutes", 30))
            );

            componentRepository.saveAll(List.of(math1, math2Easy, math2Advanced, read1, read2Easy, read2Advanced));
            System.out.println("Database successfully seeded with components!");
        }

        if (learningPathRepository.count() == 0) {
            LearningPath satPath = new LearningPath();
            satPath.setId("lp-sat-adaptive-test");
            satPath.setName("SAT Adaptive Diagnostic Path");
            satPath.setDescription("Example path matching the visual layout. Routes learners dynamically to Easy/Advanced modules based on Math/Reading diagnostic scores.");
            satPath.setStatus("published");
            satPath.setVersion(1);
            satPath.setCanvas(Map.of("zoom", 1.0, "offsetX", 0, "offsetY", 0));
            
            // Nodes definition
            satPath.setNodes(List.of(
                Map.of("id", "node-start", "type", "start", "label", "Start Assessment", "position", Map.of("x", 350, "y", 40), "componentId", "system-start"),
                Map.of("id", "node-math1", "type", "unit", "label", "Math Module 1", "position", Map.of("x", 350, "y", 140), "componentId", "cmp-assess-math-1"),
                Map.of("id", "node-math2-group", "type", "assessment", "label", "Math Module 2", "position", Map.of("x", 350, "y", 260), "componentId", "system-group"),
                Map.of("id", "node-math2-easy", "type", "unit", "label", "Math Module 2 - Easy", "position", Map.of("x", 120, "y", 380), "componentId", "cmp-unit-math-2-easy"),
                Map.of("id", "node-math2-advanced", "type", "unit", "label", "Math Module 2 - Advanced", "position", Map.of("x", 580, "y", 380), "componentId", "cmp-unit-math-2-advanced"),
                Map.of("id", "node-reading1", "type", "unit", "label", "Reading & Comp Module 1", "position", Map.of("x", 350, "y", 520), "componentId", "cmp-assess-reading-1"),
                Map.of("id", "node-reading2-group", "type", "assessment", "label", "Reading & Comp Module 2", "position", Map.of("x", 350, "y", 640), "componentId", "system-group"),
                Map.of("id", "node-reading2-easy", "type", "unit", "label", "R&C Module 2 - Easy", "position", Map.of("x", 120, "y", 760), "componentId", "cmp-unit-reading-2-easy"),
                Map.of("id", "node-reading2-advanced", "type", "unit", "label", "R&C Module 2 - Advanced", "position", Map.of("x", 580, "y", 760), "componentId", "cmp-unit-reading-2-advanced"),
                Map.of("id", "node-end", "type", "end", "label", "Complete Assessment", "position", Map.of("x", 350, "y", 900), "componentId", "system-end")
            ));

            // Edges definition
            satPath.setEdges(List.of(
                Map.of(
                    "id", "edge-start-math1",
                    "sourceNodeId", "node-start",
                    "targetNodeId", "node-math1",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                    "id", "edge-math1-math2",
                    "sourceNodeId", "node-math1",
                    "targetNodeId", "node-math2-group",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                    "id", "edge-math2-easy",
                    "sourceNodeId", "node-math2-group",
                    "targetNodeId", "node-math2-easy",
                    "isDefault", false,
                    "priority", 1,
                    "conditions", Map.of(
                        "operator", "AND",
                        "rules", List.of(
                            Map.of(
                                "id", "rule-math-easy",
                                "sourceType", "assessment",
                                "sourceNodeId", "node-math1",
                                "metric", "score",
                                "operator", "lt",
                                "value", 50.0
                            )
                        )
                    )
                ),
                Map.of(
                    "id", "edge-math2-advanced",
                    "sourceNodeId", "node-math2-group",
                    "targetNodeId", "node-math2-advanced",
                    "isDefault", false,
                    "priority", 2,
                    "conditions", Map.of(
                        "operator", "AND",
                        "rules", List.of(
                            Map.of(
                                "id", "rule-math-advanced",
                                "sourceType", "assessment",
                                "sourceNodeId", "node-math1",
                                "metric", "score",
                                "operator", "gte",
                                "value", 50.0
                            )
                        )
                    )
                ),
                Map.of(
                    "id", "edge-math2easy-read1",
                    "sourceNodeId", "node-math2-easy",
                    "targetNodeId", "node-reading1",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                    "id", "edge-math2advanced-read1",
                    "sourceNodeId", "node-math2-advanced",
                    "targetNodeId", "node-reading1",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                    "id", "edge-read1-read2",
                    "sourceNodeId", "node-reading1",
                    "targetNodeId", "node-reading2-group",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                    "id", "edge-read2-easy",
                    "sourceNodeId", "node-reading2-group",
                    "targetNodeId", "node-reading2-easy",
                    "isDefault", false,
                    "priority", 1,
                    "conditions", Map.of(
                        "operator", "AND",
                        "rules", List.of(
                            Map.of(
                                "id", "rule-read-easy",
                                "sourceType", "assessment",
                                "sourceNodeId", "node-reading1",
                                "metric", "score",
                                "operator", "lt",
                                "value", 50.0
                            )
                        )
                    )
                ),
                Map.of(
                    "id", "edge-read2-advanced",
                    "sourceNodeId", "node-reading2-group",
                    "targetNodeId", "node-reading2-advanced",
                    "isDefault", false,
                    "priority", 2,
                    "conditions", Map.of(
                        "operator", "AND",
                        "rules", List.of(
                            Map.of(
                                "id", "rule-read-advanced",
                                "sourceType", "assessment",
                                "sourceNodeId", "node-reading1",
                                "metric", "score",
                                "operator", "gte",
                                "value", 50.0
                            )
                        )
                    )
                ),
                Map.of(
                    "id", "edge-read2easy-end",
                    "sourceNodeId", "node-reading2-easy",
                    "targetNodeId", "node-end",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                ),
                Map.of(
                    "id", "edge-read2advanced-end",
                    "sourceNodeId", "node-reading2-advanced",
                    "targetNodeId", "node-end",
                    "isDefault", true,
                    "conditions", Map.of("operator", "AND", "rules", List.of())
                )
            ));

            learningPathRepository.save(satPath);
            System.out.println("Database successfully seeded with SAT Adaptive Learning Path!");
        }
    }
}
