'use client';
import React, { useState, useRef, useCallback } from 'react';

export default function FaceDetector() {
  const [checking, setChecking] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [awayCount, setAwayCount] = useState(0);
  const [streakSec, setStreakSec] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceRef = useRef(false);

  const showToast = (msg) => alert(msg);

  const checkFaceWithAI = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    setChecking(true);
    const W = 320, H = 240;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -W, 0, W, H); ctx.restore();
    const base64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
    ctx.clearRect(0, 0, W, H);
    let detected = false;
    try {
      const res = await fetch("/api/check-face", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) throw new Error(`サーバーエラー: ${res.status}`);
      const data = await res.json();
      detected = data.detected;
    } catch (e) {
      console.error("AI error:", e);
      detected = false;
    }
    setChecking(false);
    ctx.clearRect(0, 0, W, H);
    if (detected) {
      ctx.strokeStyle = "rgba(74,222,128,0.9)";
      ctx.lineWidth = 4;
      ctx.strokeRect(15, 15, W - 30, H - 30);
    }
    if (detected !== faceRef.current) {
      faceRef.current = detected;
      setFaceDetected(detected);
      if (!detected) {
        setAwayCount(p => p + 1);
        setStreakSec(0);
        showToast("⚠ 顔が検出されません");
      } else {
        showToast("✓ 顔を検出しました");
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, audio: false
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (e) {
      alert("カメラの許可が必要です");
    }
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', padding:'20px' }}>
      <h1 style={{ fontSize:'20px', fontWeight:'bold' }}>顔で計る集中時間</h1>
      <div style={{ position:'relative', width:'320px', height:'240px', borderRadius:'12px', overflow:'hidden', background:'#000' }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', transform:'scaleX(-1)', objectFit:'cover' }} />
        <canvas ref={canvasRef}
          style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10 }} />
        {checking && (
          <div style={{ position:'absolute', top:10, left:10, color:'#fff', background:'rgba(0,0,0,0.6)', padding:'4px 8px', borderRadius:'4px', fontSize:'12px', zIndex:20 }}>
            AI解析中...
          </div>
        )}
      </div>
      <button onClick={startCamera} style={{ padding:'10px 24px', borderRadius:'8px', background:'#7c6af7', color:'#fff', border:'none', fontWeight:'bold', cursor:'pointer', fontSize:'16px' }}>
        📷 カメラ起動
      </button>
      <button onClick={checkFaceWithAI} disabled={checking} style={{ padding:'10px 24px', borderRadius:'8px', background:'#4ade80', color:'#000', border:'none', fontWeight:'bold', cursor:'pointer', fontSize:'16px' }}>
        顔チェック
      </button>
      <div style={{ fontSize:'16px', lineHeight:'2' }}>
        <p>状態: {faceDetected ? "⭕ 顔あり — タイマー稼働中" : "❌ 顔なし — 停止中"}</p>
        <p>離席回数: {awayCount}回</p>
        <p>連続集中: {Math.floor(streakSec / 60)}分</p>
      </div>
    </div>
  );
}
