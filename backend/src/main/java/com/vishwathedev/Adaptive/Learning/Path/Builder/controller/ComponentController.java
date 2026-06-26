package com.vishwathedev.Adaptive.Learning.Path.Builder.controller;

import com.vishwathedev.Adaptive.Learning.Path.Builder.model.Component;
import com.vishwathedev.Adaptive.Learning.Path.Builder.repository.ComponentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/components")
public class ComponentController {

    @Autowired
    private ComponentRepository componentRepository;

    @GetMapping
    public Map<String, Object> getComponents() {
        List<Component> items = componentRepository.findAll();
        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("totalCount", items.size());
        return response;
    }
}
