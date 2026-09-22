package com.taskmanager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/** Return {"message": ...} for deliberate errors so the app can show the reason to the user. */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleStatus(ResponseStatusException e) {
        String message = e.getReason() != null ? e.getReason() : "Request failed";
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", message));
    }
}
