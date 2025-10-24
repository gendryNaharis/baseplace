# 🚀 Cloudflare Pages Deployment Guide

## ⚙️ Cloudflare Pages Build Ayarları

Cloudflare Pages dashboard'unda şu ayarları kullanın:

### Build Configuration

| Ayar | Değer |
|------|-------|
| **Framework preset** | `Next.js` (veya `None`) |
| **Build command** | `npm run build && npx @cloudflare/next-on-pages` |
| **Build output directory** | `.vercel/output/static` |
| **Production branch** | `main` |
| **Root directory** | `/` (boş bırakabilirsiniz) |

⚠️ **Not**: Framework preset'i `None` olarak da ayarlayabilirsiniz, çünkü custom build command kullanıyoruz.

## 📝 Detaylı Adımlar

### 1. Framework Preset
```
Next.js
```
Dropdown'dan **Next.js** seçin.

### 2. Build Command
```bash
npm run build && npx @cloudflare/next-on-pages
```
İlk önce Next.js build'i çalışır, sonra Cloudflare Pages için optimize edilir.

**Alternatif** (daha basit):
```bash
npm run build:cloudflare
```
package.json'da tanımlı kısayol komutu.

### 3. Build Output Directory
```
.vercel/output/static
```
**Not**: Slash ile başlamayın, sadece `.vercel/output/static` yazın.

### 4. Environment Variables (Önemli!)

Cloudflare Pages dashboard'unda **Settings → Environment Variables** bölümünden şu değişkenleri ekleyin:

```env
NEXT_PUBLIC_URL=https://baseplace.pages.dev
NEYNAR_API_KEY=your-neynar-api-key
NEYNAR_CLIENT_ID=your-neynar-client-id
```

**Not**: Production ve Preview ortamları için ayrı ayrı ekleyin.

## ⚠️ Önemli Notlar

### API Routes Sınırlamaları

Cloudflare Pages, Vercel'den farklı olarak bazı Next.js özelliklerinde sınırlamalar olabilir:

1. **Edge Runtime**: API routes Cloudflare Workers'da çalışır
2. **Execution Time**: Maximum 30 saniye (Workers ücretsiz planı)
3. **Memory**: 128MB limit

### Supabase Real-time

Cloudflare Pages'da Supabase real-time bağlantıları çalışmalı, ancak:
- WebSocket bağlantıları için ek yapılandırma gerekmez
- Edge runtime'da çalıştığı için daha düşük latency beklenir

### Cron Jobs

⚠️ **Önemli**: Cloudflare Pages'da Vercel Cron Jobs çalışmaz!

Alternatif çözümler:

#### Seçenek 1: Cloudflare Workers Cron Triggers (Önerilen)

`wrangler.toml` dosyasına ekleyin:

```toml
[triggers]
crons = ["*/10 * * * *"]
```

Ancak bu durumda ayrı bir Cloudflare Worker oluşturmanız gerekir.

#### Seçenek 2: Harici Cron Servisi

- **Cron-job.org** (ücretsiz)
- **EasyCron** 
- **UptimeRobot** (monitoring + cron)

Endpoint:
```
GET https://baseplace.pages.dev/api/canvas/check-sessions
```

Her 10 dakikada bir çağırın.

#### Seçenek 3: Cloudflare Workers + Cron

Ayrı bir Worker oluşturun:

```javascript
export default {
  async scheduled(event, env, ctx) {
    await fetch('https://baseplace.pages.dev/api/canvas/check-sessions');
  }
};
```

## 🧪 Yerel Test (Opsiyonel)

Cloudflare Pages ortamını yerel olarak test etmek için:

```bash
# Build
npm run build:cloudflare

# Preview
npm run preview:cloudflare
```

## 🔍 Troubleshooting

### Build Hatası: "Could not find a production build"

**Çözüm**: Build output directory'yi kontrol edin:
- `.vercel/output/static` olmalı
- Slash ile başlamamalı

### API Routes Çalışmıyor

**Çözüm**: 
1. Environment variables'ları kontrol edin
2. API route'larının edge runtime uyumlu olduğundan emin olun

### Real-time Güncellemeler Yavaş

**Çözüm**:
- Cloudflare Workers'ın WebSocket desteğini kontrol edin
- Supabase bölgenizi optimize edin

## 📊 Deployment Sonrası

### 1. Domain Ayarları

Cloudflare Pages → **Custom domains** → Kendi domain'inizi ekleyin

### 2. Cron Job Kurulumu

Yukarıdaki seçeneklerden birini kullanarak cron job kurun.

### 3. Analytics

Cloudflare Pages otomatik olarak analytics sağlar:
- Page views
- Bandwidth
- Requests

## 🆚 Cloudflare vs Vercel

| Özellik | Cloudflare Pages | Vercel |
|---------|------------------|--------|
| Build time | Free: Unlimited | Free: 6000 min/ay |
| Bandwidth | Free: Unlimited | Free: 100GB/ay |
| Cron Jobs | ❌ (ayrı Worker gerekir) | ✅ |
| Edge Runtime | ✅ | ✅ |
| Cold Starts | Çok düşük | Orta |
| Global CDN | ✅ 300+ PoP | ✅ 100+ PoP |

## 🎯 Önerilen Yaklaşım

1. **İlk Deploy**: Cloudflare Pages'ı deneyin
2. **Cron Job**: cron-job.org veya benzeri ücretsiz servis kullanın
3. **Monitoring**: Cloudflare Analytics + Supabase logs

## 🔗 Yararlı Linkler

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Cloudflare Workers Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/)

## ✅ Checklist

Deployment öncesi kontrol listesi:

- [ ] Environment variables eklendi
- [ ] Build command doğru: `npx @cloudflare/next-on-pages`
- [ ] Output directory doğru: `.vercel/output/static`
- [ ] Supabase SQL schema çalıştırıldı
- [ ] Cron job alternatifi belirlendi
- [ ] Custom domain eklendi (opsiyonel)

---

**Not**: İlk deploy 2-3 dakika sürebilir. Build loglarını kontrol edin.

