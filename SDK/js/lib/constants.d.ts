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
    fast: "fast";
    highlight: "highlight";
    loud: "loud";
    normal: "normal";
    pause: "pause";
    phonetic: "phonetic";
    pronunciation: "pronunciation";
    rhetorical: "rhetorical";
    sarcasm: "sarcasm";
    slow: "slow";
    soft: "soft";
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
    wpmSuffix: "WPM";
}>;
export declare const TpsEmotions: readonly ["neutral", "warm", "professional", "focused", "concerned", "urgent", "motivational", "excited", "happy", "sad", "calm", "energetic"];
export declare const TpsVolumeLevels: readonly ["loud", "soft", "whisper"];
export declare const TpsDeliveryModes: readonly ["sarcasm", "aside", "rhetorical", "building"];
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
    mismatchedClosingTag: "mismatched-closing-tag";
    unclosedTag: "unclosed-tag";
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
        wpmSuffix: "WPM";
    }>;
    tags: Readonly<{
        aside: "aside";
        breath: "breath";
        building: "building";
        editPoint: "edit_point";
        emphasis: "emphasis";
        fast: "fast";
        highlight: "highlight";
        loud: "loud";
        normal: "normal";
        pause: "pause";
        phonetic: "phonetic";
        pronunciation: "pronunciation";
        rhetorical: "rhetorical";
        sarcasm: "sarcasm";
        slow: "slow";
        soft: "soft";
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
        wpmSuffix: "WPM";
    }>;
    tags: Readonly<{
        aside: "aside";
        breath: "breath";
        building: "building";
        editPoint: "edit_point";
        emphasis: "emphasis";
        fast: "fast";
        highlight: "highlight";
        loud: "loud";
        normal: "normal";
        pause: "pause";
        phonetic: "phonetic";
        pronunciation: "pronunciation";
        rhetorical: "rhetorical";
        sarcasm: "sarcasm";
        slow: "slow";
        soft: "soft";
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
            wpmSuffix: "WPM";
        }>;
        tags: Readonly<{
            aside: "aside";
            breath: "breath";
            building: "building";
            editPoint: "edit_point";
            emphasis: "emphasis";
            fast: "fast";
            highlight: "highlight";
            loud: "loud";
            normal: "normal";
            pause: "pause";
            phonetic: "phonetic";
            pronunciation: "pronunciation";
            rhetorical: "rhetorical";
            sarcasm: "sarcasm";
            slow: "slow";
            soft: "soft";
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
    }>;
}>;
export type TpsEmotion = (typeof TpsEmotions)[number];
export type TpsVolumeLevel = (typeof TpsVolumeLevels)[number];
export type TpsDeliveryMode = (typeof TpsDeliveryModes)[number];
export type TpsEditPointPriority = (typeof TpsEditPointPriorities)[number];
