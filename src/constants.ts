export const COLORS = {
    // Page
    BACKGROUND_FILL: "#131B23",

    // Note
    NOTE_FILL: "#141414",
    NOTE_SHADOW_FILL: "#rgba(50, 50, 50, 10)",
    HIGHLIGHTED_NOTE_FILL: "#FFD700",

    // Lane
    LANE_FILL: "#ECDFCC",
    MEASURE_LINE: "#141414",
    MEASURE_NUMBER: "#141414",
    
    // Zones
    MISS_ZONE_FILL: "rgba(232, 49, 81, 10)",
    LATE_HITZONE_FILL: "rgba(28, 124, 84, .1)",
    EARLY_HITZONE_FILL: "rgba(28, 124, 84, .1)",
    PERFECT_HITZONE_FILL: "rgba(28, 124, 84, .25)",

    // Input
    INPUT_KEY_UNPRESSED: "#141414",
    INPUT_KEY_PRESSED: "#ECDFCC",
    PRESSED_INPUT_FILL: "#141414",
    UNPRESSED_INPUT_FILL: "#ECDFCC",

    // Edit mode
    NOTE_AREA_HIGHLIGHT: "#14141410", 
};


export const ZONE_NAMES = {
    EARLY_ZONE: "early_zone",
    EARLY_HIT_ZONE: "early_hit_zone",
    PERFECT_HIT_ZONE:"perfect_hit_zone",
    LATE_HIT_ZONE: "late_hit_zone",
    MISS_ZONE: "miss_zone"
};

export const HIT_STATUSES = {
    UNHIT: "unit",
    EARLY_HIT: "early_hit",
    PERFECT_HIT: "perfect_hit",
    LATE_HIT: "late_hit"
};

export const EDIT_MODES = {
    NOTE_MODE: "NOTE_MODE",
    PATTERN_MODE: "PATTERN_MODE",
    CREATE_PATTERN_MODE: "CREATE_PATTERN_MODE"
}