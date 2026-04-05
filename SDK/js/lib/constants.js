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
export const TpsArchetypeArticulationExpectations = Object.freeze({
    legato: "legato",
    staccato: "staccato",
    neutral: "neutral",
    flexible: "flexible"
});
export const TpsArchetypeVolumeExpectations = Object.freeze({
    defaultOnly: "default-only",
    softOrDefault: "soft-or-default",
    loudOnly: "loud-only",
    flexible: "flexible"
});
export const TpsArchetypeProfiles = Object.freeze({
    [TpsArchetypeNames.friend]: Object.freeze({
        articulation: TpsArchetypeArticulationExpectations.legato,
        energy: Object.freeze({ min: 4, max: 6 }),
        melody: Object.freeze({ min: 6, max: 8 }),
        volume: TpsArchetypeVolumeExpectations.softOrDefault,
        speed: Object.freeze({ min: 125, max: 150 })
    }),
    [TpsArchetypeNames.motivator]: Object.freeze({
        articulation: TpsArchetypeArticulationExpectations.legato,
        energy: Object.freeze({ min: 7, max: 10 }),
        melody: Object.freeze({ min: 7, max: 9 }),
        volume: TpsArchetypeVolumeExpectations.loudOnly,
        speed: Object.freeze({ min: 145, max: 170 })
    }),
    [TpsArchetypeNames.educator]: Object.freeze({
        articulation: TpsArchetypeArticulationExpectations.neutral,
        energy: Object.freeze({ min: 3, max: 5 }),
        melody: Object.freeze({ min: 2, max: 4 }),
        volume: TpsArchetypeVolumeExpectations.defaultOnly,
        speed: Object.freeze({ min: 110, max: 135 })
    }),
    [TpsArchetypeNames.coach]: Object.freeze({
        articulation: TpsArchetypeArticulationExpectations.staccato,
        energy: Object.freeze({ min: 7, max: 9 }),
        melody: Object.freeze({ min: 1, max: 3 }),
        volume: TpsArchetypeVolumeExpectations.loudOnly,
        speed: Object.freeze({ min: 135, max: 160 })
    }),
    [TpsArchetypeNames.storyteller]: Object.freeze({
        articulation: TpsArchetypeArticulationExpectations.flexible,
        energy: Object.freeze({ min: 4, max: 7 }),
        melody: Object.freeze({ min: 8, max: 10 }),
        volume: TpsArchetypeVolumeExpectations.flexible,
        speed: Object.freeze({ min: 100, max: 150 })
    }),
    [TpsArchetypeNames.entertainer]: Object.freeze({
        articulation: TpsArchetypeArticulationExpectations.flexible,
        energy: Object.freeze({ min: 6, max: 8 }),
        melody: Object.freeze({ min: 7, max: 9 }),
        volume: TpsArchetypeVolumeExpectations.flexible,
        speed: Object.freeze({ min: 140, max: 165 })
    })
});
export const TpsArchetypeRhythmProfiles = Object.freeze({
    minimumWords: 12,
    [TpsArchetypeNames.friend]: Object.freeze({
        phraseLength: Object.freeze({ min: 8, max: 15 }),
        pauseFrequencyPer100Words: Object.freeze({ min: 4, max: 8 }),
        averagePauseDurationMs: Object.freeze({ min: 300, max: 600 }),
        emphasisDensityPercent: Object.freeze({ min: 3, max: 8 }),
        speedVariationPer100Words: Object.freeze({ min: 0, max: 1 })
    }),
    [TpsArchetypeNames.motivator]: Object.freeze({
        phraseLength: Object.freeze({ min: 8, max: 20 }),
        pauseFrequencyPer100Words: Object.freeze({ min: 3, max: 6 }),
        averagePauseDurationMs: Object.freeze({ min: 600, max: 2000 }),
        emphasisDensityPercent: Object.freeze({ min: 10, max: 20 }),
        speedVariationPer100Words: Object.freeze({ min: 0, max: 2 })
    }),
    [TpsArchetypeNames.educator]: Object.freeze({
        phraseLength: Object.freeze({ min: 10, max: 25 }),
        pauseFrequencyPer100Words: Object.freeze({ min: 6, max: 12 }),
        averagePauseDurationMs: Object.freeze({ min: 400, max: 800 }),
        emphasisDensityPercent: Object.freeze({ min: 3, max: 8 }),
        speedVariationPer100Words: Object.freeze({ min: 0, max: 2 })
    }),
    [TpsArchetypeNames.coach]: Object.freeze({
        phraseLength: Object.freeze({ min: 3, max: 8 }),
        pauseFrequencyPer100Words: Object.freeze({ min: 8, max: 15 }),
        averagePauseDurationMs: Object.freeze({ min: 200, max: 400 }),
        emphasisDensityPercent: Object.freeze({ min: 15, max: 30 }),
        speedVariationPer100Words: Object.freeze({ min: 0, max: 2 })
    }),
    [TpsArchetypeNames.storyteller]: Object.freeze({
        phraseLength: Object.freeze({ min: 5, max: 20 }),
        pauseFrequencyPer100Words: Object.freeze({ min: 4, max: 10 }),
        averagePauseDurationMs: Object.freeze({ min: 500, max: 3000 }),
        emphasisDensityPercent: Object.freeze({ min: 5, max: 12 }),
        speedVariationPer100Words: Object.freeze({ min: 3, max: 6 })
    }),
    [TpsArchetypeNames.entertainer]: Object.freeze({
        phraseLength: Object.freeze({ min: 5, max: 15 }),
        pauseFrequencyPer100Words: Object.freeze({ min: 5, max: 10 }),
        averagePauseDurationMs: Object.freeze({ min: 300, max: 2000 }),
        emphasisDensityPercent: Object.freeze({ min: 5, max: 15 }),
        speedVariationPer100Words: Object.freeze({ min: 2, max: 4 })
    })
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
    archetypeArticulationMismatch: "archetype-articulation-mismatch",
    archetypeEnergyMismatch: "archetype-energy-mismatch",
    archetypeMelodyMismatch: "archetype-melody-mismatch",
    archetypeVolumeMismatch: "archetype-volume-mismatch",
    archetypeSpeedMismatch: "archetype-speed-mismatch",
    archetypeRhythmPhraseLength: "archetype-rhythm-phrase-length",
    archetypeRhythmPauseFrequency: "archetype-rhythm-pause-frequency",
    archetypeRhythmPauseDuration: "archetype-rhythm-pause-duration",
    archetypeRhythmEmphasisDensity: "archetype-rhythm-emphasis-density",
    archetypeRhythmSpeedVariation: "archetype-rhythm-speed-variation",
    mismatchedClosingTag: "mismatched-closing-tag",
    unclosedTag: "unclosed-tag"
});
export const TpsWarningDiagnosticCodes = Object.freeze([
    TpsDiagnosticCodes.invalidHeaderParameter,
    TpsDiagnosticCodes.archetypeArticulationMismatch,
    TpsDiagnosticCodes.archetypeEnergyMismatch,
    TpsDiagnosticCodes.archetypeMelodyMismatch,
    TpsDiagnosticCodes.archetypeVolumeMismatch,
    TpsDiagnosticCodes.archetypeSpeedMismatch,
    TpsDiagnosticCodes.archetypeRhythmPhraseLength,
    TpsDiagnosticCodes.archetypeRhythmPauseFrequency,
    TpsDiagnosticCodes.archetypeRhythmPauseDuration,
    TpsDiagnosticCodes.archetypeRhythmEmphasisDensity,
    TpsDiagnosticCodes.archetypeRhythmSpeedVariation
]);
export const TpsPlaybackDefaults = Object.freeze({
    defaultSpeedStepWpm: 10,
    defaultTickIntervalMs: 16,
    minimumSpeedStepWpm: 1,
    minimumTickIntervalMs: 1
});
export const TpsPlaybackEventNames = Object.freeze({
    stateChanged: "stateChanged",
    wordChanged: "wordChanged",
    phraseChanged: "phraseChanged",
    blockChanged: "blockChanged",
    segmentChanged: "segmentChanged",
    statusChanged: "statusChanged",
    completed: "completed",
    snapshotChanged: "snapshotChanged"
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
    archetypeProfiles: TpsArchetypeProfiles,
    archetypeRhythmProfiles: TpsArchetypeRhythmProfiles,
    relativeSpeedTags: TpsRelativeSpeedTags,
    editPointPriorities: TpsEditPointPriorities,
    controlMarkers: TpsControlMarkers,
    playbackEventNames: TpsPlaybackEventNames,
    warningDiagnosticCodes: TpsWarningDiagnosticCodes
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
    archetypeArticulationExpectations: TpsArchetypeArticulationExpectations,
    archetypeVolumeExpectations: TpsArchetypeVolumeExpectations,
    archetypeProfiles: TpsArchetypeProfiles,
    archetypeRhythmProfiles: TpsArchetypeRhythmProfiles,
    warningDiagnosticCodes: TpsWarningDiagnosticCodes,
    playbackDefaults: TpsPlaybackDefaults,
    playbackEventNames: TpsPlaybackEventNames,
    energyLevels: TpsEnergyLevels,
    melodyLevels: TpsMelodyLevels
});
//# sourceMappingURL=constants.js.map