import type { ExtendedFeatureCollection } from 'd3-geo';

// High-fidelity simplified world landmass polygons (continents and major landmasses)
// Formatted as standard GeoJSON for d3-geo orthographic projection.

export const WORLD_LAND_GEOJSON: ExtendedFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // Eurasia & Africa (connected Afro-Eurasian landmass simplified)
    {
      type: 'Feature',
      properties: { name: 'Eurasia & Africa' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Northern Europe & Scandinavia
            [10, 54], [12, 56], [10, 60], [5, 62], [14, 68], [24, 71], [31, 70], [40, 68],
            [50, 68], [68, 73], [76, 73], [86, 74], [105, 78], [115, 76], [130, 72], [150, 71],
            [170, 70], [180, 66], [170, 64], [162, 56], [156, 51], [143, 50], [135, 43], [130, 38],
            // East Asia & China coast
            [122, 38], [120, 34], [122, 30], [118, 25], [110, 20], [108, 16], [105, 10], [103, 1],
            // Southeast Asia & Malaya
            [100, 4], [98, 10], [95, 18], [90, 22],
            // Indian subcontinent
            [88, 22], [85, 20], [80, 16], [80, 10], [77, 8], [75, 12], [73, 18], [68, 24],
            // Arabian Sea & Persian Gulf
            [62, 25], [56, 26], [51, 25], [50, 29], [48, 30], [55, 24], [59, 22], [54, 16], [45, 13],
            // Horn of Africa & East Africa
            [51, 12], [49, 10], [43, 12], [41, 4], [40, -4], [39, -10], [35, -15], [35, -24],
            // South Africa & Cape
            [32, -28], [28, -32], [20, -34], [18, -34], [16, -30], [13, -23], [12, -15],
            // West Africa & Gulf of Guinea
            [10, -5], [9, 4], [4, 6], [-3, 5], [-8, 4], [-15, 10], [-17, 15], [-16, 20],
            // Northwest Africa / Maghreb
            [-13, 28], [-10, 30], [-6, 36], [-1, 36], [10, 37], [11, 33], [15, 32], [25, 32], [30, 31],
            // Levant & Anatolia & Mediterranean
            [34, 32], [36, 36], [30, 36], [26, 37], [28, 41], [23, 40], [22, 37], [20, 40],
            // Italy & Southern Europe
            [16, 41], [16, 38], [12, 42], [14, 45], [9, 44], [3, 42], [-1, 39], [-8, 37], [-9, 42],
            // Western Europe: France, Low countries, Germany
            [-1, 44], [-4, 48], [-1, 49], [2, 51], [7, 54], [10, 54]
          ]
        ]
      }
    },
    // Great Britain
    {
      type: 'Feature',
      properties: { name: 'Great Britain' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[-5, 50], [1, 51], [1.5, 52.5], [0, 54], [-2, 57], [-4, 58.5], [-5, 57], [-4.5, 54], [-3, 51.5], [-5, 50]]
        ]
      }
    },
    // Ireland
    {
      type: 'Feature',
      properties: { name: 'Ireland' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[-6, 52], [-6, 54.5], [-8, 55], [-10, 54], [-10, 52], [-8, 51.5], [-6, 52]]
        ]
      }
    },
    // Japan
    {
      type: 'Feature',
      properties: { name: 'Japan' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[131, 31], [133, 33], [137, 35], [141, 38], [141, 43], [145, 44], [142, 45], [140, 41], [136, 36], [130, 33], [131, 31]]
        ]
      }
    },
    // Madagascar
    {
      type: 'Feature',
      properties: { name: 'Madagascar' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[49, -12], [50, -16], [47, -25], [44, -25], [44, -18], [47, -13], [49, -12]]
        ]
      }
    },
    // North America
    {
      type: 'Feature',
      properties: { name: 'North America' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            // Alaska
            [-168, 66], [-160, 71], [-140, 70], [-125, 69], [-105, 69], [-85, 66],
            // Hudson Bay & Labrador & Atlantic Coast
            [-80, 60], [-65, 58], [-55, 52], [-60, 46], [-66, 44], [-70, 42], [-75, 36],
            // Florida & Gulf of Mexico
            [-80, 28], [-80, 25], [-82, 28], [-88, 30], [-97, 26], [-97, 22],
            // Central America
            [-90, 15], [-84, 10], [-79, 8], [-77, 8], [-83, 10], [-87, 14], [-94, 16],
            // Pacific Coast
            [-105, 22], [-110, 24], [-115, 30], [-120, 34], [-124, 40], [-124, 48],
            [-130, 54], [-140, 59], [-152, 60], [-165, 60], [-168, 66]
          ]
        ]
      }
    },
    // South America
    {
      type: 'Feature',
      properties: { name: 'South America' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-77, 8], [-72, 11], [-62, 10], [-50, 0], [-35, -5], [-35, -10],
            [-39, -15], [-40, -22], [-48, -28], [-55, -34], [-65, -45],
            // Tierra del Fuego
            [-68, -54], [-73, -53], [-74, -45], [-72, -35], [-70, -20],
            [-78, -5], [-80, -2], [-77, 4], [-77, 8]
          ]
        ]
      }
    },
    // Australia
    {
      type: 'Feature',
      properties: { name: 'Australia' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [142, -11], [145, -15], [153, -28], [150, -37], [145, -38],
            [138, -35], [130, -32], [115, -34], [114, -26], [120, -20],
            [130, -14], [136, -12], [142, -11]
          ]
        ]
      }
    },
    // Greenland
    {
      type: 'Feature',
      properties: { name: 'Greenland' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [[-45, 60], [-35, 65], [-20, 75], [-25, 82], [-40, 83], [-55, 80], [-50, 70], [-45, 60]]
        ]
      }
    },
    // Antarctica
    {
      type: 'Feature',
      properties: { name: 'Antarctica' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-180, -78], [-120, -75], [-60, -65], [0, -70],
            [60, -68], [120, -66], [180, -78]
          ]
        ]
      }
    }
  ]
};
