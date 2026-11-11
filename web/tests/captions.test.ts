import { describe, expect, it } from 'bun:test';
import { captionsToText } from '@/services/media/captions';

// Kaltura serves captions as SRT, WebVTT or DFXP. Only the words matter: cue numbers, timings,
// styling and the repeats of rolling captions must all fall away — and a caption that is just a
// number ("42") is still words.

describe('captionsToText', () => {
    it('reads SRT, keeping a cue that is only a number', () => {
        const srt = '1\n00:00:00,000 --> 00:00:03,000\nthe answer is\n\n2\n00:00:03,000 --> 00:00:05,000\n42\n\n3\n00:00:05,000 --> 00:00:08,000\n<i>okay</i> moving on\n';
        expect(captionsToText(srt)).toBe('the answer is 42 okay moving on');
    });

    it('reads WebVTT with a header, NOTE blocks, cue ids and cue settings', () => {
        const vtt = 'WEBVTT\n\nNOTE made by machine\n\nintro\n00:00.000 --> 00:02.000 align:start\nwelcome &amp; hello\n\n00:02.000 --> 00:04.000\nsee you\n';
        expect(captionsToText(vtt)).toBe('welcome & hello see you');
    });

    it('drops a cue that repeats the one before it (rolling captions)', () => {
        const srt = '1\n00:00:00,000 --> 00:00:02,000\nbinary search\n\n2\n00:00:02,000 --> 00:00:04,000\nbinary search\n\n3\n00:00:04,000 --> 00:00:06,000\nis log n\n';
        expect(captionsToText(srt)).toBe('binary search is log n');
    });

    it('reads DFXP', () => {
        const dfxp = '<?xml version="1.0"?><tt xmlns="http://www.w3.org/ns/ttml"><body><div><p begin="0s" end="2s">stacks are<br/>last in</p><p begin="2s" end="4s">first out , right</p></div></body></tt>';
        expect(captionsToText(dfxp)).toBe('stacks are last in first out, right');
    });

    it('handles Windows line endings and a byte-order mark', () => {
        expect(captionsToText('﻿1\r\n00:00:00,000 --> 00:00:01,000\r\nhi there\r\n')).toBe('hi there');
    });
});
