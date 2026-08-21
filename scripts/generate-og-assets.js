import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Generate 1200x630 Open Graph Image (Landscape Banner)
const ogBannerSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#09090b" />
      <stop offset="40%" stop-color="#130d24" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    
    <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" />
      <stop offset="50%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.08)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.02)" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- Ambient Glow Circles -->
  <circle cx="200" cy="150" r="180" fill="#7C3AED" opacity="0.25" filter="url(#glow)" />
  <circle cx="1000" cy="450" r="220" fill="#F97316" opacity="0.20" filter="url(#glow)" />
  <circle cx="950" cy="180" r="140" fill="#EC4899" opacity="0.15" filter="url(#glow)" />

  <!-- Grid overlay pattern -->
  <g opacity="0.06" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="100" x2="1200" y2="100" />
    <line x1="0" y1="200" x2="1200" y2="200" />
    <line x1="0" y1="300" x2="1200" y2="300" />
    <line x1="0" y1="400" x2="1200" y2="400" />
    <line x1="0" y1="500" x2="1200" y2="500" />
    <line x1="150" y1="0" x2="150" y2="630" />
    <line x1="300" y1="0" x2="300" y2="630" />
    <line x1="450" y1="0" x2="450" y2="630" />
    <line x1="600" y1="0" x2="600" y2="630" />
    <line x1="750" y1="0" x2="750" y2="630" />
    <line x1="900" y1="0" x2="900" y2="630" />
    <line x1="1050" y1="0" x2="1050" y2="630" />
  </g>

  <!-- Left Content Box -->
  <g transform="translate(100, 100)">
    <!-- Top Pill Badge -->
    <rect width="270" height="38" rx="19" fill="#7C3AED" fill-opacity="0.25" stroke="#8B5CF6" stroke-width="1.5" />
    <circle cx="22" cy="19" r="6" fill="#F97316" />
    <text x="36" y="24" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#E2E8F0" letter-spacing="1">
      ORGANIZAÇÃO COM IA
    </text>

    <!-- Main Title -->
    <text x="0" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#FFFFFF" letter-spacing="-1">
      Planner de Conteúdo
    </text>
    <text x="0" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="url(#brandGrad)" letter-spacing="-1">
      Multicanal &amp; Roteiros
    </text>

    <!-- Description -->
    <text x="0" y="235" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#94A3B8">
      Planeje vídeos, gere roteiros com IA e aprove com clientes.
    </text>
    <text x="0" y="270" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="400" fill="#94A3B8">
      Tudo integrado em um calendário visual completo.
    </text>

    <!-- Feature Pills -->
    <g transform="translate(0, 320)">
      <!-- YouTube -->
      <rect x="0" y="0" width="130" height="42" rx="10" fill="#1E1B4B" stroke="#4338CA" stroke-width="1" />
      <text x="20" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#EF4444">▶ YouTube</text>

      <!-- Instagram -->
      <rect x="145" y="0" width="140" height="42" rx="10" fill="#1E1B4B" stroke="#4338CA" stroke-width="1" />
      <text x="165" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#EC4899">📸 Instagram</text>

      <!-- TikTok -->
      <rect x="300" y="0" width="120" height="42" rx="10" fill="#1E1B4B" stroke="#4338CA" stroke-width="1" />
      <text x="320" y="27" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="700" fill="#06B6D4">🎵 TikTok</text>

      <!-- 15 Days Free Trial Tag -->
      <rect x="435" y="0" width="220" height="42" rx="10" fill="#F97316" fill-opacity="0.2" stroke="#F97316" stroke-width="1.5" />
      <text x="455" y="26" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#FB923C">🔥 15 DIAS GRÁTIS</text>
    </g>
  </g>

  <!-- Right Side: Beautiful Logo / Calendar Visual -->
  <g transform="translate(850, 150)">
    <!-- Card Frame -->
    <rect width="260" height="280" rx="30" fill="url(#cardGrad)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" />
    
    <!-- Logo Badge inside Card -->
    <g transform="translate(45, 45)">
      <rect width="170" height="170" rx="36" fill="url(#brandGrad)" filter="url(#glow)" opacity="0.3" />
      <rect width="170" height="170" rx="36" fill="url(#brandGrad)" />
      
      <!-- Calendar Icon Symbol -->
      <g transform="translate(35, 35)" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">
        <rect x="5" y="15" width="90" height="75" rx="12" />
        <line x1="28" y1="5" x2="28" y2="25" />
        <line x1="72" y1="5" x2="72" y2="25" />
        <line x1="5" y1="38" x2="95" y2="38" />
        <circle cx="32" cy="58" r="4" fill="#ffffff" />
        <circle cx="52" cy="58" r="4" fill="#ffffff" />
        <circle cx="72" cy="58" r="4" fill="#ffffff" />
        <circle cx="32" cy="74" r="4" fill="#ffffff" />
        <circle cx="52" cy="74" r="4" fill="#ffffff" />
      </g>
    </g>
    <text x="130" y="250" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="800" fill="#E2E8F0" letter-spacing="1">
      AMPLIFICA SAAS
    </text>
  </g>

  <!-- Bottom Brand Signature -->
  <g transform="translate(100, 560)">
    <text x="0" y="0" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748B">
      https://planner.amplificagroup.com
    </text>
  </g>
