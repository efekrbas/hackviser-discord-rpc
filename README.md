# Hackviser Discord Rich Presence 

Show your active Hackviser (hackviser.com) training sessions on your Discord profile with this secure, automated desktop-extension bridge.

![Hackviser](images/1679414162991.jpg)

## 🚀 How It Works

The project consists of **two components**:
1. **Desktop Bridge App:** A lightweight, security-focused background application that does not scan your system — it simply listens for data from the Chrome extension and relays it to Discord.
2. **Chrome Developer Extension:** A local Chrome extension that only works on Hackviser platforms, reads browser tab information, and communicates with the Desktop Bridge.

## 📦 Installation & Setup

### 1- App Installation (Setup Installer)
Run the **`HackviserRPC_Setup.exe`** file obtained from the website or by building the project.
- Once installed, the application will be added to your Start Menu and Desktop. When launched, it quietly runs in the background in the system tray (bottom-right corner).

### 2- Adding the Chrome Extension (Developer Mode)
Since the extension is pending approval, it must be manually loaded into your browser:
1. Extract the `HackviserExtension.zip` file (downloaded from the source files or website) into a folder.
2. Open `chrome://extensions/` in your web browser (Chrome, Brave, etc.).
3. Enable **Developer Mode** from the top-right toggle.
4. Click "Load Unpacked" and select the extracted folder.
5. Done! Your Discord profile will light up when you start your training sessions.

## 🛠 Developer (Build) Information

If you'd like to build the project on your own machine:

```bash
# Install dependencies (Node.js and npm must be installed on your system)
npm install

# Optional: Create a distributable installer .exe (NSIS Setup)
npm run build

# Optional: Create a portable single .exe (Portable)
npm run build:portable
```

## 📋 Features

- ✅ Isolated/local security bridge between Desktop and Browser
- ✅ Seamless real-time browser analysis with Chrome Extension (V3) architecture
- ✅ Setup installer with automatic Start Menu/Desktop shortcut creation
- ✅ Dynamic, automatic English/Turkish web page based on browser language (i18n)
- ✅ Auto-reconnect capability and privacy-friendly design

---

**Hackviser** - Cyber Security Learning Platform | [hackviser.com](https://hackviser.com)

maked for hackviser 💚
