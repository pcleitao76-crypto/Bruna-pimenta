// MiniSonicGame.jsx
// Componente React (JSX) — mini jogo 2D simples estilo "Sonic" usando <canvas>
// Controles: Espaço ou clique para pular. R para reiniciar após Game Over.

import React, { useRef, useEffect, useState } from "react";

export default function MiniSonicGame() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem("minisonic_highscore") || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Configurações
    const WIDTH = 800;
    const HEIGHT = 400;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    // Player
    const player = {
      x: 100,
      y: HEIGHT - 110,
      w: 48,
      h: 48,
      vy: 0,
      gravity: 0.9,
      jumpStrength: -16,
      onGround: true,
    };

    const groundY = HEIGHT - 60;

    // Obstáculos
    const obstacles = [];
    let obstacleSpawnTimer = 0;
    let obstacleSpawnInterval = 90;
    let obstacleSpeed = 6;

    let rafId = null;
    let frame = 0;

    function resetGameState() {
      player.y = HEIGHT - 110;
      player.vy = 0;
      player.onGround = true;
      obstacles.length = 0;
      obstacleSpawnTimer = 0;
      obstacleSpawnInterval = 90;
      obstacleSpeed = 6;
      setScore(0);
      setGameOver(false);
      frame = 0;
    }

    function spawnObstacle() {
      const h = 30 + Math.round(Math.random() * 50);
      const w = 20 + Math.round(Math.random() * 30);
      obstacles.push({ x: WIDTH + 20, y: groundY - h, w, h, passed: false });
    }

    function drawBackground() {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGradient.addColorStop(0, "#80d0ff");
      skyGradient.addColorStop(1, "#b8f1ff");
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, WIDTH, groundY);

      ctx.fillStyle = "#6ea06e";
      ctx.beginPath();
      ctx.moveTo(0, groundY - 40);
      ctx.lineTo(120, groundY - 140);
      ctx.lineTo(260, groundY - 60);
      ctx.lineTo(400, groundY - 160);
      ctx.lineTo(540, groundY - 70);
      ctx.lineTo(700, groundY - 150);
      ctx.lineTo(WIDTH, groundY - 50);
      ctx.lineTo(WIDTH, groundY);
      ctx.lineTo(0, groundY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(0, groundY, WIDTH, HEIGHT - groundY);

      ctx.fillStyle = "#1eac4b";
      ctx.fillRect(0, groundY + (HEIGHT - groundY) - 20, WIDTH, 20);
    }

    function drawPlayer() {
      ctx.fillStyle = "#0066ff";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillStyle = "#fff";
      ctx.fillRect(player.x + 30, player.y + 12, 8, 8);
      ctx.fillStyle = "#000";
      ctx.fillRect(player.x + 32, player.y + 14, 4, 4);
    }

    function drawObstacles() {
      ctx.fillStyle = "#7f8c8d";
      for (let obs of obstacles) {
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      }
    }

    function drawUI() {
      ctx.fillStyle = "#000";
      ctx.font = "20px Inter, system-ui, sans-serif";
      ctx.fillText(`Pontos: ${score}`, 14, 28);
      ctx.fillText(`Melhor: ${highScore}`, 14, 56);
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "32px Inter, system-ui, sans-serif";
        ctx.fillText(`Game Over`, WIDTH / 2, HEIGHT / 2 - 10);
        ctx.font = "18px Inter, system-ui, sans-serif";
        ctx.fillText(
          `Pontos: ${score} — Pressione 'R' para reiniciar`,
          WIDTH / 2,
          HEIGHT / 2 + 24
        );
        ctx.textAlign = "left";
      }
    }

    function rectsCollide(a, b) {
      return !(
        a.x + a.w < b.x ||
        a.x > b.x + b.w ||
        a.y + a.h < b.y ||
        a.y > b.y + b.h
      );
    }

    function update() {
      player.y += player.vy;
      player.vy += player.gravity;

      if (player.y + player.h >= groundY) {
        player.y = groundY - player.h;
        player.vy = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }

      obstacleSpawnTimer++;
      if (obstacleSpawnTimer > obstacleSpawnInterval) {
        spawnObstacle();
        obstacleSpawnTimer = 0;
        if (obstacleSpawnInterval > 50) obstacleSpawnInterval -= 1;
        obstacleSpeed += 0.05;
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= obstacleSpeed;

        if (!obs.passed && obs.x + obs.w < player.x) {
          obs.passed = true;
          setScore((s) => s + 1);
        }

        if (obs.x + obs.w < -50) {
          obstacles.splice(i, 1);
        }

        const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
        const obsRect = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
        if (rectsCollide(playerRect, obsRect)) {
          setGameOver(true);
          // atualiza highscore imediatamente
          setHighScore((hs) => {
            const newHs = Math.max(hs, score);
            try {
              localStorage.setItem("minisonic_highscore", String(newHs));
            } catch {}
            return newHs;
          });
        }
      }

      frame++;
    }

    function loop() {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawBackground();
      update();
      drawObstacles();
      drawPlayer();
      drawUI();

      if (!gameOver) {
        rafId = requestAnimationFrame(loop);
      }
    }

    // iniciar
    resetGameState();
    rafId = requestAnimationFrame(loop);

    function handleKeyDown(e) {
      if (e.code === "Space") {
        if (!gameOver && player.onGround) {
          player.vy = player.jumpStrength;
          player.onGround = false;
        }
      }
      if (e.key.toLowerCase() === "r") {
        if (gameOver) {
          resetGameState();
          rafId = requestAnimationFrame(loop);
        }
      }
    }

    function handleClick() {
      if (!gameOver && player.onGround) {
        player.vy = player.jumpStrength;
        player.onGround = false;
      } else if (gameOver) {
        resetGameState();
        rafId = requestAnimationFrame(loop);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("click", handleClick);
    };
    // deps intencionais: não vinculamos gameOver/score/highScore aqui
  }, [gameOver, score, highScore]);

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: 16 }}>
      <div style={{ maxWidth: 820, background: "#fff", borderRadius: 16, padding: 12, boxShadow: "0 8px 18px rgba(0,0,0,0.12)" }}>
        <h2 style={{ margin: 0, marginBottom: 8 }}>Mini Sonic (JSX / React)</h2>
        <p style={{ marginTop: 0, marginBottom: 12 }}>Pressione Espaço ou clique para pular. Pressione R para reiniciar após Game Over.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <canvas ref={canvasRef} style={{ borderRadius: 12, boxShadow: "0 8px 18px rgba(0,0,0,0.12)", cursor: "pointer" }} />
          <div style={{ minWidth: 220, padding: 8 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Pontos</strong>
              <div>{score}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Melhor</strong>
              <div>{highScore}</div>
            </div>
            <div style={{ fontSize: 12, color: "#555" }}>
              Dicas:
              <ul>
                <li>Substitua o desenho do player por sprites para melhorar o visual.</li>
                <li>Adicione som via Web Audio / <code>new Audio(...)</code>.</li>
                <li>Aumente a dificuldade reduzindo spawnInterval ou aumentando obstacleSpeed.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
