export const TpsFrontMatterKeys = Object.freeze({
    title: "title",
    profile: "profile",
    duration: "duration",
    baseWpm: "base_wpm",
    author: "author",
    created: "created",
    version: "version",
    speedOffsetsXslow: "speed_offsets.xslow",
    speedOffsetsSlow: "speed_offsets.slow",
    speedOffsetsFast: "speed_offsets.fast",
    speedOffsetsXfast: "speed_offsets.xfast"
});
export const TpsLegacyKeys = Object.freeze({
    displayDuration: "display_duration",
    fastOffset: "fast_offset",
    presetsFast: "presets.fast",
    presetsSlow: "presets.slow",
    presetsXfast: "presets.xfast",
    presetsXslow: "presets.xslow",
    slowOffset: "slow_offset",
    xfastOffset: "xfast_offset",
    xslowOffset: "xslow_offset"
});
export const TpsTags = Object.freeze({
    aside: "aside",
    breath: "breath",
    building: "building",
    editPoint: "edit_point",
    emphasis: "emphasis",
    energy: "energy",
    fast: "fast",
    highlight: "highlight",
    legato: "legato",
    loud: "loud",
    melody: "melody",
    normal: "normal",
    pause: "pause",
    phonetic: "phonetic",
    pronunciation: "pronunciation",
    rhetorical: "rhetorical",
    sarcasm: "sarcasm",
    slow: "slow",
    soft: "soft",
    staccato: "staccato",
    stress: "stress",
    whisper: "whisper",
    xfast: "xfast",
    xslow: "xslow"
});
export const TpsHeaderTokens = Object.freeze({
    title: "# ",
    segment: "## ",
    block: "### ",
    speakerPrefix: "Speaker:",
    archetypePrefix: "Archetype:",
    wpmSuffix: "WPM"
});
export const TpsEmotions = Object.freeze([
    "neutral",
    "warm",
    "professional",
    "focused",
    "concerned",
    "urgent",
    "motivational",
    "excited",
    "happy",
    "sad",
    "calm",
    "energetic"
]);
export const TpsVolumeLevels = Object.freeze([
    TpsTags.loud,
    TpsTags.soft,
    TpsTags.whisper
]);
export const TpsDeliveryModes = Object.freeze([
    TpsTags.sarcasm,
    TpsTags.aside,
    TpsTags.rhetorical,
    TpsTags.building
]);
export const TpsArticulationStyles = Object.freeze([
    TpsTags.legato,
    TpsTags.staccato
]);
export const TpsArchetypeNames = Object.freeze({
    friend: "friend",
    motivator: "motivator",
    educator: "educator",
    coach: "coach",
    storyteller: "storyteller",
    entertainer: "entertainer"
});
export const TpsArchetypes = Object.freeze([
    TpsArchetypeNames.friend,
    TpsArchetypeNames.motivator,
    TpsArchetypeNames.educator,
    TpsArchetypeNames.coach,
    TpsArchetypeNames.storyteller,
    TpsArchetypeNames.entertainer
]);
export const TpsArchetypeRecommendedWpm = Object.freeze({
    [TpsArchetypeNames.friend]: 135,
    [TpsArchetypeNames.motivator]: 155,
    [TpsArchetypeNames.educator]: 120,
    [TpsArchetypeNames.coach]: 145,
    [TpsArchetypeNames.storyteller]: 125,
    [TpsArchetypeNames.entertainer]: 150
});
export const TpsEnergyLevels = Object.freeze({ min: 1, max: 10 });
export const TpsMelodyLevels = Object.freeze({ min: 1, max: 10 });
export const TpsRelativeSpeedTags = Object.freeze([
    TpsTags.xslow,
    TpsTags.slow,
    TpsTags.fast,
    TpsTags.xfast,
    TpsTags.normal
]);
export const TpsEditPointPriorities = Object.freeze([
    "high",
    "medium",
    "low"
]);
export const TpsControlMarkers = Object.freeze({
    shortPause: "/",
    mediumPause: "//"
});
export const TpsDefaultSpeedOffsets = Object.freeze({
    [TpsTags.xslow]: -40,
    [TpsTags.slow]: -20,
    [TpsTags.fast]: 25,
    [TpsTags.xfast]: 50
});
export const TpsEmotionPalettes = Object.freeze({
    neutral: { accent: "#2563EB", text: "#0F172A", background: "#60A5FA" },
    warm: { accent: "#EA580C", text: "#1C1917", background: "#FDBA74" },
    professional: { accent: "#1D4ED8", text: "#0F172A", background: "#93C5FD" },
    focused: { accent: "#15803D", text: "#052E16", background: "#86EFAC" },
    concerned: { accent: "#B91C1C", text: "#1F1111", background: "#FCA5A5" },
    urgent: { accent: "#DC2626", text: "#FFF7F7", background: "#FCA5A5" },
    motivational: { accent: "#7C3AED", text: "#FFFFFF", background: "#C4B5FD" },
    excited: { accent: "#DB2777", text: "#FFF7FB", background: "#F9A8D4" },
    happy: { accent: "#D97706", text: "#1C1917", background: "#FCD34D" },
    sad: { accent: "#4F46E5", text: "#EEF2FF", background: "#A5B4FC" },
    calm: { accent: "#0F766E", text: "#F0FDFA", background: "#99F6E4" },
    energetic: { accent: "#C2410C", text: "#FFF7ED", background: "#FDBA74" }
});
export const TpsEmotionHeadCues = Object.freeze({
    neutral: "H0",
    calm: "H0",
    professional: "H9",
    focused: "H5",
    motivational: "H9",
    urgent: "H4",
    concerned: "H1",
    sad: "H1",
    warm: "H7",
    happy: "H6",
    excited: "H6",
    energetic: "H8"
});
export const TpsDiagnosticCodes = Object.freeze({
    invalidFrontMatter: "invalid-front-matter",
    invalidHeader: "invalid-header",
    invalidHeaderParameter: "invalid-header-parameter",
    unterminatedTag: "unterminated-tag",
    unknownTag: "unknown-tag",
    invalidPause: "invalid-pause",
    invalidTagArgument: "invalid-tag-argument",
    invalidWpm: "invalid-wpm",
    invalidEnergyLevel: "invalid-energy-level",
    invalidMelodyLevel: "invalid-melody-level",
    unknownArchetype: "unknown-archetype",
    mismatchedClosingTag: "mismatched-closing-tag",
    unclosedTag: "unclosed-tag"
});
export const TpsKeywords = Object.freeze({
    frontMatterKeys: TpsFrontMatterKeys,
    legacyKeys: TpsLegacyKeys,
    headerTokens: TpsHeaderTokens,
    tags: TpsTags,
    emotions: TpsEmotions,
    volumeLevels: TpsVolumeLevels,
    deliveryModes: TpsDeliveryModes,
    articulationStyles: TpsArticulationStyles,
    archetypes: TpsArchetypes,
    relativeSpeedTags: TpsRelativeSpeedTags,
    editPointPriorities: TpsEditPointPriorities,
    controlMarkers: TpsControlMarkers
});
export const TpsSpec = Object.freeze({
    defaultBaseWpm: 140,
    defaultEmotion: "neutral",
    defaultImplicitSegmentName: "Content",
    defaultProfile: "Actor",
    minimumWpm: 80,
    maximumWpm: 220,
    shortPauseDurationMs: 300,
    mediumPauseDurationMs: 600,
    speakerPrefix: TpsHeaderTokens.speakerPrefix,
    wpmSuffix: TpsHeaderTokens.wpmSuffix,
    frontMatterKeys: TpsFrontMatterKeys,
    legacyKeys: TpsLegacyKeys,
    headerTokens: TpsHeaderTokens,
    tags: TpsTags,
    emotions: TpsEmotions,
    volumeLevels: TpsVolumeLevels,
    deliveryModes: TpsDeliveryModes,
    relativeSpeedTags: TpsRelativeSpeedTags,
    editPointPriorities: TpsEditPointPriorities,
    controlMarkers: TpsControlMarkers,
    defaultSpeedOffsets: TpsDefaultSpeedOffsets,
    emotionPalettes: TpsEmotionPalettes,
    emotionHeadCues: TpsEmotionHeadCues,
    diagnosticCodes: TpsDiagnosticCodes,
    keywords: TpsKeywords,
    articulationStyles: TpsArticulationStyles,
    archetypes: TpsArchetypes,
    archetypeRecommendedWpm: TpsArchetypeRecommendedWpm,
    energyLevels: TpsEnergyLevels,
    melodyLevels: TpsMelodyLevels
});
//# sourceMappingURL=constants.js.map