# 🛡️ Hackviser Discord Rich Presence Bridge

Discord profilinizde Hackviser platformunda (hackviser.com) aktif olduğunuzu siber güvenlik eğitimlerinizi gösteren zenginleştirilmiş, güvenli ve otomatik masaüstü-eklenti köprüsü.

![Hackviser](images/1679414162991.jpg)

## 🚀 Çalışma Mantığı

Proje **iki bileşenden** oluşmaktadır:
1. **Masaüstü Eğitim Köprüsü:** Sistemi taramayan, sadece Chrome eklentisinden gelecek bilgileri bekleyerek Discord'a aktaran güvenlik odaklı hafif bir arka plan yazılımı.
2. **Chrome Geliştirici Eklentisi:** Yalnızca Hackviser platformlarında çalışıp tarayıcı sekme bilgilerini okuyan ve Masaüstü köprüsüyle haberleşen yerel Chrome eklentisi.

## 📦 Kurulum ve Çalıştırma

### 1- Uygulama Kurulumu (Setup Ekranı)
Sunucu üzerinden veya derlenerek elde edeceğiniz **`HackviserRPC_Setup.exe`** dosyasını çalıştırın.
- Kurulum tamamlandığında uygulamanız Başlat Menüsü'ne ve Masaüstünüze eklenecektir. Uygulamayı çalıştırdığınızda sağ alt köşede (Sistem tepsisi) arka planda sessizce beklemeye başlar.

### 2- Chrome Eklentisini Ekleme (Geliştirici Modu)
Eklenti onay beklediği sürece manuel olarak tarayıcıya eklenmelidir:
1. Kaynak dosyalardan veya siteden indirilen `HackviserExtension.zip` dosyasını bir klasöre çıkartın.
2. Web tarayıcınızda (Chrome, Brave vb.) `chrome://extensions/` adresine gidin.
3. Sağ üstten **Geliştirici Modunu (Developer Mode)** aktif edin.
4. Çıkan menüden "Paketlenmemiş Öğe Yükle (Load Unpacked)" butonuna tıklayın ve çıkarttığınız klasörü seçin.
5. İşlem Tamamlandı! Eğitimlere başladığınızda profiliniz parlayacak.

## 🛠 Geliştirici (Derleme) Bilgileri

Projeyi kendi bilgisayarınızda derlemek isterseniz:

```bash
# Bağımlılıkları yükle (Sistemde node ve npm kurulu olmalıdır)
npm install

# İsteğe Bağlı: Dağıtılabilir Kurulum .exe si oluşturmak için (NSIS Setup)
npm run build

# İsteğe Bağlı: Taşınabilir tek .exe oluşturmak için (Portable)
npm run build:portable
```

## 📋 Özellikler

- ✅ Masaüstü ve Tarayıcı arası izole/lokal güvenlik köprüsü özelliği
- ✅ Chrome Uzantı (V3) mimarisi ile kusursuz anlık tarayıcı analizi
- ✅ Setup halinde yükleme ve otomatik başlat menüsü/masaüstü kısayolu
- ✅ Dinamik, site ortamına göre otomatik İngilizce / Türkçe web sayfası (i18n)
- ✅ Otomatik yeniden bağlanma yeteneği ve gizlilik dostu yapı

---

**Hackviser** - Cyber Security Training Platform | [hackviser.com](https://hackviser.com)

maked for hackviser 💚
