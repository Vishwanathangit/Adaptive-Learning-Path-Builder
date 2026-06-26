package com.vishwathedev.Adaptive.Learning.Path.Builder.repository;

import com.vishwathedev.Adaptive.Learning.Path.Builder.model.LearningPath;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LearningPathRepository extends JpaRepository<LearningPath, String> {
}
