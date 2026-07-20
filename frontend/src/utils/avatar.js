/**
 * Helper para resolver la URL estática del avatar asignado al usuario
 */
export function getAvatarUrl(avatarName) {
  if (!avatarName) return '/avatars/avatar1.png';
  const cleanName = avatarName.replace(/^avatar_?0*(\d+)/, (match, p1) => `avatar${p1}`);
  return `/avatars/${cleanName}`;
}

export const ALL_AVATARS = Array.from({ length: 26 }, (_, i) => ({
  id: `avatar${i + 1}.png`,
  name: `Avatar ${i + 1}`,
  url: `/avatars/avatar${i + 1}.png`,
}));
