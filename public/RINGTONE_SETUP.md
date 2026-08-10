# Ringtone Setup for Incoming Calls

## Option 1: Use a Free Ringtone (Recommended)

Download a free ringtone and place it in `weconnect/public/ringtone.mp3`

### Free Ringtone Sources:
1. **Zedge** - https://www.zedge.net/ringtones
2. **FreeSoundEffects** - https://www.freesoundeffects.com/free-sounds/phone-10014/
3. **Pixabay** - https://pixabay.com/sound-effects/search/phone-ring/

### Recommended Ringtones:
- Classic phone ring
- WhatsApp call tone
- Teams call tone
- Simple beep pattern

## Option 2: Generate a Simple Ringtone

If you have `ffmpeg` installed, you can generate a simple ringtone:

```bash
# Generate a 2-second beep pattern
ffmpeg -f lavfi -i "sine=frequency=800:duration=0.5" -f lavfi -i "sine=frequency=0:duration=0.5" -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1[out]" -map "[out]" -ar 44100 -ac 2 public/ringtone.mp3
```

## Option 3: Use Online Ringtone Generator

1. Go to https://www.onlinetonegenerator.com/
2. Set frequency to 800 Hz
3. Duration: 2 seconds
4. Generate and download
5. Save as `weconnect/public/ringtone.mp3`

## Option 4: Use a Data URI (No File Needed)

If you don't want to use a file, you can use a data URI in the code.

Edit `weconnect/src/components/organization/IncomingMeetingModal.tsx`:

```typescript
// Replace this line:
audioRef.current = new Audio("/ringtone.mp3");

// With this:
audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2CBhku+zooVARC0yl4fG5ZRwFNo3V7859KQUofsz");
```

## Option 5: Use Browser Beep API

For a simple beep without any file:

```typescript
// In IncomingMeetingModal.tsx, replace the audio code with:
const playBeep = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

// Then call playBeep() in a loop
const interval = setInterval(playBeep, 1000);
```

## Current Setup

The code expects a file at: `weconnect/public/ringtone.mp3`

If this file doesn't exist, the ringtone won't play but the modal will still work.

## Testing

1. Place your ringtone file in `weconnect/public/ringtone.mp3`
2. Start the app
3. Have another user start a meeting
4. You should hear the ringtone and see the incoming call modal

## Troubleshooting

### No sound plays
- Check browser console for errors
- Verify the file exists at `public/ringtone.mp3`
- Check browser audio permissions
- Try clicking somewhere on the page first (browsers block autoplay)

### Sound is too loud/quiet
Edit `IncomingMeetingModal.tsx` and change:
```typescript
audioRef.current.volume = 0.5; // Change from 0.0 (silent) to 1.0 (max)
```

### Want a different sound
Replace `public/ringtone.mp3` with your preferred sound file
