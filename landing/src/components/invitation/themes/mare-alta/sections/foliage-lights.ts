/**
 * The hero's twinkling lights: one small circle per tuft of foliage, as
 * `[cx, cy, r]` in the artwork's own 1024×1536 space.
 *
 * Theme art, not content: the coordinates are tied to the embroidered villa and
 * its trees, and the SVG that draws them (`preserveAspectRatio="xMidYMid
 * slice"`, over an `object-fit: cover` image) keeps them on the trees at every
 * size. The designer's rule: lights on the foliage only, never on the sky.
 *
 * The order matters. The stylesheet staggers each light by its position
 * (`circle:nth-child(8n + 3)`…), so the list is rendered as it is written.
 */
export const FOLIAGE_LIGHTS: ReadonlyArray<readonly [cx: number, cy: number, r: number]> = [
  // Large umbrella pine, left
  [45, 875, 4], [92, 843, 3.5], [143, 829, 4], [195, 846, 3.5], [248, 858, 4],
  [302, 887, 3.5], [344, 918, 4], [78, 925, 3.5], [159, 915, 4], [235, 929, 3.5],
  // Pines and foliage, left
  [20, 1008, 3.5], [57, 990, 4], [96, 1016, 3.5], [38, 1045, 4], [83, 1054, 3.5],
  [210, 1008, 4], [198, 1064, 3.5], [218, 1127, 4], [202, 1190, 3.5], [220, 1254, 4],
  [207, 1315, 3.5], [302, 975, 3.5], [289, 1013, 3.5],
  // Cypresses behind the house
  [683, 982, 3.5], [700, 1021, 3.5], [718, 956, 4], [737, 1000, 3.5], [790, 982, 3.5],
  [804, 1034, 4],
  // Large umbrella pine, right
  [777, 898, 4], [821, 862, 3.5], [866, 839, 4], [913, 847, 3.5], [962, 866, 4],
  [1004, 898, 3.5], [804, 934, 3.5], [865, 918, 4], [929, 929, 3.5], [987, 946, 4],
  // Pines and foliage, right
  [835, 1015, 3.5], [876, 994, 4], [918, 1023, 3.5], [855, 1055, 4], [904, 1064, 3.5],
  [810, 1086, 4], [826, 1150, 3.5], [813, 1216, 4], [829, 1280, 3.5], [818, 1331, 4],
  [967, 1032, 3.5], [1006, 1075, 4], [977, 1124, 3.5],
  // Gardens and hedges at the foot of the villa
  [116, 1218, 3.5], [163, 1281, 3.5], [358, 1248, 4], [395, 1306, 3.5], [627, 1301, 3.5],
  [665, 1246, 4], [876, 1285, 3.5], [929, 1218, 3.5], [87, 1360, 4], [315, 1381, 3.5],
  [701, 1382, 3.5], [936, 1361, 4],
];
