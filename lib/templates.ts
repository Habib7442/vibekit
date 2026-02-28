export interface ReelTemplate {
  id: string;
  name: string;
  description: string;
  previewVideo: string;
  style: string;
  promptPrefix: string;
  color: string;
}

export const REEL_TEMPLATES: ReelTemplate[] = [
  {
    id: 'pop-art',
    name: 'Pop Art Montage',
    description: 'Transform your photos into vibrant, high-contrast comic book style art.',
    previewVideo: '/reel_template/popart.mp4',
    style: 'Pop Art',
    promptPrefix: 'A vibrant pop-art style illustration with bold outlines, halftone dots, and high-contrast primary colors.',
    color: '#FF007A'
  }
];
