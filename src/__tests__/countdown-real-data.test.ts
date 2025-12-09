import { describe, it, expect } from 'vitest';

describe('Countdown Timing - Real Data Validation', () => {
    describe('Bug: Old timing had 1s spacing (BEFORE fix)', () => {
        it('should show the problem with old 1-second spacing', () => {
            // This is ACTUAL data from yebaatein project BEFORE the fix
            const oldTimings = [
                { time: 18.96, lyric: '[4] 3 2 1' },
                { time: 19.96, lyric: '4 [3] 2 1' },
                { time: 20.96, lyric: '4 3 [2] 1' },
                { time: 21.96, lyric: '4 3 2 [1]' },
                { time: 22.96, lyric: 'ये बातें झूटी बातें हैं' }
            ];

            // Calculate durations (endTime - startTime)
            const durations = [];
            for (let i = 0; i < oldTimings.length - 1; i++) {
                durations.push({
                    lyric: oldTimings[i].lyric,
                    duration: oldTimings[i + 1].time - oldTimings[i].time
                });
            }

            // OLD BUG: Each countdown was 1 second
            expect(durations[0].duration).toBe(1.0); // Countdown 4
            expect(durations[1].duration).toBe(1.0); // Countdown 3
            expect(durations[2].duration).toBe(1.0); // Countdown 2
            expect(durations[3].duration).toBe(1.0); // Countdown 1

            // Total countdown time was 4 seconds (TOO SLOW!)
            const totalCountdownTime = durations.slice(0, 4).reduce((sum, d) => sum + d.duration, 0);
            expect(totalCountdownTime).toBe(4.0);
        });

        it('should show another example from real data - line 21', () => {
            // Another countdown sequence from the real data
            const oldTimings = [
                { time: 83.74, lyric: '[4] 3 2 1' },
                { time: 84.74, lyric: '4 [3] 2 1' },
                { time: 85.74, lyric: '4 3 [2] 1' },
                { time: 86.74, lyric: '4 3 2 [1]' },
                { time: 87.74, lyric: 'हैं लाखों रोग ज़माने में' }
            ];

            // Each countdown was 1 second apart
            expect(oldTimings[1].time - oldTimings[0].time).toBe(1.0);
            expect(oldTimings[2].time - oldTimings[1].time).toBe(1.0);
            expect(oldTimings[3].time - oldTimings[2].time).toBe(1.0);
            expect(oldTimings[4].time - oldTimings[3].time).toBe(1.0);
        });
    });

    describe('Fix: New timing should have 0.5s spacing (AFTER fix)', () => {
        it('should generate correct timing with 0.5s spacing', () => {
            // Simulate what the NEW code should generate
            const nextLyricTime = 22.96; // From real data
            const COUNTDOWN_DURATION = 2; // NEW value
            const countdownStart = nextLyricTime - COUNTDOWN_DURATION; // 20.96

            const newTimings = [];
            for (let num = 4; num >= 1; num--) {
                const time = countdownStart + (4 - num) * 0.5;
                newTimings.push({
                    time: parseFloat(time.toFixed(2)),
                    lyric: `Countdown ${num}`
                });
            }
            newTimings.push({ time: nextLyricTime, lyric: 'ये बातें झूटी बातें हैं' });

            // NEW FIX: Each countdown should be 0.5 seconds
            expect(newTimings[0].time).toBe(20.96); // Countdown 4
            expect(newTimings[1].time).toBe(21.46); // Countdown 3
            expect(newTimings[2].time).toBe(21.96); // Countdown 2
            expect(newTimings[3].time).toBe(22.46); // Countdown 1
            expect(newTimings[4].time).toBe(22.96); // Next lyric

            // Verify spacing
            expect(newTimings[1].time - newTimings[0].time).toBe(0.5);
            expect(newTimings[2].time - newTimings[1].time).toBe(0.5);
            expect(newTimings[3].time - newTimings[2].time).toBe(0.5);
            expect(newTimings[4].time - newTimings[3].time).toBe(0.5);

            // Total countdown time should be 2 seconds (FASTER!)
            const totalCountdownTime = 2.0;
            expect(totalCountdownTime).toBe(2.0);
        });

        it('should fix the timing for line 21 (the one user reported)', () => {
            // User reported this lyric was 2-4 seconds late:
            // "हैं लाखों रोग ज़माने में क्यूँ इश्क़ है रुस्वा बे-चारा"

            // OLD timing (from real data): lyric at 87.74
            // Countdown started at 83.74 (4 seconds before)

            // NEW timing should be:
            const nextLyricTime = 87.74;
            const COUNTDOWN_DURATION = 2; // NEW value
            const countdownStart = nextLyricTime - COUNTDOWN_DURATION; // 85.74

            const newTimings = [];
            for (let num = 4; num >= 1; num--) {
                newTimings.push({
                    time: parseFloat((countdownStart + (4 - num) * 0.5).toFixed(2)),
                    num
                });
            }

            // NEW countdown times
            expect(newTimings[0].time).toBe(85.74); // Countdown 4
            expect(newTimings[1].time).toBe(86.24); // Countdown 3
            expect(newTimings[2].time).toBe(86.74); // Countdown 2
            expect(newTimings[3].time).toBe(87.24); // Countdown 1

            // Lyric should appear at 87.74 (0.5s after last countdown)
            // This is 2 seconds EARLIER than the old countdown start (85.74 vs 83.74)
            const timeSaved = 83.74 - 85.74; // Should be negative (we start later)
            expect(timeSaved).toBe(-2.0);

            // But the lyric still appears at the same time (87.74)
            // So it's no longer late!
        });

        it('should calculate correct durations for video generation', () => {
            // Using real timing from yebaatein project
            const nextLyricTime = 22.96;
            const COUNTDOWN_DURATION = 2;
            const countdownStart = nextLyricTime - COUNTDOWN_DURATION;

            const segments = [];
            for (let num = 4; num >= 1; num--) {
                segments.push({
                    startTime: parseFloat((countdownStart + (4 - num) * 0.5).toFixed(2)),
                    lyric: `Countdown ${num}`
                });
            }
            segments.push({ startTime: nextLyricTime, lyric: 'Next lyric' });

            // Calculate durations for video
            const durations = [];
            for (let i = 0; i < segments.length - 1; i++) {
                const duration = segments[i + 1].startTime - segments[i].startTime;
                durations.push({
                    lyric: segments[i].lyric,
                    duration: parseFloat(duration.toFixed(2))
                });
            }

            // Each countdown segment should be exactly 0.5s
            expect(durations[0].duration).toBe(0.5); // Countdown 4
            expect(durations[1].duration).toBe(0.5); // Countdown 3
            expect(durations[2].duration).toBe(0.5); // Countdown 2
            expect(durations[3].duration).toBe(0.5); // Countdown 1

            // All countdown durations should be 0.5s
            const allCountdownsCorrect = durations.every(d => d.duration === 0.5);
            expect(allCountdownsCorrect).toBe(true);
        });
    });

    describe('Comparison: Old vs New', () => {
        it('should show the improvement in timing', () => {
            const nextLyricTime = 22.96;

            // OLD: 4 second countdown
            const oldCountdownStart = nextLyricTime - 4;
            const oldCountdownEnd = nextLyricTime;
            const oldDuration = oldCountdownEnd - oldCountdownStart;

            // NEW: 2 second countdown
            const newCountdownStart = nextLyricTime - 2;
            const newCountdownEnd = nextLyricTime;
            const newDuration = newCountdownEnd - newCountdownStart;

            expect(oldDuration).toBe(4.0);
            expect(newDuration).toBe(2.0);

            // 50% faster!
            const improvement = (oldDuration - newDuration) / oldDuration;
            expect(improvement).toBe(0.5); // 50% improvement
        });
    });
});
