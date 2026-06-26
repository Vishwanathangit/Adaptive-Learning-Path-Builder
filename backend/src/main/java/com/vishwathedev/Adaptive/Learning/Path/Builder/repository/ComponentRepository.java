package com.vishwathedev.Adaptive.Learning.Path.Builder.repository;

import com.vishwathedev.Adaptive.Learning.Path.Builder.model.Component;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComponentRepository extends JpaRepository<Component, String> {
}
