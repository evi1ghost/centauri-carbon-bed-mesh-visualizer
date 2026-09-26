const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMeshProfiles } = require('../mesh-parser.js');

test('parses ELEGOO autosave.cfg SAVE_CONFIG sections', () => {
    const config = `
#*# <---------------------- SAVE_CONFIG ---------------------->
#*# [bed_mesh default]
#*# version = 1
#*# points = 0.10, 0.20,
#*#          0.30, 0.40
#*# algo = bicubic
#*# min_x = 6.0
#*# max_x = 246.0
#*# min_y = 6.0
#*# max_y = 246.0
#*# x_count = 2
#*# y_count = 2
#*#
#*# [bed_mesh ADAPTIVE]
#*# points = -0.10, 0.00, 0.10, 0.20
#*# min_x = 20
#*# max_x = 100
#*# min_y = 30
#*# max_y = 110
#*# x_count = 2
#*# y_count = 2
`;

    const profiles = parseMeshProfiles(config);

    assert.equal(profiles.length, 2);
    assert.equal(profiles[0].label, 'Default mesh');
    assert.equal(profiles[0].format, 'autosave.cfg');
    assert.deepEqual(profiles[0].points, [[0.1, 0.2], [0.3, 0.4]]);
    assert.equal(profiles[0].configs.min_x, 6);
    assert.equal(profiles[0].configs.max_y, 246);
    assert.equal(profiles[0].configs.algorithm, 'bicubic');
    assert.equal(profiles[1].label, 'Adaptive mesh');
    assert.deepEqual(profiles[1].points, [[-0.1, 0], [0.1, 0.2]]);
});

test('keeps support for legacy printer.cfg profiles', () => {
    const config = `
[besh_profile_standard_default]
points: 0.1, 0.2, 0.3, 0.4
min_x: 20
max_x: 220
min_y: 20
max_y: 220
x_count: 2
y_count: 2
`;

    const profiles = parseMeshProfiles(config);

    assert.equal(profiles.length, 1);
    assert.equal(profiles[0].label, 'Side A');
    assert.equal(profiles[0].format, 'legacy printer.cfg');
    assert.deepEqual(profiles[0].points, [[0.1, 0.2], [0.3, 0.4]]);
});

test('rejects a profile when the point count does not match the grid', () => {
    const config = `
#*# [bed_mesh default]
#*# points = 0.1, 0.2, 0.3
#*# x_count = 2
#*# y_count = 2
`;

    assert.deepEqual(parseMeshProfiles(config), []);
});
