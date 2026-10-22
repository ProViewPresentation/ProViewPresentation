import { useMediaUrl } from '../lib/media';
import type { Slide, ThemeId } from '../lib/types';
import { asset, cn } from '../lib/utils';

export function SlideView({
  slide,
  className,
  clear = false,
  black = false,
  motion = false,
}: {
  slide: Slide | null;
  className?: string;
  clear?: boolean;
  black?: boolean;
  motion?: boolean;
}) {
  const mediaUrl = useMediaUrl(slide?.backgroundUrl);
  const style =
    slide?.theme === 'mountain' && !mediaUrl
      ? { backgroundImage: `url("${asset('images/mountain-dawn.jpg')}")` }
      : undefined;
  return (
    <div
      className={cn('slide-view', `theme-${slide?.theme || 'midnight'}`, black && 'slide-black', className)}
      style={style}
    >
      {!black && slide && (
        <>
          {mediaUrl &&
            (slide.mediaType === 'video' ? (
              <video src={mediaUrl} autoPlay={motion} loop muted playsInline className="slide-media" />
            ) : (
              <img src={mediaUrl} alt="" className="slide-media" />
            ))}
          <div className="slide-shade" />
          {!clear && (
            <div className="slide-content">
              <div className="slide-text" style={{ fontSize: `${slide.fontSize / 10}cqw` }}>
                {slide.text}
              </div>
              {slide.subtitle && <div className="slide-subtitle">{slide.subtitle}</div>}
            </div>
          )}
          {!clear && slide.credit && <div className="slide-credit">{slide.credit}</div>}
        </>
      )}
    </div>
  );
}
export function ThemeSwatch({
  theme,
  selected = false,
  onClick,
  name,
}: {
  theme: ThemeId;
  selected?: boolean;
  onClick: () => void;
  name: string;
}) {
  return (
    <button
      type="button"
      aria-label={name}
      title={name}
      aria-pressed={selected}
      className={cn('theme-swatch', `theme-${theme}`, selected && 'selected')}
      style={
        theme === 'mountain' ? { backgroundImage: `url("${asset('images/mountain-dawn.jpg')}")` } : undefined
      }
      onClick={onClick}
    />
  );
}
