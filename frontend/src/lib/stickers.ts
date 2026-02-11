// Emoji stickers
export const EMOJI_STICKERS = [
  // Faces
  '😀', '😂', '🥰', '😎', '🤩', '😇',
  // Hearts
  '❤️', '💛', '💚', '💙', '💜', '🖤',
  // Hands
  '👍', '👋', '✌️', '🤟', '👏', '🙌',
  // Objects
  '⭐', '🔥', '💯', '🎉', '🎨', '📸',
  // Nature
  '🌟', '🌈', '🌸', '🍀', '🦋', '✨',
];

// SVG sticker categories and manifest
export interface SvgSticker {
  name: string;
  src: string; // path in /public/stickers/
  category: string;
}

export const STICKER_CATEGORIES = ['Shapes', 'Arrows', 'Badges', 'Social', 'Fun'];

export const SVG_STICKERS: SvgSticker[] = [
  // Shapes
  { name: 'Star', src: '/stickers/star.svg', category: 'Shapes' },
  { name: 'Heart', src: '/stickers/heart.svg', category: 'Shapes' },
  { name: 'Circle', src: '/stickers/circle.svg', category: 'Shapes' },
  { name: 'Diamond', src: '/stickers/diamond.svg', category: 'Shapes' },
  { name: 'Hexagon', src: '/stickers/hexagon.svg', category: 'Shapes' },
  { name: 'Triangle', src: '/stickers/triangle.svg', category: 'Shapes' },
  { name: 'Cross', src: '/stickers/cross.svg', category: 'Shapes' },
  // Arrows
  { name: 'Arrow Right', src: '/stickers/arrow-right.svg', category: 'Arrows' },
  { name: 'Arrow Up', src: '/stickers/arrow-up.svg', category: 'Arrows' },
  { name: 'Arrow Down', src: '/stickers/arrow-down.svg', category: 'Arrows' },
  { name: 'Arrow Left', src: '/stickers/arrow-left.svg', category: 'Arrows' },
  { name: 'Curved Arrow', src: '/stickers/curved-arrow.svg', category: 'Arrows' },
  // Badges
  { name: 'Badge Star', src: '/stickers/badge-star.svg', category: 'Badges' },
  { name: 'Badge Check', src: '/stickers/badge-check.svg', category: 'Badges' },
  { name: 'Badge Crown', src: '/stickers/badge-crown.svg', category: 'Badges' },
  { name: 'Ribbon', src: '/stickers/ribbon.svg', category: 'Badges' },
  { name: 'Shield', src: '/stickers/shield.svg', category: 'Badges' },
  // Social
  { name: 'Like', src: '/stickers/like.svg', category: 'Social' },
  { name: 'Comment', src: '/stickers/comment.svg', category: 'Social' },
  { name: 'Share', src: '/stickers/share.svg', category: 'Social' },
  { name: 'Camera', src: '/stickers/camera.svg', category: 'Social' },
  { name: 'Music', src: '/stickers/music.svg', category: 'Social' },
  // Fun
  { name: 'Lightning', src: '/stickers/lightning.svg', category: 'Fun' },
  { name: 'Fire', src: '/stickers/fire.svg', category: 'Fun' },
  { name: 'Sparkle', src: '/stickers/sparkle.svg', category: 'Fun' },
  { name: 'Rainbow', src: '/stickers/rainbow.svg', category: 'Fun' },
  { name: 'Sun', src: '/stickers/sun.svg', category: 'Fun' },
  { name: 'Moon', src: '/stickers/moon.svg', category: 'Fun' },
  { name: 'Cloud', src: '/stickers/cloud.svg', category: 'Fun' },
];
