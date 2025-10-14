# MegaMan X4 - Web Version

Port của game MegaMan X4 từ C++ sang JavaScript để chạy trên web browser.

## 🎮 Tính năng

- **Web-based**: Chạy hoàn toàn trên browser, không cần cài đặt
- **Modern JavaScript**: Sử dụng ES6+ modules và async/await
- **PIXI.js Renderer**: Rendering 2D hiệu suất cao với WebGL
- **Web Audio**: Âm thanh chất lượng cao với Web Audio API
- **Responsive**: Tự động điều chỉnh theo kích thước màn hình
- **Gamepad Support**: Hỗ trợ tay cầm game controller

## 🚀 Cài đặt và chạy

### Yêu cầu
- Node.js 16+ 
- npm hoặc yarn

### Bước 1: Cài đặt dependencies
```bash
cd Megaz
npm install
```

### Bước 2: Chạy development server
```bash
npm run dev
```

Game sẽ chạy tại `http://localhost:3000`

### Bước 3: Build cho production
```bash
npm run build
```

Files build sẽ được tạo trong thư mục `dist/`

## 🎯 Điều khiển

### Bàn phím
- **Mũi tên**: Di chuyển
- **Z**: Dash (lướt nhanh)
- **X**: Jump (nhảy)
- **C**: Attack 1 (tấn công cơ bản)
- **V**: Fire Attack (tấn công lửa)
- **O**: Spawn player (debug)
- **P**: Spawn monster (debug)

### Gamepad
- **D-pad/Left stick**: Di chuyển
- **A**: Jump
- **B**: Dash  
- **X**: Attack
- **Y**: Fire Attack

## 📁 Cấu trúc dự án

```
Megaz/
├── public/                 # Static assets
│   └── assets/            
│       ├── textures/      # Game sprites và textures
│       ├── sounds/        # Audio files
│       └── manifest.json  # Asset manifest
├── src/
│   ├── core/              # Core engine classes
│   │   ├── Device.js      # PIXI.js wrapper
│   │   └── MainGame.js    # Main game controller
│   ├── managers/          # Game managers
│   │   ├── SceneManager.js
│   │   ├── TextureManager.js
│   │   ├── SoundManager.js
│   │   ├── KeyManager.js
│   │   ├── TimeManager.js
│   │   ├── RenderManager.js
│   │   └── ObjectSortManager.js
│   ├── objects/           # Game objects
│   │   └── GameObject.js
│   ├── scenes/            # Game scenes
│   ├── utils/             # Utilities
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── AssetLoader.js
│   └── main.js           # Entry point
├── index.html            # Main HTML file
├── vite.config.js        # Vite configuration
└── package.json
```

## 🛠️ Kiến trúc kỹ thuật

### Core Systems

1. **Device System**: Wrapper cho PIXI.js, quản lý canvas và rendering context
2. **Scene Management**: Quản lý các màn chơi và chuyển cảnh
3. **Object Management**: Hệ thống phân layer và quản lý objects
4. **Asset Management**: Load và cache textures, sounds
5. **Input System**: Xử lý keyboard và gamepad input
6. **Audio System**: Web Audio API cho âm thanh

### Design Patterns

- **Singleton Pattern**: Cho các manager classes
- **Factory Pattern**: Tạo game objects
- **Observer Pattern**: Event handling
- **State Machine**: Player và enemy states

## 🎨 Asset Requirements

### Textures
Cần copy các file texture từ dự án C++ gốc vào:
- `public/assets/textures/backgrounds/` - Backgrounds
- `public/assets/textures/player/` - Player sprites  
- `public/assets/textures/enemies/` - Enemy sprites
- `public/assets/textures/effects/` - Effects

### Audio  
Convert audio files từ WAV sang OGG/MP3 và copy vào:
- `public/assets/sounds/` - All audio files

## 🔧 Development

### Linting
```bash
npm run lint
```

### Testing
```bash
npm run test
```

### Formatting
```bash
npm run format
```

## 🚀 Deployment

### Vercel
1. Push code lên GitHub
2. Connect repository tới Vercel
3. Deploy tự động từ main branch

### Netlify
1. Build project: `npm run build`
2. Upload thư mục `dist/` lên Netlify

### Static hosting
Có thể host trên bất kỳ static file server nào (GitHub Pages, Firebase Hosting, etc.)

## 🔄 Migration từ C++

### Đã hoàn thành
- ✅ Core engine architecture
- ✅ Device/Rendering system (DirectX → PIXI.js)
- ✅ Asset management system
- ✅ Input handling (DirectInput → Web APIs)
- ✅ Audio system (DirectSound → Web Audio)
- ✅ Scene management
- ✅ Object management và sorting
- ✅ Time management

### Cần thực hiện
- 🔄 Player class và state machine
- 🔄 Enemy classes
- 🔄 Collision detection system
- 🔄 Stage implementation
- 🔄 UI system
- 🔄 Game-specific logic

## 📝 TODO

1. **Implement Player Class**: Port CPlayer từ C++
2. **Create Stage Scenes**: Port CStage_One và các stage khác
3. **Add Collision System**: Implement collision detection
4. **Create Enemy Classes**: Port monster classes
5. **Add UI Components**: Health bar, score, etc.
6. **Optimize Performance**: Profiling và optimization
7. **Add Mobile Support**: Touch controls
8. **Add Save System**: LocalStorage cho game progress

## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 🎯 Next Steps

1. **Copy Assets**: Copy tất cả texture và audio files từ dự án C++ gốc
2. **Implement Player**: Tạo Player class với đầy đủ animation và controls
3. **Create First Stage**: Implement Stage One với backgrounds và platforms
4. **Add Enemies**: Port enemy classes và AI
5. **Test & Polish**: Debug, optimize và polish gameplay

---

**Note**: Đây là framework cơ bản. Game logic cụ thể sẽ được implement trong các bước tiếp theo dựa trên source code C++ gốc.