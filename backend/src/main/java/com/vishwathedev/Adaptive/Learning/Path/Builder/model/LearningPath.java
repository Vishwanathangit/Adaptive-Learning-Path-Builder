package com.vishwathedev.Adaptive.Learning.Path.Builder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "learning_paths")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LearningPath {
    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 50)
    private String status; // draft or published

    private Integer version;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = MapJsonConverter.class)
    private Map<String, Object> canvas;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = ListJsonConverter.class)
    private List<Map<String, Object>> nodes;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = ListJsonConverter.class)
    private List<Map<String, Object>> edges;
}
