import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  videoSrc: string;
}

export function VideoPlayer({ videoSrc }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.3); // 30% default
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    // Autoplay when component mounts and set default volume
    if (videoRef.current) {
      videoRef.current.volume = 0.3; // Set default volume to 30%
      videoRef.current.play().catch(() => {
        // Autoplay was prevented, user interaction required
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setShowOverlay(true);
      } else {
        videoRef.current.play();
        setShowOverlay(false);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      // Unmute if volume is increased from 0
      if (newVolume > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden group">
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
      />

      {/* Pause Overlay */}
      {showOverlay && !isPlaying && (
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center text-white p-6">
            <h3 className="text-xl font-semibold mb-2">404: Internship Not Found</h3>
            <p className="text-sm opacity-90">
              Applied to 100 roles, got more rejection emails than LinkedIn notifications.
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all backdrop-blur-sm"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all backdrop-blur-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-2">
          <VolumeX className="w-3 h-3 text-white/70" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            aria-label="Volume"
          />
          <Volume2 className="w-3 h-3 text-white/70" />
        </div>
      </div>

      {/* Bottom Gradient for better control visibility */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-black/50 to-transparent pointer-events-none" />
    </div>
  );
}
