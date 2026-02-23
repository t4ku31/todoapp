package com.todoapp.resource.dto;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "繰り返しルールの厳密な定義 (RFC 5545準拠)")
public record RecurrenceRuleDto(
        @Schema(description = "繰り返し頻度", requiredMode = Schema.RequiredMode.REQUIRED) Frequency frequency,
        @Schema(description = "繰り返し間隔 (デフォルト: 1)") Integer interval,
        @Schema(description = "曜日指定 (WEEKLYの場合に使用)") List<DayOfWeek> byDay,
        @Schema(description = "終了日 (countと排他)") LocalDate until,
        @Schema(description = "繰り返し回数 (untilと排他)") Integer count) {

    public enum Frequency {
        DAILY, WEEKLY, MONTHLY, YEARLY, ORIGINAL
    }

    private static final DateTimeFormatter UNTIL_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd");

    // Helper to convert to RRULE string
    public String toRRuleString() {
        if (frequency == null)
            return null;

        StringBuilder sb = new StringBuilder();
        sb.append("FREQ=").append(frequency.name());

        if (interval != null && interval > 1) {
            sb.append(";INTERVAL=").append(interval);
        }

        if (byDay != null && !byDay.isEmpty()) {
            sb.append(";BYDAY=");
            sb.append(String.join(",", byDay.stream()
                    .map(RecurrenceRuleDto::toRRuleDay)
                    .toList()));
        }

        if (until != null) {
            sb.append(";UNTIL=").append(until.format(UNTIL_FORMAT));
        }

        if (count != null && count > 0) {
            sb.append(";COUNT=").append(count);
        }

        return sb.toString();
    }

    // Helper to parse from RRULE string
    public static RecurrenceRuleDto fromRRuleString(String rrule) {
        if (rrule == null || rrule.isBlank())
            return null;

        String cleanRule = rrule.startsWith("RRULE:") ? rrule.substring(6) : rrule;
        // Normalize: support both comma and semicolon separators
        cleanRule = cleanRule.replaceAll(",(?=[A-Z]+=[^=])", ";");

        Frequency freq = null;
        Integer interval = null;
        List<DayOfWeek> byDay = null;
        LocalDate until = null;
        Integer count = null;

        try {
            // Parse FREQ
            Matcher freqMatcher = Pattern.compile("FREQ=([A-Z]+)").matcher(cleanRule);
            if (freqMatcher.find()) {
                freq = switch (freqMatcher.group(1)) {
                    case "DAILY" -> Frequency.DAILY;
                    case "WEEKLY" -> Frequency.WEEKLY;
                    case "MONTHLY" -> Frequency.MONTHLY;
                    case "YEARLY" -> Frequency.YEARLY;
                    case "ORIGINAL" -> Frequency.ORIGINAL;
                    default -> Frequency.DAILY;
                };
            }

            // Parse INTERVAL
            Matcher intervalMatcher = Pattern.compile("INTERVAL=(\\d+)").matcher(cleanRule);
            if (intervalMatcher.find()) {
                interval = Integer.parseInt(intervalMatcher.group(1));
                if (interval <= 1)
                    interval = null;
            }

            // Parse BYDAY
            Matcher byDayMatcher = Pattern.compile("BYDAY=([A-Z,]+)").matcher(cleanRule);
            if (byDayMatcher.find()) {
                String[] days = byDayMatcher.group(1).split(",");
                byDay = new ArrayList<>();
                for (String day : days) {
                    DayOfWeek dow = fromRRuleDay(day.trim());
                    if (dow != null)
                        byDay.add(dow);
                }
                if (byDay.isEmpty())
                    byDay = null;
            }

            // Parse UNTIL
            Matcher untilMatcher = Pattern.compile("UNTIL=(\\d{8})").matcher(cleanRule);
            if (untilMatcher.find()) {
                until = LocalDate.parse(untilMatcher.group(1), UNTIL_FORMAT);
            }

            // Parse COUNT
            Matcher countMatcher = Pattern.compile("COUNT=(\\d+)").matcher(cleanRule);
            if (countMatcher.find()) {
                count = Integer.parseInt(countMatcher.group(1));
                if (count <= 0)
                    count = null;
            }

            return new RecurrenceRuleDto(freq, interval, byDay, until, count);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid RRULE: " + rrule, e);
        }
    }

    private static String toRRuleDay(DayOfWeek d) {
        return switch (d) {
            case MONDAY -> "MO";
            case TUESDAY -> "TU";
            case WEDNESDAY -> "WE";
            case THURSDAY -> "TH";
            case FRIDAY -> "FR";
            case SATURDAY -> "SA";
            case SUNDAY -> "SU";
        };
    }

    private static DayOfWeek fromRRuleDay(String day) {
        return switch (day) {
            case "MO" -> DayOfWeek.MONDAY;
            case "TU" -> DayOfWeek.TUESDAY;
            case "WE" -> DayOfWeek.WEDNESDAY;
            case "TH" -> DayOfWeek.THURSDAY;
            case "FR" -> DayOfWeek.FRIDAY;
            case "SA" -> DayOfWeek.SATURDAY;
            case "SU" -> DayOfWeek.SUNDAY;
            default -> null;
        };
    }
}
