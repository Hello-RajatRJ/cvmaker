'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera, CameraOff, AlertTriangle, ShieldAlert, CheckCircle,
  Eye, EyeOff, UserX, Users, Activity, Scan, Smartphone,
  ChevronDown, ChevronUp, History
} from 'lucide-react';
import { ProctorViolationEvent, ProctorViolationType } from '../../types/assessment';

interface AIProctorEngineProps {
  onViolation: (event: ProctorViolationEvent) => void;
  onTerminate: (reason: string) => void;
  isActive: boolean;
  maxCriticalViolations?: number;
}

export type GazeDirection = 'CENTER' | 'LEFT' | 'RIGHT' | 'UP' | 'DOWN' | 'AWAY';

export default function AIProctorEngine({
  onViolation,
  onTerminate,
  isActive,
  maxCriticalViolations = 3
}: AIProctorEngineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Real-time tracking metrics
  const [gazeDirection, setGazeDirection] = useState<GazeDirection>('CENTER');
  const [phoneInFrame, setPhoneInFrame] = useState<boolean>(false);
  const [personsCount, setPersonsCount] = useState<number>(1);
  const [postureMotion, setPostureMotion] = useState<'STABLE' | 'MODERATE' | 'HIGH_MOTION'>('STABLE');

  // Continuous accumulated timers (in seconds)
  const [awaySeconds, setAwaySeconds] = useState<number>(0);
  const [phoneSeconds, setPhoneSeconds] = useState<number>(0);
  const [noFaceSeconds, setNoFaceSeconds] = useState<number>(0);
  const [multiFaceSeconds, setMultiFaceSeconds] = useState<number>(0);

  // Violations and Timeline
  const [violations, setViolations] = useState<ProctorViolationEvent[]>([]);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState<boolean>(false);

  // Keep track of emitted event cooldowns to avoid flood
  const lastEmittedEvents = useRef<Record<string, number>>({});

  // Initialize camera stream
  useEffect(() => {
    let mounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
            facingMode: 'user'
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setHasCameraPermission(true);
      } catch (err: any) {
        if (mounted) {
          setHasCameraPermission(false);
          setCameraError(err.message || 'Camera permission required for proctoring.');
        }
      }
    }

    if (isActive) {
      initCamera();
    }

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  const emitViolation = useCallback(
    (type: ProctorViolationType, message: string, severity: 'warning' | 'critical') => {
      const now = Date.now();
      // Cooldown 8 seconds per specific violation type to prevent duplicate event spam
      if (lastEmittedEvents.current[type] && now - lastEmittedEvents.current[type] < 8000) {
        return;
      }
      lastEmittedEvents.current[type] = now;

      const event: ProctorViolationEvent = {
        id: `viol_${now}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        type,
        message,
        severity
      };

      setViolations((prev) => {
        const updated = [event, ...prev];
        const criticalCount = updated.filter((v) => v.severity === 'critical').length;
        if (criticalCount >= maxCriticalViolations) {
          onTerminate(`Exceeded critical proctoring violation threshold (${criticalCount} violations recorded).`);
        }
        return updated;
      });

      onViolation(event);
    },
    [maxCriticalViolations, onTerminate, onViolation]
  );

  // Continuous Video Frame Analysis Loop (runs every 1000ms)
  useEffect(() => {
    if (!isActive || !hasCameraPermission) return;

    let localAway = 0;
    let localPhone = 0;
    let localNoFace = 0;
    let localMultiFace = 0;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState !== 4) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = 160;
      const height = 120;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(video, 0, 0, width, height);

      const frameData = ctx.getImageData(0, 0, width, height);
      const data = frameData.data;

      let skinPixels = 0;
      let skinSumX = 0;
      let skinSumY = 0;

      let leftSkin = 0;
      let rightSkin = 0;

      let darkRectangularHandheldPixels = 0;
      let totalMotionDelta = 0;

      const prevData = previousFrameRef.current;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // 1. Frame Motion & Posture Delta
          if (prevData) {
            const pr = prevData[idx];
            const pg = prevData[idx + 1];
            const pb = prevData[idx + 2];
            const diff = Math.abs(r - pr) + Math.abs(g - pg) + Math.abs(b - pb);
            if (diff > 45) totalMotionDelta++;
          }

          // 2. Human Skin Tone Heuristic (YCbCr / RGB envelope)
          const isSkin =
            r > 65 && g > 40 && b > 20 &&
            r > b &&
            Math.abs(r - g) > 10 &&
            r - b > 15;

          if (isSkin) {
            skinPixels++;
            skinSumX += x;
            skinSumY += y;

            if (x < width * 0.4) leftSkin++;
            else if (x > width * 0.6) rightSkin++;
          }

          // 3. Handheld Device / Phone Detection Heuristic
          // Detects high-contrast dark rectangular phone body or bright screen held near bottom/sides
          const isDarkPhoneBody = r < 35 && g < 35 && b < 35;
          const isHandheldZone = y > height * 0.45 && (x < width * 0.35 || x > width * 0.65);
          if (isDarkPhoneBody && isHandheldZone) {
            darkRectangularHandheldPixels++;
          }
        }
      }

      // Save frame for motion tracking
      previousFrameRef.current = new Uint8ClampedArray(data);

      // Posture Motion Evaluation
      if (totalMotionDelta > 650) {
        setPostureMotion('HIGH_MOTION');
      } else if (totalMotionDelta > 200) {
        setPostureMotion('MODERATE');
      } else {
        setPostureMotion('STABLE');
      }

      // ── DETECTION 1: Face Presence & Multiple Faces ──
      if (skinPixels < 120) {
        // No face present
        localNoFace++;
        setNoFaceSeconds(localNoFace);
        setGazeDirection('AWAY');

        if (localNoFace === 15) {
          setWarningBanner('⚠️ No face detected in camera! Please stay positioned in front of screen.');
          emitViolation('FACE_NOT_DETECTED', 'Candidate face absent from camera frame for 15s.', 'warning');
        } else if (localNoFace >= 60) {
          setWarningBanner('⚠️ No face detected for over 1 minute. Flagged as suspicious attempt.');
          emitViolation('FACE_NOT_DETECTED', 'Face not detected for > 60 seconds.', 'critical');
        }
      } else {
        localNoFace = 0;
        setNoFaceSeconds(0);

        // Multiple Faces / Persons Detection (wide bi-modal skin clusters)
        const isMultiplePersons = leftSkin > 350 && rightSkin > 350;
        if (isMultiplePersons) {
          localMultiFace++;
          setPersonsCount(2);
          setMultiFaceSeconds(localMultiFace);

          if (localMultiFace >= 3) {
            setWarningBanner('⚠️ Multiple faces / persons detected in camera frame!');
            emitViolation('MULTIPLE_FACES', 'Multiple persons detected in camera frame.', 'critical');
          }
        } else {
          localMultiFace = 0;
          setPersonsCount(1);
          setMultiFaceSeconds(0);
        }

        // ── DETECTION 2: Head Pose & Gaze Direction Tracking ──
        const avgHeadX = skinSumX / skinPixels;
        const avgHeadY = skinSumY / skinPixels;

        let currentGaze: GazeDirection = 'CENTER';
        if (avgHeadX < width * 0.38) currentGaze = 'LEFT';
        else if (avgHeadX > width * 0.62) currentGaze = 'RIGHT';
        else if (avgHeadY < height * 0.28) currentGaze = 'UP';
        else if (avgHeadY > height * 0.68) currentGaze = 'DOWN';

        setGazeDirection(currentGaze);

        const isGazeAway = currentGaze !== 'CENTER';

        if (isGazeAway) {
          localAway++;
          setAwaySeconds(localAway);

          if (localAway === 20) {
            setWarningBanner('⚠️ Please correct your posture and focus on the screen. Activity is monitored.');
            emitViolation('LOOKING_AWAY', `Looking ${currentGaze.toLowerCase()} away from screen for 20s.`, 'warning');
          } else if (localAway >= 60) {
            setWarningBanner('⚠️ Looking away continuously > 60 sec! Severe violation logged.');
            emitViolation('LOOKING_AWAY', 'Looking away continuously for over 60 seconds.', 'critical');
          }
        } else {
          localAway = Math.max(0, localAway - 2);
          setAwaySeconds(localAway);
          if (localAway === 0 && localPhone === 0) {
            setWarningBanner(null);
          }
        }
      }

      // ── DETECTION 3: Phone / Handheld Device Tracking ──
      const isPhoneDetected = darkRectangularHandheldPixels > 160;
      setPhoneInFrame(isPhoneDetected);

      if (isPhoneDetected) {
        localPhone++;
        setPhoneSeconds(localPhone);

        // Continuous Rule: Phone detected for 10 sec -> Warning
        if (localPhone === 10) {
          setWarningBanner('⚠️ Mobile phone detected in hand/frame (10s). Please put away your phone.');
          emitViolation('PHONE_DETECTED', 'Mobile phone detected in frame for 10 seconds.', 'warning');
        }

        // Continuous Compound Rule: Phone detected + looking away -> High-Severity Critical
        if (localPhone >= 5 && localAway >= 5) {
          setWarningBanner('⚠️ Critical: Mobile phone usage combined with off-screen gaze detected!');
          emitViolation(
            'COMPOUND_PHONE_GAZE',
            'Phone detected simultaneously with off-screen gaze.',
            'critical'
          );
        }
      } else {
        localPhone = Math.max(0, localPhone - 1);
        setPhoneSeconds(localPhone);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, hasCameraPermission, emitViolation]);

  if (!isActive) return null;

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />

      {/* Floating Modern AI Proctoring HUD */}
      <div className="fixed bottom-4 right-4 z-50 animate-fadeIn">
        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl p-3.5 backdrop-blur-xl w-72 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-extrabold text-white text-[11px] tracking-wide">AI Proctor HUD</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border ${
                  gazeDirection === 'CENTER' && !phoneInFrame
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : phoneInFrame
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}
              >
                {phoneInFrame ? 'PHONE DETECTED' : gazeDirection === 'CENTER' ? 'GAZE CENTER' : `GAZE ${gazeDirection}`}
              </span>

              <button
                onClick={() => setShowTimeline(!showTimeline)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Toggle Violation Timeline"
              >
                <History className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Camera Viewfinder */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800/80 mb-2">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* AI HUD Overlay Metrics */}
            <div className="absolute inset-0 pointer-events-none p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-400">
                <span className="bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                  DIR: {gazeDirection}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded border ${
                    phoneInFrame
                      ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800'
                  }`}
                >
                  PHONE: {phoneInFrame ? `${phoneSeconds}s` : 'NONE'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="bg-slate-950/80 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                  PERSONS: {personsCount}
                </span>
                <span className="bg-slate-950/80 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-800">
                  FLAGS: {violations.length}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Warning Notice */}
          {warningBanner && (
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-200 font-semibold leading-tight animate-pulse mb-2 flex items-start space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{warningBanner}</span>
            </div>
          )}

          {/* Expandable Chronological Timeline */}
          {showTimeline && (
            <div className="mt-2 pt-2 border-t border-slate-800 max-h-36 overflow-y-auto no-scrollbar space-y-1.5">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Violation Timeline
              </p>
              {violations.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-1">No violations logged. Session clean.</p>
              ) : (
                violations.slice(0, 5).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-950/60 border border-slate-800/80"
                  >
                    <span className="text-slate-400">{v.timestamp}</span>
                    <span className="text-slate-200 truncate mx-1 max-w-[100px]">{v.type}</span>
                    <span
                      className={`font-bold ${
                        v.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {v.severity === 'critical' ? 'Violation' : 'Warning'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Bottom Summary Pill */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-medium">
            <span>Away: <strong className="text-white">{awaySeconds}s</strong></span>
            <span>Phone: <strong className="text-white">{phoneSeconds}s</strong></span>
            <span>Motion: <strong className="text-indigo-300">{postureMotion}</strong></span>
          </div>
        </div>
      </div>
    </>
  );
}
