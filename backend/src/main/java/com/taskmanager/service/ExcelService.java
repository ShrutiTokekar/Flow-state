package com.taskmanager.service;

import com.taskmanager.model.Task;
import com.taskmanager.model.User;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
public class ExcelService {

    private static final Logger log = LoggerFactory.getLogger(ExcelService.class);

    private final TaskService taskService;

    public ExcelService(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Export tasks to Excel
     */
    public byte[] exportTasksToExcel(List<Task> tasks) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Tasks");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Title", "Description", "Status", "Priority", "Due Date", "Created At"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Task task : tasks) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(task.getId());
                row.createCell(1).setCellValue(task.getTitle());
                row.createCell(2).setCellValue(task.getDescription() != null ? task.getDescription() : "");
                row.createCell(3).setCellValue(task.getStatus() != null ? task.getStatus() : "");
                row.createCell(4).setCellValue(task.getPriority() != null ? task.getPriority() : "");

                if (task.getDueDate() != null) {
                    Cell dueDateCell = row.createCell(5);
                    dueDateCell.setCellValue(Date.from(task.getDueDate().atZone(ZoneId.systemDefault()).toInstant()));
                    CellStyle dateStyle = workbook.createCellStyle();
                    dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd hh:mm"));
                    dueDateCell.setCellStyle(dateStyle);
                } else {
                    row.createCell(5).setCellValue("");
                }

                if (task.getCreatedAt() != null) {
                    Cell createdAtCell = row.createCell(6);
                    createdAtCell.setCellValue(Date.from(task.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant()));
                    CellStyle dateStyle = workbook.createCellStyle();
                    dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd hh:mm"));
                    createdAtCell.setCellStyle(dateStyle);
                } else {
                    row.createCell(6).setCellValue("");
                }
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Import tasks from Excel
     */
    public List<Task> importTasksFromExcel(MultipartFile file, User user) throws IOException {
        List<Task> importedTasks = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    Task task = new Task();
                    task.setUser(user);

                    Cell titleCell = row.getCell(1);
                    if (titleCell == null || titleCell.getStringCellValue().trim().isEmpty()) {
                        log.warn("Skipping row {} - missing title", i);
                        continue;
                    }
                    task.setTitle(titleCell.getStringCellValue());

                    Cell descCell = row.getCell(2);
                    if (descCell != null) task.setDescription(descCell.getStringCellValue());

                    Cell statusCell = row.getCell(3);
                    if (statusCell != null) {
                        try { task.setStatus(statusCell.getStringCellValue().toUpperCase()); }
                        catch (Exception e) { task.setStatus("TODO"); }
                    } else {
                        task.setStatus("TODO");
                    }

                    Cell priorityCell = row.getCell(4);
                    if (priorityCell != null) {
                        try { task.setPriority(priorityCell.getStringCellValue().toUpperCase()); }
                        catch (Exception e) { task.setPriority("MEDIUM"); }
                    } else {
                        task.setPriority("MEDIUM");
                    }

                    Cell dueDateCell = row.getCell(5);
                    if (dueDateCell != null && dueDateCell.getCellType() == CellType.NUMERIC
                            && DateUtil.isCellDateFormatted(dueDateCell)) {
                        task.setDueDate(LocalDateTime.ofInstant(
                                dueDateCell.getDateCellValue().toInstant(), ZoneId.systemDefault()));
                    }

                    com.taskmanager.dto.TaskDTO taskDTO = new com.taskmanager.dto.TaskDTO();
                    taskDTO.setTitle(task.getTitle());
                    taskDTO.setDescription(task.getDescription());
                    taskDTO.setStatus(task.getStatus());
                    taskDTO.setPriority(task.getPriority());
                    if (task.getDueDate() != null) taskDTO.setDueDate(task.getDueDate().toString());

                    taskService.createTask(user.getEmail(), taskDTO);
                    importedTasks.add(task);

                } catch (Exception e) {
                    log.error("Error importing row {}: {}", i, e.getMessage(), e);
                }
            }
        }

        log.info("Imported {} tasks from Excel", importedTasks.size());
        return importedTasks;
    }

    /**
     * Export calendar events to Excel
     */
    public byte[] exportCalendarEventsToExcel(List<com.taskmanager.model.CalendarEvent> events) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Calendar Events");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row headerRow = sheet.createRow(0);
            // Removed "Synced to Google" column since Google sync is no longer used
            String[] headers = {"Title", "Description", "Start Time", "End Time", "Type"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd hh:mm"));

            for (com.taskmanager.model.CalendarEvent event : events) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(event.getTitle());
                row.createCell(1).setCellValue(event.getDescription() != null ? event.getDescription() : "");

                if (event.getStartTime() != null) {
                    Cell startCell = row.createCell(2);
                    startCell.setCellValue(Date.from(event.getStartTime().atZone(ZoneId.systemDefault()).toInstant()));
                    startCell.setCellStyle(dateStyle);
                }

                if (event.getEndTime() != null) {
                    Cell endCell = row.createCell(3);
                    endCell.setCellValue(Date.from(event.getEndTime().atZone(ZoneId.systemDefault()).toInstant()));
                    endCell.setCellStyle(dateStyle);
                }

                row.createCell(4).setCellValue(event.getType() != null ? event.getType() : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}