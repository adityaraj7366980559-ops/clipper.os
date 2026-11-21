"""
ClipForge - 60-Second Sample Video Generator
Generates a realistic 1920x1080 30fps test video with:
- Dynamic colored backgrounds and scene cuts
- Simulated speaker face circle for face-tracking algorithms
- Speech audio and natural conversational pauses
- Text captions displaying timestamps and scene IDs
"""

import os
import subprocess
import sys
import math
import struct
import wave

def generate_sample_audio(wav_path: str, duration: float = 60.0):
    sample_rate = 16000
    total_samples = int(sample_rate * duration)
    
    # Sequence of phrase bursts (start_time, end_time, pitch_hz)
    phrases = [
        (1.0, 4.5, 220),    # Hook sentence
        (5.5, 9.0, 240),    # Followup sentence
        (10.0, 14.0, 210),  # Insight point
        (15.5, 20.0, 230),  # Story opening
        (22.0, 28.0, 250),  # Climactic moment (high virality)
        (30.0, 36.0, 210),  # Punchline
        (38.0, 44.0, 235),  # Secondary takeaway
        (46.0, 52.0, 225),  # Actionable advice
        (54.0, 58.5, 240),  # Call to action
    ]
    
    samples = bytearray()
    
    for i in range(total_samples):
        t = i / sample_rate
        in_phrase = False
        val = 0.0
        
        for start, end, pitch in phrases:
            if start <= t <= end:
                in_phrase = True
                local_t = t - start
                phrase_len = end - start
                env = math.sin(math.pi * min(1.0, local_t * 5.0) * 0.5) * math.sin(math.pi * min(1.0, (phrase_len - local_t) * 5.0) * 0.5)
                syllable_mod = 0.5 + 0.5 * math.sin(2 * math.pi * 3.5 * t)
                f0 = pitch + 15 * math.sin(2 * math.pi * 1.5 * t)
                wave_val = (
                    0.5 * math.sin(2 * math.pi * f0 * t) +
                    0.3 * math.sin(2 * math.pi * 2 * f0 * t) +
                    0.15 * math.sin(2 * math.pi * 3 * f0 * t)
                ) * env * syllable_mod
                val = wave_val * 16000.0
                break
                
        int_val = int(max(-32767, min(32767, val)))
        samples.extend(struct.pack('<h', int_val))
        
    with wave.open(wav_path, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(samples)
        
    print(f"Generated sample audio: {wav_path} ({duration}s)")


def generate_sample_video(output_mp4: str = "sample_podcast.mp4", duration: float = 60.0):
    temp_wav = "temp_sample_speech.wav"
    generate_sample_audio(temp_wav, duration)
    
    font_arg = "fontfile='C\\:/Windows/Fonts/arial.ttf':" if os.path.exists("C:/Windows/Fonts/arial.ttf") else ""
    
    filter_complex = (
        f"testsrc=duration={duration}:size=1920x1080:rate=30 [base];"
        f"[base] drawbox=x=0:y=0:w=1920:h=1080:color=0x0f172a@1.0:t=fill [bg];"
        # Speaker 1 Podium & Simulated Face
        f"[bg] drawbox=x=280:y=240:w=440:h=600:color=0x1e293b@0.9:t=fill,"
        f"drawbox=x=280:y=240:w=440:h=600:color=0x38bdf8@0.8:t=4,"
        f"drawbox=x=430:y=340:w=140:h=180:color=0xfbcfe8@1.0:t=fill,"
        f"drawbox=x=450:y=460:w=100:h=25:color=0xe11d48@1.0:t=fill [with_spk1];"
        # Speaker 2 Podium & Simulated Face
        f"[with_spk1] drawbox=x=1200:y=240:w=440:h=600:color=0x1e293b@0.9:t=fill,"
        f"drawbox=x=1200:y=240:w=440:h=600:color=0xa855f7@0.8:t=4,"
        f"drawbox=x=1350:y=340:w=140:h=180:color=0xfde68a@1.0:t=fill,"
        f"drawbox=x=1370:y=460:w=100:h=25:color=0xd97706@1.0:t=fill [with_spk2];"
        # Studio Header Banner
        f"[with_spk2] drawbox=x=0:y=0:w=1920:h=90:color=0x020617@0.95:t=fill,"
        f"drawtext={font_arg}text='CLIPFORGE PODCAST SHOW':x=60:y=30:fontsize=32:fontcolor=0xffffff,"
        f"drawtext={font_arg}text='Alex (Host)':x=420:y=800:fontsize=28:fontcolor=0x38bdf8,"
        f"drawtext={font_arg}text='Jordan (Founder)':x=1300:y=800:fontsize=28:fontcolor=0xa855f7 [vout]"
    )
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"color=c=black:s=1920x1080:d={duration}",
        "-i", temp_wav,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", str(duration),
        output_mp4
    ]
    
    print("Running FFmpeg to generate sample test video...")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
        raise RuntimeError(f"Failed to build sample video: {res.stderr}")
        
    if os.path.exists(temp_wav):
        os.remove(temp_wav)
        
    print(f"Sample video successfully created: {output_mp4} ({duration}s, 1920x1080)")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "sample_podcast.mp4"
    generate_sample_video(out_file, 60.0)
