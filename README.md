# 🛡️ Hackviser Discord Rich Presence

Discord profilinizde Hackviser platformunda aktif olduğunuzu gösteren Rich Presence istemcisi.

![Hackviser](images/1679414162991.jpg)

## 🚀 Kurulum

### Gereksinimler
- [Node.js](https://nodejs.org/) (v16+)
- [Discord](https://discord.com/) masaüstü uygulaması

### Adımlar

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Uygulamayı çalıştır
npm start
```

## 🔧 Yapılandırma

`config.json` dosyasını düzenleyerek Rich Presence ayarlarını özelleştirebilirsiniz:

| Alan | Açıklama |
|------|----------|
| `details` | Üst satır metni |
| `state` | Alt satır metni |
| `largeImageKey` | Discord Developer Portal'daki büyük resim anahtarı |
| `buttons` | Profildeki butonlar (max 2) |

## 📦 EXE Olarak Derleme

```bash
# Bağımlılıkları yükle (ilk seferde)
npm install

# EXE dosyasını oluştur
npm run build
```

Oluşturulan `HackviserRPC.exe` dosyasını doğrudan çalıştırabilirsiniz.

## 📋 Özellikler

- ✅ Discord Rich Presence desteği
- ✅ Otomatik yeniden bağlanma
- ✅ Renkli konsol çıktıları
- ✅ Geçen süre göstergesi
- ✅ Hackviser web sitesine buton bağlantıları
- ✅ EXE olarak derlenebilir

## ⚙️ Discord Developer Portal

1. [Discord Developer Portal](https://discord.com/developers/applications) → Uygulamanıza gidin
2. **Rich Presence → Art Assets** → Hackviser logosunu yükleyin
   - Büyük resim key: `hackviser_logo`
   - Küçük resim key: `hackviser_small`
3. Kaydedin

---

**Hackviser** - Cyber Security Training Platform | [hackviser.com](https://hackviser.com)
