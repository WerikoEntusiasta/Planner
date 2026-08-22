import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, 
  Settings, Check, Loader2, Sparkles, RefreshCw, AlertCircle
} from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  aspectRatio?: '9:16' | '4:5' | '1:1' | '16:9' | 'auto';
  objectFit?: 'contain' | 'cover';
  autoPlay?: boolean;
  loop?: boolean;
  mutedDefault?: boolean;
  className?: string;
  onDimensionDetected?: (dimensions: { width: number; height: number; ratio: number }) => void;
}

export default function ProfessionalVideoPlayer({
  url,
  poster,
  aspectRatio = 'auto',
  objectFit = 'contain',
  autoPlay = true,
  loop = true,
  mutedDefault = true,
  className = '',
  onDimensionDetected
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const videoNativeRef = useRef<HTMLVideoElement>(null);

  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(mutedDefault);
  const [volume, setVolume] = useState(1);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(mutedDefault);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number; ratio: number } | null>(null);

  // Reset state on URL change
  useEffect(() => {
    setPlayed(0);
    setSeeking(false);
    setHasError(false);
    setBuffering(false);
    setPlaying(autoPlay);
    setShowUnmuteHint(mutedDefault);
  }, [url]);

  const handlePlayPause = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlaying(prev => !prev);
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMuted(prev => {
      const next = !prev;
      if (!next && volume === 0) setVolume(0.8);
      setShowUnmuteHint(false);
      return next;
    });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setMuted(val === 0);
    setShowUnmuteHint(false);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat((e.target as HTMLInputElement).value));
    }
  };

  const handleSeekContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.max(0, Math.min(1, clickX / rect.width));
    setPlayed(fraction);
    if (playerRef.current) {
      playerRef.current.seekTo(fraction);
    }
  };

  const handleFullscreen = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Inspect video metadata to detect exact natural dimensions
  const handleInspectMetadata = (e: any) => {
    try {
      const v = e?.target;
      if (v && v.videoWidth && v.videoHeight) {
        const info = {
          width: v.videoWidth,
          height: v.videoHeight,
          ratio: v.videoWidth / v.videoHeight
        };
        setNaturalDimensions(info);
        if (onDimensionDetected) {
          onDimensionDetected(info);
        }
      }
    } catch (err) {}
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-black flex items-center justify-center overflow-hidden group select-none ${className}`}
      style={{
        aspectRatio: aspectRatio !== 'auto' 
          ? (aspectRatio === '9:16' ? '9/16' : aspectRatio === '4:5' ? '4/5' : aspectRatio === '16:9' ? '16/9' : '1/1')
          : (naturalDimensions ? `${naturalDimensions.width} / ${naturalDimensions.height}` : undefined)
      }}
    >
      {/* ReactPlayer instance */}
      {!hasError ? (
        <div 
          className="w-full h-full flex items-center justify-center cursor-pointer"
          onClick={handlePlayPause}
        >
          {React.createElement(ReactPlayer as any, {
            ref: playerRef,
            url: url,
            src: url,
            playing: playing,
            loop: loop,
            muted: muted,
            volume: volume,
            playbackRate: playbackRate,
            width: "100%",
            height: "100%",
            playsinline: true,
            style: {
              position: 'relative'
            },
            onReady: () => {
              setBuffering(false);
              setHasError(false);
            },
            onBuffer: () => setBuffering(true),
            onBufferEnd: () => setBuffering(false),
            onProgress: (state: any) => handleProgress(state),
            onDuration: (dur: number) => handleDuration(dur),
            onError: (err: any) => {
              console.warn('ReactPlayer fallback:', err);
              setHasError(true);
              setErrorMessage('Usando reprodutor alternativo');
            }
          })}
        </div>
      ) : (
        /* Native HTML5 fallback with same styled controls */
        <div 
          className="relative w-full h-full flex items-center justify-center cursor-pointer"
          onClick={handlePlayPause}
        >
          <video
            ref={videoNativeRef}
            src={url}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline
            preload="auto"
            onLoadedMetadata={handleInspectMetadata}
            onTimeUpdate={(e) => {
              if (!seeking && e.currentTarget.duration) {
                setPlayed(e.currentTarget.currentTime / e.currentTarget.duration);
              }
            }}
            className={`w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'}`}
          />
        </div>
      )}

      {/* Buffering Spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
          <Loader2 size={36} className="text-purple-400 animate-spin" />
        </div>
      )}

      {/* Center Big Play Button Overlay when paused */}
      {!playing && !buffering && (
        <div 
          onClick={handlePlayPause}
          className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-all z-20"
        >
          <div className="w-16 h-16 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all">
            <Play size={30} className="ml-1 fill-white" />
          </div>
        </div>
      )}

      {/* Unmute Hint Badge */}
      {muted && playing && showUnmuteHint && (
        <button
          type="button"
          onClick={handleToggleMute}
          className="absolute top-3 left-3 z-30 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black transition-all shadow-lg cursor-pointer animate-bounce"
        >
          <VolumeX size={14} className="text-amber-400" />
          <span>🔊 Toque para ouvir o áudio</span>
        </button>
      )}

      {/* Bottom Floating Control Bar */}
      <div 
        className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 pt-6 flex flex-col gap-2 z-20 opacity-90 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrubber Progress Bar */}
        <div 
          className="w-full h-1.5 hover:h-2.5 bg-white/25 rounded-full cursor-pointer transition-all relative overflow-hidden group/bar"
          onClick={handleSeekContainerClick}
        >
          <div 
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full pointer-events-none"
            style={{ width: `${played * 100}%` }}
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-white text-xs">
          {/* Left Controls: Play, Mute/Volume, Time */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-1 hover:text-purple-400 transition-colors cursor-pointer"
              title={playing ? 'Pausar' : 'Reproduzir'}
            >
              {playing ? <Pause size={17} /> : <Play size={17} className="fill-white" />}
            </button>

            <div className="flex items-center gap-1 group/volume relative">
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1 hover:text-purple-400 transition-colors cursor-pointer flex items-center gap-1"
                title={muted ? 'Ativar som' : 'Silenciar áudio'}
              >
                {muted || volume === 0 ? (
                  <VolumeX size={17} className="text-amber-400" />
                ) : (
                  <Volume2 size={17} className="text-emerald-400" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-18 h-1 accent-purple-500 cursor-pointer"
                title="Ajustar volume"
              />
            </div>

            <span className="font-mono text-[10px] text-zinc-300 ml-1">
              {formatTime(played * duration)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls: Playback Speed, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu(prev => !prev)}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                title="Velocidade de reprodução"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-7 right-0 bg-zinc-900 border border-zinc-700 rounded-xl p-1 shadow-2xl flex flex-col gap-1 min-w-[70px] z-40">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`px-2 py-1 text-[11px] font-mono text-left rounded-lg flex items-center justify-between cursor-pointer ${
                        playbackRate === rate ? 'bg-purple-600 text-white font-bold' : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={handleFullscreen}
              className="p-1 hover:text-purple-400 transition-colors cursor-pointer"
              title="Tela Cheia"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
