package com.jcrpo.fieldcontrol.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String home() {
        // forward к static/index.html
        return "forward:/index.html";
    }
}
