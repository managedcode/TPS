export declare const TpsFrontMatterKeys: Readonly<{
    title: "title";
    profile: "profile";
    duration: "duration";
    baseWpm: "base_wpm";
    author: "author";
    created: "created";
    version: "version";
    speedOffsetsXslow: "speed_offsets.xslow";
    speedOffsetsSlow: "speed_offsets.slow";
    speedOffsetsFast: "speed_offsets.fast";
    speedOffsetsXfast: "speed_offsets.xfast";
}>;
export declare const TpsLegacyKeys: Readonly<{
    displayDuration: "display_duration";
    fastOffset: "fast_offset";
    presetsFast: "presets.fast";
    presetsSlow: "presets.slow";
    presetsXfast: "presets.xfast";
    presetsXslow: "presets.xslow";
    slowOffset: "slow_offset";
    xfastOffset: "xfast_offset";
    xslowOffset: "xslow_offset";
}>;
export declare const TpsTags: Readonly<{
    aside: "aside";
    breath: "breath";
    building: "building";
    editPoint: "edit_point";
    emphasis: "emphasis";
    energy: "energy";
    fast: "fast";
    highlight: "highlight";
    legato: "legato";
    loud: "loud";
    melody: "melody";
    normal: "normal";
    pause: "pause";
    phonetic: "phonetic";
    pronunciation: "pronunciation";
    rhetorical: "rhetorical";
    sarcasm: "sarcasm";
    slow: "slow";
    soft: "soft";
    staccato: "staccato";
    stress: "stress";
    whisper: "whisper";
    xfast: "xfast";
    xslow: "xslow";
}>;
export declare const TpsHeaderTokens: Readonly<{
    title: "# ";
    segment: "## ";
    block: "### ";
    speakerPrefix: "Speaker:";
    archetypePrefix: "Archetype:";
    wpmSuffix: "WPM";
}>;
export declare const TpsEmotions: readonly ["neutral", "warm", "professional", "focused", "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm", "energetic"];
export declare const TpsVolumeLevels: readonly ["loud", "soft", "whisper"];
export declare const TpsDeliveryModes: readonly ["sarcasm", "aside", "rhetorical", "building"];
export declare const TpsArticulationStyles: readonly ["legato", "staccato"];
export declare const TpsArchetypeNames: Readonly<{
    friend: "friend";
    motivator: "motivator";
    educator: "educator";
    coach: "coach";
    storyteller: "storyteller";
    entertainer: "entertainer";
}>;
export declare const TpsArchetypes: readonly ["friend", "motivator", "educator", "coach", "storyteller", "entertainer"];
export declare const TpsArchetypeRecommendedWpm: Readonly<{
    friend: 135;
    motivator: 155;
    educator: 120;
    coach: 145;
    storyteller: 125;
    entertainer: 150;
}>;
export declare const TpsArchetypeArticulationExpectations: Readonly<{
    legato: "legato";
    staccato: "staccato";
    neutral: "neutral";
    flexible: "flexible";
}>;
export declare const TpsArchetypeVolumeExpectations: Readonly<{
    defaultOnly: "default-only";
    softOrDefault: "soft-or-default";
    loudOnly: "loud-only";
    flexible: "flexible";
}>;
export declare const TpsArchetypeProfiles: Readonly<{
    friend: Readonly<{
        articulation: "legato";
        energy: Readonly<{
            min: 4;
            max: 6;
        }>;
        melody: Readonly<{
            min: 6;
            max: 8;
        }>;
        volume: "soft-or-default";
        speed: Readonly<{
            min: 125;
            max: 150;
        }>;
    }>;
    motivator: Readonly<{
        articulation: "legato";
        energy: Readonly<{
            min: 7;
            max: 10;
        }>;
        melody: Readonly<{
            min: 7;
            max: 9;
        }>;
        volume: "loud-only";
        speed: Readonly<{
            min: 145;
            max: 170;
        }>;
    }>;
    educator: Readonly<{
        articulation: "neutral";
        energy: Readonly<{
            min: 3;
            max: 5;
        }>;
        melody: Readonly<{
            min: 2;
            max: 4;
        }>;
        volume: "default-only";
        speed: Readonly<{
            min: 110;
            max: 135;
        }>;
    }>;
    coach: Readonly<{
        articulation: "staccato";
        energy: Readonly<{
            min: 7;
            max: 9;
        }>;
        melody: Readonly<{
            min: 1;
            max: 3;
        }>;
        volume: "loud-only";
        speed: Readonly<{
            min: 135;
            max: 160;
        }>;
    }>;
    storyteller: Readonly<{
        articulation: "flexible";
        energy: Readonly<{
            min: 4;
            max: 7;
        }>;
        melody: Readonly<{
            min: 8;
            max: 10;
        }>;
        volume: "flexible";
        speed: Readonly<{
            min: 100;
            max: 150;
        }>;
    }>;
    entertainer: Readonly<{
        articulation: "flexible";
        energy: Readonly<{
            min: 6;
            max: 8;
        }>;
        melody: Readonly<{
            min: 7;
            max: 9;
        }>;
        volume: "flexible";
        speed: Readonly<{
            min: 140;
            max: 165;
        }>;
    }>;
}>;
export declare const TpsArchetypeRhythmProfiles: Readonly<{
    minimumWords: 12;
    friend: Readonly<{
        phraseLength: Readonly<{
            min: 8;
            max: 15;
        }>;
        pauseFrequencyPer100Words: Readonly<{
            min: 4;
            max: 8;
        }>;
        averagePauseDurationMs: Readonly<{
            min: 300;
            max: 600;
        }>;
        emphasisDensityPercent: Readonly<{
            min: 3;
            max: 8;
        }>;
        speedVariationPer100Words: Readonly<{
            min: 0;
            max: 1;
        }>;
    }>;
    motivator: Readonly<{
        phraseLength: Readonly<{
            min: 8;
            max: 20;
        }>;
        pauseFrequencyPer100Words: Readonly<{
            min: 3;
            max: 6;
        }>;
        averagePauseDurationMs: Readonly<{
            min: 600;
            max: 2000;
        }>;
        emphasisDensityPercent: Readonly<{
            min: 10;
            max: 20;
        }>;
        speedVariationPer100Words: Readonly<{
            min: 0;
            max: 2;
        }>;
    }>;
    educator: Readonly<{
        phraseLength: Readonly<{
            min: 10;
            max: 25;
        }>;
        pauseFrequencyPer100Words: Readonly<{
            min: 6;
            max: 12;
        }>;
        averagePauseDurationMs: Readonly<{
            min: 400;
            max: 800;
        }>;
        emphasisDensityPercent: Readonly<{
            min: 3;
            max: 8;
        }>;
        speedVariationPer100Words: Readonly<{
            min: 0;
            max: 2;
        }>;
    }>;
    coach: Readonly<{
        phraseLength: Readonly<{
            min: 3;
            max: 8;
        }>;
        pauseFrequencyPer100Words: Readonly<{
            min: 8;
            max: 15;
        }>;
        averagePauseDurationMs: Readonly<{
            min: 200;
            max: 400;
        }>;
        emphasisDensityPercent: Readonly<{
            min: 15;
            max: 30;
        }>;
        speedVariationPer100Words: Readonly<{
            min: 0;
            max: 2;
        }>;
    }>;
    storyteller: Readonly<{
        phraseLength: Readonly<{
            min: 5;
            max: 20;
        }>;
        pauseFrequencyPer100Words: Readonly<{
            min: 4;
            max: 10;
        }>;
        averagePauseDurationMs: Readonly<{
            min: 500;
            max: 3000;
        }>;
        emphasisDensityPercent: Readonly<{
            min: 5;
            max: 12;
        }>;
        speedVariationPer100Words: Readonly<{
            min: 3;
            max: 6;
        }>;
    }>;
    entertainer: Readonly<{
        phraseLength: Readonly<{
            min: 5;
            max: 15;
        }>;
        pauseFrequencyPer100Words: Readonly<{
            min: 5;
            max: 10;
        }>;
        averagePauseDurationMs: Readonly<{
            min: 300;
            max: 2000;
        }>;
        emphasisDensityPercent: Readonly<{
            min: 5;
            max: 15;
        }>;
        speedVariationPer100Words: Readonly<{
            min: 2;
            max: 4;
        }>;
    }>;
}>;
export declare const TpsEnergyLevels: Readonly<{
    min: 1;
    max: 10;
}>;
export declare const TpsMelodyLevels: Readonly<{
    min: 1;
    max: 10;
}>;
export declare const TpsRelativeSpeedTags: readonly ["xslow", "slow", "fast", "xfast", "normal"];
export declare const TpsEditPointPriorities: readonly ["high", "medium", "low"];
export declare const TpsControlMarkers: Readonly<{
    shortPause: "/";
    mediumPause: "//";
}>;
export declare const TpsDefaultSpeedOffsets: Readonly<{
    xslow: -40;
    slow: -20;
    fast: 25;
    xfast: 50;
}>;
export declare const TpsEmotionPalettes: Readonly<{
    neutral: {
        accent: string;
        text: string;
        background: string;
    };
    warm: {
        accent: string;
        text: string;
        background: string;
    };
    professional: {
        accent: string;
        text: string;
        background: string;
    };
    focused: {
        accent: string;
        text: string;
        background: string;
    };
    concerned: {
        accent: string;
        text: string;
        background: string;
    };
    urgent: {
        accent: string;
        text: string;
        background: string;
    };
    motivational: {
        accent: string;
        text: string;
        background: string;
    };
    excited: {
        accent: string;
        text: string;
        background: string;
    };
    happy: {
        accent: string;
        text: string;
        background: string;
    };
    sad: {
        accent: string;
        text: string;
        background: string;
    };
    calm: {
        accent: string;
        text: string;
        background: string;
    };
    energetic: {
        accent: string;
        text: string;
        background: string;
    };
}>;
export declare const TpsEmotionHeadCues: Readonly<{
    neutral: "H0";
    calm: "H0";
    professional: "H9";
    focused: "H5";
    motivational: "H9";
    urgent: "H4";
    concerned: "H1";
    sad: "H1";
    warm: "H7";
    happy: "H6";
    excited: "H6";
    energetic: "H8";
}>;
export declare const TpsDiagnosticCodes: Readonly<{
    invalidFrontMatter: "invalid-front-matter";
    invalidHeader: "invalid-header";
    invalidHeaderParameter: "invalid-header-parameter";
    unterminatedTag: "unterminated-tag";
    unknownTag: "unknown-tag";
    invalidPause: "invalid-pause";
    invalidTagArgument: "invalid-tag-argument";
    invalidWpm: "invalid-wpm";
    invalidEnergyLevel: "invalid-energy-level";
    invalidMelodyLevel: "invalid-melody-level";
    unknownArchetype: "unknown-archetype";
    archetypeArticulationMismatch: "archetype-articulation-mismatch";
    archetypeEnergyMismatch: "archetype-energy-mismatch";
    archetypeMelodyMismatch: "archetype-melody-mismatch";
    archetypeVolumeMismatch: "archetype-volume-mismatch";
    archetypeSpeedMismatch: "archetype-speed-mismatch";
    archetypeRhythmPhraseLength: "archetype-rhythm-phrase-length";
    archetypeRhythmPauseFrequency: "archetype-rhythm-pause-frequency";
    archetypeRhythmPauseDuration: "archetype-rhythm-pause-duration";
    archetypeRhythmEmphasisDensity: "archetype-rhythm-emphasis-density";
    archetypeRhythmSpeedVariation: "archetype-rhythm-speed-variation";
    mismatchedClosingTag: "mismatched-closing-tag";
    unclosedTag: "unclosed-tag";
}>;
export declare const TpsWarningDiagnosticCodes: readonly ["invalid-header-parameter", "archetype-articulation-mismatch", "archetype-energy-mismatch", "archetype-melody-mismatch", "archetype-volume-mismatch", "archetype-speed-mismatch", "archetype-rhythm-phrase-length", "archetype-rhythm-pause-frequency", "archetype-rhythm-pause-duration", "archetype-rhythm-emphasis-density", "archetype-rhythm-speed-variation"];
export declare const TpsPlaybackDefaults: Readonly<{
    defaultSpeedStepWpm: 10;
    defaultTickIntervalMs: 16;
    minimumSpeedStepWpm: 1;
    minimumTickIntervalMs: 1;
}>;
export declare const TpsPlaybackEventNames: Readonly<{
    stateChanged: "stateChanged";
    wordChanged: "wordChanged";
    phraseChanged: "phraseChanged";
    blockChanged: "blockChanged";
    segmentChanged: "segmentChanged";
    statusChanged: "statusChanged";
    completed: "completed";
    snapshotChanged: "snapshotChanged";
}>;
export declare const TpsKeywords: Readonly<{
    frontMatterKeys: Readonly<{
        title: "title";
        profile: "profile";
        duration: "duration";
        baseWpm: "base_wpm";
        author: "author";
        created: "created";
        version: "version";
        speedOffsetsXslow: "speed_offsets.xslow";
        speedOffsetsSlow: "speed_offsets.slow";
        speedOffsetsFast: "speed_offsets.fast";
        speedOffsetsXfast: "speed_offsets.xfast";
    }>;
    legacyKeys: Readonly<{
        displayDuration: "display_duration";
        fastOffset: "fast_offset";
        presetsFast: "presets.fast";
        presetsSlow: "presets.slow";
        presetsXfast: "presets.xfast";
        presetsXslow: "presets.xslow";
        slowOffset: "slow_offset";
        xfastOffset: "xfast_offset";
        xslowOffset: "xslow_offset";
    }>;
    headerTokens: Readonly<{
        title: "# ";
        segment: "## ";
        block: "### ";
        speakerPrefix: "Speaker:";
        archetypePrefix: "Archetype:";
        wpmSuffix: "WPM";
    }>;
    tags: Readonly<{
        aside: "aside";
        breath: "breath";
        building: "building";
        editPoint: "edit_point";
        emphasis: "emphasis";
        energy: "energy";
        fast: "fast";
        highlight: "highlight";
        legato: "legato";
        loud: "loud";
        melody: "melody";
        normal: "normal";
        pause: "pause";
        phonetic: "phonetic";
        pronunciation: "pronunciation";
        rhetorical: "rhetorical";
        sarcasm: "sarcasm";
        slow: "slow";
        soft: "soft";
        staccato: "staccato";
        stress: "stress";
        whisper: "whisper";
        xfast: "xfast";
        xslow: "xslow";
    }>;
    emotions: readonly ["neutral", "warm", "professional", "focused", "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm", "energetic"];
    volumeLevels: readonly ["loud", "soft", "whisper"];
    deliveryModes: readonly ["sarcasm", "aside", "rhetorical", "building"];
    articulationStyles: readonly ["legato", "staccato"];
    archetypes: readonly ["friend", "motivator", "educator", "coach", "storyteller", "entertainer"];
    archetypeProfiles: Readonly<{
        friend: Readonly<{
            articulation: "legato";
            energy: Readonly<{
                min: 4;
                max: 6;
            }>;
            melody: Readonly<{
                min: 6;
                max: 8;
            }>;
            volume: "soft-or-default";
            speed: Readonly<{
                min: 125;
                max: 150;
            }>;
        }>;
        motivator: Readonly<{
            articulation: "legato";
            energy: Readonly<{
                min: 7;
                max: 10;
            }>;
            melody: Readonly<{
                min: 7;
                max: 9;
            }>;
            volume: "loud-only";
            speed: Readonly<{
                min: 145;
                max: 170;
            }>;
        }>;
        educator: Readonly<{
            articulation: "neutral";
            energy: Readonly<{
                min: 3;
                max: 5;
            }>;
            melody: Readonly<{
                min: 2;
                max: 4;
            }>;
            volume: "default-only";
            speed: Readonly<{
                min: 110;
                max: 135;
            }>;
        }>;
        coach: Readonly<{
            articulation: "staccato";
            energy: Readonly<{
                min: 7;
                max: 9;
            }>;
            melody: Readonly<{
                min: 1;
                max: 3;
            }>;
            volume: "loud-only";
            speed: Readonly<{
                min: 135;
                max: 160;
            }>;
        }>;
        storyteller: Readonly<{
            articulation: "flexible";
            energy: Readonly<{
                min: 4;
                max: 7;
            }>;
            melody: Readonly<{
                min: 8;
                max: 10;
            }>;
            volume: "flexible";
            speed: Readonly<{
                min: 100;
                max: 150;
            }>;
        }>;
        entertainer: Readonly<{
            articulation: "flexible";
            energy: Readonly<{
                min: 6;
                max: 8;
            }>;
            melody: Readonly<{
                min: 7;
                max: 9;
            }>;
            volume: "flexible";
            speed: Readonly<{
                min: 140;
                max: 165;
            }>;
        }>;
    }>;
    archetypeRhythmProfiles: Readonly<{
        minimumWords: 12;
        friend: Readonly<{
            phraseLength: Readonly<{
                min: 8;
                max: 15;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 4;
                max: 8;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 300;
                max: 600;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 3;
                max: 8;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 1;
            }>;
        }>;
        motivator: Readonly<{
            phraseLength: Readonly<{
                min: 8;
                max: 20;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 3;
                max: 6;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 600;
                max: 2000;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 10;
                max: 20;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 2;
            }>;
        }>;
        educator: Readonly<{
            phraseLength: Readonly<{
                min: 10;
                max: 25;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 6;
                max: 12;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 400;
                max: 800;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 3;
                max: 8;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 2;
            }>;
        }>;
        coach: Readonly<{
            phraseLength: Readonly<{
                min: 3;
                max: 8;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 8;
                max: 15;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 200;
                max: 400;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 15;
                max: 30;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 2;
            }>;
        }>;
        storyteller: Readonly<{
            phraseLength: Readonly<{
                min: 5;
                max: 20;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 4;
                max: 10;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 500;
                max: 3000;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 5;
                max: 12;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 3;
                max: 6;
            }>;
        }>;
        entertainer: Readonly<{
            phraseLength: Readonly<{
                min: 5;
                max: 15;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 5;
                max: 10;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 300;
                max: 2000;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 5;
                max: 15;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 2;
                max: 4;
            }>;
        }>;
    }>;
    relativeSpeedTags: readonly ["xslow", "slow", "fast", "xfast", "normal"];
    editPointPriorities: readonly ["high", "medium", "low"];
    controlMarkers: Readonly<{
        shortPause: "/";
        mediumPause: "//";
    }>;
    playbackEventNames: Readonly<{
        stateChanged: "stateChanged";
        wordChanged: "wordChanged";
        phraseChanged: "phraseChanged";
        blockChanged: "blockChanged";
        segmentChanged: "segmentChanged";
        statusChanged: "statusChanged";
        completed: "completed";
        snapshotChanged: "snapshotChanged";
    }>;
    warningDiagnosticCodes: readonly ["invalid-header-parameter", "archetype-articulation-mismatch", "archetype-energy-mismatch", "archetype-melody-mismatch", "archetype-volume-mismatch", "archetype-speed-mismatch", "archetype-rhythm-phrase-length", "archetype-rhythm-pause-frequency", "archetype-rhythm-pause-duration", "archetype-rhythm-emphasis-density", "archetype-rhythm-speed-variation"];
}>;
export declare const TpsSpec: Readonly<{
    defaultBaseWpm: 140;
    defaultEmotion: "neutral";
    defaultImplicitSegmentName: "Content";
    defaultProfile: "Actor";
    minimumWpm: 80;
    maximumWpm: 220;
    shortPauseDurationMs: 300;
    mediumPauseDurationMs: 600;
    speakerPrefix: "Speaker:";
    wpmSuffix: "WPM";
    frontMatterKeys: Readonly<{
        title: "title";
        profile: "profile";
        duration: "duration";
        baseWpm: "base_wpm";
        author: "author";
        created: "created";
        version: "version";
        speedOffsetsXslow: "speed_offsets.xslow";
        speedOffsetsSlow: "speed_offsets.slow";
        speedOffsetsFast: "speed_offsets.fast";
        speedOffsetsXfast: "speed_offsets.xfast";
    }>;
    legacyKeys: Readonly<{
        displayDuration: "display_duration";
        fastOffset: "fast_offset";
        presetsFast: "presets.fast";
        presetsSlow: "presets.slow";
        presetsXfast: "presets.xfast";
        presetsXslow: "presets.xslow";
        slowOffset: "slow_offset";
        xfastOffset: "xfast_offset";
        xslowOffset: "xslow_offset";
    }>;
    headerTokens: Readonly<{
        title: "# ";
        segment: "## ";
        block: "### ";
        speakerPrefix: "Speaker:";
        archetypePrefix: "Archetype:";
        wpmSuffix: "WPM";
    }>;
    tags: Readonly<{
        aside: "aside";
        breath: "breath";
        building: "building";
        editPoint: "edit_point";
        emphasis: "emphasis";
        energy: "energy";
        fast: "fast";
        highlight: "highlight";
        legato: "legato";
        loud: "loud";
        melody: "melody";
        normal: "normal";
        pause: "pause";
        phonetic: "phonetic";
        pronunciation: "pronunciation";
        rhetorical: "rhetorical";
        sarcasm: "sarcasm";
        slow: "slow";
        soft: "soft";
        staccato: "staccato";
        stress: "stress";
        whisper: "whisper";
        xfast: "xfast";
        xslow: "xslow";
    }>;
    emotions: readonly ["neutral", "warm", "professional", "focused", "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm", "energetic"];
    volumeLevels: readonly ["loud", "soft", "whisper"];
    deliveryModes: readonly ["sarcasm", "aside", "rhetorical", "building"];
    relativeSpeedTags: readonly ["xslow", "slow", "fast", "xfast", "normal"];
    editPointPriorities: readonly ["high", "medium", "low"];
    controlMarkers: Readonly<{
        shortPause: "/";
        mediumPause: "//";
    }>;
    defaultSpeedOffsets: Readonly<{
        xslow: -40;
        slow: -20;
        fast: 25;
        xfast: 50;
    }>;
    emotionPalettes: Readonly<{
        neutral: {
            accent: string;
            text: string;
            background: string;
        };
        warm: {
            accent: string;
            text: string;
            background: string;
        };
        professional: {
            accent: string;
            text: string;
            background: string;
        };
        focused: {
            accent: string;
            text: string;
            background: string;
        };
        concerned: {
            accent: string;
            text: string;
            background: string;
        };
        urgent: {
            accent: string;
            text: string;
            background: string;
        };
        motivational: {
            accent: string;
            text: string;
            background: string;
        };
        excited: {
            accent: string;
            text: string;
            background: string;
        };
        happy: {
            accent: string;
            text: string;
            background: string;
        };
        sad: {
            accent: string;
            text: string;
            background: string;
        };
        calm: {
            accent: string;
            text: string;
            background: string;
        };
        energetic: {
            accent: string;
            text: string;
            background: string;
        };
    }>;
    emotionHeadCues: Readonly<{
        neutral: "H0";
        calm: "H0";
        professional: "H9";
        focused: "H5";
        motivational: "H9";
        urgent: "H4";
        concerned: "H1";
        sad: "H1";
        warm: "H7";
        happy: "H6";
        excited: "H6";
        energetic: "H8";
    }>;
    diagnosticCodes: Readonly<{
        invalidFrontMatter: "invalid-front-matter";
        invalidHeader: "invalid-header";
        invalidHeaderParameter: "invalid-header-parameter";
        unterminatedTag: "unterminated-tag";
        unknownTag: "unknown-tag";
        invalidPause: "invalid-pause";
        invalidTagArgument: "invalid-tag-argument";
        invalidWpm: "invalid-wpm";
        invalidEnergyLevel: "invalid-energy-level";
        invalidMelodyLevel: "invalid-melody-level";
        unknownArchetype: "unknown-archetype";
        archetypeArticulationMismatch: "archetype-articulation-mismatch";
        archetypeEnergyMismatch: "archetype-energy-mismatch";
        archetypeMelodyMismatch: "archetype-melody-mismatch";
        archetypeVolumeMismatch: "archetype-volume-mismatch";
        archetypeSpeedMismatch: "archetype-speed-mismatch";
        archetypeRhythmPhraseLength: "archetype-rhythm-phrase-length";
        archetypeRhythmPauseFrequency: "archetype-rhythm-pause-frequency";
        archetypeRhythmPauseDuration: "archetype-rhythm-pause-duration";
        archetypeRhythmEmphasisDensity: "archetype-rhythm-emphasis-density";
        archetypeRhythmSpeedVariation: "archetype-rhythm-speed-variation";
        mismatchedClosingTag: "mismatched-closing-tag";
        unclosedTag: "unclosed-tag";
    }>;
    keywords: Readonly<{
        frontMatterKeys: Readonly<{
            title: "title";
            profile: "profile";
            duration: "duration";
            baseWpm: "base_wpm";
            author: "author";
            created: "created";
            version: "version";
            speedOffsetsXslow: "speed_offsets.xslow";
            speedOffsetsSlow: "speed_offsets.slow";
            speedOffsetsFast: "speed_offsets.fast";
            speedOffsetsXfast: "speed_offsets.xfast";
        }>;
        legacyKeys: Readonly<{
            displayDuration: "display_duration";
            fastOffset: "fast_offset";
            presetsFast: "presets.fast";
            presetsSlow: "presets.slow";
            presetsXfast: "presets.xfast";
            presetsXslow: "presets.xslow";
            slowOffset: "slow_offset";
            xfastOffset: "xfast_offset";
            xslowOffset: "xslow_offset";
        }>;
        headerTokens: Readonly<{
            title: "# ";
            segment: "## ";
            block: "### ";
            speakerPrefix: "Speaker:";
            archetypePrefix: "Archetype:";
            wpmSuffix: "WPM";
        }>;
        tags: Readonly<{
            aside: "aside";
            breath: "breath";
            building: "building";
            editPoint: "edit_point";
            emphasis: "emphasis";
            energy: "energy";
            fast: "fast";
            highlight: "highlight";
            legato: "legato";
            loud: "loud";
            melody: "melody";
            normal: "normal";
            pause: "pause";
            phonetic: "phonetic";
            pronunciation: "pronunciation";
            rhetorical: "rhetorical";
            sarcasm: "sarcasm";
            slow: "slow";
            soft: "soft";
            staccato: "staccato";
            stress: "stress";
            whisper: "whisper";
            xfast: "xfast";
            xslow: "xslow";
        }>;
        emotions: readonly ["neutral", "warm", "professional", "focused", "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm", "energetic"];
        volumeLevels: readonly ["loud", "soft", "whisper"];
        deliveryModes: readonly ["sarcasm", "aside", "rhetorical", "building"];
        articulationStyles: readonly ["legato", "staccato"];
        archetypes: readonly ["friend", "motivator", "educator", "coach", "storyteller", "entertainer"];
        archetypeProfiles: Readonly<{
            friend: Readonly<{
                articulation: "legato";
                energy: Readonly<{
                    min: 4;
                    max: 6;
                }>;
                melody: Readonly<{
                    min: 6;
                    max: 8;
                }>;
                volume: "soft-or-default";
                speed: Readonly<{
                    min: 125;
                    max: 150;
                }>;
            }>;
            motivator: Readonly<{
                articulation: "legato";
                energy: Readonly<{
                    min: 7;
                    max: 10;
                }>;
                melody: Readonly<{
                    min: 7;
                    max: 9;
                }>;
                volume: "loud-only";
                speed: Readonly<{
                    min: 145;
                    max: 170;
                }>;
            }>;
            educator: Readonly<{
                articulation: "neutral";
                energy: Readonly<{
                    min: 3;
                    max: 5;
                }>;
                melody: Readonly<{
                    min: 2;
                    max: 4;
                }>;
                volume: "default-only";
                speed: Readonly<{
                    min: 110;
                    max: 135;
                }>;
            }>;
            coach: Readonly<{
                articulation: "staccato";
                energy: Readonly<{
                    min: 7;
                    max: 9;
                }>;
                melody: Readonly<{
                    min: 1;
                    max: 3;
                }>;
                volume: "loud-only";
                speed: Readonly<{
                    min: 135;
                    max: 160;
                }>;
            }>;
            storyteller: Readonly<{
                articulation: "flexible";
                energy: Readonly<{
                    min: 4;
                    max: 7;
                }>;
                melody: Readonly<{
                    min: 8;
                    max: 10;
                }>;
                volume: "flexible";
                speed: Readonly<{
                    min: 100;
                    max: 150;
                }>;
            }>;
            entertainer: Readonly<{
                articulation: "flexible";
                energy: Readonly<{
                    min: 6;
                    max: 8;
                }>;
                melody: Readonly<{
                    min: 7;
                    max: 9;
                }>;
                volume: "flexible";
                speed: Readonly<{
                    min: 140;
                    max: 165;
                }>;
            }>;
        }>;
        archetypeRhythmProfiles: Readonly<{
            minimumWords: 12;
            friend: Readonly<{
                phraseLength: Readonly<{
                    min: 8;
                    max: 15;
                }>;
                pauseFrequencyPer100Words: Readonly<{
                    min: 4;
                    max: 8;
                }>;
                averagePauseDurationMs: Readonly<{
                    min: 300;
                    max: 600;
                }>;
                emphasisDensityPercent: Readonly<{
                    min: 3;
                    max: 8;
                }>;
                speedVariationPer100Words: Readonly<{
                    min: 0;
                    max: 1;
                }>;
            }>;
            motivator: Readonly<{
                phraseLength: Readonly<{
                    min: 8;
                    max: 20;
                }>;
                pauseFrequencyPer100Words: Readonly<{
                    min: 3;
                    max: 6;
                }>;
                averagePauseDurationMs: Readonly<{
                    min: 600;
                    max: 2000;
                }>;
                emphasisDensityPercent: Readonly<{
                    min: 10;
                    max: 20;
                }>;
                speedVariationPer100Words: Readonly<{
                    min: 0;
                    max: 2;
                }>;
            }>;
            educator: Readonly<{
                phraseLength: Readonly<{
                    min: 10;
                    max: 25;
                }>;
                pauseFrequencyPer100Words: Readonly<{
                    min: 6;
                    max: 12;
                }>;
                averagePauseDurationMs: Readonly<{
                    min: 400;
                    max: 800;
                }>;
                emphasisDensityPercent: Readonly<{
                    min: 3;
                    max: 8;
                }>;
                speedVariationPer100Words: Readonly<{
                    min: 0;
                    max: 2;
                }>;
            }>;
            coach: Readonly<{
                phraseLength: Readonly<{
                    min: 3;
                    max: 8;
                }>;
                pauseFrequencyPer100Words: Readonly<{
                    min: 8;
                    max: 15;
                }>;
                averagePauseDurationMs: Readonly<{
                    min: 200;
                    max: 400;
                }>;
                emphasisDensityPercent: Readonly<{
                    min: 15;
                    max: 30;
                }>;
                speedVariationPer100Words: Readonly<{
                    min: 0;
                    max: 2;
                }>;
            }>;
            storyteller: Readonly<{
                phraseLength: Readonly<{
                    min: 5;
                    max: 20;
                }>;
                pauseFrequencyPer100Words: Readonly<{
                    min: 4;
                    max: 10;
                }>;
                averagePauseDurationMs: Readonly<{
                    min: 500;
                    max: 3000;
                }>;
                emphasisDensityPercent: Readonly<{
                    min: 5;
                    max: 12;
                }>;
                speedVariationPer100Words: Readonly<{
                    min: 3;
                    max: 6;
                }>;
            }>;
            entertainer: Readonly<{
                phraseLength: Readonly<{
                    min: 5;
                    max: 15;
                }>;
                pauseFrequencyPer100Words: Readonly<{
                    min: 5;
                    max: 10;
                }>;
                averagePauseDurationMs: Readonly<{
                    min: 300;
                    max: 2000;
                }>;
                emphasisDensityPercent: Readonly<{
                    min: 5;
                    max: 15;
                }>;
                speedVariationPer100Words: Readonly<{
                    min: 2;
                    max: 4;
                }>;
            }>;
        }>;
        relativeSpeedTags: readonly ["xslow", "slow", "fast", "xfast", "normal"];
        editPointPriorities: readonly ["high", "medium", "low"];
        controlMarkers: Readonly<{
            shortPause: "/";
            mediumPause: "//";
        }>;
        playbackEventNames: Readonly<{
            stateChanged: "stateChanged";
            wordChanged: "wordChanged";
            phraseChanged: "phraseChanged";
            blockChanged: "blockChanged";
            segmentChanged: "segmentChanged";
            statusChanged: "statusChanged";
            completed: "completed";
            snapshotChanged: "snapshotChanged";
        }>;
        warningDiagnosticCodes: readonly ["invalid-header-parameter", "archetype-articulation-mismatch", "archetype-energy-mismatch", "archetype-melody-mismatch", "archetype-volume-mismatch", "archetype-speed-mismatch", "archetype-rhythm-phrase-length", "archetype-rhythm-pause-frequency", "archetype-rhythm-pause-duration", "archetype-rhythm-emphasis-density", "archetype-rhythm-speed-variation"];
    }>;
    articulationStyles: readonly ["legato", "staccato"];
    archetypes: readonly ["friend", "motivator", "educator", "coach", "storyteller", "entertainer"];
    archetypeRecommendedWpm: Readonly<{
        friend: 135;
        motivator: 155;
        educator: 120;
        coach: 145;
        storyteller: 125;
        entertainer: 150;
    }>;
    archetypeArticulationExpectations: Readonly<{
        legato: "legato";
        staccato: "staccato";
        neutral: "neutral";
        flexible: "flexible";
    }>;
    archetypeVolumeExpectations: Readonly<{
        defaultOnly: "default-only";
        softOrDefault: "soft-or-default";
        loudOnly: "loud-only";
        flexible: "flexible";
    }>;
    archetypeProfiles: Readonly<{
        friend: Readonly<{
            articulation: "legato";
            energy: Readonly<{
                min: 4;
                max: 6;
            }>;
            melody: Readonly<{
                min: 6;
                max: 8;
            }>;
            volume: "soft-or-default";
            speed: Readonly<{
                min: 125;
                max: 150;
            }>;
        }>;
        motivator: Readonly<{
            articulation: "legato";
            energy: Readonly<{
                min: 7;
                max: 10;
            }>;
            melody: Readonly<{
                min: 7;
                max: 9;
            }>;
            volume: "loud-only";
            speed: Readonly<{
                min: 145;
                max: 170;
            }>;
        }>;
        educator: Readonly<{
            articulation: "neutral";
            energy: Readonly<{
                min: 3;
                max: 5;
            }>;
            melody: Readonly<{
                min: 2;
                max: 4;
            }>;
            volume: "default-only";
            speed: Readonly<{
                min: 110;
                max: 135;
            }>;
        }>;
        coach: Readonly<{
            articulation: "staccato";
            energy: Readonly<{
                min: 7;
                max: 9;
            }>;
            melody: Readonly<{
                min: 1;
                max: 3;
            }>;
            volume: "loud-only";
            speed: Readonly<{
                min: 135;
                max: 160;
            }>;
        }>;
        storyteller: Readonly<{
            articulation: "flexible";
            energy: Readonly<{
                min: 4;
                max: 7;
            }>;
            melody: Readonly<{
                min: 8;
                max: 10;
            }>;
            volume: "flexible";
            speed: Readonly<{
                min: 100;
                max: 150;
            }>;
        }>;
        entertainer: Readonly<{
            articulation: "flexible";
            energy: Readonly<{
                min: 6;
                max: 8;
            }>;
            melody: Readonly<{
                min: 7;
                max: 9;
            }>;
            volume: "flexible";
            speed: Readonly<{
                min: 140;
                max: 165;
            }>;
        }>;
    }>;
    archetypeRhythmProfiles: Readonly<{
        minimumWords: 12;
        friend: Readonly<{
            phraseLength: Readonly<{
                min: 8;
                max: 15;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 4;
                max: 8;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 300;
                max: 600;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 3;
                max: 8;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 1;
            }>;
        }>;
        motivator: Readonly<{
            phraseLength: Readonly<{
                min: 8;
                max: 20;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 3;
                max: 6;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 600;
                max: 2000;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 10;
                max: 20;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 2;
            }>;
        }>;
        educator: Readonly<{
            phraseLength: Readonly<{
                min: 10;
                max: 25;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 6;
                max: 12;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 400;
                max: 800;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 3;
                max: 8;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 2;
            }>;
        }>;
        coach: Readonly<{
            phraseLength: Readonly<{
                min: 3;
                max: 8;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 8;
                max: 15;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 200;
                max: 400;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 15;
                max: 30;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 0;
                max: 2;
            }>;
        }>;
        storyteller: Readonly<{
            phraseLength: Readonly<{
                min: 5;
                max: 20;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 4;
                max: 10;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 500;
                max: 3000;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 5;
                max: 12;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 3;
                max: 6;
            }>;
        }>;
        entertainer: Readonly<{
            phraseLength: Readonly<{
                min: 5;
                max: 15;
            }>;
            pauseFrequencyPer100Words: Readonly<{
                min: 5;
                max: 10;
            }>;
            averagePauseDurationMs: Readonly<{
                min: 300;
                max: 2000;
            }>;
            emphasisDensityPercent: Readonly<{
                min: 5;
                max: 15;
            }>;
            speedVariationPer100Words: Readonly<{
                min: 2;
                max: 4;
            }>;
        }>;
    }>;
    warningDiagnosticCodes: readonly ["invalid-header-parameter", "archetype-articulation-mismatch", "archetype-energy-mismatch", "archetype-melody-mismatch", "archetype-volume-mismatch", "archetype-speed-mismatch", "archetype-rhythm-phrase-length", "archetype-rhythm-pause-frequency", "archetype-rhythm-pause-duration", "archetype-rhythm-emphasis-density", "archetype-rhythm-speed-variation"];
    playbackDefaults: Readonly<{
        defaultSpeedStepWpm: 10;
        defaultTickIntervalMs: 16;
        minimumSpeedStepWpm: 1;
        minimumTickIntervalMs: 1;
    }>;
    playbackEventNames: Readonly<{
        stateChanged: "stateChanged";
        wordChanged: "wordChanged";
        phraseChanged: "phraseChanged";
        blockChanged: "blockChanged";
        segmentChanged: "segmentChanged";
        statusChanged: "statusChanged";
        completed: "completed";
        snapshotChanged: "snapshotChanged";
    }>;
    energyLevels: Readonly<{
        min: 1;
        max: 10;
    }>;
    melodyLevels: Readonly<{
        min: 1;
        max: 10;
    }>;
}>;
export type TpsEmotion = (typeof TpsEmotions)[number];
export type TpsVolumeLevel = (typeof TpsVolumeLevels)[number];
export type TpsDeliveryMode = (typeof TpsDeliveryModes)[number];
export type TpsArticulationStyle = (typeof TpsArticulationStyles)[number];
export type TpsArchetype = (typeof TpsArchetypes)[number];
export type TpsEditPointPriority = (typeof TpsEditPointPriorities)[number];
