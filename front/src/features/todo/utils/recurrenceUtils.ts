import type { RecurrenceConfig } from "@/features/todo/types";
import { format } from "date-fns";
import { type Frequency, RRule } from "rrule";

/**
 * APIとの通信用にシリアライズされたRecurrenceConfig型
 * Date型のフィールドがstring型になっている
 */
export interface SerializedRecurrenceConfig {
	frequency: RecurrenceConfig["frequency"];
	interval?: number;
	count?: number;
	until?: string; // "YYYY-MM-DD" format
	byDay?: RecurrenceConfig["byDay"];
	occurs?: string[]; // "YYYY-MM-DD" format array
}

/**
 * AIが生成したRRULE文字列 (例: "RRULE:FREQ=DAILY;COUNT=7") または
 * バックエンドからのRRULE文字列 ("FREQ=DAILY;...") を
 * RecurrenceConfigオブジェクトに変換する
 */
export const parseRRuleToConfig = (
	rruleString: string,
): RecurrenceConfig | undefined => {
	if (!rruleString) return undefined;

	// Normalize string: Remove "RRULE:" prefix and handle comma separators if present
	let cleanRule = rruleString.replace(/^RRULE:/i, "");
	// Replace commas with semicolons BUT ignore commas inside BYDAY list (e.g. MO,TU)
	// A simplified approach: if it looks like comma-delimited properties (FREQ=X,COUNT=Y), convert to semicolons
	if (cleanRule.includes(",") && !cleanRule.includes(";")) {
		cleanRule = cleanRule.replace(/,(?=[A-Z]+=[^=])/g, ";");
	}

	// Handle CUSTOM frequency manually
	if (cleanRule.includes("FREQ=CUSTOM")) {
		const occursMatch = cleanRule.match(/OCCURS=([^;]+)/);
		const occurs = occursMatch
			? occursMatch[1].split(",").map((d) => {
					// YYYYMMDD format expected from RRULE string or custom format
					const year = Number.parseInt(d.substring(0, 4), 10);
					const month = Number.parseInt(d.substring(4, 6), 10) - 1;
					const day = Number.parseInt(d.substring(6, 8), 10);
					return new Date(year, month, day);
				})
			: [];
		return {
			frequency: "CUSTOM",
			occurs,
		};
	}

	try {
		const options = RRule.parseString(cleanRule);

		if (!options || !options.freq) return undefined;

		// Map Frequency
		let frequency: RecurrenceConfig["frequency"];
		switch (options.freq as Frequency) {
			case RRule.DAILY:
				frequency = "DAILY";
				break;
			case RRule.WEEKLY:
				frequency = "WEEKLY";
				break;
			case RRule.MONTHLY:
				frequency = "MONTHLY";
				break;
			case RRule.YEARLY:
				frequency = "YEARLY";
				break;
			default:
				// Fallback or ignore hourly
				return undefined;
		}

		// Map BYDAY
		let byDay: RecurrenceConfig["byDay"];
		if (
			options.byweekday &&
			Array.isArray(options.byweekday) &&
			options.byweekday.length > 0
		) {
			byDay = options.byweekday
				.map((d) => {
					const s = d.toString(); // "MO", "TU" etc.
					switch (s) {
						case "SU":
							return "SUNDAY";
						case "MO":
							return "MONDAY";
						case "TU":
							return "TUESDAY";
						case "WE":
							return "WEDNESDAY";
						case "TH":
							return "THURSDAY";
						case "FR":
							return "FRIDAY";
						case "SA":
							return "SATURDAY";
						default:
							return "" as const; // as const to allow filtering type inference
					}
				})
				.filter(
					(s): s is NonNullable<RecurrenceConfig["byDay"]>[number] => s !== "",
				);
		}

		return {
			frequency,
			interval: options.interval,
			count: options.count ?? undefined, // null to undefined
			until: options.until ?? undefined, // Date object or undefined
			byDay,
		};
	} catch (e) {
		console.error("Failed to parse RRULE with rrule library:", e);
		return undefined;
	}
};

/**
 * RecurrenceConfigオブジェクトをRRULE文字列に変換する
 */
export const formatConfigToRRule = (config: RecurrenceConfig): string => {
	// Handle CUSTOM frequency
	if (config.frequency === "CUSTOM") {
		const occursStr = config.occurs
			? config.occurs.map((d) => format(d, "yyyyMMdd")).join(",")
			: "";
		return `FREQ=CUSTOM;OCCURS=${occursStr}`;
	}

	// Map Frequency String -> RRule Frequency Enum
	let freq: Frequency;
	switch (config.frequency) {
		case "DAILY":
			freq = RRule.DAILY;
			break;
		case "WEEKLY":
			freq = RRule.WEEKLY;
			break;
		case "MONTHLY":
			freq = RRule.MONTHLY;
			break;
		case "YEARLY":
			freq = RRule.YEARLY;
			break;

		default:
			freq = RRule.DAILY;
	}

	// Map BYDAY Strings -> RRule Weekday objects
	let byweekday: any[] | undefined;
	if (config.byDay && config.byDay.length > 0) {
		byweekday = config.byDay
			.map((d) => {
				switch (d) {
					case "SUNDAY":
						return RRule.SU;
					case "MONDAY":
						return RRule.MO;
					case "TUESDAY":
						return RRule.TU;
					case "WEDNESDAY":
						return RRule.WE;
					case "THURSDAY":
						return RRule.TH;
					case "FRIDAY":
						return RRule.FR;
					case "SATURDAY":
						return RRule.SA;
					default:
						return undefined;
				}
			})
			.filter((d) => d !== undefined);
	}

	const options = {
		freq,
		interval: config.interval,
		count: config.count,
		until: config.until, // Date object
		byweekday,
	};

	// Use RRule object to generate string
	const rrule = new RRule(options);
	// toString() returns "RRULE:FREQ=..."
	return rrule.toString();
};

/**
 * API送信用にRecurrenceConfigをシリアライズする (Date -> string)
 */
export const serializeRecurrenceConfig = (
	config?: RecurrenceConfig | null,
): SerializedRecurrenceConfig | null | undefined => {
	if (!config) return config;
	return {
		...config,
		until: config.until ? format(config.until, "yyyy-MM-dd") : undefined,
		occurs: config.occurs
			? config.occurs.map((d) => format(d, "yyyy-MM-dd"))
			: undefined,
	};
};

/**
 * APIレスポンスからRecurrenceConfigをデシリアライズする (string -> Date)
 * 文字列 "YYYY-MM-DD" をローカルの0時0分0秒としてDateオブジェクトに変換する
 */
export const deserializeRecurrenceConfig = (
	config: SerializedRecurrenceConfig | null | undefined,
): RecurrenceConfig | undefined => {
	if (!config) return undefined;

	let until: Date | undefined;
	if (config.until) {
		const [year, month, day] = config.until.split("-").map(Number);
		until = new Date(year, month - 1, day);
	}

	let occurs: Date[] | undefined;
	if (config.occurs && Array.isArray(config.occurs)) {
		occurs = config.occurs.map((s: string) => {
			const [year, month, day] = s.split("-").map(Number);
			return new Date(year, month - 1, day);
		});
	}

	return {
		...config,
		until,
		occurs,
	} as RecurrenceConfig;
};
