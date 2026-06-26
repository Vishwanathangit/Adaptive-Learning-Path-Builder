package com.vishwathedev.Adaptive.Learning.Path.Builder.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Entity
@Table(name = "components")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Component {
    @Id
    @Column(length = 100)
    private String id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 280)
    private String shortDescription;

    @Column(nullable = false, length = 50)
    private String type; // unit or assessment

    @Column(nullable = false)
    private Integer approximateDurationMinutes;

    @Column(columnDefinition = "TEXT")
    @Convert(converter = MapJsonConverter.class)
    private Map<String, Object> metadata;
}
