import type { TemplateSectionKey } from './types'

export const TEMPLATE_SECTIONS: { key: TemplateSectionKey; label: string; helper: string }[] = [
  { key: 'hero', label: 'Banners', helper: 'Main banner images + hero content.' },
  { key: 'overview', label: 'Overview', helper: 'Project overview copy + key points.' },
  { key: 'gallery', label: 'Gallery', helper: 'Gallery images grouped by sections (kitchen, interior, living, dining).' },
  { key: 'media', label: 'Media', helper: 'Videos (intro/walkthrough/extra) + Reels (3 max).' },
  { key: 'floorplans', label: 'Floor plans', helper: 'BHK tabs, types, and floor plan images.' },
  { key: 'amenities', label: 'Amenities', helper: 'Amenity cards + icons/images.' },
  { key: 'highlights', label: 'Highlights', helper: 'Highlight cards (USP list).' },
  { key: 'benefits', label: 'Benefits', helper: 'Stats + benefits background images.' },
  { key: 'location', label: 'Social infrastructure', helper: 'Nearby places list (school, metro, hospital, etc.).' },
]
