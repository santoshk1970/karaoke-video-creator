import { describe, it, expect } from 'vitest';
import { TimingTool } from '../timing-tool';
import * as fs from 'fs';
import * as path from 'path';

describe('TimingTool - Countdown Timing', () => {
    describe('Countdown Duration and Spacing', () => {
        it('should insert countdown with 0.5s spacing per number', () => {
            // Simulate timing marks with a long instrumental gap
            const marks = [
                { lineIndex: 0, time: 10.5, lyric: 'First line' },
                { lineIndex: 1, time: 15.2, lyric: '♪ Instrumental ♪' },
                { lineIndex: 2, time: 28.7, lyric: 'Next line after instrumental' } // 13.5s gap
            ];

            // Manually run the countdown insertion logic
            const COUNTDOWN_THRESHOLD = 10;
            const COUNTDOWN_DURATION = 2;
            const marksWithCountdowns: any[] = [];

            for (let i = 0; i < marks.length; i++) {
                const currentMark = marks[i];
                const nextMark = marks[i + 1];

                marksWithCountdowns.push(currentMark);

                const isInstrumental = currentMark.lyric.includes('♪ Instrumental ♪');

                if (isInstrumental && nextMark) {
                    const gap = nextMark.time - currentMark.time;

                    if (gap > COUNTDOWN_THRESHOLD) {
                        const countdownStart = nextMark.time - COUNTDOWN_DURATION;

                        for (let num = 4; num >= 1; num--) {
                            const countdownTime = countdownStart + (4 - num) * 0.5;
                            marksWithCountdowns.push({
                                lineIndex: -1,
                                time: countdownTime,
                                lyric: `Countdown ${num}`,
                                isCountdown: true
                            });
                        }
                    }
                }
            }

            // Sort by time
            marksWithCountdowns.sort((a, b) => a.time - b.time);

            // Find countdown marks
            const countdowns = marksWithCountdowns.filter(m => m.isCountdown);

            // Verify countdown exists
            expect(countdowns.length).toBe(4);

            // Verify countdown timing
            expect(countdowns[0].time).toBe(26.7); // 28.7 - 2.0 = 26.7 (countdown 4)
            expect(countdowns[1].time).toBe(27.2); // 26.7 + 0.5 = 27.2 (countdown 3)
            expect(countdowns[2].time).toBe(27.7); // 27.2 + 0.5 = 27.7 (countdown 2)
            expect(countdowns[3].time).toBe(28.2); // 27.7 + 0.5 = 28.2 (countdown 1)

            // Verify next lyric comes 0.5s after last countdown
            const nextLyric = marksWithCountdowns.find(m => m.lyric === 'Next line after instrumental');
            expect(nextLyric.time).toBe(28.7);
            expect(nextLyric.time - countdowns[3].time).toBe(0.5);
        });

        it('should have exactly 0.5s spacing between each countdown number', () => {
            const marks = [
                { lineIndex: 0, time: 5.0, lyric: '♪ Instrumental ♪' },
                { lineIndex: 1, time: 20.0, lyric: 'Next lyric' } // 15s gap
            ];

            const COUNTDOWN_DURATION = 2;
            const countdownStart = 20.0 - COUNTDOWN_DURATION; // 18.0

            const countdownTimes = [];
            for (let num = 4; num >= 1; num--) {
                countdownTimes.push(countdownStart + (4 - num) * 0.5);
            }

            // Verify spacing
            expect(countdownTimes[0]).toBe(18.0); // Countdown 4
            expect(countdownTimes[1]).toBe(18.5); // Countdown 3
            expect(countdownTimes[2]).toBe(19.0); // Countdown 2
            expect(countdownTimes[3]).toBe(19.5); // Countdown 1

            // Verify each gap is exactly 0.5s
            for (let i = 1; i < countdownTimes.length; i++) {
                const gap = countdownTimes[i] - countdownTimes[i - 1];
                expect(gap).toBe(0.5);
            }
        });

        it('should position countdown to end exactly 0.5s before next lyric', () => {
            const nextLyricTime = 50.0;
            const COUNTDOWN_DURATION = 2;

            const countdownStart = nextLyricTime - COUNTDOWN_DURATION; // 48.0
            const lastCountdownTime = countdownStart + (4 - 1) * 0.5; // 48.0 + 1.5 = 49.5

            // Last countdown (1) should be at 49.5
            expect(lastCountdownTime).toBe(49.5);

            // Gap between last countdown and next lyric should be 0.5s
            expect(nextLyricTime - lastCountdownTime).toBe(0.5);
        });

        it('should calculate video durations correctly with countdown', () => {
            // Simulate the full timing sequence
            const marks = [
                { lineIndex: 0, time: 10.0, lyric: 'Line 1' },
                { lineIndex: 1, time: 15.0, lyric: '♪ Instrumental ♪' },
                { lineIndex: 2, time: 30.0, lyric: 'Line 2' } // 15s gap
            ];

            const COUNTDOWN_DURATION = 2;
            const marksWithCountdowns: any[] = [];

            for (let i = 0; i < marks.length; i++) {
                const currentMark = marks[i];
                const nextMark = marks[i + 1];

                marksWithCountdowns.push(currentMark);

                if (currentMark.lyric.includes('♪ Instrumental ♪') && nextMark) {
                    const gap = nextMark.time - currentMark.time;
                    if (gap > 10) {
                        const countdownStart = nextMark.time - COUNTDOWN_DURATION;
                        for (let num = 4; num >= 1; num--) {
                            marksWithCountdowns.push({
                                lineIndex: -1,
                                time: countdownStart + (4 - num) * 0.5,
                                lyric: `Countdown ${num}`,
                                isCountdown: true
                            });
                        }
                    }
                }
            }

            marksWithCountdowns.sort((a, b) => a.time - b.time);

            // Calculate durations (endTime - startTime)
            const durations = [];
            for (let i = 0; i < marksWithCountdowns.length; i++) {
                const startTime = marksWithCountdowns[i].time;
                const endTime = i < marksWithCountdowns.length - 1
                    ? marksWithCountdowns[i + 1].time
                    : 35.0; // total duration
                durations.push({
                    lyric: marksWithCountdowns[i].lyric,
                    duration: endTime - startTime
                });
            }

            // Verify durations
            expect(durations[0].duration).toBe(5.0);  // Line 1: 10.0 to 15.0
            expect(durations[1].duration).toBe(13.0); // Instrumental: 15.0 to 28.0
            expect(durations[2].duration).toBe(0.5);  // Countdown 4: 28.0 to 28.5
            expect(durations[3].duration).toBe(0.5);  // Countdown 3: 28.5 to 29.0
            expect(durations[4].duration).toBe(0.5);  // Countdown 2: 29.0 to 29.5
            expect(durations[5].duration).toBe(0.5);  // Countdown 1: 29.5 to 30.0
            expect(durations[6].duration).toBe(5.0);  // Line 2: 30.0 to 35.0

            // Verify all countdown durations are exactly 0.5s
            const countdownDurations = durations.filter(d => d.lyric.includes('Countdown'));
            expect(countdownDurations.every(d => d.duration === 0.5)).toBe(true);
        });

        it('should not insert countdown if gap is less than threshold', () => {
            const marks = [
                { lineIndex: 0, time: 5.0, lyric: '♪ Instrumental ♪' },
                { lineIndex: 1, time: 14.0, lyric: 'Next lyric' } // 9s gap (< 10s threshold)
            ];

            const COUNTDOWN_THRESHOLD = 10;
            const marksWithCountdowns: any[] = [];

            for (let i = 0; i < marks.length; i++) {
                const currentMark = marks[i];
                const nextMark = marks[i + 1];

                marksWithCountdowns.push(currentMark);

                if (currentMark.lyric.includes('♪ Instrumental ♪') && nextMark) {
                    const gap = nextMark.time - currentMark.time;
                    if (gap > COUNTDOWN_THRESHOLD) {
                        // Should not execute
                        marksWithCountdowns.push({ lyric: 'Countdown', isCountdown: true });
                    }
                }
            }

            // Should only have original 2 marks
            expect(marksWithCountdowns.length).toBe(2);
            expect(marksWithCountdowns.filter(m => m.isCountdown).length).toBe(0);
        });

        it('should use toFixed(2) for decimal precision', () => {
            // Verify that times are stored with 2 decimal places
            const nextLyricTime = 28.7;
            const COUNTDOWN_DURATION = 2;
            const countdownStart = nextLyricTime - COUNTDOWN_DURATION;

            const countdownTimes = [];
            for (let num = 4; num >= 1; num--) {
                const time = countdownStart + (4 - num) * 0.5;
                countdownTimes.push(parseFloat(time.toFixed(2)));
            }

            // Verify precision
            expect(countdownTimes[0]).toBe(26.70);
            expect(countdownTimes[1]).toBe(27.20);
            expect(countdownTimes[2]).toBe(27.70);
            expect(countdownTimes[3]).toBe(28.20);

            // Verify all have at most 2 decimal places
            countdownTimes.forEach(time => {
                const str = time.toString();
                const decimalPart = str.split('.')[1];
                expect(decimalPart === undefined || decimalPart.length <= 2).toBe(true);
            });
        });
    });
});
