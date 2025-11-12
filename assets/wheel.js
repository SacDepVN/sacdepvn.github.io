(function () {
	'use strict';

	const canvas = document.getElementById('wheel-canvas');
	const ctx = canvas ? canvas.getContext('2d') : null;
	const btn = document.getElementById('spin-btn');
	const resultEl = document.getElementById('result');
	const confettiCanvas = document.getElementById('confetti-canvas');
	const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
	const fullscreenConfettiCanvas = document.getElementById('fullscreen-confetti');
	const fullscreenConfettiCtx = fullscreenConfettiCanvas ? fullscreenConfettiCanvas.getContext('2d') : null;
	const soundToggle = document.getElementById('sound-toggle');
	const soundIcon = soundToggle ? soundToggle.querySelector('.sound-icon') : null;
	
	// Quản lý âm thanh
	let soundEnabled = true;
	let audioContext = null;
	let spinSoundInterval = null;
	
	// Khởi tạo AudioContext (cần user interaction)
	function initAudio() {
		if (!audioContext) {
			try {
				audioContext = new (window.AudioContext || window.webkitAudioContext)();
				// Resume nếu bị suspended (do autoplay policy)
				if (audioContext.state === 'suspended') {
					audioContext.resume();
				}
			} catch (e) {
				console.log('AudioContext not supported:', e);
			}
		}
		return audioContext;
	}
	
	// Khởi tạo AudioContext khi user click lần đầu
	function initAudioOnInteraction() {
		if (!audioContext && soundEnabled) {
			initAudio();
		}
	}
	
	// Tạo âm thanh quay (tone giảm dần)
	function playSpinSound() {
		if (!soundEnabled || !audioContext) return;
		try {
			// Resume nếu bị suspended
			if (audioContext.state === 'suspended') {
				audioContext.resume();
			}
			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			
			oscillator.connect(gainNode);
			gainNode.connect(audioContext.destination);
			
			oscillator.frequency.value = 200 + Math.random() * 100;
			oscillator.type = 'sine';
			
			gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
			gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
			
			oscillator.start();
			oscillator.stop(audioContext.currentTime + 0.1);
		} catch (e) {
			console.log('Audio error:', e);
		}
	}
	
	// Âm thanh khi trúng (fanfare)
	function playWinSound() {
		if (!soundEnabled || !audioContext) return;
		try {
			// Resume nếu bị suspended
			if (audioContext.state === 'suspended') {
				audioContext.resume();
			}
			// Tạo chuỗi nốt nhạc vui vẻ
			const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C (quãng tám)
			const duration = 0.15;
			
			notes.forEach((freq, i) => {
				setTimeout(() => {
					if (!audioContext) return;
					const oscillator = audioContext.createOscillator();
					const gainNode = audioContext.createGain();
					
					oscillator.connect(gainNode);
					gainNode.connect(audioContext.destination);
					
					oscillator.frequency.value = freq;
					oscillator.type = 'sine';
					
					gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
					gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
					
					oscillator.start();
					oscillator.stop(audioContext.currentTime + duration);
				}, i * 100);
			});
		} catch (e) {
			console.log('Audio error:', e);
		}
	}
	
	// Toggle âm thanh
	function toggleSound() {
		soundEnabled = !soundEnabled;
		if (soundToggle) {
			if (soundEnabled) {
				soundToggle.classList.remove('muted');
				if (soundIcon) soundIcon.textContent = '🔊';
				// Khởi tạo AudioContext khi bật âm thanh
				initAudio();
				// Phát âm thanh test ngắn
				if (audioContext) {
					setTimeout(() => playWinSound(), 100);
				}
			} else {
				soundToggle.classList.add('muted');
				if (soundIcon) soundIcon.textContent = '🔇';
				// Dừng âm thanh quay nếu đang phát
				if (spinSoundInterval) {
					clearInterval(spinSoundInterval);
					spinSoundInterval = null;
				}
			}
			// Lưu vào localStorage
			localStorage.setItem('wheelSoundEnabled', soundEnabled);
		}
	}
	
	// Khôi phục trạng thái âm thanh từ localStorage
	function restoreSoundState() {
		const saved = localStorage.getItem('wheelSoundEnabled');
		if (saved !== null) {
			soundEnabled = saved === 'true';
		}
		if (soundToggle) {
			if (!soundEnabled) {
				soundToggle.classList.add('muted');
				if (soundIcon) soundIcon.textContent = '🔇';
			}
		}
		// Không tự động khởi tạo AudioContext (cần user interaction)
	}
	
	if (soundToggle) {
		soundToggle.addEventListener('click', toggleSound);
	}
	restoreSoundState();
	
	// Xử lý resize cho fullscreen confetti canvas
	if (fullscreenConfettiCanvas) {
		window.addEventListener('resize', function() {
			fullscreenConfettiCanvas.width = window.innerWidth;
			fullscreenConfettiCanvas.height = window.innerHeight;
		});
	}

	const SLICES = 11;
	// Nhãn và trọng số: 10 voucher + 1 giải đặc biệt (không bao giờ trúng)
	const slots = [
		{ label: 'Voucher 100k', weight: 10 },
		{ label: 'Voucher 200k', weight: 10 },
		{ label: 'Voucher 300k', weight: 10 },
		{ label: 'Voucher 400k', weight: 10 },
		{ label: 'Voucher 500k', weight: 10 },
		{ label: 'Voucher 600k', weight: 10 },
		{ label: 'Voucher 700k', weight: 10 },
		{ label: 'Voucher 800k', weight: 10 },
		{ label: 'Voucher 900k', weight: 10 },
		{ label: 'Voucher 1 TRIỆU', weight: 10 },
		{ label: 'GIẢI ĐẶC BIỆT', weight: 0 }, // KHÔNG BAO GIỜ TRÚNG
	];

	// Màu dark tones cho 11 lát
	const sliceColors = [
		'#ec4899', // 0 - dark pink
		'#3b82f6', // 1 - dark blue
		'#10b981', // 2 - dark teal
		'#f59e0b', // 3 - dark yellow
		'#8b5cf6', // 4 - dark purple
		'#f43f5e', // 5 - dark rose
		'#06b6d4', // 6 - dark cyan
		'#ea580c', // 7 - dark orange
		'#65a30d', // 8 - dark lime
		'#dc2626', // 9 - dark red
		'#6b7280', // 10 - gray (giải đặc biệt - không trúng)
	];

	// Góc hiện tại của bánh xe
	let angle = 0;
	let spinning = false;

	function drawWheel(currentAngle) {
		if (!ctx) return;
		const w = canvas.width, h = canvas.height;
		const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 10;
		ctx.clearRect(0, 0, w, h);

		// Vẽ các lát
		for (let i = 0; i < SLICES; i++) {
			const start = (i * 2 * Math.PI / SLICES) + currentAngle;
			const end = ((i + 1) * 2 * Math.PI / SLICES) + currentAngle;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r, start, end);
			// Màu theo từng ô
			ctx.fillStyle = sliceColors[i % sliceColors.length];
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 5; // Border trắng đậm
			ctx.stroke();

			// Nhãn màu trắng đậm - điều chỉnh vị trí và font size
			const mid = (start + end) / 2;
			const textRadius = r * 0.70; // Tăng radius để text xa tâm hơn, không bị chật
			const lx = cx + textRadius * Math.cos(mid);
			const ly = cy + textRadius * Math.sin(mid);
			ctx.save();
			ctx.translate(lx, ly);
			ctx.rotate(mid + Math.PI / 2);
			ctx.fillStyle = '#fff'; // Màu trắng
			ctx.font = 'bold 14px system-ui, sans-serif'; // Font phù hợp với canvas 500x500
			ctx.textAlign = 'center';
			// Text shadow để dễ đọc trên nền tối
			ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
			ctx.shadowBlur = 4;
			ctx.shadowOffsetX = 2;
			ctx.shadowOffsetY = 2;
			ctx.fillText(slots[i].label, 0, 0);
			ctx.shadowBlur = 0;
			ctx.restore();
		}

		// Vẽ nút QUAY ở giữa bánh xe
		const centerRadius = r * 0.25; // Bán kính nút giữa
		ctx.save();
		ctx.beginPath();
		ctx.arc(cx, cy, centerRadius, 0, 2 * Math.PI);
		ctx.fillStyle = '#14532d'; // Dark green
		ctx.fill();
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 4;
		ctx.stroke();
		// Text "QUAY" - font phù hợp với canvas 500x500
		ctx.fillStyle = '#fff';
		ctx.font = 'bold 24px system-ui, sans-serif';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
		ctx.shadowBlur = 3;
		ctx.fillText('QUAY', cx, cy);
		ctx.shadowBlur = 0;
		ctx.restore();

		// Tô sáng lát hiện đang nằm dưới con trỏ với hiệu ứng đẹp mắt
		const selectedIndex = getSelectedIndex(currentAngle);
		if (selectedIndex >= 0) {
			const sliceAngle = (2 * Math.PI) / SLICES;
			const startSel = (selectedIndex * sliceAngle) + currentAngle;
			const endSel = startSel + sliceAngle;
			ctx.save();
			
			// Vẽ glow effect (ánh sáng phát ra)
			const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
			gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
			gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.15)');
			gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r, startSel, endSel);
			ctx.closePath();
			ctx.fill();
			
			// Vẽ lát được chọn với màu đỏ sáng
			ctx.fillStyle = '#ef4444'; // Đỏ sáng
			ctx.beginPath();
			ctx.moveTo(cx, cy);
			ctx.arc(cx, cy, r, startSel, endSel);
			ctx.closePath();
			ctx.fill();
			
			// Border vàng sáng rất đậm cho lát được chọn
			ctx.lineWidth = 8; // Border dày
			ctx.strokeStyle = '#fbbf24'; // Vàng sáng
			ctx.shadowColor = '#fbbf24';
			ctx.shadowBlur = 25; // Shadow mạnh
			ctx.stroke();
			ctx.shadowBlur = 0;
			ctx.restore();

			// Vẽ lại nhãn với text lớn hơn - điều chỉnh cho canvas lớn
			const selMid = (startSel + endSel) / 2;
			const textRadius = r * 0.70; // Cùng radius với text thường
			const tx = cx + textRadius * Math.cos(selMid);
			const ty = cy + textRadius * Math.sin(selMid);
			ctx.save();
			ctx.translate(tx, ty);
			ctx.rotate(selMid + Math.PI / 2);
			// Text shadow đậm
			ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
			ctx.shadowBlur = 8;
			ctx.shadowOffsetX = 3;
			ctx.shadowOffsetY = 3;
			ctx.fillStyle = '#fff';
			ctx.font = 'bold 16px system-ui, sans-serif'; // Font phù hợp với canvas 500x500
			ctx.textAlign = 'center';
			ctx.fillText(slots[selectedIndex].label, 0, 0);
			ctx.shadowBlur = 0;
			ctx.restore();
		}

		// Con trỏ đỏ đậm với border trắng ở 12h
		ctx.save();
		ctx.translate(cx, cy);
		// Shadow mạnh cho con trỏ
		ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
		ctx.shadowBlur = 15;
		ctx.shadowOffsetX = 0;
		ctx.shadowOffsetY = 8;
		// Màu đỏ đậm
		ctx.fillStyle = '#dc2626';
		ctx.beginPath();
		ctx.moveTo(0, -(r + 10));
		ctx.lineTo(-18, -(r + 45));
		ctx.lineTo(18, -(r + 45));
		ctx.closePath();
		ctx.fill();
		ctx.shadowBlur = 0;
		// Border trắng đậm cho con trỏ
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 4;
		ctx.stroke();
		sctx.restore();
	}

	function getSelectedIndex(currentAngle) {
		// Góc con trỏ (12h) trong hệ toạ độ toàn cục
		const pointerAngle = -Math.PI / 2;
		// Góc của bánh xe ngược chiều (đưa về frame của lát cắt)
		const rel = normalizeAngle(pointerAngle - currentAngle);
		const sliceAngle = (2 * Math.PI) / SLICES;
		const idx = Math.floor(rel / sliceAngle);
		return Math.max(0, Math.min(SLICES - 1, idx));
	}

	function weightedDrawIndex() {
		let total = 0;
		for (const s of slots) total += Math.max(0, s.weight);
		if (total <= 0) return -1;
		const rnd = Math.floor(Math.random() * total) + 1;
		let acc = 0;
		for (let i = 0; i < slots.length; i++) {
			acc += Math.max(0, slots[i].weight);
			if (rnd <= acc) return i;
		}
		return -1;
	}

	function getTargetAngleForIndex(index) {
		// Con trỏ ở hướng 12h; muốn index dừng tại con trỏ
		const sliceAngle = (2 * Math.PI) / SLICES;
		// Tâm của lát index khi bánh xe quay là: centerAngle = currentAngle + index * sliceAngle + sliceAngle/2
		// Ta muốn centerAngle ≡ -90deg (12h) => targetAngle để quay thêm
		const pointerAngle = -Math.PI / 2; // 12h
		const target = pointerAngle - (index * sliceAngle + sliceAngle / 2);
		return target;
	}

	function animateToIndex(index) {
		return new Promise((resolve) => {
			const fullSpins = 6; // Giảm số vòng quay để nhanh hơn
			const sliceAngle = (2 * Math.PI) / SLICES;
			const target = getTargetAngleForIndex(index) + fullSpins * 2 * Math.PI;
			let start = angle;
			let delta = normalizeAngle(target - start);
			let t = 0;
			const duration = 3000; // ms - Giảm thời gian quay xuống 3 giây
			const startTime = performance.now();
			
			// Phát âm thanh quay liên tục
			if (soundEnabled && audioContext) {
				spinSoundInterval = setInterval(() => {
					playSpinSound();
				}, 100); // Phát mỗi 100ms
			}

			function easeOutCubic(x) {
				return 1 - Math.pow(1 - x, 3);
			}
			function frame(now) {
				const elapsed = now - startTime;
				t = Math.min(1, elapsed / duration);
				const eased = easeOutCubic(t);
				angle = start + delta * eased;
				drawWheel(angle);
				if (t < 1) {
					requestAnimationFrame(frame);
				} else {
					// Dừng âm thanh quay
					if (spinSoundInterval) {
						clearInterval(spinSoundInterval);
						spinSoundInterval = null;
					}
					resolve();
				}
			}
			requestAnimationFrame(frame);
		});
	}

	function normalizeAngle(a) {
		const twoPi = 2 * Math.PI;
		return ((a % twoPi) + twoPi) % twoPi;
	}

	async function onSpin() {
		if (spinning) return;
		// Khởi tạo AudioContext khi user click (yêu cầu của browser)
		initAudioOnInteraction();
		spinning = true;
		btn.disabled = true;
		resultEl.textContent = '';
		try {
			const idx = weightedDrawIndex();
			if (idx < 0) {
				resultEl.textContent = 'Không có ô hợp lệ (tất cả weight = 0).';
				return;
			}
			await animateToIndex(idx);
			resultEl.textContent = 'Kết quả: ' + slots[idx].label;
			// Confetti, âm thanh trúng và hiển thị modal
			fireConfettiBurst();
			playWinSound();
			showWinModal(slots[idx].label);
		} finally {
			spinning = false;
			btn.disabled = false;
		}
	}

	function showWinModal(prizeName) {
		const modal = document.getElementById('win-modal');
		const prizeNameEl = document.getElementById('prize-name');
		if (modal && prizeNameEl) {
			prizeNameEl.textContent = prizeName;
			modal.style.display = 'flex';
		}
	}

	window.closeModal = function() {
		const modal = document.getElementById('win-modal');
		if (modal) {
			modal.style.display = 'none';
		}
	};

	if (btn) btn.addEventListener('click', onSpin);

	// Click vào nút QUAY ở giữa bánh xe
	if (canvas) {
		canvas.addEventListener('click', function(e) {
			if (spinning) return;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const cx = canvas.width / 2;
			const cy = canvas.height / 2;
			const r = Math.min(cx, cy) - 10;
			const centerRadius = r * 0.25;
			const dx = x - cx;
			const dy = y - cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist <= centerRadius) {
				onSpin();
			}
		});
		canvas.style.cursor = 'pointer';
	}

	// Vẽ lần đầu
	drawWheel(angle);

	// Expose for tests
	window.__ALW__ = {
		slots,
		weightedDrawIndex,
		onSpin,
	};

	// --------- Pháo Hoa Rơi Từ Trên Xuống Nhẹ Nhàng ---------
	function fireConfettiBurst() {
		if (!fullscreenConfettiCtx || !fullscreenConfettiCanvas) return;
		
		// Set canvas size to fullscreen
		fullscreenConfettiCanvas.width = window.innerWidth;
		fullscreenConfettiCanvas.height = window.innerHeight;
		
		const w = fullscreenConfettiCanvas.width;
		const h = fullscreenConfettiCanvas.height;
		const colors = ['#e11d48', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#10b981', '#06b6d4', '#fbbf24', '#a78bfa', '#f43f5e'];
		
		const particles = [];
		const count = 150; // Giảm số lượng particles xuống 150
		
		// Tạo particles rơi từ trên xuống, phân bố đều trên chiều rộng màn hình
		for (let i = 0; i < count; i++) {
			particles.push({
				x: Math.random() * w, // Phân bố đều trên chiều rộng
				y: -20 - Math.random() * 100, // Bắt đầu từ trên màn hình (âm)
				vx: (Math.random() - 0.5) * 1.2, // Xoay ngang nhẹ nhàng
				vy: 1 + Math.random() * 2, // Tốc độ rơi nhẹ nhàng
				size: 8 + Math.random() * 12, // Kích thước nhỏ hơn một chút
				rot: Math.random() * Math.PI * 2,
				vr: (Math.random() - 0.5) * 0.15, // Xoay chậm hơn
				color: colors[Math.floor(Math.random() * colors.length)],
				shape: Math.random() < 0.35 ? 'rect' : (Math.random() < 0.7 ? 'tri' : 'circle'),
				opacity: 0.8 + Math.random() * 0.2
			});
		}
		
		let running = true;
		const gravity = 0.08; // Trọng lực nhẹ
		const drag = 0.998; // Ma sát nhẹ
		const startTime = performance.now();
		const duration = 4000; // Giảm thời gian xuống 4 giây
		
		function step(now) {
			const elapsed = now - startTime;
			if (elapsed > duration) {
				running = false;
				fullscreenConfettiCtx.clearRect(0, 0, w, h);
				return;
			}
			
			// Fade out dần ở cuối
			const fadeStart = duration * 0.7; // Bắt đầu fade ở 70% thời gian
			let fadeAlpha = 1;
			if (elapsed > fadeStart) {
				fadeAlpha = 1 - ((elapsed - fadeStart) / (duration - fadeStart));
			}
			
			fullscreenConfettiCtx.clearRect(0, 0, w, h);
			
			for (const p of particles) {
				// Cập nhật vị trí
				p.vx *= drag;
				p.vy = p.vy * drag + gravity; // Rơi xuống nhẹ nhàng
				p.x += p.vx;
				p.y += p.vy;
				p.rot += p.vr;
				
				// Reset nếu rơi ra ngoài màn hình dưới
				if (p.y > h + 50) {
					p.y = -20 - Math.random() * 50;
					p.x = Math.random() * w;
					p.vx = (Math.random() - 0.5) * 1.5;
					p.vy = 1 + Math.random() * 2;
				}
				
				// Chỉ vẽ nếu trong màn hình
				if (p.x < -50 || p.x > w + 50 || p.y < -50) continue;
				
				fullscreenConfettiCtx.save();
				fullscreenConfettiCtx.translate(p.x, p.y);
				fullscreenConfettiCtx.rotate(p.rot);
				fullscreenConfettiCtx.globalAlpha = p.opacity * fadeAlpha;
				fullscreenConfettiCtx.fillStyle = p.color;
				
				if (p.shape === 'rect') {
					fullscreenConfettiCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
				} else if (p.shape === 'tri') {
					fullscreenConfettiCtx.beginPath();
					fullscreenConfettiCtx.moveTo(0, -p.size/2);
					fullscreenConfettiCtx.lineTo(p.size/2, p.size/2);
					fullscreenConfettiCtx.lineTo(-p.size/2, p.size/2);
					fullscreenConfettiCtx.closePath();
					fullscreenConfettiCtx.fill();
				} else {
					// Circle
					fullscreenConfettiCtx.beginPath();
					fullscreenConfettiCtx.arc(0, 0, p.size/2, 0, Math.PI * 2);
					fullscreenConfettiCtx.fill();
				}
				
				fullscreenConfettiCtx.restore();
			}
			
			if (running) {
				requestAnimationFrame(step);
			}
		}
		requestAnimationFrame(step);
	}
})();
