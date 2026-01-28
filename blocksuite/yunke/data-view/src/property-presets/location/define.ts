import zod from 'zod';

import { t } from '../../core/logical/type-presets.js';
import { propertyType } from '../../core/property/property-config.js';

export const locationPropertyType = propertyType('location');

const locationValueSchema = zod.object({
  latitude: zod.number(),
  longitude: zod.number(),
  address: zod.string().optional(),
  name: zod.string().optional(),
});

export type LocationValue = zod.infer<typeof locationValueSchema>;

export const locationPropertyModelConfig = locationPropertyType.modelConfig({
  name: '地理位置',
  propertyData: {
    schema: zod.object({
      showMap: zod.boolean().default(false),
      defaultZoom: zod.number().default(15),
    }),
    default: () => ({
      showMap: false,
      defaultZoom: 15,
    }),
  },
  jsonValue: {
    schema: locationValueSchema.nullable(),
    isEmpty: value => !value || (value.latitude === 0 && value.longitude === 0),
    type: () => t.string.instance(),
  },
  rawValue: {
    schema: locationValueSchema.nullable(),
    default: () => null,
    toString: ({ value }) => {
      if (!value) return '';
      if (value.address) return value.address;
      if (value.name) return value.name;
      return `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
    },
    fromString: ({ value }) => {
      if (!value) return { value: null };
      // 尝试解析 "lat, lng" 格式
      const parts = value.split(',').map(s => s.trim());
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { value: { latitude: lat, longitude: lng } };
        }
      }
      return { value: null };
    },
    toJson: ({ value }) => value,
    fromJson: ({ value }) => value,
  },
});