</svg>
`;

// 2. Generate 512x512 Square Open Graph / WhatsApp Preview Icon
const ogSquareSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sqBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0c1b" />
      <stop offset="100%" stop-color="#1e1338" />
    </linearGradient>
    
    <linearGradient id="sqBrand" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6" />
      <stop offset="50%" stop-color="#EC4899" />
      <stop offset="100%" stop-color="#F97316" />
    </linearGradient>

    <filter id="sqGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="25" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" fill="url(#sqBg)" />
  <circle cx="256" cy="220" r="160" fill="#8B5CF6" opacity="0.3" filter="url(#sqGlow)" />

  <!-- Logo Card Box -->
  <g transform="translate(136, 90)">
    <rect width="240" height="240" rx="55" fill="url(#sqBrand)" filter="url(#sqGlow)" opacity="0.4" />
    <rect width="240" height="240" rx="55" fill="url(#sqBrand)" />

    <!-- Calendar Icon -->
    <g transform="translate(50, 48)" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="8" y="20" width="124" height="106" rx="16" />
      <line x1="40" y1="6" x2="40" y2="34" />
      <line x1="100" y1="6" x2="100" y2="34" />
      <line x1="8" y1="52" x2="132" y2="52" />
      <circle cx="44" cy="80" r="6" fill="#ffffff" />
      <circle cx="72" cy="80" r="6" fill="#ffffff" />
      <circle cx="100" cy="80" r="6" fill="#ffffff" />
      <circle cx="44" cy="102" r="6" fill="#ffffff" />
      <circle cx="72" cy="102" r="6" fill="#ffffff" />
    </g>
  </g>

  <!-- Text -->
  <text x="256" y="395" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF" letter-spacing="-0.5">
    PLANNER SAAS
  </text>
  <text x="256" y="435" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#F97316" letter-spacing="1">
    CONTEÚDO &amp; ROTEIROS COM IA
  </text>
  <text x="256" y="470" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#94A3B8">
    planner.amplificagroup.com
  </text>
</svg>
`;

async function generateAllAssets() {
  console.log('Generating Open Graph & Social Preview Assets...');

  // 1. og-image.png (1200x630)
  await sharp(Buffer.from(ogBannerSvg))
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✔ public/og-image.png (1200x630)');

  // 2. og-square.png / whatsapp-preview.png (512x512)
  await sharp(Buffer.from(ogSquareSvg))
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'og-square.png'));
  console.log('✔ public/og-square.png (512x512)');

  // 3. icon-512.png (512x512)
  await sharp(Buffer.from(ogSquareSvg))
    .resize(512, 512)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✔ public/icon-512.png');

  // 4. icon-192.png (192x192)
  await sharp(Buffer.from(ogSquareSvg))
    .resize(192, 192)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✔ public/icon-192.png');

  // 5. apple-touch-icon.png (180x180)
  await sharp(Buffer.from(ogSquareSvg))
    .resize(180, 180)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✔ public/apple-touch-icon.png');

  // 6. favicon.png (64x64)
  await sharp(Buffer.from(ogSquareSvg))
    .resize(64, 64)
    .png({ quality: 95 })
    .toFile(path.join(publicDir, 'favicon.png'));
  console.log('✔ public/favicon.png');

  console.log('All Social Preview assets generated successfully!');
}

generateAllAssets().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
