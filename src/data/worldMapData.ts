import * as topojson from 'topojson-client';
import worldTopology from 'world-atlas/countries-110m.json';
import { WORLD_LAND_GEOJSON } from './worldLand';

// Extract country features and internal borders from world-atlas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topology = worldTopology as any;

export const countriesGeoJson = (topojson.feature(
  topology,
  topology.objects.countries
) as unknown) as GeoJSON.FeatureCollection;

export const countryBordersMesh = (topojson.mesh(
  topology,
  topology.objects.countries,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (a: any, b: any) => a !== b
) as unknown) as GeoJSON.MultiLineString;

export const landMesh = ((topojson.feature(
  topology,
  topology.objects.land
) as unknown) as GeoJSON.FeatureCollection) || WORLD_LAND_GEOJSON;
