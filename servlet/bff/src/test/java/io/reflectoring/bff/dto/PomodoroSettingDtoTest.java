package io.reflectoring.bff.dto;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.json.JsonTest;
import org.springframework.boot.test.json.JacksonTester;

@JsonTest
class PomodoroSettingDtoTest {

    @Autowired
    private JacksonTester<PomodoroSettingDto.Request> json;

    @Test
    void testPartialUpdateDeserialization() throws Exception {
        // Partial JSON with only focusDuration
        String content = "{\"focusDuration\": 30}";

        PomodoroSettingDto.Request request = json.parseObject(content);

        // Verify focusDuration is set
        assertThat(request.focusDuration()).isEqualTo(30);

        // Verify other fields are null (indicating no change)
        assertThat(request.shortBreakDuration()).isNull();
        assertThat(request.longBreakDuration()).isNull();
        assertThat(request.longBreakInterval()).isNull();
        assertThat(request.isLongBreakEnabled()).isNull();
        assertThat(request.dailyGoal()).isNull();
        assertThat(request.autoAdvance()).isNull();
        assertThat(request.whiteNoise()).isNull();
        assertThat(request.volume()).isNull();
    }

    @Test
    void testAnotherPartialUpdate() throws Exception {
        // Partial JSON with dailyGoal and whiteNoise
        String content = "{\"dailyGoal\": 150, \"whiteNoise\": \"rain\"}";

        PomodoroSettingDto.Request request = json.parseObject(content);

        assertThat(request.dailyGoal()).isEqualTo(150);
        assertThat(request.whiteNoise()).isEqualTo("rain");

        // Focus duration should be null
        assertThat(request.focusDuration()).isNull();
    }
}
