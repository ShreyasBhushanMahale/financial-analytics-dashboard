import { Avatar } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { initials } from '../../utils/initials';

const TONES = ['primary', 'warning', 'info', 'secondary'] as const;

// The same name always gets the same colour, so a user is recognisable across the app.
function toneFor(name: string): (typeof TONES)[number] {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length] ?? 'primary';
}

interface UserAvatarProps {
  name: string;
  size?: number;
}

/**
 * Initials on a tinted square. The data's user_profile URL is deliberately never loaded: that
 * site returns a different random face on every request, so it can't identify anyone.
 */
export function UserAvatar({ name, size = 40 }: UserAvatarProps) {
  const tone = toneFor(name);
  return (
    <Avatar
      variant="rounded"
      aria-hidden
      sx={(theme) => ({
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 600,
        color: theme.palette[tone].main,
        bgcolor: alpha(theme.palette[tone].main, 0.16),
      })}
    >
      {initials(name)}
    </Avatar>
  );
}
