export interface CampaignFormat {
  key: string;
  label: string;
  aspectRatio: '1:1' | '9:16' | '16:9' | '4:5' | '4:3';
  width: number;
  height: number;
}

export const CAMPAIGN_FORMATS: CampaignFormat[] = [
  { key: 'ig_post',      label: 'Instagram Post',    aspectRatio: '1:1',  width: 1080, height: 1080 },
  { key: 'ig_story',     label: 'Instagram Story',   aspectRatio: '9:16', width: 1080, height: 1920 },
  { key: 'fb_ad',        label: 'Facebook Ad',       aspectRatio: '4:5',  width: 1200, height: 1500 },
  { key: 'fb_cover',     label: 'Facebook Cover',    aspectRatio: '16:9', width: 1640, height: 924 },
  { key: 'twitter',      label: 'Twitter/X Post',    aspectRatio: '16:9', width: 1600, height: 900 },
  { key: 'pinterest',    label: 'Pinterest Pin',     aspectRatio: '9:16', width: 1000, height: 1500 },
  { key: 'youtube',      label: 'YouTube Thumbnail', aspectRatio: '16:9', width: 1280, height: 720 },
  { key: 'linkedin',     label: 'LinkedIn Post',     aspectRatio: '4:3',  width: 1200, height: 627 },
  { key: 'email',        label: 'Email Header',      aspectRatio: '16:9', width: 600,  height: 200 },
  { key: 'web_banner',   label: 'Website Banner',    aspectRatio: '16:9', width: 1920, height: 600 },
];
