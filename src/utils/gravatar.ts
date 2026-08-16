/**
 * Generates Gravatar image URL using Web Crypto API SHA-256 hashing.
 * 
 * @param email User email address
 * @param size Image size in pixels (default: 200)
 * @param defaultStyle Fallback style (default: 'identicon')
 */
export async function getGravatarUrl(
  email: string,
  size = 200,
  defaultStyle = 'identicon'
): Promise<string> {
  if (!email) {
    return `https://www.gravatar.com/avatar/0000000000000000000000000000000000000000000000000000000000000000?s=${size}&d=${defaultStyle}`;
  }

  const normalizedEmail = email.trim().toLowerCase();

  const data = new TextEncoder().encode(normalizedEmail);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultStyle}`;
}
