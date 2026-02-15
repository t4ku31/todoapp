package com.example.app1.service.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.app1.dto.RecurrenceRuleDto;
import com.example.app1.dto.RecurrenceRuleDto.Frequency;
import com.example.app1.dto.TaskDto;
import com.example.app1.model.Category;
import com.example.app1.model.Task;
import com.example.app1.model.TaskList;
import com.example.app1.repository.CategoryRepository;
import com.example.app1.repository.FocusSessionRepository;
import com.example.app1.repository.PomodoroSettingRepository;
import com.example.app1.repository.TaskListRepository;
import com.example.app1.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private TaskListRepository taskListRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private CategoryService categoryService;
    @Mock
    private PomodoroSettingRepository pomodoroSettingRepository;
    @Mock
    private FocusSessionRepository focusSessionRepository;

    @InjectMocks
    private TaskService taskService;

    private final String userId = "auth0|123456";
    private TaskList mockTaskList;
    private Category mockCategory;

    @BeforeEach
    void setUp() {
        mockTaskList = TaskList.builder().id(1L).userId(userId).build();
        mockCategory = Category.builder().id(1L).userId(userId).name("Work").build();
    }

    @Test
    void createTask_Basic() {
        // Arrange
        TaskDto.Create request = new TaskDto.Create(
                "Test Task", 1L, null, 1L, null, null, 2, false, null, null,
                java.time.LocalDate.now().atStartOfDay().atOffset(java.time.ZoneOffset.UTC), null, true, null, null);

        when(taskListRepository.existsByIdAndUserId(1L, userId)).thenReturn(true);
        when(taskListRepository.getReferenceById(1L)).thenReturn(mockTaskList);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(100L);
            return t;
        });

        // Act
        Task result = taskService.createTask(request, userId);

        // Assert
        assertNotNull(result);
        assertEquals("Test Task", result.getTitle());
        assertEquals(userId, result.getUserId());
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    void createTask_CustomDates() {
        // Arrange
        List<LocalDate> dates = Arrays.asList(
                LocalDate.of(2026, 1, 1),
                LocalDate.of(2026, 1, 5));
        TaskDto.Create request = new TaskDto.Create(
                "Multi Date Task", 1L, null, 1L, null, null, 1, false, null, dates, null, null, true, null, null);

        when(taskListRepository.existsByIdAndUserId(1L, userId)).thenReturn(true);
        when(taskListRepository.getReferenceById(1L)).thenReturn(mockTaskList);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        Task result = taskService.createTask(request, userId);

        // Assert
        // Should create 2 tasks
        verify(taskRepository, times(2)).save(any(Task.class));
        assertNotNull(result, "Should return the first created task");
    }

    @Test
    void createTask_Recurring_Weekly_WithDays() {
        // Arrange
        // Weekly on Mon, Wed. Max 4 occurrences.
        // Start date: 2026-01-05 (Monday)
        RecurrenceRuleDto recurrenceRule = new RecurrenceRuleDto(
                Frequency.WEEKLY, 1,
                Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY),
                null, 4);

        LocalDate startDate = LocalDate.of(2026, 1, 5); // Monday

        TaskDto.Create request = new TaskDto.Create(
                "Recurring Task", 1L, null, 1L, null, null, 1, true, recurrenceRule, null,
                startDate.atStartOfDay().atOffset(java.time.ZoneOffset.UTC), null, true, null, null);

        when(taskListRepository.existsByIdAndUserId(1L, userId)).thenReturn(true);
        when(taskListRepository.getReferenceById(1L)).thenReturn(mockTaskList);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            if (t.getId() == null)
                t.setId(System.nanoTime()); // Mock ID assignment
            return t;
        });

        // Act
        taskService.createTask(request, userId);

        // Assert
        // Expected dates: 1/5(Mon), 1/7(Wed), 1/12(Mon), 1/14(Wed) -> Total 4 tasks
        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, times(4)).save(taskCaptor.capture());

        List<Task> capturedTasks = taskCaptor.getAllValues();
        assertEquals(4, capturedTasks.size());

        // First task (Parent)
        Task t1 = capturedTasks.get(0);
        assertEquals(startDate, t1.getScheduledStartAt().toLocalDate());
        assertTrue(t1.getIsRecurring());

        // Children
        assertEquals(LocalDate.of(2026, 1, 7), capturedTasks.get(1).getScheduledStartAt().toLocalDate());
        assertEquals(LocalDate.of(2026, 1, 12), capturedTasks.get(2).getScheduledStartAt().toLocalDate());
        assertEquals(LocalDate.of(2026, 1, 14), capturedTasks.get(3).getScheduledStartAt().toLocalDate());

        // Check parent linkage
        assertEquals(t1.getId(), capturedTasks.get(1).getRecurrenceParentId());
    }

    @Test
    void createTask_Recurring_Daily_EndDate() {
        // Arrange
        // Daily until 2026-01-04. Start 2026-01-01.
        RecurrenceRuleDto recurrenceRule = new RecurrenceRuleDto(
                Frequency.DAILY, 1, null, LocalDate.of(2026, 1, 4), null);

        LocalDate startDate = LocalDate.of(2026, 1, 1);

        TaskDto.Create request = new TaskDto.Create(
                "Daily Task", 1L, null, 1L, null, null, 1, true, recurrenceRule, null,
                startDate.atStartOfDay().atOffset(java.time.ZoneOffset.UTC), null, true, null, null);

        when(taskListRepository.existsByIdAndUserId(1L, userId)).thenReturn(true);
        when(taskListRepository.getReferenceById(1L)).thenReturn(mockTaskList);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(System.nanoTime());
            return t;
        });

        // Act
        taskService.createTask(request, userId);

        // Assert
        // Expected: 1/1, 1/2, 1/3, 1/4 -> 4 tasks
        verify(taskRepository, times(4)).save(any(Task.class));
    }

    @Test
    void bulkCreateTasks() {
        // Arrange
        TaskDto.Create request1 = new TaskDto.Create(
                "Task 1", 1L, null, 1L, null, null, 1, false, null, null,
                java.time.LocalDate.now().atStartOfDay().atOffset(java.time.ZoneOffset.UTC), null, true, null, null);
        TaskDto.Create request2 = new TaskDto.Create(
                "Task 2", 1L, null, 1L, null, null, 1, false, null, null,
                java.time.LocalDate.now().atStartOfDay().atOffset(java.time.ZoneOffset.UTC), null, true, null, null);
        List<TaskDto.Create> requests = Arrays.asList(request1, request2);

        when(taskListRepository.existsByIdAndUserId(1L, userId)).thenReturn(true);
        when(taskListRepository.getReferenceById(1L)).thenReturn(mockTaskList);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(mockCategory));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(System.nanoTime());
            return t;
        });

        // Act
        List<Task> results = taskService.bulkCreateTasks(requests, userId);

        // Assert
        assertEquals(2, results.size());
        verify(taskRepository, times(2)).save(any(Task.class));
    }
}
