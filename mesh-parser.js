(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    root.BedMeshParser = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const LEGACY_PROFILES = {
        besh_profile_standard_default: 'Side A',
        besh_profile_enhancement_default: 'Side B',
        besh_profile_standard_1: 'Side A (Secondary)',
        besh_profile_enhancement_1: 'Side B (Secondary)'
    };

    function normalizeConfig(content) {
        return String(content || '')
            .replace(/^\uFEFF/, '')
            .replace(/^\s*#\*#\s?/gm, '');
    }

    function parseSections(content) {
        const sections = [];
        let currentSection = null;
        let currentKey = null;

        for (const rawLine of normalizeConfig(content).split(/\r?\n/)) {
            const line = rawLine.trim();
            const sectionMatch = line.match(/^\[([^\]]+)]$/);

            if (sectionMatch) {
                currentSection = {
                    name: sectionMatch[1].trim(),
                    values: {}
                };
                sections.push(currentSection);
                currentKey = null;
                continue;
            }

            if (!currentSection || !line || line.startsWith('#')) {
                continue;
            }

            const valueMatch = line.match(/^([A-Za-z_][\w-]*)\s*[:=]\s*(.*)$/);
            if (valueMatch) {
                currentKey = valueMatch[1].toLowerCase();
                currentSection.values[currentKey] = valueMatch[2].trim();
            } else if (currentKey) {
                currentSection.values[currentKey] += ` ${line}`;
            }
        }

        return sections;
    }

    function parseNumber(value, fallback) {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function parseInteger(value, fallback) {
        const parsed = Number.parseInt(value, 10);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
    }

    function parsePointValues(value) {
        if (!value) {
            return [];
        }

        const matches = value.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
        return matches.map(Number).filter(Number.isFinite);
    }

    function autosaveLabel(profileName) {
        if (profileName.toLowerCase() === 'default') {
            return 'Default mesh';
        }
        if (profileName.toLowerCase() === 'adaptive') {
            return 'Adaptive mesh';
        }
        return profileName;
    }

    function makeUniqueKey(sectionName, usedKeys) {
        const base = sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mesh';
        let key = base;
        let suffix = 2;

        while (usedKeys.has(key)) {
            key = `${base}-${suffix}`;
            suffix += 1;
        }

        usedKeys.add(key);
        return key;
    }

    function parseMeshSection(section, profileName, label, format, usedKeys) {
        const values = section.values;
        const meshPoints = parsePointValues(values.points);
        if (meshPoints.length === 0) {
            return null;
        }

        const inferredSide = Math.sqrt(meshPoints.length);
        const inferredCount = Number.isInteger(inferredSide) ? inferredSide : null;
        const xCount = parseInteger(values.x_count, inferredCount);
        const yCount = parseInteger(values.y_count, inferredCount);

        if (!xCount || !yCount || meshPoints.length !== xCount * yCount) {
            return null;
        }

        const points = [];
        for (let row = 0; row < yCount; row += 1) {
            points.push(meshPoints.slice(row * xCount, (row + 1) * xCount));
        }

        return {
            key: makeUniqueKey(section.name, usedKeys),
            sectionName: section.name,
            profileName,
            label,
            format,
            points,
            configs: {
                min_x: parseNumber(values.min_x, 20),
                max_x: parseNumber(values.max_x, 246),
                min_y: parseNumber(values.min_y, 20),
                max_y: parseNumber(values.max_y, 246),
                x_count: xCount,
                y_count: yCount,
                algorithm: values.algo || values.algorithm || 'unknown',
                mesh_x_pps: parseInteger(values.mesh_x_pps, null),
                mesh_y_pps: parseInteger(values.mesh_y_pps, null)
            }
        };
    }

    function parseMeshProfiles(content) {
        const profiles = [];
        const usedKeys = new Set();

        for (const section of parseSections(content)) {
            const autosaveMatch = section.name.match(/^bed_mesh\s+(.+)$/i);
            if (autosaveMatch) {
                const profileName = autosaveMatch[1].trim();
                const profile = parseMeshSection(
                    section,
                    profileName,
                    autosaveLabel(profileName),
                    'autosave.cfg',
                    usedKeys
                );
                if (profile) {
                    profiles.push(profile);
                }
                continue;
            }

            const legacyLabel = LEGACY_PROFILES[section.name.toLowerCase()];
            if (legacyLabel) {
                const profile = parseMeshSection(
                    section,
                    section.name,
                    legacyLabel,
                    'legacy printer.cfg',
                    usedKeys
                );
                if (profile) {
                    profiles.push(profile);
                }
            }
        }

        return profiles;
    }

    return {
        normalizeConfig,
        parseSections,
        parseMeshProfiles
    };
}));
